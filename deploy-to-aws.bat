@echo off
REM #############################################
REM AWS App Runner Deployment Script (Windows)
REM Easy deployment of Docker app to AWS
REM #############################################

setlocal enabledelayedexpansion

echo.
echo ======================================
echo AWS App Runner Deployment Script
echo ======================================
echo.

REM Check if AWS CLI is installed
where aws >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] AWS CLI not found. Please install it first:
    echo https://aws.amazon.com/cli/
    pause
    exit /b 1
)

REM Check if Docker is running
docker ps >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Docker is not running. Please start Docker Desktop first.
    pause
    exit /b 1
)

REM Get AWS Account ID
echo [1/5] Getting AWS Account ID...
for /f "delims=" %%i in ('aws sts get-caller-identity --query Account --output text') do set ACCOUNT_ID=%%i

if "%ACCOUNT_ID%"=="" (
    echo [ERROR] Could not get AWS Account ID. Check your credentials with: aws configure
    pause
    exit /b 1
)

set REGION=us-east-1
set REPO_NAME=interview-app
set IMAGE_TAG=latest

echo [OK] Account ID: %ACCOUNT_ID%
echo [OK] Region: %REGION%
echo [OK] Repository: %REPO_NAME%
echo.

REM Create ECR Repository
echo [2/5] Creating ECR Repository...
aws ecr describe-repositories --repository-names %REPO_NAME% --region %REGION% >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo [OK] ECR Repository already exists
) else (
    echo Creating new ECR repository...
    aws ecr create-repository ^
        --repository-name %REPO_NAME% ^
        --region %REGION% ^
        --image-scanning-configuration scanOnPush=true >nul
    echo [OK] ECR Repository created
)

REM Build Docker Image
echo.
echo [3/5] Building Docker Image...
docker build -t %REPO_NAME%:%IMAGE_TAG% .
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Docker build failed
    pause
    exit /b 1
)
echo [OK] Docker image built successfully

REM Login to ECR and Push
echo.
echo [4/5] Pushing to ECR...
echo Logging in to ECR...
for /f "delims=" %%i in ('aws ecr get-login-password --region %REGION%') do (
    docker login --username AWS --password-stdin %ACCOUNT_ID%.dkr.ecr.%REGION%.amazonaws.com <<<"%%i"
)

echo Tagging image...
docker tag %REPO_NAME%:%IMAGE_TAG% %ACCOUNT_ID%.dkr.ecr.%REGION%.amazonaws.com/%REPO_NAME%:%IMAGE_TAG%

echo Pushing image...
docker push %ACCOUNT_ID%.dkr.ecr.%REGION%.amazonaws.com/%REPO_NAME%:%IMAGE_TAG%
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Docker push failed
    pause
    exit /b 1
)
echo [OK] Image pushed to ECR

REM Display Summary
echo.
echo ======================================
echo [5/5] Deployment Summary
echo ======================================
echo.
echo [OK] All done! Your image is ready for App Runner
echo.
echo NEXT STEPS:
echo 1. Go to AWS Console ^> App Runner
echo 2. Create Service ^> Select ECR
echo 3. Repository: %ACCOUNT_ID%.dkr.ecr.%REGION%.amazonaws.com/%REPO_NAME%
echo 4. Image tag: %IMAGE_TAG%
echo 5. Add Environment Variables:
echo    - MONGO_URI=mongodb+srv://appuser:PASSWORD@cluster0.xxxxx.mongodb.net/yourdb
echo    - NODE_ENV=production
echo    - PORT=5000
echo 6. Click 'Deploy'
echo.
echo Your app will be live in 5-10 minutes!
echo.
echo To automate deployments:
echo - Go to App Runner ^> Service ^> Deployment Settings
echo - Select GitHub ^> Connect ^> Enable automatic deployments
echo.
echo Cost Estimate:
echo - App Runner: $0 (1,000 hrs free/month)
echo - MongoDB Atlas: $0 (512MB free tier)
echo - ECR: ~$0 (minimal storage)
echo.
pause
