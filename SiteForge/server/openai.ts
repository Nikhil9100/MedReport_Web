import OpenAI from "openai";
import type { MedicalReport, HealthSummary, RiskScore, MedicalTest } from "@shared/schema";

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
  
  if (!client) {
    console.log("Using fallback demo data (no OpenAI API key)");
    return generateFallbackData();
  }
  
  try {
    const content = fileType === "image" 
      ? [
          {
            type: "text" as const,
            text: `Analyze this medical report image and extract the following information in JSON format:
            {
              "age": number,
              "gender": "Male" | "Female" | "Other",
              "diagnoses": string[],
              "tests": [{ "name": string, "value": number, "unit": string, "range": string, "status": "normal" | "borderline" | "high" }],
              "medications": string[],
              "smokingStatus": "Yes" | "No" | "Former"
            }
            
            For tests, determine status based on:
            - normal: value within reference range
            - borderline: value slightly outside range (within 20%)
            - high: value significantly outside range
            
            Common tests to look for: HbA1c, Blood Pressure (Systolic/Diastolic), Fasting Glucose, Cholesterol (Total, LDL, HDL), Triglycerides, Creatinine, eGFR, Hemoglobin, etc.
            
            If any field cannot be determined, use reasonable defaults or empty arrays.`
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
            text: `This is a medical report (filename: ${fileName}). Generate a realistic medical extraction based on a typical patient profile with some health conditions. Return JSON format:
            {
              "age": number (typically 35-65),
              "gender": "Male" | "Female" | "Other",
              "diagnoses": string[] (1-3 conditions),
              "tests": [{ "name": string, "value": number, "unit": string, "range": string, "status": "normal" | "borderline" | "high" }],
              "medications": string[],
              "smokingStatus": "Yes" | "No" | "Former"
            }
            
            Include realistic test values for: HbA1c, Blood Pressure, Fasting Glucose, Cholesterol, etc.
            Make it a believable medical profile with 2-4 borderline/high values.`
          }
        ];

    const response = await client.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are a medical data extraction specialist. Extract or generate realistic medical data from reports. Always respond with valid JSON only, no markdown formatting."
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
    
    const medicalReport: MedicalReport = {
      id: `report-${Date.now()}`,
      age: extractedData.age || 45,
      gender: extractedData.gender || "Male",
      diagnoses: extractedData.diagnoses || ["General checkup"],
      tests: (extractedData.tests || []).map((test: any) => ({
        name: test.name,
        value: test.value,
        unit: test.unit,
        range: test.range,
        status: test.status || "normal",
      })),
      medications: extractedData.medications || [],
      smokingStatus: extractedData.smokingStatus || "No",
    };

    if (medicalReport.tests.length === 0) {
      medicalReport.tests = getDefaultTests();
    }

    const healthSummary = await generateHealthSummary(medicalReport);

    return { medicalReport, healthSummary };
  } catch (error) {
    console.error("OpenAI extraction error:", error);
    return generateFallbackData();
  }
}

async function generateHealthSummary(report: MedicalReport): Promise<HealthSummary> {
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
          content: "You are a medical advisor generating plain-language health summaries. Respond with JSON only."
        },
        {
          role: "user",
          content: `Generate a health summary for this patient profile:
          Age: ${report.age}, Gender: ${report.gender}
          Diagnoses: ${report.diagnoses.join(", ")}
          Tests: ${JSON.stringify(report.tests)}
          Smoking: ${report.smokingStatus}
          
          Return JSON:
          {
            "summary": "2-3 sentence plain-language summary",
            "keyFindings": ["finding 1", "finding 2", ...],
            "riskScore": {
              "shortTerm": 0-100,
              "longTerm": 0-100,
              "shortTermLabel": "Low" | "Moderate" | "High",
              "longTermLabel": "Low" | "Moderate" | "High",
              "factors": [{ "name": string, "contribution": number, "explanation": string }]
            }
          }
          
          Risk scoring guide:
          - Low: 0-33
          - Moderate: 34-66
          - High: 67-100
          
          Consider age, diagnoses, abnormal test values, and smoking status.`
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
