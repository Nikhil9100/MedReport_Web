/**
 * File validation utilities for medical report uploads
 * Validates file size, type, and content to ensure it's a valid medical report
 */

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20MB
const MIN_FILE_SIZE_BYTES = 1024; // 1KB
const VALID_FILE_TYPES = ["pdf", "image"];
const VALID_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png"];

// Keywords that indicate a medical report
const MEDICAL_KEYWORDS = [
  "patient",
  "diagnosis",
  "treatment",
  "medical",
  "doctor",
  "physician",
  "hospital",
  "clinical",
  "test",
  "laboratory",
  "blood",
  "imaging",
  "xray",
  "ultrasound",
  "ct scan",
  "mri",
  "report",
  "examination",
  "findings",
  "symptoms",
  "disease",
  "health",
  "medication",
  "prescription",
  "vitals",
  "cholesterol",
  "glucose",
  "hemoglobin",
  "bmi",
  "blood pressure",
  "pulse",
  "temperature",
  "weight",
  "height",
];

interface FileValidationResult {
  valid: boolean;
  error?: string;
  warning?: string;
}

/**
 * Validates file size
 */
export function validateFileSize(
  fileSizeBytes: number,
  fileName: string
): FileValidationResult {
  if (fileSizeBytes > MAX_FILE_SIZE_BYTES) {
    const fileSizeMB = (fileSizeBytes / (1024 * 1024)).toFixed(2);
    const maxSizeMB = MAX_FILE_SIZE_BYTES / (1024 * 1024);
    return {
      valid: false,
      error: `File exceeds maximum size of ${maxSizeMB}MB. Uploaded file is ${fileSizeMB}MB.`,
    };
  }

  if (fileSizeBytes < MIN_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File is too small (${(fileSizeBytes / 1024).toFixed(1)}KB). Medical reports must be at least 1MB.`,
    };
  }

  return { valid: true };
}

/**
 * Validates file type and extension
 */
export function validateFileType(
  fileType: string,
  fileName: string
): FileValidationResult {
  // Validate file type parameter
  if (!VALID_FILE_TYPES.includes(fileType.toLowerCase())) {
    return {
      valid: false,
      error: `Invalid file type: ${fileType}. Must be 'pdf' or 'image'.`,
    };
  }

  // Validate file extension
  const extension = `.${fileName.split(".").pop()?.toLowerCase()}`;
  if (!VALID_EXTENSIONS.includes(extension)) {
    return {
      valid: false,
      error: `Invalid file extension: ${extension}. Accepted formats: PDF, JPG, JPEG, PNG.`,
    };
  }

  return { valid: true };
}

/**
 * Checks if content looks like a medical report
 * Analyzes the file content (converted to text) for medical keywords
 */
export function validateMedicalContent(
  fileData: string,
  fileName: string
): FileValidationResult {
  try {
    // For base64 encoded data, decode it first
    let content = fileData;
    
    // If it looks like base64, try to decode it
    if (/^[A-Za-z0-9+/=]+$/.test(fileData.substring(0, 100))) {
      try {
        // This is a simplified check - in production you'd parse PDF/image content properly
        // For now, we'll check if it contains text that looks medical
        const decodedText = Buffer.from(fileData, "base64").toString("utf8", 0, 5000);
        content = decodedText.toLowerCase();
      } catch {
        // If decoding fails, that's okay - might be binary
        content = fileData.toLowerCase();
      }
    } else {
      content = fileData.toLowerCase();
    }

    // Count how many medical keywords are present
    const foundKeywords = MEDICAL_KEYWORDS.filter(keyword =>
      content.includes(keyword)
    );

    // If we find at least 2 medical keywords, consider it likely a medical report
    if (foundKeywords.length >= 2) {
      return { valid: true };
    }

    // If we find some keywords, warn but allow
    if (foundKeywords.length >= 1) {
      return {
        valid: true,
        warning: `File may not be a medical report. Found ${foundKeywords.length} medical keyword(s): ${foundKeywords.join(", ")}. Please verify the file is correct.`,
      };
    }

    // No medical keywords found
    return {
      valid: true,
      warning:
        "Warning: File does not appear to contain typical medical report content. " +
        "Please verify you've uploaded the correct file. " +
        "The system will attempt to process it, but results may be inaccurate.",
    };
  } catch (error) {
    // If content checking fails, log but don't fail validation
    console.warn("Could not validate medical content:", error);
    return {
      valid: true,
      warning: "Could not verify if file is a medical report, but file format is correct.",
    };
  }
}

/**
 * Performs all file validations
 */
export function validateMedicalFile(
  fileData: string,
  fileType: string,
  fileName: string,
  fileSizeBytes: number
): FileValidationResult {
  // Check file size first
  const sizeValidation = validateFileSize(fileSizeBytes, fileName);
  if (!sizeValidation.valid) {
    return sizeValidation;
  }

  // Check file type
  const typeValidation = validateFileType(fileType, fileName);
  if (!typeValidation.valid) {
    return typeValidation;
  }

  // Check medical content
  const contentValidation = validateMedicalContent(fileData, fileName);

  // Return content validation result (which may have warnings)
  return contentValidation;
}

/**
 * Get human-readable file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
}
