/**
 * PDF and Document Validation for Medical Reports
 * Uses PDF.js for proper text extraction
 */

import * as pdfjsLib from "pdfjs-dist";

interface ParseResult {
  text: string;
  pageCount: number;
  isMedicalDocument: boolean;
  confidence: number;
  error?: string;
}

/**
 * Medical document indicators - keywords that appear in actual medical reports
 */
const MEDICAL_DOCUMENT_KEYWORDS = [
  // Lab/test indicators
  "laboratory", "lab", "blood test", "urinalysis", "biopsy",
  "pathology", "specimen", "result", "value", "normal range",
  "reference range", "reference interval", "measured value",
  
  // Clinical indicators
  "patient", "diagnosis", "clinical", "patient id", "patient name",
  "date of birth", "medical record", "admission", "discharge",
  "physician", "doctor", "consultant", "nurse", "healthcare",
  
  // Vital signs and measurements
  "blood pressure", "heart rate", "temperature", "respiratory rate",
  "weight", "height", "bmi", "oxygen saturation", "pulse",
  
  // Common lab tests
  "hemoglobin", "hematocrit", "wbc", "white blood cell", "red blood cell",
  "platelet", "glucose", "fasting glucose", "cholesterol", "ldl", "hdl",
  "triglyceride", "creatinine", "egfr", "bun", "ast", "alt", "albumin",
  "bilirubin", "sodium", "potassium", "chloride", "calcium", "phosphate",
  
  // Imaging reports
  "xray", "x-ray", "ct scan", "mri", "ultrasound", "ecg", "ekg",
  "radiograph", "radiography", "imaging", "findings", "impression",
  
  // Medical conditions
  "diabetes", "hypertension", "hyperlipidemia", "asthma", "copd",
  "heart disease", "cardiac", "coronary", "pneumonia", "infection",
  "malignancy", "cancer", "tumor", "fracture", "arthritis",
  
  // Medication/treatment related
  "medication", "drug", "prescription", "dosage", "frequency",
  "treatment", "therapy", "antibiotic", "vaccine", "injection",
  
  // Report structure
  "assessment", "plan", "objective", "subjective", "history of present illness",
  "physical examination", "past medical history", "allergies", "medications",
  "family history", "social history", "review of systems",
];

/**
 * Validate if a file is likely a medical document based on filename and size
 * For PDFs, we'll let OpenAI handle the actual content extraction
 */
export async function parsePDF(pdfBuffer: Buffer): Promise<ParseResult> {
  try {
    // Check if buffer is empty
    if (!pdfBuffer || pdfBuffer.length === 0) {
      return {
        text: "",
        pageCount: 0,
        isMedicalDocument: false,
        confidence: 0,
        error: "PDF file is empty",
      };
    }

    // Check if it's a valid PDF header
    const header = pdfBuffer.toString("utf8", 0, 5);
    if (!header.includes("%PDF")) {
      return {
        text: "",
        pageCount: 0,
        isMedicalDocument: false,
        confidence: 0,
        error: "Invalid PDF file format. The uploaded file does not appear to be a valid PDF document.",
      };
    }

    // Set up PDF.js worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

    // Load PDF document from buffer
    const pdf = await pdfjsLib.getDocument({ data: pdfBuffer }).promise;
    const pageCount = pdf.numPages;

    let extractedText = "";
    let textCount = 0;

    // Extract text from all pages
    for (let i = 1; i <= Math.min(pageCount, 5); i++) {
      // Limit to first 5 pages for performance
      try {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(" ");

        extractedText += pageText + " ";
        textCount += pageText.length;

        if (textCount > 5000) {
          // Stop if we have enough text
          break;
        }
      } catch (pageError) {
        console.warn(`Failed to extract text from page ${i}`);
        continue;
      }
    }

    // If no text extracted, try basic stream extraction as fallback
    if (!extractedText.trim()) {
      const pdfString = pdfBuffer.toString("latin1");
      const textMatches = pdfString.match(/\(([^)]+)\)/g);
      if (textMatches) {
        extractedText = textMatches
          .map(match => match.slice(1, -1))
          .join(" ")
          .substring(0, 5000);
      }
    }

    console.log(
      `📄 PDF parsed: ${pageCount} pages, extracted ${extractedText.length} characters`
    );

    return {
      text: extractedText.trim(),
      pageCount,
      isMedicalDocument: true, // Valid PDF, let content analysis determine if medical
      confidence: 70,
    };
  } catch (error) {
    console.error("PDF parsing error:", error);
    // Fall back to basic stream extraction if PDF.js fails
    try {
      const pdfString = pdfBuffer.toString("latin1");
      const textMatches = pdfString.match(/\(([^)]+)\)/g);
      let extractedText = "";
      if (textMatches) {
        extractedText = textMatches
          .map(match => match.slice(1, -1))
          .join(" ")
          .substring(0, 5000);
      }
      return {
        text: extractedText.trim(),
        pageCount: 1,
        isMedicalDocument: true,
        confidence: 50,
      };
    } catch (fallbackError) {
      return {
        text: "",
        pageCount: 0,
        isMedicalDocument: false,
        confidence: 0,
        error: `Failed to parse PDF: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  }
}

/**
 * Validate if text content looks like a medical document
 */
function validateMedicalContent(text: string): { isValid: boolean; confidence: number } {
  if (!text || text.length < 100) {
    return { isValid: false, confidence: 0 };
  }

  // Count matching keywords
  const matchedKeywords = MEDICAL_DOCUMENT_KEYWORDS.filter(keyword =>
    text.includes(keyword)
  ).length;

  const totalKeywords = MEDICAL_DOCUMENT_KEYWORDS.length;
  const confidence = (matchedKeywords / totalKeywords) * 100;

  // Need at least 5% of keywords (7+ out of ~140) to be considered medical
  const isValid = matchedKeywords >= 7;

  return { isValid, confidence };
}

/**
 * Extract base64 from file and convert to buffer
 */
export function base64ToBuffer(base64String: string): Buffer {
  return Buffer.from(base64String, "base64");
}

/**
 * Check if extracted content is actually medical data
 */
export function isMedicalContent(text: string): boolean {
  if (!text || text.trim().length === 0) {
    return false;
  }

  const lowercaseText = text.toLowerCase();
  
  // Less strict validation - check for common medical patterns
  const medicalPatterns = [
    /\b(patient|diagnosis|doctor|physician|clinical|medical|health|hospital)\b/i,
    /\b(blood|test|lab|result|examination|report|treatment)\b/i,
    /\b(date|age|gender|vital|pressure|glucose|temperature)\b/i,
    /\b(disease|condition|symptom|medication|prescription|therapy)\b/i,
  ];

  const matchedPatterns = medicalPatterns.filter(pattern =>
    pattern.test(lowercaseText)
  ).length;

  // Require at least 2 patterns (much more lenient than before)
  const isValid = matchedPatterns >= 2;
  
  console.log(`📄 Medical content validation: matched ${matchedPatterns}/4 patterns - ${isValid ? '✅ VALID' : '❌ INVALID'}`);
  
  return isValid;
}

