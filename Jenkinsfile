
pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    environment {
        NEXUS_REGISTRY = 'host.docker.internal:8082'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Validate Project Files') {
            steps {
                sh '''
                    echo "Checking project files..."
                    ls -la
                    test -f docker-compose.yml
                    test -d frontend
                    test -d backend
                    echo "Project files verified."
                '''
            }
        }

        stage('Check Docker Access') {
            steps {
                sh 'docker --version'
            }
        }

        stage('Build Frontend Image') {
            steps {
                sh 'docker build -t blogreact-frontend:ci frontend'
            }
        }

        stage('Build Backend Image') {
            steps {
                sh 'docker build -t blogreact-backend:ci backend'
            }
        }

        stage('Trivy Frontend Scan') {
            steps {
                sh '''
                    trivy image \
                        --severity HIGH,CRITICAL \
                        --exit-code 1 \
                        blogreact-frontend:ci
                '''
            }
        }

        stage('Trivy Backend Scan') {
            steps {
                sh '''
                    trivy image \
                        --severity HIGH,CRITICAL \
                        --exit-code 1 \
                        blogreact-backend:ci
                '''
            }
        }

        stage('Push Images to Nexus') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'nexus-docker-creds',
                        usernameVariable: 'NEXUS_USER',
                        passwordVariable: 'NEXUS_PASSWORD'
                    )
                ]) {
                    sh '''
                        set +x

                        echo "$NEXUS_PASSWORD" | docker login "$NEXUS_REGISTRY" \
                            --username "$NEXUS_USER" \
                            --password-stdin

                        docker tag blogreact-frontend:ci \
                            "$NEXUS_REGISTRY/blogreact-frontend:ci"

                        docker tag blogreact-backend:ci \
                            "$NEXUS_REGISTRY/blogreact-backend:ci"

                        docker push "$NEXUS_REGISTRY/blogreact-frontend:ci"
                        docker push "$NEXUS_REGISTRY/blogreact-backend:ci"

                        docker logout "$NEXUS_REGISTRY"
                    '''
                }
            }
        }
    }

    post {
        success {
            echo 'CI pipeline and Nexus image publishing completed successfully.'
        }

        failure {
            echo 'Pipeline failed. Check the stage logs.'
        }

        always {
            echo 'Pipeline execution finished.'
        }
    }
}
