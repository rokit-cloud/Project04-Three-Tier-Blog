
pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
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
                sh 'trivy image --severity HIGH,CRITICAL --exit-code 1 blogreact-frontend:ci'
            }
        }

        stage('Trivy Backend Scan') {
            steps {
                sh 'trivy image --severity HIGH,CRITICAL --exit-code 1 blogreact-backend:ci'
            }
        }
    }

    post {
        success {
            echo 'CI pipeline completed successfully.'
        }
        failure {
            echo 'Pipeline failed. Check the stage logs.'
        }
        always {
            echo 'Pipeline execution finished.'
        }
    }
}
