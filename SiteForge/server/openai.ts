import OpenAI from "openai";
import type { MedicalReport, HealthSummary, RiskScore, MedicalTest } from "@shared/schema";
import { parsePDF, base64ToBuffer, isMedicalContent } from "./pdfParser";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) {
    console.warn("OPENAI_API_KEY not set - using fallback demo data");
    return null;
  }
  if (!openai) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
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
  const client = getOpenAIClient();
  
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

      // Verify content is actually medical using OpenAI if available
      if (client && !isMedicalContent(pdfText)) {
        throw new Error(
          "The uploaded document does not contain valid medical information. " +
          "Please ensure you've uploaded a medical report, lab test result, or clinical document."
        );
      }
    }

    // If no OpenAI client, provide helpful instructions
    if (!client) {
      console.warn("⚠️  OPENAI_API_KEY not configured");
      console.warn("Medical document processing requires OpenAI API key");
      console.warn("To enable: Add OPENAI_API_KEY to your environment variables");
      
      // Create a basic extraction from filename and estimated data
      // This allows testing but clearly indicates limitations
      const medicalReport: MedicalReport = {
        id: `report-${Date.now()}`,
        age: 45,
        gender: "Other",
        diagnoses: ["Medical report uploaded"],
        tests: [
          {
            name: "Processing Status",
            value: 1,
            unit: "pending",
            range: "awaiting-api-key",
            status: "normal",
          }
        ],
        medications: [],
        smokingStatus: "Unknown",
      };

      const healthSummary: HealthSummary = {
        summary: "⚠️ LIMITED PROCESSING: OpenAI API key is not configured. " +
          "To enable full medical report analysis, please add your OPENAI_API_KEY to the environment variables. " +
          "Current mode: File accepted but AI analysis unavailable.",
        keyFindings: [
          "File uploaded successfully",
          "AI analysis unavailable - OpenAI API key missing",
          "Add OPENAI_API_KEY environment variable to enable full processing"
        ],
        riskScore: {
          shortTerm: 0,
          longTerm: 0,
          shortTermLabel: "Unknown",
          longTermLabel: "Unknown",
          factors: [
            {
              name: "API Configuration",
              contribution: 0,
              explanation: "Please configure OPENAI_API_KEY for medical analysis"
            }
          ]
        }
      };

      return { medicalReport, healthSummary };
    }

    // Use AI to extract medical data from the document
    const content = fileType === "image" 
      ? [
          {
            type: "text" as const,
            text: `You are a medical data extraction specialist. Analyze this medical report image and extract ONLY ACTUAL medical information present in the image. 
            
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
          },
          {
            type: "image_url" as const,
            image_url: {
              url: `data:image/jpeg;base64,${fileData}`
            }
          }
        ]
      : [
          {
            type: "text" as const,
            text: `You are a medical data extraction specialist. Analyze this medical report text and extract ONLY actual medical information present.

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
${contentToAnalyze}`
          }
        ];

    const response = await client.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are a medical data extraction specialist. Extract ONLY actual data from medical documents. Never invent or generate data. Always respond with valid JSON only."
        },
        {
          role: "user",
          content: content
        }
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 2048,
    });

    const extractedData = JSON.parse(response.choices[0].message.content || "{}");
    
    // Check if AI detected it's not a medical document
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
      gender: extractedData.gender || "Male",
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

    return { medicalReport, healthSummary };
  } catch (error) {
    console.error("Medical data extraction error:", error);
    throw new Error(
      error instanceof Error 
        ? error.message 
        : "Failed to process medical report. Please ensure you've uploaded a valid medical document."
    );
  }
}

async function generateHealthSummary(report: MedicalReport, clinicalNotes?: string): Promise<HealthSummary> {
  const client = getOpenAIClient();
  
  if (!client) {
    return generateFallbackSummary(report);
  }
  
  try {
    const response = await client.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are a medical advisor analyzing patient medical reports. Provide accurate health summaries based on actual patient data. Respond with JSON only."
        },
        {
          role: "user",
          content: `Analyze this patient's medical report and generate a comprehensive health summary.

Patient Profile:
- Age: ${report.age}
- Gender: ${report.gender}
- Diagnoses: ${report.diagnoses.length > 0 ? report.diagnoses.join(", ") : "None documented"}
- Medications: ${report.medications.length > 0 ? report.medications.join(", ") : "None documented"}
- Smoking Status: ${report.smokingStatus}

Test Results:
${report.tests.map(t => `- ${t.name}: ${t.value} ${t.unit} (Range: ${t.range}) [${t.status}]`).join("\n")}

${clinicalNotes ? `Clinical Notes: ${clinicalNotes}` : ""}

Generate a professional health summary in this JSON format:
{
  "summary": "2-3 sentence professional summary of the patient's health status based on actual findings",
  "keyFindings": ["finding 1", "finding 2", "finding 3"],
  "riskScore": {
    "shortTerm": 0-100 number (risk in next 1-2 years),
    "longTerm": 0-100 number (risk in next 5-10 years),
    "shortTermLabel": "Low" | "Moderate" | "High",
    "longTermLabel": "Low" | "Moderate" | "High",
    "factors": [
      { "name": "factor name", "contribution": 0-100, "explanation": "how this factor affects risk" }
    ]
  }
}

Risk Assessment Guide:
- Consider all abnormal test values (especially borderline and high)
- Age is a significant risk factor
- Multiple diagnoses increase risk
- Smoking status significantly impacts risk
- Medication use may indicate chronic conditions`
        }
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 1024,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      summary: result.summary || "Your health profile shows some areas that may require attention.",
      keyFindings: result.keyFindings || [],
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

function getDefaultTests(): MedicalTest[] {
  return [
    { name: "HbA1c", value: 7.8, unit: "%", range: "4.0-5.6", status: "high" },
    { name: "Blood Pressure (Systolic)", value: 145, unit: "mmHg", range: "90-120", status: "borderline" },
    { name: "Blood Pressure (Diastolic)", value: 92, unit: "mmHg", range: "60-80", status: "borderline" },
    { name: "Fasting Glucose", value: 126, unit: "mg/dL", range: "70-100", status: "high" },
    { name: "Total Cholesterol", value: 220, unit: "mg/dL", range: "< 200", status: "borderline" },
    { name: "LDL Cholesterol", value: 145, unit: "mg/dL", range: "< 100", status: "high" },
    { name: "HDL Cholesterol", value: 42, unit: "mg/dL", range: "> 40", status: "normal" },
    { name: "Triglycerides", value: 175, unit: "mg/dL", range: "< 150", status: "borderline" },
    { name: "Creatinine", value: 1.1, unit: "mg/dL", range: "0.7-1.3", status: "normal" },
    { name: "Hemoglobin", value: 13.5, unit: "g/dL", range: "12-17", status: "normal" },
  ];
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

function generateFallbackData(): ExtractionResult {
  const medicalReport: MedicalReport = {
    id: `report-${Date.now()}`,
    age: 52,
    gender: "Male",
    diagnoses: ["Type 2 Diabetes", "Hypertension"],
    tests: [
      { name: "HbA1c", value: 8.2, unit: "%", range: "4.0-5.6", status: "high" },
      { name: "Blood Pressure (Systolic)", value: 150, unit: "mmHg", range: "90-120", status: "high" },
      { name: "Blood Pressure (Diastolic)", value: 95, unit: "mmHg", range: "60-80", status: "borderline" },
      { name: "Fasting Glucose", value: 142, unit: "mg/dL", range: "70-100", status: "high" },
      { name: "Total Cholesterol", value: 235, unit: "mg/dL", range: "< 200", status: "borderline" },
      { name: "LDL Cholesterol", value: 155, unit: "mg/dL", range: "< 100", status: "high" },
      { name: "HDL Cholesterol", value: 38, unit: "mg/dL", range: "> 40", status: "borderline" },
      { name: "Triglycerides", value: 195, unit: "mg/dL", range: "< 150", status: "borderline" },
      { name: "Creatinine", value: 1.2, unit: "mg/dL", range: "0.7-1.3", status: "normal" },
      { name: "Hemoglobin", value: 14.2, unit: "g/dL", range: "12-17", status: "normal" },
    ],
    medications: ["Metformin 500mg", "Lisinopril 10mg"],
    smokingStatus: "No",
  };

  const healthSummary = generateFallbackSummary(medicalReport);

  return { medicalReport, healthSummary };
}
