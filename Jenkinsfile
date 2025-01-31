pipeline {
  agent {
    label "docker-agent"
  }
  environment {
    REGISTRY_AUTH = credentials('eec0f0c2-9b9d-4b26-8da5-58222499d901')
    DOTENV_PATH = credentials('unchained-dotenv')
    minimal = ''
    docs = ''
    controlpanel = ''
  }
  tools { dockerTool "docker" }
  stages {
    stage('Test') {
      steps {
        script {
          sh 'cp ${DOTENV_PATH} ./env'
          docker.build("ci:latest")
          sh 'docker run ci:latest sh -c "meteor npm run lint:ci && meteor npm run test:ci"'
        }
      }
    }
    stage('Login to Registry') {
      steps {
        script {
          sh 'docker login -u ${REGISTRY_AUTH_USR} -p ${REGISTRY_AUTH_PSW} registry.ucc.dev'
        }
      }
    }
    stage('Build') {
      parallel {
        stage('Example: Minimal') {
          stages {
            stage('Building') {
              steps{
                script {
                  sh 'cp -R packages ./examples/minimal/packages'
                  minimal = docker.build("registry.ucc.dev/unchained/minimal","-f ./examples/minimal/Dockerfile.multi-stage ./examples/minimal")
                }
              }
            }
            stage('Pushing to Registry') {
              steps {
                script {
                  minimal.push("${GIT_BRANCH}-latest")
                }
              }
            }
          }
        }
        stage('Documentation') {
          stages {
            stage('Building') {
              steps{
                script {
                  docs = docker.build("registry.ucc.dev/unchained/docs",'-f ./docs/Dockerfile ./docs')
                }
              }
            }
            stage('Pushing to Registry') {
              steps {
                script {
                  docs.push("${GIT_BRANCH}-latest")
                }
              }
            }
          }
        }
        stage('Examples: Controlpanel') {
          stages {
            stage('Building') {
              steps{
                script {
                  controlpanel = docker.build("registry.ucc.dev/unchained/controlpanel","-f ./examples/controlpanel/Dockerfile ./examples/controlpanel")
                }
              }
            }
            stage('Pushing to Registry') {
              steps {
                script {
                  controlpanel.push("${GIT_BRANCH}-latest")
                }
              }
            }
          }
        }
      }
    }
    stage('Deploy to Test') {
      when { branch 'develop' }
      steps {
        script {
          controlpanel.push("next")
          minimal.push("next")
          docs.push("next")
        }
      }
    }
    stage('Deploy to Stage') {
      when { branch 'master' }
      steps {
        script {
          controlpanel.push("latest")
          minimal.push("latest")
          docs.push("latest")
        }
      }
    }
    stage('Deploy to Unchained Cloud') {
      when { buildingTag() }
      steps {
        script {
          controlpanel.push("stable")
          minimal.push("stable")
          docs.push("stable")
        }
      }
    }
  }
}
