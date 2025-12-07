# AI-Powered Medical Report Analysis Setup

## Overview
MedReport uses Google Gemini API for advanced AI-powered medical report analysis. This document explains how to set up and configure the system for full AI capabilities.

## Quick Start (Local Development)

### 1. Get Your Free Google API Key
1. Visit [Google AI Studio](https://aistudio.google.com/apikey)
2. Click "Get API Key"
3. Create a new API key or use existing one
4. Copy the API key

### 2. Configure .env File
Create a `.env` file in the `SiteForge/` directory:

```bash
# Google API Configuration - Get free key from https://aistudio.google.com/apikey
GOOGLE_API_KEY=your_actual_api_key_here

# Session Configuration (optional)
SESSION_SECRET=your-secure-session-key

# Node Environment
NODE_ENV=production
```

### 3. Verify Setup
```bash
cd SiteForge
npm install
npm run build
npm run start
```

The server should start without warnings about missing API keys.

## Production Deployment (Render.com)

### 1. Add Environment Variable to Render
1. Go to your Render service dashboard
2. Navigate to **Settings** → **Environment**
3. Add new variable:
   - **Key**: `GOOGLE_API_KEY`
   - **Value**: Your Google API key from step 1 above
4. Click Save

### 2. Redeploy
1. Go to **Deployments**
2. Click **Manual Deploy** or push changes to GitHub
3. Wait for deployment to complete

The app will automatically use the GOOGLE_API_KEY from Render's environment variables.

## API Quota & Limits

### Google Gemini Free Tier
- **Tokens/Month**: 2,000,000
- **Requests/Minute**: 60 RPM
- **Cost**: FREE

### MedReport Rate Limiting
Built-in protection with 3 layers:
1. **Rate Limiter**: 60 requests per minute per IP
2. **Report Cache**: Caches results for identical files (24-hour TTL)
3. **Fallback Analyzer**: Local analysis if quota exceeded

## What AI Analysis Provides

### With API Key (AI-Enabled)
✅ Detailed medical data extraction
✅ Disease risk prediction (1-2 years & 5-10 years)
✅ Insurance coverage recommendations
✅ Professional health summaries
✅ Risk factor analysis with explanations
✅ Preventive measures suggestions

### Without API Key (Fallback Analyzer)
⚠️ Basic medical keyword extraction
⚠️ Test value detection from patterns
⚠️ Limited diagnosis recognition
⚠️ Generic health summaries
⚠️ No risk prediction capability

## Troubleshooting

### "No API key configured" Warning
**Cause**: GOOGLE_API_KEY environment variable not set
**Solution**: 
- Local: Add to `.env` file
- Render: Add to environment variables in dashboard

### "API quota exceeded" Error
**Cause**: Free tier monthly limit reached
**Solution**: 
- Wait for quota reset (monthly)
- Upgrade to paid API tier
- Use cached results for duplicate files

### Tests show "local analysis"
**Cause**: API key not properly loaded
**Solution**:
```bash
# Verify environment
echo $GOOGLE_API_KEY

# Rebuild project
npm run build

# Restart server
npm run start
```

## Technical Architecture

### Medical Data Extraction (openai.ts)
1. Parse uploaded PDF/image
2. Validate medical document content
3. Send to Google Gemini API
4. Parse JSON response
5. Cache result for future use
6. Return structured data

### Health Summary Generation
1. Analyze test results (high/borderline/normal)
2. Assess risk factors
3. Generate disease risk predictions
4. Recommend insurance coverage
5. Suggest preventive measures

### Fallback Processing
If API unavailable:
1. Extract medical keywords from text
2. Detect test patterns (blood pressure, glucose, etc.)
3. Estimate age from context
4. Identify smoking status
5. Generate generic health summary

## Performance Metrics

### API Response Time
- Average: 2-3 seconds
- Max: 5-10 seconds (depending on file size)

### Cache Hit Rate
- Expected: 30-40% (for repeated uploads)
- Saves API quota significantly

### File Size Limits
- PDF: Up to 50MB
- Images: Up to 50MB
- Processing time: < 10 seconds

## Security Considerations

1. **API Key Protection**
   - Never commit .env file to git
   - Use environment variables in production
   - Rotate keys periodically

2. **Data Privacy**
   - Medical data sent to Google APIs
   - No data stored persistently
   - Session data cleared after 24 hours

3. **Rate Limiting**
   - Per-IP rate limiting (60 req/min)
   - Prevents abuse and quota exhaustion

## Advanced Configuration

### Custom Rate Limits
Edit `server/gemini-rate-limiter.ts`:
```typescript
const REQUESTS_PER_MINUTE = 60; // Change this
const QUOTA_CHECK_INTERVAL = 1000; // milliseconds
```

### Cache TTL
Edit `server/report-cache.ts`:
```typescript
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
```

### Prompt Customization
Edit `server/openai.ts` - search for `MEDICAL_EXTRACTION_PROMPT`:
```typescript
const prompt = `Your custom prompt here...`;
```

## Getting Help

1. **Google API Issues**
   - Check: [Google Generative AI Docs](https://ai.google.dev/docs)
   - Status: [Google Cloud Console](https://console.cloud.google.com)

2. **MedReport Issues**
   - GitHub Issues: [MedReport_Web Issues](https://github.com/Nikhil9100/MedReport_Web/issues)
   - Repository: [MedReport_Web](https://github.com/Nikhil9100/MedReport_Web)

## Next Steps

1. ✅ Get API key from Google AI Studio
2. ✅ Add to `.env` (local) or Render environment (production)
3. ✅ Rebuild and redeploy
4. ✅ Test with a sample medical report
5. ✅ Monitor API usage in Google Cloud Console

---

**Last Updated**: December 7, 2025  
**Status**: Production Ready with Free Google Gemini API
