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
  
  environment {
    NODE_ENV = "development"
  }

  options {
    timestamps()
    ansiColor('xterm')
    skipDefaultCheckout(true)
    buildDiscarder(logRotator(numToKeepStr: '5'))
    timeout(time: 90, unit: 'MINUTES')
  }

  stages {
    /* ===============================
       PREPARE: Checkout
       =============================== */
    stage('Prepare') {
      steps {
        checkout scm
        script {
          env.COMMIT_MSG = sh(
            script: "git log -1 --pretty=%B",
            returnStdout: true
          ).trim()
        } // needed to check for [heavy] or [perf] descriptor
        sh './mvnw -ntp -DskipTests verify'
        sh './npmw ci'
      }
    }
    
    /* ========================================
       FEATURE BRANCH: Rapido controllo qualità
       ======================================== */
    stage('feature-qa') {
      when { branch pattern: "feature/.*", comparator: "REGEXP" }
      parallel {
        stage('Frontend Lint & Unit') {
          steps {
            sh './npmw run lint'
            sh './npmw run prettier:check || true'
            sh './npmw test -- --watch=false'
          }
          post {
            always {
              junit '**/build/test-results/**/*.xml'
            }
          }
        }

        stage('Backend Unit & Coverage') {
          steps {
            sh './mvnw spotless:check'
            sh './mvnw verify -Pdev -DskipIntegrationTests'
            sh './mvnw jacoco:report'
          }
          post {
            always {
              junit '**/target/surefire-reports/*.xml'
              publishHTML(target: [
                reportDir: 'target/site/jacoco',
                reportFiles: 'index.html',
                reportName: 'Jacoco Coverage'
              ])
            }
          }
        }

        stage('Static Analysis') {
          steps {
            sh './mvnw checkstyle:check spotbugs:check || true'
          }
          post {
            always {
              recordIssues(tools: [checkStyle(), spotBugs()])
            }
          }
        }
      }
      post {
        always {
			withSonarQubeEnv('sonar-local') {
            	sh './mvnw sonar:sonar'
          	}
        }
      }
    }

    /* =====================================
       DEV BRANCH: Suite completa di qualità
       ===================================== */
    stage('dev-full-qa') {
      when { branch 'dev' }
      stages {
        stage('Unit Tests') {
	      parallel {
	        stage('Frontend') {
	          steps {
	            sh './npmw run lint'
	            sh './npmw test -- --watch=false'
	          }
	        }
	        stage('Backend') {
	          steps {
	            sh './mvnw verify -Pdev'
	          }
	        }
	      }
          post {
            always {
              junit '**/target/surefire-reports/*.xml'
              publishHTML(target: [
                reportDir: 'target/site/jacoco',
                reportFiles: 'index.html',
                reportName: 'Jacoco Coverage'
              ])
            }
          }
        }

        stage('Integration & E2E Tests') {
          steps {
            sh './mvnw verify -Pintegration -DskipUnitTests'
            sh './npmw run e2e'
          }
          post {
            always {
              cucumber fileIncludePattern: '**/cucumber-reports/*.json'
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
              archiveArtifacts artifacts: 'target/gatling/**', fingerprint: true
            }
          }
        }

        stage('Static Analysis') {
          steps {
            sh './mvnw checkstyle:check spotbugs:check || true'
          }
          post {
            always {
              recordIssues(tools: [checkStyle(), spotBugs()])
            }
          }
        }
        
        stage('Sonar Analysis') {
          steps {
            withSonarQubeEnv('sonar-local') {
              sh './mvnw sonar:sonar'
            }
          }
        }
        
        stage('Quality Gate') {
          steps {
            timeout(time: 5, unit: 'MINUTES') {
              waitForQualityGate abortPipeline: true
            }
          }
        }
      }
    }
    /* =========================================
       PR BRANCH: fast unit checks on PR
       ========================================= */
	stage('pr-validation') {
	  when {
	    changeRequest()
	  }
	  parallel {
	    stage('Backend Unit') {
	      steps {
	        sh './mvnw -Pdev test -DskipIntegrationTests'
	      }
	    }
	    stage('Frontend Unit') {
	      steps {
	        sh './npmw test -- --watch=false'
	      }
	    }
	  }
	}
    /* =========================================
       MAIN BRANCH: Build e packaging di produzione
       ========================================= */
    stage('release-build') {
      when { branch 'main' }
      environment {
        NODE_ENV = "production" // only for production artifact/image
      }
      stages {
        stage('Build Backend & Frontend') {
	      steps {
	        sh './mvnw -Pprod clean package -DskipTests'
	        sh './npmw ci'
	        sh './npmw run build'
	      }
	    }
	
	    stage('Build & Push Image (Jib)') {
	      steps {
	        sh """
	          ./mvnw -Pprod -DskipTests jib:build \
	            -Djib.to.image=localhost:15000/noticeme:${env.GIT_COMMIT}
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