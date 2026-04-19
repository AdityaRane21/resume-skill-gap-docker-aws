# AWS Deployment Guide - Docker App

## Overview
This guide deploys your full-stack dockerized app to AWS using **App Runner** (easiest) with MongoDB Atlas for the database.

### Why App Runner?
✅ **Free tier**: 1,000 compute hours/month (enough for testing)  
✅ **Easy**: No infrastructure management  
✅ **Automatic**: CI/CD from git/ECR  
✅ **Scalable**: Pay only for what you use  

---

## Prerequisites
1. **AWS Account** with free tier eligible
2. **AWS CLI** installed locally
3. **Docker** installed
4. **Git** repository (GitHub/GitLab)
5. **MongoDB Atlas account** (free tier available)

---

## Step 1: Prepare MongoDB Atlas (Database)

### 1.1 Create MongoDB Atlas Cluster
1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up (free) → Create Organization
3. Create a **Free Tier Cluster** (M0, 512MB storage)
4. Choose region closest to your AWS region
5. Create a database user:
   - Go to **Database Access** → **Add New Database User**
   - Username: `appuser`
   - Password: Generate secure password (save it!)
   - Built-in Role: `readWriteAnyDatabase`

### 1.2 Get MongoDB Connection String
1. Go to **Clusters** → Click **Connect**
2. Select "Drivers" → Node.js
3. Copy the connection string:
   ```
   mongodb+srv://appuser:<password>@cluster0.xxxxx.mongodb.net/yourdb?retryWrites=true&w=majority
   ```
4. Replace `<password>` with your actual password
5. Save as environment variable: `MONGO_URI`

### 1.3 Whitelist All IPs (for App Runner)
1. Go to **Network Access**
2. Click **Add IP Address**
3. Enter `0.0.0.0/0` (allow all - since App Runner IPs are dynamic)

---

## Step 2: Push Code to GitHub

### 2.1 Initialize Git Repository
```bash
cd /path/to/resume\ skill\ gap\ docker\ aws\ project
git init
git add .
git commit -m "Initial commit - ready for AWS deployment"
git branch -M main
```

