# ================================
# AWS App Runner Deployment Script (PowerShell)
# ================================

$ErrorActionPreference = "Stop"

# Config
$REGION = "us-east-1"
$REPO_NAME = "interview-app"

Write-Host "======================================"
Write-Host "AWS App Runner Deployment Script"
Write-Host "======================================"

# Step 1: Get Account ID
Write-Host "`n[1/5] Getting AWS Account ID..."
$ACCOUNT_ID = (aws sts get-caller-identity --query Account --output text)
Write-Host "[OK] Account ID: $ACCOUNT_ID"
Write-Host "[OK] Region: $REGION"
Write-Host "[OK] Repository: $REPO_NAME"

# Step 2: Create ECR Repo (if not exists)
Write-Host "`n[2/5] Creating ECR Repository..."

$repoExists = aws ecr describe-repositories --repository-names $REPO_NAME 2>$null

if (-not $repoExists) {
    Write-Host "Creating new ECR repository..."
    aws ecr create-repository --repository-name $REPO_NAME | Out-Null
    Write-Host "[OK] Repository created"
} else {
    Write-Host "[OK] Repository already exists"
}

# Step 3: Build Docker Image
Write-Host "`n[3/5] Building Docker Image..."
docker build -t $REPO_NAME .
Write-Host "[OK] Docker image built"

# Step 4: Login to ECR
Write-Host "`n[4/5] Logging in to ECR..."
aws ecr get-login-password --region $REGION `
| docker login --username AWS --password-stdin "$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com"

Write-Host "[OK] Login successful"

# Step 5: Tag & Push
Write-Host "`n[5/5] Pushing to ECR..."

$IMAGE_URI = "$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$REPO_NAME"

docker tag "${REPO_NAME}:latest" $IMAGE_URI
docker push $IMAGE_URI

Write-Host "[OK] Image pushed successfully"

Write-Host "`n🎉 Deployment Step 1 Complete!"
Write-Host "Next: Create App Runner service using this image:"
Write-Host $IMAGE_URI