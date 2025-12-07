# MedReport_Web
Convert medical reports into actionable insurance recommendations.

MedReport is a privacy-first prototype that helps users upload a medical report (PDF/image), automatically extracts clinical facts (OCR + medical NER), computes a simple short- and long-term health risk score, and matches the profile against an insurer plan database to recommend the best-fit policies — including an estimated Net Annual Cost and savings comparison vs the user’s current plan.

Key capabilities

-Automatic OCR + medical entity extraction (tests, diagnoses, medications, vitals) with an editable review UI.

-Simple, explainable risk scoring (0–100) and highlight of drivers (e.g., HbA1c, BP).

-Policy import/parse (PDF/manual) and Net Annual Cost calculator that includes expected out-of-pocket expense.

-Ranked plan recommendations with Match Score, waiting period fitting, and explicit savings figures.

-One-page downloadable summary tailored for users and insurance conversations.

Tech & integrations (suggested)
React frontend, Node/Express or Python backend, OCR (Tesseract or cloud OCR), NER (spaCy/custom model), queue worker for background processing, S3 for secure uploads.

Quick start

Clone the repo.

Install dependencies: npm install / pip install -r requirements.txt.

Configure .env for storage, OCR, and model keys.



Why this repo exists
To simplify the insurance-shopping experience for people with pre-existing conditions by combining medical report parsing, transparent risk explanation, and direct-priced plan comparisons — while keeping user privacy and editability front-and-center.
