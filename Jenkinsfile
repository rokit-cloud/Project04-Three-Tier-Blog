
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
                bat 'dir'
                bat 'docker --version'
            }
        }

        stage('Build Frontend Image') {
            steps {
                bat 'docker build -t blogreact-frontend:ci frontend'
            }
        }

        stage('Build Backend Image') {
            steps {
                bat 'docker build -t blogreact-backend:ci backend'
            }
        }

        stage('Trivy Frontend Scan') {
            steps {
                bat 'trivy image --severity HIGH,CRITICAL --exit-code 1 blogreact-frontend:ci'
            }
        }

        stage('Trivy Backend Scan') {
            steps {
                bat 'trivy image --severity HIGH,CRITICAL --exit-code 1 blogreact-backend:ci'
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
