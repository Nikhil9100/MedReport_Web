import { GoogleGenerativeAI } from "@google/generative-ai";
import type { MedicalReport, HealthSummary, RiskScore, MedicalTest } from "@shared/schema";
import { parsePDF, base64ToBuffer, isMedicalContent } from "./pdfParser";
import { checkRateLimit, getQuotaWarning } from "./gemini-rate-limiter";
import { getCachedReport, cacheReport, generateFileHash } from "./report-cache";
import { performLocalAnalysis } from "./fallback-analyzer";

// Using Google Gemini API for medical report analysis
let genAI: GoogleGenerativeAI | null = null;

function getGeminiClient(): GoogleGenerativeAI | null {
  if (!process.env.GOOGLE_API_KEY) {
    console.warn("GOOGLE_API_KEY not set");
    return null;
  }
  if (!genAI) {
    genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
  }
  return genAI;
}

interface ExtractionResult {
  medicalReport: MedicalReport;
  healthSummary: HealthSummary;
}

export async function extractMedicalData(
  fileData: string,
  fileType: "pdf" | "image",
  fileName: string
): Promise<ExtractionResult> {
  // Check cache first - if we've already analyzed this file, use cached result
  const cached = getCachedReport(fileData);
  if (cached) {
    return {
      medicalReport: cached.medicalReport,
      healthSummary: cached.healthSummary,
    };
  }

  // Check rate limit first
  try {
    await checkRateLimit();
  } catch (rateLimitError) {
    console.warn(`Rate limit: ${rateLimitError}`);
    throw rateLimitError;
  }

  const client = getGeminiClient();
  
  try {
    // For PDFs, extract text content first
    let contentToAnalyze: string = "";
    let pdfText: string = "";
    
    if (fileType === "pdf") {
      const buffer = base64ToBuffer(fileData);
      const parseResult = await parsePDF(buffer);
      
      if (!parseResult.isMedicalDocument) {
        throw new Error(
          `Invalid medical document. This PDF does not appear to be a medical report. ` +
          `Found ${parseResult.pageCount} page(s). Please upload a legitimate medical report with lab results, ` +
          `clinical notes, or healthcare provider documentation.`
        );
      }

      if (parseResult.error) {
        throw new Error(`PDF parsing error: ${parseResult.error}`);
      }

      pdfText = parseResult.text;
      contentToAnalyze = pdfText;

      // Verify content is actually medical using local keyword check
      if (!isMedicalContent(pdfText)) {
        throw new Error(
          "The uploaded document does not contain valid medical information. " +
          "Please ensure you've uploaded a medical report, lab test result, or clinical document."
        );
      }
    }

    // Require API key for medical report processing
    if (!client) {
      throw new Error(
        "Medical report processing requires Google API key configuration. " +
        "Please set the GOOGLE_API_KEY environment variable to enable document analysis. " +
        "Visit https://aistudio.google.com/app/apikeys to create an API key."
      );
    }

    // Use Gemini to extract medical data from the document
    const model = client.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = fileType === "image" 
      ? `You are a medical data extraction specialist. Analyze this medical report image and extract ONLY ACTUAL medical information present in the image. 
            
CRITICAL: Do NOT generate or invent data. Only extract information that is visible in the image.

If the image does NOT contain a medical report, respond with: {"error": "Not a medical document"}

Extract in this JSON format:
{
  "age": number (or null if not visible),
  "gender": "Male" | "Female" | "Other" (or null),
  "diagnoses": string[] (diagnoses mentioned in report),
  "tests": [{ "name": string, "value": number, "unit": string, "range": string, "status": "normal" | "borderline" | "high" }],
  "medications": string[],
  "smokingStatus": "Yes" | "No" | "Former" (or null),
  "dateOfTest": string (if visible),
  "providerName": string (if visible)
}

Important: If critical fields are missing, set them to null. Do NOT invent values.`
      : `You are a medical data extraction specialist. Analyze this medical report text and extract ONLY actual medical information present.

CRITICAL RULES:
1. Do NOT generate or invent any data
2. If the document is not a medical report, respond with: {"error": "Not a medical document"}
3. Only extract information explicitly mentioned in the report
4. Set fields to null if not found in the document

Extract this information in JSON format:
{
  "age": number (or null),
  "gender": "Male" | "Female" | "Other" (or null),
  "diagnoses": string[],
  "tests": [{ "name": string, "value": number, "unit": string, "range": string, "status": "normal" | "borderline" | "high" }],
  "medications": string[],
  "smokingStatus": "Yes" | "No" | "Former" (or null),
  "dateOfTest": string (if visible),
  "providerName": string (if visible),
  "clinicalNotes": string (if available)
}

Medical Report Text:
${contentToAnalyze}`;

    const response = await model.generateContent(prompt);
    const extractedData = JSON.parse(response.response.text());
    
    // Check if Gemini detected it's not a medical document
    if (extractedData.error) {
      throw new Error(
        "The uploaded file does not appear to be a medical report. " +
        "Please upload a legitimate medical document such as lab results, clinical notes, or a healthcare provider's report."
      );
    }

    // Validate that we got actual medical data
    if (!extractedData.diagnoses?.length && !extractedData.tests?.length) {
      throw new Error(
        "No medical information could be extracted from this document. " +
        "Please ensure you've uploaded a medical report containing test results or clinical findings."
      );
    }

    const medicalReport: MedicalReport = {
      id: `report-${Date.now()}`,
      age: extractedData.age || 45,
      gender: extractedData.gender || "Other",
      diagnoses: extractedData.diagnoses || [],
      tests: (extractedData.tests || []).map((test: any) => ({
        name: test.name || "Unknown",
        value: test.value || 0,
        unit: test.unit || "",
        range: test.range || "",
        status: test.status || "normal",
      })),
      medications: extractedData.medications || [],
      smokingStatus: extractedData.smokingStatus || "Unknown",
    };

    // If no diagnoses were found, this might not be a real medical report
    if (medicalReport.diagnoses.length === 0 && medicalReport.tests.length === 0) {
      throw new Error(
        "This document contains insufficient medical information. " +
        "Please upload a medical report that includes diagnoses, test results, or clinical findings."
      );
    }

    const healthSummary = await generateHealthSummary(medicalReport, extractedData.clinicalNotes);

    // Cache the result for future use
    cacheReport(fileData, fileName, medicalReport, healthSummary);

    return { medicalReport, healthSummary };
  } catch (error) {
    console.error("Medical data extraction error:", error);
    
    // Handle specific Google API errors
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    if (errorMessage.includes("Quota exceeded") || errorMessage.includes("quota")) {
      // Use fallback analysis instead of failing completely
      console.warn("⚠️ API quota exceeded - using local fallback analysis");
      
      if (fileType === "pdf") {
        const buffer = base64ToBuffer(fileData);
        const parseResult = await parsePDF(buffer);
        pdfText = parseResult.text;
      } else {
        pdfText = fileData;
      }

      const { medicalReport, healthSummary } = performLocalAnalysis(pdfText);
      
      // Add note about fallback mode
      healthSummary.summary = "⚠️ FALLBACK MODE (No API quota): " + healthSummary.summary;
      healthSummary.keyFindings.unshift("Analysis performed with local processing (API quota exceeded)");

      // Cache the fallback result too
      cacheReport(fileData, fileName, medicalReport, healthSummary);
      
      return { medicalReport, healthSummary };
    }
    
    if (errorMessage.includes("API key not valid") || errorMessage.includes("Invalid API")) {
      throw new Error(
        "Invalid Google API key. Please verify your GOOGLE_API_KEY is correct. " +
        "Get a new key at https://aistudio.google.com/app/apikeys"
      );
    }

    throw new Error(
      error instanceof Error 
        ? error.message 
        : "Failed to process medical report. Please ensure you've uploaded a valid medical document."
    );
  }
}

