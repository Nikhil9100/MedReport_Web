/**
 * PDF and Document Validation for Medical Reports
 * Simple regex-based extraction for Node.js backend
 * Avoids browser-only dependencies
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

    // Extract text using basic stream extraction
    // This works for PDFs with embedded text (most medical reports)
    let extractedText = extractPDFText(pdfBuffer);

    // Estimate page count from PDF structure
    const pageCount = estimatePageCount(pdfBuffer);

    console.log(
      `📄 PDF parsed: ~${pageCount} pages, extracted ${extractedText.length} characters`
    );

    return {
      text: extractedText.trim(),
      pageCount,
      isMedicalDocument: true, // Valid PDF, let content analysis determine if medical
      confidence: 60,
    };
  } catch (error) {
    console.error("PDF parsing error:", error);
    return {
      text: "",
      pageCount: 0,
      isMedicalDocument: false,
      confidence: 0,
      error: `Failed to parse PDF: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

/**
 * Extract text from PDF streams using regex patterns
 * Handles multiple PDF encoding formats and text extraction methods
 */
function extractPDFText(pdfBuffer: Buffer): string {
  try {
    let extractedText = "";
    
    // Try UTF-8 first (most common for modern PDFs)
    let pdfString = pdfBuffer.toString("utf8");
    
    // If UTF-8 is mostly garbage, try latin1
    if (!pdfString.includes("stream") && !pdfString.includes("endstream")) {
      pdfString = pdfBuffer.toString("latin1");
    }

    // Pattern 1: Extract text between parentheses - handles Tj operators
    const textMatches = pdfString.match(/\(([^()\\]|\\[\\()bfnrt]|\\[0-7]{1,3})*\)/g);
    if (textMatches && textMatches.length > 0) {
      extractedText = textMatches
        .map(match => {
          try {
            let text = match.slice(1, -1);
            
            // Decode PDF escape sequences
            text = text
              .replace(/\\n/g, "\n")
              .replace(/\\r/g, "\r")
              .replace(/\\t/g, "\t")
              .replace(/\\\//g, "/")
              .replace(/\\\\/g, "\\")
              .replace(/\\b/g, "\b")
              .replace(/\\f/g, "\f");
            
            // Decode octal sequences
            text = text.replace(/\\([0-7]{1,3})/g, (match, octal) => {
              return String.fromCharCode(parseInt(octal, 8));
            });
            
            return text;
          } catch {
            return "";
          }
        })
        .filter(t => t.trim().length > 0)
        .join(" ");
    }

    // Pattern 2: Extract from BT...ET (text positioning blocks)
    if (extractedText.length < 100) {
      const btMatches = pdfString.match(/BT[\s\S]{0,200}?ET/g);
      if (btMatches && btMatches.length > 0) {
        const btText = btMatches
          .map(match => {
            // Extract all parentheses content
            const content = match.match(/\(([^()]*)\)/g);
            return content ? content.map(m => m.slice(1, -1)).join(" ") : "";
          })
          .filter(t => t.trim().length > 0)
          .join(" ");
        
        if (btText.length > extractedText.length) {
          extractedText = btText;
        }
      }
    }

    // Pattern 3: Extract from content streams (last resort)
    if (extractedText.length < 100) {
      const streamMatches = pdfString.match(/stream\n([\s\S]{0,5000}?)\nendstream/g);
      if (streamMatches) {
        const streamText = streamMatches
          .map(m => m.replace(/stream\n/, "").replace(/\nendstream/, ""))
          .map(s => {
            // Extract readable ASCII content
            return s.match(/[\x20-\x7E\n\r\t]+/g)?.join(" ") || "";
          })
          .filter(t => t.length > 20)
          .join(" ");
        
        if (streamText.length > extractedText.length) {
          extractedText = streamText;
        }
      }
    }

    // Clean up the extracted text
    return extractedText
      .replace(/\s+/g, " ")
      .substring(0, 15000) // Limit to 15KB
      .trim();
      
  } catch (error) {
    console.warn("PDF text extraction failed:", error);
    return "";
  }
}

/**
 * Estimate PDF page count by counting /Page objects
 */
function estimatePageCount(pdfBuffer: Buffer): number {
  try {
    const pdfString = pdfBuffer.toString("latin1");
    // Count page tree nodes
    const pageMatches = pdfString.match(/\/Type\s*\/Page\b/g);
    return Math.max(1, (pageMatches?.length || 1));
  } catch {
    return 1;
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

