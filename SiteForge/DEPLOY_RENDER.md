# Deploy to Render.com (Free & Simple)

Render is perfect if you want a **completely free deployment** with PostgreSQL included.

## 5-Minute Setup

### Step 1: Sign Up
1. Go to https://render.com
2. Click "Sign up"
3. Choose "Sign up with GitHub"
4. Authorize Render to access your repos

### Step 2: Create Web Service
1. Click "New +" button (top right)
2. Select "Web Service"
3. Choose your GitHub repo (MedReport_Web)
4. Grant Render permission to access repo

### Step 3: Configure Service
Fill in the following:

```
Name:                your-medrep-app
Environment:         Node
Region:              US East (or closest to you)
Branch:              main
Build Command:       npm run build
Start Command:       npm start
```

### Step 4: Add Environment Variables
In "Environment" section, add:

```
OPENAI_API_KEY = sk-... (from platform.openai.com)
SESSION_SECRET = (random string)
NODE_ENV = production
```

### Step 5: Deploy
1. Click "Create Web Service"
2. Wait for deployment (5-10 minutes)
3. Get your URL: `https://your-medrep-app.onrender.com`

## Using Render's Free PostgreSQL

Want a database? Render gives you free PostgreSQL:

1. In your Render project, click "New +" 
2. Select "PostgreSQL"
3. Name it (e.g., "medrep-db")
4. Click "Create Database"
5. Copy the `Internal Database URL` to your web service environment

Then run:
```bash
npm run db:push
```

## Important Notes

**Free Tier Limitations:**
- App spins down after 15 min of inactivity
- First request after spin-down takes ~30 seconds
- Database included (500 MB free tier)
- Perfect for testing/demo

**Upgrade to "Starter" ($7/month):**
- No spin-down
- Always running
- Good for production

## Test Your Deployment

```bash
# Health check
curl https://your-medrep-app.onrender.com/api/health

# Frontend
curl https://your-medrep-app.onrender.com/

# View logs
# Go to Render dashboard → Logs tab
```

## Troubleshooting

**Build failed?**
- Check build logs in Render dashboard
- Verify `package.json` has build script
- Ensure `npm run build` works locally

**App keeps crashing?**
- Check "Logs" tab in Render dashboard
- Verify all environment variables are set
- Check OPENAI_API_KEY is valid

**Slow startup?**
- Free tier apps spin down after 15 min
- First request wakes them up (~30s wait)
- Upgrade to Starter to prevent spin-down

## Comparison: Free vs Paid

| Feature | Free | Starter ($7/mo) |
|---------|------|-----------------|
| Spinning down | Yes (15 min) | No |
| Database | 500 MB free | 100 GB |
| Bandwidth | Limited | Unlimited |
| SSL | Yes | Yes |
| Best for | Demo/Test | Production |

---

**Deployment time: 5-10 minutes** ⏱️
**Best for: Free tier with database** 🎉
