# 🚀 Vercel Deployment Quick Reference

## 3-Minute Setup Checklist

### Step 1: Verify Code is Pushed ✓
```bash
git log --oneline -2
# Should show: "84aaab9 Production optimizations..."
```

### Step 2: Add Environment Variables
Go to Vercel Dashboard → Project → Settings → Environment Variables

| Variable | Value | Required |
|----------|-------|----------|
| `GOOGLE_API_KEY` | `AIza...` from https://aistudio.google.com/app/apikeys | YES |
| `SESSION_SECRET` | Any random string or leave blank | NO |
| `DATABASE_URL` | PostgreSQL URL (optional) | NO |

### Step 3: Deploy
- **Option A**: Push to main (auto-deploys)
- **Option B**: Click "Deploy" in Vercel dashboard

### Step 4: Verify (Takes 2-3 minutes)
```bash
# Test these URLs
GET https://your-app.vercel.app/api/health
GET https://your-app.vercel.app/
POST https://your-app.vercel.app/api/upload
```

---

## Troubleshooting

| Error | Fix |
|-------|-----|
| **NOT_FOUND on all routes** | Config points to wrong file. Check vercel.json has `"dist/index.cjs"` |
| **GOOGLE_API_KEY not found** | Add to deployment env vars - FREE tier available at https://aistudio.google.com |
| **Timeout errors** | Increase `maxDuration` in vercel.json (currently 30s) |
| **Build fails** | Run `npm run build` locally first, fix errors, push again |

---

## Key Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/health` | GET | Check if app is running |
| `/api/upload` | POST | Upload medical report (medical data extracted here) |
| `/api/report/:id` | GET | Fetch extracted report data |
| `/api/report/:id/match` | POST | Get insurance recommendations |
| `/api/plans` | GET | List available insurance plans |
| `/` | GET | Frontend app (React) |

---

## File Structure (What Gets Deployed)

```
GitHub (main branch)
└── SiteForge/
    ├── server/         ← Node.js/Express backend
    ├── client/         ← React frontend (TypeScript)
    ├── package.json    ← Dependencies
    ├── vite.config.ts  ← Frontend build config
    ├── vercel.json     ← Deployment config ✨ (New)
    └── DEPLOYMENT.md   ← Full guide ✨ (New)
           ↓
        npm run build
           ↓
        dist/
        ├── index.cjs        ← Server (gets deployed)
        └── public/          ← Frontend (gets deployed)
           ↓
        Uploaded to Vercel
           ↓
        Live at: https://your-app.vercel.app
```

---

## What Was Changed (Since NOT_FOUND Error)

1. **Fixed**: `vercel.json` → points to `dist/index.cjs` (not source files)
2. **Added**: `/api/health` endpoint for monitoring
3. **Added**: `.env.example` for environment variable documentation
4. **Optimized**: `vite.config.ts` for production (no Replit plugins)
5. **Added**: `DEPLOYMENT.md` comprehensive guide

---

## Success Indicators

After deployment, you should see:

✅ `GET /api/health` returns `{"status":"healthy",...}`
✅ Visiting `/` shows the MedReport landing page
✅ App is accessible globally at your Vercel URL
✅ No 404 or 500 errors in Vercel logs
✅ Upload endpoint accepts medical report files

---

## For Issues

1. **Check Vercel Logs**: Dashboard → Deployments → Logs
2. **Verify Environment Variables**: Settings → Environment Variables
3. **Test Locally**: `npm run build && npm start`
4. **Check Git History**: Latest commit should be production optimizations
5. **Read DEPLOYMENT.md**: Full troubleshooting guide in SiteForge folder

---

## Useful Commands (Local Testing)

```bash
# Test build
npm run build

# Test production server locally
npm start
# Visit http://localhost:5000

# Check build size
ls -lh dist/index.cjs  # Should be ~1MB

# Verify environment
echo $NODE_ENV  # Should be "production"
```

---

**Your app is ready! 🎉**
Deployed at: `https://your-medrep-project.vercel.app`
