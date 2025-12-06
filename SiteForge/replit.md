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

## Recent Changes
- Initial MVP implementation with full user flow
- OpenAI gpt-5 integration for medical extraction
- Plan matching algorithm with savings calculator
- Responsive design with dark mode support
