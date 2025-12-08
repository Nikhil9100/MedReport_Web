# MedReport - AI-Powered Insurance Advisor

## Overview
MedReport is a healthcare insurance recommendation platform that analyzes medical reports, compares policies, and provides personalized plan suggestions with clear savings calculations.

## Current State
- **MVP Features Implemented**: End-to-end flow from upload to recommendations
- **Status**: AI extraction via Google Gemini with robust local fallback
- **API Status**: ✅ GOOGLE_API_KEY supported; falls back locally if quota/rate-limited

## User Flow
1. **Landing Page** → Hero with CTAs to upload report or compare policy
2. **Upload** → Drag & drop medical report (PDF/image)
3. **Extraction** → AI extracts medical data when available; local OCR parser provides deterministic extraction without AI
4. **Review** → User verifies data, adds existing policy, sets preferences
5. **Recommendations** → Top 3 plans with match scores, savings comparison
6. **Download** → One-page PDF report

## Technical Architecture

### Frontend (React + Vite)
- **Router**: wouter
- **State Management**: TanStack Query v5
- **UI Components**: Shadcn UI + Tailwind CSS
- **Charts**: Recharts

### Backend (Express.js)
- **API Endpoints**:
  - `POST /api/upload` - Upload and extract medical data
  - `GET /api/report/:id` - Fetch report session
  - `POST /api/report/:id/match` - Generate plan recommendations
   - `POST /api/ocr-extract` - Deterministic extraction from pasted OCR text (quota-free)
  - `POST /api/report/:id/export` - Generate PDF export
  - `POST /api/policy/parse` - Parse uploaded policy
  - `GET /api/plans` - Get available insurance plans

### Key Files
- `shared/schema.ts` - All TypeScript types and Zod schemas
- `server/openai.ts` - Gemini AI integration with quota-aware fallback
- `server/ocrExtractor.ts` - Deterministic OCR text parser returning strict OUTPUT_SCHEMA
- `server/matching.ts` - Plan matching algorithm and scoring
- `server/storage.ts` - In-memory storage for sessions and plans
- `client/src/pages/` - Page components (landing, upload, review, recommendations)
- `client/src/components/` - Reusable UI components
- `client/src/lib/ocr.ts` - Client helper for `/api/ocr-extract`

## Data Models
- **MedicalReport**: Patient info, tests, diagnoses
- **HealthSummary**: Plain-language summary, risk scores
- **Policy**: User's existing insurance policy
- **InsurancePlan**: Available plans in database
- **PlanMatch**: Recommendation with scores and savings

## Scoring Algorithm
Match Score (0-100) components:
- Coverage Fit (0-50): How well plan covers user's conditions
- Affordability (0-25): Premium vs budget
- Waiting Period (0-15): Pre-existing condition wait time
- Coverage Quality (0-10): Sum insured, network, co-pay

Net Annual Cost = Premium + Expected OOP
Savings = Existing Policy Cost - Recommended Plan Cost

## Environment Variables
- `GOOGLE_API_KEY` - ✅ Supported; if quota/rate-limited, system uses local analysis
- `SESSION_SECRET` - For session management (auto-generated if not provided)

## Design System
- Primary color: Healthcare blue (HSL 199 89% 48%)
- Status colors: Green (normal), Amber (borderline), Red (high)
- Font: Inter (Google Fonts)
- Dark mode supported via ThemeProvider

## Running the App
```bash
npm run dev
```
Frontend runs on port 5000.

## Deployment
- **Live URL**: https://medreport-web.onrender.com
- **GitHub Repository**: https://github.com/Nikhil9100/MedReport_Web
- **Hosting**: Render.com (Docker containerized)

## Recent Improvements (Session 3)
- ✅ Added robust fallback flow when Gemini quota/rate-limited
- ✅ Implemented deterministic OCR extraction endpoint (`POST /api/ocr-extract`)
- ✅ Added Upload page panel to paste OCR text and preview structured output
- ✅ Enhanced error handling and caching in AI extraction path
- ✅ Created AI setup guide; clarified quota behavior and local fallback

## Features
- **Medical Data Extraction**: AI extracts name, age, gender, diagnoses, test values
- **Disease Risk Prediction**: Predicts future health risks with preventive measures
- **Insurance Recommendations**: Personalized plans based on health profile
- **Professional Reports**: PDF/JSON/HTML/CSV download options
- **Transparent Analysis**: Shows all extracted details for verification

## Setting Up AI Analysis

### Quick Setup (30 seconds)
1. **Get API Key**: Visit [Google AI Studio](https://aistudio.google.com/apikey)
2. **Local Setup**: Add to `SiteForge/.env`:
   ```
   GOOGLE_API_KEY=your_api_key_here
   ```
3. **Production (Render)**: Add to environment variables:
   - Key: `GOOGLE_API_KEY`
   - Value: Your Google API key

### Full Documentation
See [AI_SETUP_GUIDE.md](../AI_SETUP_GUIDE.md) for detailed instructions, troubleshooting, and advanced configuration.

### API Details
- **Service**: Google Gemini 2.0 Flash (with local fallback)
- **Cost**: Free tier subject to quotas; local OCR parser is quota-free
- **Features**: Medical extraction (AI or local), disease risk prediction, insurance recommendations
