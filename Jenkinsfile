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
	// withChecks currently only affects Jenkins UI locally
	// GitHub Checks UI requires Jenkins accessible from the internet
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
    DOCKER_REGISTRY = "registry:5000"
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
		withChecks(name: 'PR - Unit Tests') {
			sh './mvnw -ntp -Pdev,webapp,no-liquibase,frontend-test clean test '
		}
      }
      post {
        always {
          junit allowEmptyResults: true, testResults: '**/target/surefire-reports/*.xml'
        }
      }
	}
    
    /* ========================================
       FEATURE BRANCH: Rapido controllo qualità
       ======================================== */
    stage('feature-qa') {
      when { branch pattern: "feature/.*", comparator: "REGEXP" }
	      steps {
			withChecks(name: 'feature - Build & unit Tests') {
		        	sh './mvnw -ntp -Pdev,webapp,no-liquibase,frontend-test test'
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
	  steps {
		withChecks(name: 'Dev - Build & Tests') {
	       sh './mvnw -ntp -Pdev,webapp,frontend-test verify'
	    }
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
	
	// ================= HEAVY TESTS =================
    stage('Heavy Tests (optional)') {
      when {
        allOf {
          branch 'dev'
          anyOf {
            expression { params.RUN_HEAVY }
            expression { env.COMMIT_MSG.contains('[heavy]') }
            expression { env.COMMIT_MSG.contains('[perf]') }
          }
        }
      }
      steps {
        withChecks(name: 'Dev - Heavy Tests (PIT & Gatling)') {
            sh './mvnw org.pitest:pitest-maven:mutationCoverage'
			sh './mvnw -ntp -Pdev,webapp -DskipTests package'
			sh '''
			      nohup java -jar target/*.jar > app.log 2>&1 &
			      echo $! > app.pid
			   '''
		      
	        sh '''
			      for i in $(seq 1 60); do
			        if curl -fsS http://localhost:8080/management/health | grep -q '"status":"UP"'; then
			          echo "Application is UP"
			          exit 0
			        fi
			        sleep 5
			      done
			      echo "Application failed to start"
			      tail -100 app.log || true
			      exit 1
			    '''  
		      
		      
            sh './mvnw gatling:test'
        }
      }
      post {
        always {
		  sh '''
	         if [ -f app.pid ]; then
	           kill $(cat app.pid) || true
	         fi
	       '''
		  archiveArtifacts artifacts: 'target/pit-reports/**', fingerprint: true
          archiveArtifacts artifacts: 'target/gatling/**', fingerprint: true
        }
      }
    }
    
     // ================= SONAR ANALYSIS =================
	   stage('Sonar Analysis') {
	  when { branch 'dev' }
	  steps {
	    withChecks(name: 'Sonar Analysis') {
	      withSonarQubeEnv("${SONAR_ENV}") {
	        script {
	          def reports = "target/site/jacoco/jacoco.xml"
	          if (fileExists('target/pit-reports/jacoco.xml')) {
	              reports += ",target/pit-reports/jacoco.xml"
	          }
	
	          sh """
	            ./mvnw sonar:sonar \
	              -Dsonar.coverage.jacoco.xmlReportPaths=${reports}
	          """
	        }
	      }
	    }
	  }
	}
    
    // ================= QUALITY GATE =================
    stage('Quality Gate') {
      when { branch 'dev' }
      steps {
          withChecks(name: 'Sonar Quality Gate') {
            timeout(time: 20, unit: 'MINUTES') {
              waitForQualityGate abortPipeline: true
            }
          }
      }
    }

    /* =========================================
       MAIN BRANCH: Build e packaging di produzione
       ========================================= */
    stage('Release Build') {
      when { branch 'main' }
      steps {
        script {
          withChecks(name: 'Release Build') {
            sh './mvnw -ntp -Pprod clean package -DskipTests'
            sh """
              ./mvnw -Pprod jib:build \
                -Djib.to.image=${DOCKER_REGISTRY}/${IMAGE_NAME}:${env.GIT_COMMIT} \
                -Djib.allowInsecureRegistries=true
            """
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