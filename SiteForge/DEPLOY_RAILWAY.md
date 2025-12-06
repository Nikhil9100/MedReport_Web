# Deploy to Railway.app (⭐ Recommended)

Railway is the **best alternative to Vercel** for your MedReport app because it's built for full-stack applications.

## 5-Minute Setup

### Step 1: Sign Up
1. Go to https://railway.app
2. Click "Start Free"
3. Sign in with GitHub (authorize)

### Step 2: Create New Project
1. Click "New Project" (or "New" button)
2. Select "Deploy from GitHub repo"
3. Find and select **MedReport_Web** repository
4. Select **SiteForge** as the root directory

### Step 3: Configure Build
Railway auto-detects `package.json`, so it should work automatically:
- **Build Command**: `npm run build` (auto-detected)
- **Start Command**: `npm start` (auto-detected)
- **Node Version**: 20.x (auto-detected)

### Step 4: Add Environment Variables
1. Go to Project Settings → Variables
2. Add these variables:
   ```
   OPENAI_API_KEY = sk-... (from https://platform.openai.com/api-keys)
   SESSION_SECRET = (any random string)
   NODE_ENV = production
   ```

### Step 5: Deploy
1. Click "Deploy" button
2. Wait ~2-3 minutes
3. Get your live URL from the Railway dashboard

## Test Your Deployment

Once deployed, test these endpoints:

```bash
# Health check
curl https://your-railway-url.railway.app/api/health

# Frontend
curl https://your-railway-url.railway.app/

# Upload test
curl -X POST https://your-railway-url.railway.app/api/upload
```

## Using Railway Database (Optional)

Want persistent data? Add PostgreSQL:

1. In Railway project, click "Add Service"
2. Select "PostgreSQL"
3. It auto-creates `DATABASE_URL` environment variable
4. Run locally: `npm run db:push`

## Advantages Over Vercel

✅ Built for Node.js backends (not just serverless functions)
✅ No configuration file needed (vs vercel.json)
✅ Better environment variable management
✅ PostgreSQL included
✅ $5/month free credits (vs $0)
✅ Auto-scales without config
✅ Better logs and debugging

## Troubleshooting

**App crashes?**
- Check logs: Project → Logs tab
- Verify environment variables are set
- Check build output for errors

**Slow startup?**
- First deployment is slower
- Subsequent deploys cache dependencies
- Check cold start in logs

**Can't find database URL?**
- It's auto-set when you add PostgreSQL service
- Check Variables tab in project settings

## Next Steps

1. Deploy to Railway
2. Share your live URL
3. Optional: Add custom domain (go to Settings → Domains)

---

**Total time to production: 5 minutes** ⏱️
