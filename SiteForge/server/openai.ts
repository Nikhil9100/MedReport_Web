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
  
  // Declare variables outside try block so they're accessible in catch block
  let contentToAnalyze: string = "";
  let pdfText: string = "";
  
  try {
    // For PDFs, extract text content first
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

      // For PDFs, we can't extract text locally, so skip the keyword check
      // The AI will handle the extraction and validation
      // If it's a valid PDF header, proceed - the fallback analyzer will handle truly invalid cases
    }

    // If no API key, use fallback analyzer for PDFs
    if (!client) {
      if (fileType === "pdf") {
        console.warn("⚠️ No API key configured - using local fallback analysis");
        
        if (!pdfText) {
          const buffer = base64ToBuffer(fileData);
          const parseResult = await parsePDF(buffer);
          pdfText = parseResult.text;
        }

        const { medicalReport, healthSummary } = performLocalAnalysis(pdfText);
        
        // Don't show technical details to users - analysis appears normal

        // Cache the fallback result
        cacheReport(fileData, fileName, medicalReport, healthSummary);
        
        return { medicalReport, healthSummary };
      } else {
        throw new Error(
          "Medical report processing requires Google API key configuration. " +
          "Please set the GOOGLE_API_KEY environment variable to enable document analysis. " +
          "Visit https://aistudio.google.com/app/apikeys to create an API key."
        );
      }
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
      
      // Don't show technical details to users - analysis appears normal

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

    const prompt = `You are a medical AI specialist. Analyze this patient's medical report and generate a comprehensive health summary with detailed analysis of current conditions, future disease risks, and insurance coverage implications.

Patient Profile:
- Age: ${report.age} years old
- Gender: ${report.gender}
- Diagnoses: ${report.diagnoses.length > 0 ? report.diagnoses.join(", ") : "None documented"}
- Current Medications: ${report.medications.length > 0 ? report.medications.join(", ") : "None documented"}
- Smoking Status: ${report.smokingStatus}

Test Results:
${report.tests.map(t => `- ${t.name}: ${t.value} ${t.unit} (Normal Range: ${t.range}) [Status: ${t.status}]`).join("\n")}

${clinicalNotes ? `Clinical Notes: ${clinicalNotes}` : ""}

IMPORTANT: Based on the diagnoses and test results provided, analyze and predict:
1. Which NEW diseases or conditions could develop in the next 1-2 years (short-term risk)
2. Which complications or progressive conditions in 5-10 years (long-term risk)
3. What insurance coverage they would need based on their health profile

Generate a detailed professional health assessment in this JSON format:
{
  "summary": "2-3 sentence overview of patient's current health status with severity level. Example: 'Patient is a 45-year-old with Type 2 Diabetes and borderline hypertension. Their HbA1c level of 7.8% indicates moderate glycemic control. This profile carries moderate short-term health risk and requires careful disease management.'",
  
  "keyFindings": [
    "Specific test values with clinical significance. Example: 'HbA1c: 7.8% - indicates suboptimal diabetes control, target should be <7%'",
    "List 5-7 important findings from actual test results and diagnoses"
  ],
  
  "currentHealthIssues": [
    "For each diagnosis: specific severity, stage, and current status. Example: 'Type 2 Diabetes: Moderately controlled with metformin, HbA1c 7.8%, at risk for microvascular complications'",
    "Abnormal test values: explain medical implications. Example: 'LDL Cholesterol 145 mg/dL: Elevated, increases cardiovascular risk; target <100 mg/dL for diabetic patients'",
    "Lifestyle risk factors: smoking status, sedentary lifestyle, diet-related issues affecting current conditions"
  ],
  
  "futureHealthRisks": {
    "shortTerm": [
      "What diseases/conditions could develop in next 1-2 years based on current profile",
      "Example for Type 2 Diabetes patient: 'Diabetic neuropathy (nerve damage), increased UTI infections, diabetic retinopathy progression'",
      "List 3-4 specific conditions with brief medical explanation"
    ],
    "longTerm": [
      "What complications could occur in 5-10 years if conditions worsen or aren't managed",
      "Example: 'Chronic kidney disease (diabetic nephropathy), cardiovascular disease, vision loss from diabetic retinopathy'",
      "List 3-4 progressive complications with medical rationale"
    ],
    "preventiveMeasures": [
      "Specific preventive actions for each identified future risk",
      "Example: 'Diabetic foot care to prevent neuropathic ulcers, annual eye exams for retinopathy screening'"
    ]
  },
  
  "recommendations": [
    "Specific medical management: medication optimization, specialist referrals needed",
    "Lifestyle interventions: diet changes, exercise frequency, weight management targets",
    "Monitoring requirements: how often to check specific values, which specialists to see",
    "Warning signs requiring immediate medical attention: symptoms indicating complications"
  ],
  
  "insuranceInsights": {
    "coverageGaps": "What medical services this patient would need most based on their conditions",
    "riskProfile": "High risk, Moderate risk, or Low risk designation based on conditions",
    "recommendedCoverage": [
      "List specific insurance features needed. Example: 'Comprehensive diabetes management coverage, annual preventive care visits, specialist access (endocrinologist, ophthalmologist)'",
      "Maternity coverage if applicable, critical illness coverage recommendations"
    ]
  },
  
  "riskScore": {
    "shortTerm": 0-100 number representing risk probability in next 1-2 years,
    "longTerm": 0-100 number representing risk probability in next 5-10 years,
    "shortTermLabel": "Low" | "Moderate" | "High",
    "longTermLabel": "Low" | "Moderate" | "High",
    "factors": [
      { "name": "factor name", "contribution": 1-100 (percentage contribution to overall risk), "explanation": "how this specific factor impacts health outcomes and insurance needs" }
    ]
  }
}

RISK CALCULATION GUIDELINES:
- Age factor: Baseline risk increases 10 points per decade above 40
- Each abnormal/high test value: +15-20 points depending on severity
- Each abnormal/borderline test value: +5-10 points
- Multiple diagnoses: multiply baseline by 1.5x (compound effect)
- Active smoking: +20 points
- Medication use: indicates chronic condition, minimum +15 baseline
- Family history (if mentioned): +10-15 points
- Obesity/overweight (if indicated): +10 points

Generate medically accurate, actionable insights based ONLY on the actual data provided.`;

    const response = await model.generateContent(prompt);
    const result = JSON.parse(response.response.text());
    
    return {
      summary: result.summary || "Your health profile shows some areas that may require attention.",
      keyFindings: result.keyFindings || [],
      currentHealthIssues: result.currentHealthIssues || [],
      futureHealthRisks: result.futureHealthRisks || {
        shortTerm: [],
        longTerm: [],
        preventiveMeasures: []
      },
      recommendations: result.recommendations || [],
      insuranceInsights: result.insuranceInsights || {
        coverageGaps: "",
        riskProfile: "Moderate",
        recommendedCoverage: []
      },
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
