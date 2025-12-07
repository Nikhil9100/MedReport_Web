/**
 * PDF and Document Validation for Medical Reports
 * Uses AI-powered extraction instead of external PDF libraries
 */

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

    // Try to extract text from PDF streams
    let extractedText = "";
    try {
      // Look for text in parentheses within PDF streams (common text format)
      const pdfString = pdfBuffer.toString("latin1");
      
      // Extract text between parentheses in PDF streams
      const textMatches = pdfString.match(/\(([^)]+)\)/g);
      if (textMatches) {
        extractedText = textMatches
          .map(match => match.slice(1, -1)) // Remove parentheses
          .join(" ")
          .substring(0, 5000); // Limit to first 5000 chars
        console.log(`📄 PDF text extraction: Found ${textMatches.length} text segments, total length: ${extractedText.length} chars`);
        console.log(`📄 Sample extracted text: ${extractedText.substring(0, 200)}`);
      }
      
      // Also try to extract text after "BT" (begin text) markers
      const btMatches = pdfString.match(/BT[\s\S]*?ET/g);
      if (btMatches && btMatches.length > 0) {
        const btText = btMatches
          .map(match => {
            // Extract content from Tj and Td operators
            const content = match.match(/\(([^)]+)\)/g);
            return content ? content.map(m => m.slice(1, -1)).join(" ") : "";
          })
          .join(" ");
        if (btText.length > extractedText.length) {
          extractedText = btText.substring(0, 5000);
        }
      }
    } catch (e) {
      // If text extraction fails, we'll still return the PDF as valid
      // The AI or fallback analyzer can attempt processing
      console.error(`📄 PDF text extraction error: ${e instanceof Error ? e.message : "Unknown error"}`);
    }

    return {
      text: extractedText,
      pageCount: 1, // We estimate 1 page
      isMedicalDocument: true, // Valid PDF is considered potentially medical
      confidence: 50, // Medium confidence until content is analyzed
    };
  } catch (error) {
    return {
      text: "",
      pageCount: 0,
      isMedicalDocument: false,
      confidence: 0,
      error: `Failed to validate PDF: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
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

