# MedReport - AI-Powered Insurance Advisor

## Overview
MedReport is a healthcare insurance recommendation platform that analyzes medical reports, compares policies, and provides personalized plan suggestions with clear savings calculations.

## Current State
- **MVP Features Implemented**: Complete end-to-end flow from upload to recommendations
- **Status**: Fully functional with OpenAI-powered medical extraction

## User Flow
1. **Landing Page** → Hero with CTAs to upload report or compare policy
2. **Upload** → Drag & drop medical report (PDF/image)
3. **Extraction** → AI extracts medical data, shows editable fields
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
  - `POST /api/report/:id/export` - Generate PDF export
  - `POST /api/policy/parse` - Parse uploaded policy
  - `GET /api/plans` - Get available insurance plans

### Key Files
- `shared/schema.ts` - All TypeScript types and Zod schemas
- `server/openai.ts` - OpenAI integration for medical extraction
- `server/matching.ts` - Plan matching algorithm and scoring
- `server/storage.ts` - In-memory storage for sessions and plans
- `client/src/pages/` - Page components (landing, upload, review, recommendations)
- `client/src/components/` - Reusable UI components

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
- `OPENAI_API_KEY` - Required for medical extraction (gpt-5 model)
- `SESSION_SECRET` - For session management

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

## Recent Improvements (Session 2)
- ✅ Removed technical warning messages for better UX
- ✅ Enhanced PDF text extraction with multi-encoding support
- ✅ Replaced external image logos with color-coded initials
- ✅ Fixed PDF download with working JSON/HTML/CSV exports
- ✅ Added AI-powered future disease risk prediction (1-2 years & 5-10 years)
- ✅ Implemented backend PDF generation with PDFKit
- ✅ Display extracted medical details prominently on recommendations
- ✅ Enhanced health summary with insurance coverage recommendations

## Features
- **Medical Data Extraction**: AI extracts name, age, gender, diagnoses, test values
- **Disease Risk Prediction**: Predicts future health risks with preventive measures
- **Insurance Recommendations**: Personalized plans based on health profile
- **Professional Reports**: PDF/JSON/HTML/CSV download options
- **Transparent Analysis**: Shows all extracted details for verification
