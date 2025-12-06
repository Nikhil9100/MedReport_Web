# Deployment Guide - MedReport on Vercel

## Pre-Deployment Checklist

✅ All improvements have been implemented:
- PostCSS warning fixed
- Health check endpoint added
- Environment variables documented
- Replit plugins optimized for production
- vercel.json configuration optimized

## Required Environment Variables

Add these to your Vercel project dashboard:

1. **OPENAI_API_KEY** (Required)
   - Get from: https://platform.openai.com/api-keys
   - Used for: Medical report analysis using GPT-5
   - Type: Secret

2. **SESSION_SECRET** (Optional but Recommended)
   - Generate: `openssl rand -hex 32` or any random string
   - Used for: Session encryption
   - Type: Secret

3. **DATABASE_URL** (Optional)
   - Format: `postgresql://user:password@host:5432/database`
   - Used for: Persistent data storage
   - If not provided: In-memory sessions (data lost on restart)
   - Type: Secret

## Deployment Steps

### 1. Set Environment Variables in Vercel

Go to your Vercel project → Settings → Environment Variables, and add:

```
OPENAI_API_KEY=sk-... (your key from OpenAI)
SESSION_SECRET=your-random-secret
DATABASE_URL=(optional - for persistent storage)
NODE_ENV=production (auto-set, but verify)
```

### 2. Deploy

The latest version with these improvements has been committed to `main` branch.

Vercel will automatically:
1. Run: `npm run build`
2. Generate: `dist/index.cjs` (server) and `dist/public/` (frontend)
3. Deploy the built application
4. Set the `PORT` environment variable automatically

### 3. Verify Deployment

Once deployed, test these endpoints:

- **Health Check**: `https://your-app.vercel.app/api/health`
  - Should return: `{ "status": "healthy", "timestamp": "...", "uptime": ... }`
  
- **Frontend**: `https://your-app.vercel.app/`
  - Should load the landing page

- **Upload Endpoint**: `POST /api/upload`
  - Test with a medical report file

## Configuration Details

### Build Output Structure

```
dist/
├── index.cjs          ← Server entry point (Express app)
└── public/            ← Static frontend assets
    ├── index.html     ← React app entry
    ├── assets/        ← CSS, JS bundles
    └── favicon.png
```

### How It Works

1. **Build Phase** (`npm run build`):
   - Client: Vite builds React app → `dist/public/`
   - Server: esbuild bundles Express server → `dist/index.cjs`
   - Critical dependencies bundled to optimize cold start

2. **Runtime** (Vercel serverless):
   - Node.js executes `dist/index.cjs`
   - Express serves both API endpoints and static files
   - Static files served from `dist/public/`

3. **Routing**:
   - API routes: `/api/*` → Handled by Express
   - Other routes: → Served as static files or SPA fallback to index.html

## Troubleshooting

### Error: NOT_FOUND on all routes
- **Cause**: Configuration points to wrong build output
- **Solution**: Verify `vercel.json` points to `dist/index.cjs`
- **Check**: `npm run build` creates `dist/index.cjs` and `dist/public/`

### Error: OPENAI_API_KEY not set
- **Impact**: API will use fallback demo data instead of real analysis
- **Solution**: Add `OPENAI_API_KEY` to Vercel environment variables
- **Test**: Call `/api/upload` with a test file

### Error: Cannot find module 'public'
- **Cause**: Build didn't generate static files
- **Solution**: Run `npm run build` locally first to verify
- **Check**: Both `dist/index.cjs` and `dist/public/` must exist

### Cold Start Timeout
- **Cause**: Bundle size or Node startup time
- **Solution**: Already optimized - see `script/build.ts` allowlist
- **If still slow**: Increase `maxDuration` in `vercel.json`

## Performance Optimizations Applied

1. **Dependency Bundling**: Critical packages bundled with server for faster cold start
2. **Replit Plugins**: Only load in dev mode, removed for production
3. **PostCSS Configuration**: Fixed to prevent unnecessary asset transformations
4. **Health Check Endpoint**: Added for monitoring and automated checks

## Environment-Specific Behavior

### Production (Vercel)
- NODE_ENV=production (auto-set)
- Serves static files from `dist/public/`
- Uses bundled dependencies
- No Replit-specific plugins loaded

### Development (Local)
- NODE_ENV=development
- Hot reload via Vite
- Replit plugins loaded (if REPL_ID set)
- Full source maps for debugging

## Database (Optional)

If you want persistent data (users, sessions):

1. Set up PostgreSQL (e.g., Vercel Postgres, Neon, AWS RDS)
2. Add `DATABASE_URL` to Vercel environment
3. Run: `npm run db:push` locally to create tables
4. Drizzle ORM will manage schema

Without DATABASE_URL: Sessions stored in-memory (lost on restart)

## Monitoring

- **Health Endpoint**: `GET /api/health` - Check server status
- **Vercel Logs**: Vercel Dashboard → Logs → view real-time logs
- **Error Tracking**: Check Vercel error pages for 500s

## Next Steps

1. Verify all environment variables are set in Vercel
2. Trigger a new deployment (push to main or redeploy from Vercel dashboard)
3. Check logs for any errors
4. Test the health endpoint
5. Upload a test medical report to verify AI integration

## Support

For issues with:
- **OpenAI API**: https://platform.openai.com/docs
- **Vercel Deployment**: https://vercel.com/docs
- **Express.js**: https://expressjs.com
- **React/Vite**: https://vitejs.dev
