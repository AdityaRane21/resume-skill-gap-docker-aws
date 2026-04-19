# Pre-Deployment Checklist

Use this checklist before deploying to AWS to ensure everything is ready.

## ✅ Prerequisites

- [ ] **AWS Account** created and verified
- [ ] **AWS Free Tier** eligible (check: https://aws.amazon.com/free/)
- [ ] **AWS CLI** installed (`aws --version` returns version)
- [ ] **Docker** installed and running (`docker ps` works)
- [ ] **Git** installed (`git --version` works)
- [ ] **GitHub** account created
- [ ] **MongoDB Atlas** account created (free tier available)

---

## ✅ AWS Setup

- [ ] **IAM User Created**
  - [ ] Username: `apprunner-deployer`
  - [ ] Attached: `AWSAppRunnerFullAccess` policy
  - [ ] Attached: `AmazonEC2ContainerRegistryPowerUser` policy
  - [ ] Access Keys generated and saved (CSV downloaded)

- [ ] **AWS Credentials Configured Locally**
  ```bash
  aws configure
  ```
  - [ ] AWS Access Key ID entered
  - [ ] AWS Secret Access Key entered
  - [ ] Default region set to: `us-east-1` (or your choice)
  - [ ] Default output format: `json`

- [ ] **AWS Credentials Verified**
  ```bash
  aws sts get-caller-identity
  ```
  - [ ] Shows correct Account ID, User ARN, and Account

---

## ✅ MongoDB Atlas Setup

- [ ] **Free Tier Cluster Created**
  - [ ] Cluster name: (e.g., `cluster0`)
  - [ ] Tier: **M0 (512MB)** - Free tier
  - [ ] Region: Same as AWS region or nearby

- [ ] **Database User Created**
  - [ ] Username: `appuser`
  - [ ] Password: Generated securely (saved somewhere safe)
  - [ ] Role: `readWriteAnyDatabase`

- [ ] **Connection String Ready**
  - [ ] Format: `mongodb+srv://appuser:PASSWORD@cluster0.xxxxx.mongodb.net/yourdb?retryWrites=true&w=majority`
  - [ ] Username/password correct
  - [ ] Database name filled in

- [ ] **IP Whitelist Configured**
  - [ ] Whitelisted: `0.0.0.0/0` (all IPs - needed for App Runner)
  - [ ] **OR** specific IP ranges (if you want to be restrictive)

- [ ] **Test Connection**
  ```bash
  mongosh "mongodb+srv://appuser:PASSWORD@cluster0.xxxxx.mongodb.net/yourdb"
  ```
  - [ ] Connection successful

---

## ✅ Application Code

- [ ] **Backend `.env` File Updated**
  ```
  MONGO_URI=mongodb+srv://appuser:PASSWORD@cluster0.xxxxx.mongodb.net/yourdb?retryWrites=true&w=majority
  NODE_ENV=production
  PORT=5000
  ```

- [ ] **Backend `package.json` Correct**
  - [ ] `main` entry point: `server.js` (or correct entry)
  - [ ] `start` script: `node server.js` (or correct start command)
  - [ ] `type`: `commonjs` (if needed)

- [ ] **Backend `server.js` Correct**
  - [ ] Listens on `process.env.PORT` (not hardcoded port)
  - [ ] MongoDB connection uses `process.env.MONGO_URI`
  - [ ] Loads environment variables with `dotenv.config()`

- [ ] **Frontend Build Works**
  ```bash
  cd Frontend
  npm install
  npm run build
  ```
  - [ ] Build completes without errors
  - [ ] `dist` or `build` folder created
  - [ ] No build warnings or errors

- [ ] **Dockerfile Builds Successfully**
  ```bash
  docker build -t interview-app:latest .
  ```
  - [ ] Build completes without errors
  - [ ] Image created successfully: `docker images`

---

## ✅ Git & GitHub

- [ ] **GitHub Repository Created**
  - [ ] Repository name: (e.g., `interview-app`)
  - [ ] Repository URL: (e.g., `https://github.com/username/interview-app.git`)
  - [ ] README present

- [ ] **Git Repository Initialized**
  ```bash
  git init
  git add .
  git commit -m "Initial commit"
  ```
  - [ ] Git initialized locally
  - [ ] All files committed (except `.env` if it has secrets)

- [ ] **`.gitignore` Configured**
  - [ ] Contains: `node_modules/`
  - [ ] Contains: `.env` (don't commit secrets!)
  - [ ] Contains: `.DS_Store` (if on Mac)
  - [ ] Contains: `dist/` (build output)

- [ ] **Pushed to GitHub**
  ```bash
  git remote add origin https://github.com/username/interview-app.git
  git branch -M main
  git push -u origin main
  ```
  - [ ] Remote added successfully
  - [ ] All code pushed to GitHub
  - [ ] Can see code on GitHub website

---

## ✅ Docker & ECR

- [ ] **Docker Image Builds**
  ```bash
  docker build -t interview-app:latest .
  ```
  - [ ] No build errors
  - [ ] Image size reasonable (~500MB or less)

- [ ] **Docker Image Runs Locally**
  ```bash
  docker run -p 5000:5000 -e MONGO_URI="..." interview-app:latest
  ```
  - [ ] Container starts without errors
  - [ ] App accessible at `http://localhost:5000`
  - [ ] API endpoints respond

- [ ] **ECR Repository Ready**
  ```bash
  aws ecr create-repository --repository-name interview-app --region us-east-1
  ```
  - [ ] Repository created (or already exists)
  - [ ] Repository URI: `ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/interview-app`

- [ ] **Docker Image Pushed to ECR**
  - [ ] ECR login successful
  - [ ] Image tagged correctly
  - [ ] Image pushed successfully
  - [ ] Can see image in ECR console

---

## ✅ App Runner Configuration

- [ ] **Environment Variables Ready**
  ```
  MONGO_URI = mongodb+srv://appuser:PASSWORD@cluster0.xxxxx.mongodb.net/yourdb?retryWrites=true&w=majority
  NODE_ENV = production
  PORT = 5000
  ```

- [ ] **App Runner Service Configuration**
  - [ ] Service name: (e.g., `interview-app`)
  - [ ] Port: `5000`
  - [ ] CPU: `1 vCPU` (sufficient for testing)
  - [ ] Memory: `2 GB` (sufficient for Node.js + frontend)
  - [ ] All environment variables set

---

## ✅ Pre-Deployment Testing

- [ ] **Local Docker Test** (optional but recommended)
  ```bash
  docker-compose up -d
  ```
  - [ ] Services start without errors
  - [ ] Can access app at `http://localhost:5000`

- [ ] **No Secrets in Code**
  - [ ] `.env` file NOT committed to Git
  - [ ] API keys NOT hardcoded
  - [ ] Passwords NOT in code files

- [ ] **All Environment Variables Defined**
  - [ ] MONGO_URI defined in App Runner
  - [ ] NODE_ENV defined in App Runner
  - [ ] PORT defined in App Runner

---

## ✅ Post-Deployment Checklist

After deploying to App Runner:

- [ ] **App Runner Service Created**
  - [ ] Service name visible in console
  - [ ] Status: "Creating" → "Running"

- [ ] **App Running**
  - [ ] Status shows "Running" (green)
  - [ ] URL provided (e.g., `https://xxxxx.us-east-1.apprunner.amazonaws.com`)

- [ ] **Test Live Deployment**
  ```bash
  curl https://your-app-url.apprunner.amazonaws.com/api/health
  ```
  - [ ] API responds
  - [ ] Frontend loads at root URL

- [ ] **Monitor Logs**
  - [ ] Check App Runner → Logs
  - [ ] No error messages
  - [ ] "Connected to Database" message visible

- [ ] **Set Up Billing Alerts** (optional but recommended)
  - [ ] AWS Budgets configured
  - [ ] Alert threshold: $5 or $10
  - [ ] Email notification enabled

---

## 🎉 Ready to Deploy!

If all checkboxes are checked, you're ready to deploy! 🚀

**Deployment Steps:**
1. Run: `./deploy-to-aws.sh` (Mac/Linux) or `deploy-to-aws.bat` (Windows)
2. Go to AWS Console → App Runner
3. Create Service → Select ECR
4. Configure environment variables
5. Click Deploy
6. Wait 5-10 minutes
7. Access your live app! 🎊

**Issues?** Check `AWS_DEPLOYMENT_GUIDE.md` Troubleshooting section.
