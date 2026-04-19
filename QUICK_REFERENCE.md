# Quick AWS Deployment Reference

## 🚀 Quick Start (5 minutes)

### 1. Setup MongoDB Atlas
```bash
# Visit: https://www.mongodb.com/cloud/atlas
# Create free cluster → Get connection string
# Save as: MONGO_URI environment variable
```

### 2. Push to GitHub
```bash
git init
git add .
git commit -m "Deploy to AWS"
git remote add origin https://github.com/YOUR_USERNAME/interview-app.git
git push -u origin main
```

### 3. Setup AWS
```bash
# Install AWS CLI: https://aws.amazon.com/cli/
aws configure
# Enter: Access Key, Secret Key, Region (us-east-1), Format (json)
```

### 4. Build & Push Docker Image
```bash
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION=us-east-1

# Create ECR repo
aws ecr create-repository --repository-name interview-app --region $REGION

# Build image
docker build -t interview-app:latest .

# Login to ECR
aws ecr get-login-password --region $REGION | \
  docker login --username AWS --password-stdin \
  $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com

# Tag & push
docker tag interview-app:latest \
  $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/interview-app:latest

docker push $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/interview-app:latest
```

### 5. Deploy to App Runner
```bash
# Go to AWS Console → App Runner
# Create Service → Select ECR image
# Add environment variables (MONGO_URI, NODE_ENV=production, PORT=5000)
# Click Deploy
```

### 6. Get Your URL
```bash
# App Runner will show: https://xxxxx.us-east-1.apprunner.amazonaws.com
# Your app is live! ✅
```

---

## Commands by Task

### Check AWS Account
```bash
aws sts get-caller-identity
```

### View ECR Repositories
```bash
aws ecr describe-repositories
```

### View App Runner Services
```bash
aws apprunner list-services --region us-east-1
```

### Delete App Runner Service (to save credits)
```bash
aws apprunner delete-service --service-arn <arn> --region us-east-1
```

### View AWS Costs
```bash
# Go to AWS Console → Billing & Cost Management → Cost Explorer
```

---

## Environment Variables to Set

In App Runner **Environment Variables** section:

```
MONGO_URI=mongodb+srv://appuser:PASSWORD@cluster0.xxxxx.mongodb.net/yourdb?retryWrites=true&w=majority
NODE_ENV=production
PORT=5000
```

**Get MONGO_URI from MongoDB Atlas:**
- Dashboard → Connect → Choose Drivers (Node.js)
- Copy connection string
- Replace `<password>` with your database user password
- Replace `yourdb` with database name

---

## Pricing Estimate

| Service | Usage | Cost |
|---------|-------|------|
| App Runner | 730 hrs × 4GB | $0 (free tier) |
| Data Transfer | <1GB/month | $0 (free tier) |
| MongoDB Atlas | 512MB | $0 (free tier) |
| **Total** | | **$0** ✅ |

*Assuming you stay within free tier limits (1,000 compute hrs/month)*

---

## Deployment Flow

```
GitHub Repository
       ↓
    (push)
       ↓
ECR (Docker Registry)
       ↓
App Runner (Container Orchestration)
       ↓
MongoDB Atlas (Database)
       ↓
Live App! 🎉
```

---

## Helpful Links

- **AWS App Runner**: https://console.aws.amazon.com/apprunner
- **MongoDB Atlas**: https://cloud.mongodb.com
- **AWS CLI Docs**: https://docs.aws.amazon.com/cli/
- **Docker Docs**: https://docs.docker.com
- **AWS Free Tier**: https://aws.amazon.com/free

---

## Stuck? Check These

1. **App crashes after deploy**
   - Check App Runner → Logs
   - Verify MONGO_URI is correct
   - Test MongoDB connection: `mongosh "your_connection_string"`

2. **Cannot push to ECR**
   - Run: `aws ecr get-login-password --region us-east-1 | docker login ...`
   - Check AWS credentials: `aws configure`

3. **Frontend not loading**
   - Verify Dockerfile builds frontend correctly
   - Check `npm run build` in Frontend folder
   - Verify port is 5000

4. **High costs / want to pause**
   - Delete App Runner service (doesn't delete code)
   - Pause MongoDB cluster (free tier only)
   - Set AWS Budget alerts

---

## Still Need Help?

See `AWS_DEPLOYMENT_GUIDE.md` for detailed step-by-step instructions!
