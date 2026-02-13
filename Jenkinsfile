pipeline {
  agent any
  // Parametri opzionali (puoi lanciare manualmente test pesanti)
  parameters {
    booleanParam(
		name: 'RUN_HEAVY',
		 defaultValue: false,
		  description: 'Esegui test Gatling e PIT'
		  )
  }
  
  options {
    timestamps()
    ansiColor('xterm')
    skipDefaultCheckout(true)
    buildDiscarder(logRotator(numToKeepStr: '5'))
    timeout(time: 90, unit: 'MINUTES')
  }
  
  environment {
	MAVEN_OPTS = "-Dmaven.repo.local=/root/.m2"
    // Sonar
    SONAR_ENV = "sonar"
    // Docker registry (local)
    DOCKER_REGISTRY = "localhost:15000"
    IMAGE_NAME = "noticeme"
  }

  stages {
    /* ===============================
       PREPARE: Checkout
       =============================== */
    stage('prepare') {
      steps {
        checkout scm
        script {
          env.COMMIT_MSG = sh(
            script: "git log -1 --pretty=%B",
            returnStdout: true
          ).trim()
        } // needed to check for [heavy] or [perf] descriptor
      }
    }
    
    /* =========================================
   PR BRANCH: fast unit checks on PR
   ========================================= */
	stage('pr-validation') {
	  when {
	    changeRequest()
	  }
	  steps {
		sh './mvnw -ntp -Pdev,webapp,no-liquibase,frontend-test clean test '
      }
	}
    
    /* ========================================
       FEATURE BRANCH: Rapido controllo qualità
       ======================================== */
    stage('feature-qa') {
      when { branch pattern: "feature/.*", comparator: "REGEXP" }
	      steps {
			withSonarQubeEnv("${SONAR_ENV}") {
	        	sh './mvnw -ntp -Pdev,webapp,no-liquibase,frontend-test test sonar:sonar'
	      	}
	      }
	      post {
	        always {
	          junit allowEmptyResults: true, testResults: '**/target/surefire-reports/*.xml'
			  recordIssues(tools: [checkStyle(), spotBugs()])
	          publishHTML(target: [
	            reportDir: 'target/site/jacoco',
	            reportFiles: 'index.html',
	            reportName: 'Jacoco Coverage'
	          ])
	        }
	      }
    }

    /* =====================================
       DEV BRANCH: Suite completa di qualità
       ===================================== */
    stage('dev-full-qa') {
      when { branch 'dev' }
      stages {
        stage('build and full test suite') {
	      steps {
            sh './mvnw -ntp -Pdev,webapp,frontend-test verify'
          }
          post {
            always {
              recordIssues(tools: [checkStyle(), spotBugs()])
			  cucumber fileIncludePattern: '**/cucumber-reports/*.json'
			  junit allowEmptyResults: true, testResults: '**/target/surefire-reports/*.xml'
			  junit allowEmptyResults: true, testResults: '**/target/failsafe-reports/*.xml'
              publishHTML(target: [
                reportDir: 'target/site/jacoco',
                reportFiles: 'index.html',
                reportName: 'Jacoco Coverage'
              ])
            }
          }
        }

        stage('Heavy Tests (optional)') {
          when {
            expression {
              return params.RUN_HEAVY ||
                     env.COMMIT_MSG.contains('[heavy]') ||
                     env.COMMIT_MSG.contains('[perf]')
            }
          }
          steps {
            sh './mvnw org.pitest:pitest-maven:mutationCoverage'
            sh './mvnw gatling:test'
          }
          post {
            always {
			  archiveArtifacts artifacts: 'target/pit-reports/**', fingerprint: true
              archiveArtifacts artifacts: 'target/gatling/**', fingerprint: true
            }
          }
        }
        
        stage('Sonar Analysis') {
          steps {
            withSonarQubeEnv("${SONAR_ENV}") {
              sh '''
		          REPORTS="target/site/jacoco/jacoco.xml"
		          if [ -f target/pit-reports/jacoco.xml ]; then
		            REPORTS="$REPORTS,target/pit-reports/jacoco.xml"
		          fi
		          ./mvnw sonar:sonar -Dsonar.coverage.jacoco.xmlReportPaths=$REPORTS
		          '''
            }
          }
        }
        
        stage('Quality Gate') {
          steps {
            timeout(time: 10, unit: 'MINUTES') {
              waitForQualityGate abortPipeline: true
            }
          }
        }
      }
    }

    /* =========================================
       MAIN BRANCH: Build e packaging di produzione
       ========================================= */
    stage('release-build') {
      when { branch 'main' }
      stages {
        stage('Build Artifacts') {
	      steps {
			sh './mvnw -ntp -Pprod clean package -DskipTests'
	      }
	    }
	
	    stage('Build & Push Image (Jib)') {
	      steps {
	        sh """
	          ./mvnw -Pprod jib:build \
	            -Djib.to.image=${DOCKER_REGISTRY}/${IMAGE_NAME}:${env.GIT_COMMIT}
	        """
	      }
	    }

        stage('Archive Artifacts') {
          steps {
            archiveArtifacts artifacts: 'target/*.jar, dist/**', fingerprint: true
          }
        }
      }
    }
  }

  /* ================
     POST BUILD STEPS
     ================ */
  post {
    always {
      cleanWs()
    }
  }
}