### 2.2 Create GitHub Repository
1. Go to [github.com/new](https://github.com/new)
2. Create repository (name: `interview-app` or similar)
3. Get the repository URL

### 2.3 Push to GitHub
```bash
git remote add origin https://github.com/YOUR_USERNAME/interview-app.git
git push -u origin main
```

---

## Step 3: Setup AWS Credentials Locally

### 3.1 Create AWS User (IAM)
1. Go to [AWS Console](https://console.aws.amazon.com)
2. Navigate to **IAM** → **Users** → **Create User**
3. Username: `apprunner-deployer`
4. Attach policies:
   - `AWSAppRunnerFullAccess`
   - `AmazonEC2ContainerRegistryPowerUser`
5. Create **Access Keys** (CSV download - keep safe!)

### 3.2 Configure AWS CLI
```bash
aws configure
# Enter:
# AWS Access Key ID: [from CSV]
# AWS Secret Access Key: [from CSV]
# Default region: us-east-1 (or your preferred region)
# Default output format: json
```

---

## Step 4: Build & Push Docker Image to ECR

### 4.1 Create ECR Repository
```bash
aws ecr create-repository \
  --repository-name interview-app \
  --region us-east-1
```

### 4.2 Build Docker Image Locally
```bash
# Navigate to project root
cd /path/to/resume\ skill\ gap\ docker\ aws\ project

# Build the image (ensure Dockerfile exists in root)
docker build -t interview-app:latest .
```

### 4.3 Tag and Push to ECR
```bash
# Get ECR login
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Tag image
docker tag interview-app:latest \
  YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/interview-app:latest

# Push to ECR
docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/interview-app:latest
```

**Note**: Find `YOUR_ACCOUNT_ID` by running:
```bash
aws sts get-caller-identity --query Account --output text
```

---

## Step 5: Deploy with AWS App Runner

### 5.1 Create App Runner Service
1. Go to **AWS Console** → **App Runner**
2. Click **Create Service**
3. **Source**: Select ECR
   - ECR Repository: `YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/interview-app`
   - Image tag: `latest`
   - Deployment trigger: Manual (you can change later)
4. Click **Next**

### 5.2 Configure Service
1. **Service name**: `interview-app`
2. **Port**: `5000` (must match your backend)
3. **Environment variables**:
   ```
   MONGO_URI = mongodb+srv://appuser:PASSWORD@cluster0.xxxxx.mongodb.net/yourdb?retryWrites=true&w=majority
   NODE_ENV = production
   PORT = 5000
   ```
4. Click **Next** → **Create & Deploy**

### 5.3 Wait for Deployment
- Status will show "Creating" → "Running"
- Takes 5-10 minutes
- App URL will be generated (e.g., `https://randomstring.us-east-1.apprunner.amazonaws.com`)

---

## Step 6: Configure Backend Environment Variables

### 6.1 Update Backend `.env` File
Create/update `Backend/.env`:
```env
MONGO_URI=mongodb+srv://appuser:PASSWORD@cluster0.xxxxx.mongodb.net/yourdb?retryWrites=true&w=majority
NODE_ENV=production
PORT=5000
```

### 6.2 Rebuild and Redeploy
```bash
docker build -t interview-app:latest .
docker tag interview-app:latest YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/interview-app:latest
docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/interview-app:latest
```

Go back to App Runner and trigger **Deploy** manually.

---

## Step 7: Test Your Deployment

### 7.1 Get App URL
Go to **App Runner** → Your service → Copy **Default domain**

### 7.2 Test API Endpoints
```bash
curl https://your-app-url.apprunner.amazonaws.com/api/auth/login
# Should return a response (not 404)
```

### 7.3 Test Frontend
Visit: `https://your-app-url.apprunner.amazonaws.com`  
Your React app should load!

---

## Free Tier Usage Calculator

| Service | Free Tier Limit | Your Usage |
|---------|-----------------|-----------|
| App Runner | 1,000 compute hrs/month | ~730 hrs (24/7) ✅ |
| Data transfer | 1GB/month (free tier) | Varies |
| ECR | 500MB storage free | ~500MB-1GB |
| MongoDB Atlas | 512MB storage | ✅ Plenty |

**Total Cost**: $0 if you stay within free tier! 🎉

---

## Troubleshooting

### App Runner shows error on deploy
1. Check **Logs** in App Runner dashboard
2. Verify `MONGO_URI` is correct
3. Ensure MongoDB IP whitelist includes `0.0.0.0/0`
4. Check Dockerfile can be built locally first

### Application crashes after deploy
1. Check **App Runner Logs** for error messages
2. Verify environment variables are set
3. Test MongoDB connection locally
4. Ensure backend listens on `PORT` environment variable

### Cannot connect to MongoDB
1. Check `MONGO_URI` connection string
2. Verify MongoDB username/password
3. Ensure IP `0.0.0.0/0` is whitelisted in Atlas
4. Test connection locally: `mongosh "mongodb+srv://..."`

---

## Next Steps - CI/CD Automation

To automatically deploy when you push to GitHub:
1. Go to **App Runner** → Service → **Deployment settings**
2. Select **GitHub** as source instead of ECR
3. Connect GitHub repository
4. Enable **Automatic deployments** on push

See `deploy-to-aws.sh` for manual deployment script.

---

## Cost Optimization Tips

1. **Use App Runner** - cheaper than EC2 for low traffic
2. **Scale down during testing** - pause service when not in use
3. **MongoDB Atlas** - M0 free tier is enough for testing
4. **AWS Budgets** - set alerts at $5, $10, $25 to avoid surprises
5. **CloudWatch** - monitor actual costs in real-time

---

## Summary

✅ **Time to Deploy**: 20-30 minutes  
✅ **Cost**: $0 (within free tier)  
✅ **Complexity**: Easy  
✅ **Maintenance**: Minimal (auto-scaling, auto-healing)

Enjoy your deployed app! 🚀