async function generateHealthSummary(report: MedicalReport, clinicalNotes?: string): Promise<HealthSummary> {
  // Check rate limit before making API call
  try {
    await checkRateLimit();
  } catch (rateLimitError) {
    console.warn(`Rate limit on health summary: ${rateLimitError}`);
    // Fall back to local summary if rate limited
    return generateFallbackSummary(report);
  }

  const client = getGeminiClient();
  
  if (!client) {
    return generateFallbackSummary(report);
  }
  
  try {
    const model = client.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `Analyze this patient's medical report and generate a comprehensive health summary with detailed problem analysis and future health risks.

Patient Profile:
- Age: ${report.age}
- Gender: ${report.gender}
- Diagnoses: ${report.diagnoses.length > 0 ? report.diagnoses.join(", ") : "None documented"}
- Medications: ${report.medications.length > 0 ? report.medications.join(", ") : "None documented"}
- Smoking Status: ${report.smokingStatus}

Test Results:
${report.tests.map(t => `- ${t.name}: ${t.value} ${t.unit} (Range: ${t.range}) [${t.status}]`).join("\n")}

${clinicalNotes ? `Clinical Notes: ${clinicalNotes}` : ""}

Generate a DETAILED professional health summary in this JSON format:
{
  "summary": "2-3 sentence professional summary of the patient's current health status based on actual findings. Include severity assessment.",
  "keyFindings": [
    "List of 5-7 key findings from test results, diagnoses, and risk factors. Be specific with values."
  ],
  "currentHealthIssues": [
    "Detailed breakdown of each diagnosed condition and its severity",
    "Description of abnormal test values and their medical implications",
    "Lifestyle factors affecting health (smoking, medications, age-related risks)"
  ],
  "futureHealthRisks": [
    "Short-term risks (1-2 years): What conditions or complications could develop",
    "Long-term risks (5-10 years): Progressive disease complications and age-related risks",
    "Preventive measures needed to mitigate these risks"
  ],
  "recommendations": [
    "Medical management recommendations",
    "Lifestyle changes to reduce risk",
    "Monitoring and follow-up frequency recommendations",
    "Warning signs to watch for that require immediate medical attention"
  ],
  "riskScore": {
    "shortTerm": 0-100 number (risk in next 1-2 years),
    "longTerm": 0-100 number (risk in next 5-10 years),
    "shortTermLabel": "Low" | "Moderate" | "High",
    "longTermLabel": "Low" | "Moderate" | "High",
    "factors": [
      { "name": "factor name", "contribution": 1-100, "explanation": "specific impact on health and risk score" }
    ]
  }
}

Risk Assessment Guidelines:
- Weight all abnormal test values (high values carry more weight than borderline)
- Age is a significant cumulative risk factor (increases with each decade above 40)
- Multiple diagnoses compound risk significantly
- Active smoking status increases all risks by 15-25 points
- Medication use indicates chronic conditions and ongoing health issues
- Consider interactions between conditions (e.g., diabetes + hypertension)
- Provide specific, actionable insights, not generic statements`;

    const response = await model.generateContent(prompt);
    const result = JSON.parse(response.response.text());
    
    return {
      summary: result.summary || "Your health profile shows some areas that may require attention.",
      keyFindings: result.keyFindings || [],
      currentHealthIssues: result.currentHealthIssues || [],
      futureHealthRisks: result.futureHealthRisks || [],
      recommendations: result.recommendations || [],
      riskScore: {
        shortTerm: result.riskScore?.shortTerm || 35,
        longTerm: result.riskScore?.longTerm || 45,
        shortTermLabel: result.riskScore?.shortTermLabel || "Moderate",
        longTermLabel: result.riskScore?.longTermLabel || "Moderate",
        factors: result.riskScore?.factors || [],
      },
    };
  } catch (error) {
    console.error("Health summary generation error:", error);
    return generateFallbackSummary(report);
  }
}

