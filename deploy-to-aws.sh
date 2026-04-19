#!/bin/bash

#############################################
# AWS App Runner Deployment Script
# Easy deployment of Docker app to AWS
#############################################

set -e  # Exit on error

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 AWS App Runner Deployment Script${NC}\n"

# 1. GET AWS ACCOUNT ID
echo -e "${YELLOW}[1/5] Getting AWS Account ID...${NC}"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION=${AWS_REGION:-us-east-1}
REPO_NAME=${REPO_NAME:-interview-app}
IMAGE_TAG=${IMAGE_TAG:-latest}

echo -e "${GREEN}✓ Account ID: $ACCOUNT_ID${NC}"
echo -e "${GREEN}✓ Region: $REGION${NC}"
echo -e "${GREEN}✓ Repository: $REPO_NAME${NC}\n"

# 2. CREATE ECR REPOSITORY
echo -e "${YELLOW}[2/5] Creating ECR Repository...${NC}"
REPO_URI="$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com"

# Check if repository exists
if aws ecr describe-repositories --repository-names $REPO_NAME --region $REGION &>/dev/null; then
    echo -e "${GREEN}✓ ECR Repository already exists${NC}"
else
    echo "Creating new ECR repository..."
    aws ecr create-repository \
        --repository-name $REPO_NAME \
        --region $REGION \
        --image-scanning-configuration scanOnPush=true \
        > /dev/null
    echo -e "${GREEN}✓ ECR Repository created${NC}"
fi

# 3. BUILD DOCKER IMAGE
echo -e "\n${YELLOW}[3/5] Building Docker Image...${NC}"
docker build -t $REPO_NAME:$IMAGE_TAG .
echo -e "${GREEN}✓ Docker image built successfully${NC}"

# 4. LOGIN TO ECR AND PUSH
echo -e "\n${YELLOW}[4/5] Pushing to ECR...${NC}"
echo "Logging in to ECR..."
aws ecr get-login-password --region $REGION | \
    docker login --username AWS --password-stdin $REPO_URI

# Tag image
docker tag $REPO_NAME:$IMAGE_TAG \
    $REPO_URI/$REPO_NAME:$IMAGE_TAG

# Push image
echo "Pushing image to ECR..."
docker push $REPO_URI/$REPO_NAME:$IMAGE_TAG
echo -e "${GREEN}✓ Image pushed to ECR${NC}"

# 5. DISPLAY NEXT STEPS
echo -e "\n${YELLOW}[5/5] Deployment Summary${NC}"
echo -e "${GREEN}✓ All done! Your image is ready for App Runner${NC}\n"

echo "📝 Next Steps:"
echo "1. Go to AWS Console → App Runner"
echo "2. Create Service → Select ECR"
echo "3. Repository: $REPO_URI/$REPO_NAME"
echo "4. Image tag: $IMAGE_TAG"
echo "5. Add Environment Variables:"
echo "   - MONGO_URI=mongodb+srv://appuser:PASSWORD@cluster0.xxxxx.mongodb.net/yourdb?retryWrites=true&w=majority"
echo "   - NODE_ENV=production"
echo "   - PORT=5000"
echo "6. Click 'Deploy'"
echo ""
echo -e "${GREEN}Your app will be live in 5-10 minutes!${NC}"
echo ""
echo "To automate deployment:"
echo "- Go to App Runner → Service → Deployment Settings"
echo "- Select GitHub → Connect repository → Enable automatic deployments"
echo ""
echo "Cost Estimate:"
echo "- App Runner: \$0 (1,000 hrs free/month)"
echo "- MongoDB Atlas: \$0 (512MB free tier)"
echo "- ECR: \$0.10/GB storage (minimal)"
echo "- Data Transfer: \$0 (free tier)"
