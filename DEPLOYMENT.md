# Deployment Guide - GitHub + Vercel

## Step 1: GitHub Upload

### 1.1 Initialize Git (if not already done)

```bash
# Check if git is initialized
git status

# If not, initialize
git init
```

### 1.2 Create GitHub Repository

1. Go to [GitHub](https://github.com)
2. Click "+" → "New repository"
3. Repository name: `irys-gm-dapp` (or any name you prefer)
4. Description: "GM dApp for Irys Testnet"
5. **DO NOT** initialize with README (we already have one)
6. Click "Create repository"

### 1.3 Push Code to GitHub

```bash
# Add all files
git add .

# Commit
git commit -m "Initial commit: Irys GM dApp"

# Add remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/irys-gm-dapp.git

# Push to GitHub
git branch -M main
git push -u origin main
```

**Note**: If you haven't configured Git before:
```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

## Step 2: Vercel Deployment

### 2.1 Sign up / Login to Vercel

1. Go to [Vercel](https://vercel.com)
2. Sign up with GitHub (recommended - easier integration)

### 2.2 Import Project

1. Click "Add New..." → "Project"
2. Import your GitHub repository (`irys-gm-dapp`)
3. Vercel will auto-detect Vite configuration

### 2.3 Configure Build Settings

Vercel should auto-detect, but verify:

- **Framework Preset**: Vite
- **Build Command**: `npm run build` (auto-detected)
- **Output Directory**: `dist` (auto-detected)
- **Install Command**: `npm install` (auto-detected)

### 2.4 Deploy

1. Click "Deploy"
2. Wait for build to complete (~1-2 minutes)
3. Your app will be live at: `https://your-project.vercel.app`

### 2.5 Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions

## Step 3: Verify Deployment

1. Visit your Vercel URL
2. Test wallet connection
3. Send a test transaction
4. Verify it works!

## Troubleshooting

### Build Fails

- Check that all dependencies are in `package.json`
- Verify `vite.config.js` is correct
- Check build logs in Vercel dashboard

### App Not Loading

- Check browser console for errors
- Verify RPC URLs are correct
- Ensure wallet extension is installed

### Transaction Fails

- Check that contract address is correct
- Verify network is Irys Testnet
- Ensure wallet has IRYS tokens

## Environment Variables (if needed)

If you add environment variables later:

1. Go to Vercel Project Settings → Environment Variables
2. Add variables (e.g., `VITE_RPC_URL`)
3. Redeploy

## Continuous Deployment

Vercel automatically deploys when you push to GitHub:
- Push to `main` branch → Production deployment
- Push to other branches → Preview deployment

## Useful Commands

```bash
# Update and redeploy
git add .
git commit -m "Update app"
git push

# Vercel will auto-deploy!
```

## Support

- Vercel Docs: https://vercel.com/docs
- GitHub Docs: https://docs.github.com