function generateFallbackSummary(report: MedicalReport): HealthSummary {
  const highCount = report.tests.filter(t => t.status === "high").length;
  const borderlineCount = report.tests.filter(t => t.status === "borderline").length;
  
  let shortTerm = 25 + highCount * 15 + borderlineCount * 5;
  let longTerm = 30 + highCount * 12 + borderlineCount * 8;
  
  if (report.smokingStatus === "Yes") {
    shortTerm += 15;
    longTerm += 20;
  }
  if (report.age > 50) {
    longTerm += 10;
  }
  
  shortTerm = Math.min(95, shortTerm);
  longTerm = Math.min(95, longTerm);
  
  const getLabel = (score: number) => score < 34 ? "Low" : score < 67 ? "Moderate" : "High";
  
  return {
    summary: `Your medical report shows ${report.diagnoses.join(", ")} with ${highCount} elevated test values. This suggests ${getLabel(shortTerm).toLowerCase()} short-term health risk and may affect insurance coverage options.`,
    keyFindings: [
      ...report.tests.filter(t => t.status === "high").map(t => `${t.name}: ${t.value} ${t.unit} (elevated)`),
      ...report.tests.filter(t => t.status === "borderline").slice(0, 2).map(t => `${t.name}: ${t.value} ${t.unit} (borderline)`),
    ],
    currentHealthIssues: report.diagnoses.map(d => `Diagnosed condition: ${d}`),
    futureHealthRisks: [
      `Short-term risk: ${getLabel(shortTerm)} - Monitor closely`,
      `Long-term risk: ${getLabel(longTerm)} - Consider preventive measures`
    ],
    recommendations: [
      "Regular health check-ups recommended",
      "Follow medical advice for diagnosed conditions",
      "Lifestyle modifications as appropriate"
    ],
    riskScore: {
      shortTerm,
      longTerm,
      shortTermLabel: getLabel(shortTerm) as "Low" | "Moderate" | "High",
      longTermLabel: getLabel(longTerm) as "Low" | "Moderate" | "High",
      factors: [
        ...report.tests.filter(t => t.status === "high").map(t => ({
          name: t.name,
          contribution: 15,
          explanation: `${t.name} of ${t.value} ${t.unit} exceeds normal range of ${t.range}`,
        })),
        ...(report.smokingStatus === "Yes" ? [{
          name: "Smoking Status",
          contribution: 15,
          explanation: "Active smoking increases cardiovascular and respiratory risks",
        }] : []),
      ],
    },
  };
}
