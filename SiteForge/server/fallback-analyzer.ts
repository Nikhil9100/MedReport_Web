/**
 * Fallback Medical Analyzer
 * When Google API quota is exceeded, use local analysis without API calls
 * Extracts actual medical data from the document text without AI
 */

import type { MedicalReport, HealthSummary } from "@shared/schema";

// Medical keywords and patterns for local extraction
const DIAGNOSES_KEYWORDS = [
  "diabetes", "hypertension", "heart disease", "coronary", "asthma", "copd",
  "arthritis", "osteoporosis", "thyroid", "cholesterol", "obesity", "depression",
  "anxiety", "cancer", "tumor", "anemia", "kidney", "liver", "pneumonia",
  "tuberculosis", "hepatitis", "hiv", "aids", "stroke", "paralysis"
];

const TEST_PATTERNS = {
  bloodPressure: /blood pressure[:\s]+(\d+)[\/\s](\d+)/gi,
  glucose: /glucose[:\s]+(\d+)/gi,
  cholesterol: /cholesterol[:\s]+(\d+)/gi,
  hbA1c: /hba1c[:\s]+([0-9.]+)/gi,
  hemoglobin: /hemoglobin[:\s]+([0-9.]+)/gi,
  creatinine: /creatinine[:\s]+([0-9.]+)/gi,
  potassium: /potassium[:\s]+([0-9.]+)/gi,
};

/**
 * Extract medical data locally without API
 */
export function performLocalAnalysis(
  documentText: string
): { medicalReport: MedicalReport; healthSummary: HealthSummary } {
  const text = documentText.toLowerCase();

  // Extract diagnoses by finding keywords
  const diagnoses = extractDiagnoses(text);

  // Extract test results
  const tests = extractTests(text);

  // Estimate age from context (look for patterns like "42-year-old")
  const age = extractAge(text) || 45;

  // Extract gender if mentioned
  const gender = extractGender(text);

  // Check smoking status
  const smokingStatus = extractSmokingStatus(text);

  const medicalReport: MedicalReport = {
    id: `report-${Date.now()}`,
    age,
    gender,
    diagnoses,
    tests,
    medications: extractMedications(text),
    smokingStatus,
  };

  const healthSummary = generateLocalHealthSummary(medicalReport);

  return { medicalReport, healthSummary };
}

function extractDiagnoses(text: string): string[] {
  const diagnoses = new Set<string>();

  for (const keyword of DIAGNOSES_KEYWORDS) {
    if (text.includes(keyword)) {
      diagnoses.add(keyword.charAt(0).toUpperCase() + keyword.slice(1));
    }
  }

  // Also look for patterns like "diagnosed with X" or "patient has X"
  const diagnosisPatterns = [
    /diagnosed with ([a-z\s]+)[,.]/g,
    /patient has ([a-z\s]+)[,.]/g,
    /suffer(?:ing|s) from ([a-z\s]+)[,.]/g,
  ];

  for (const pattern of diagnosisPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      diagnoses.add(match[1].trim());
    }
  }

  return Array.from(diagnoses).slice(0, 5); // Limit to 5
}

function extractTests(text: string): any[] {
  const tests: any[] = [];

  // Blood pressure
  const bpMatch = text.match(TEST_PATTERNS.bloodPressure);
  if (bpMatch) {
    const systolic = parseInt(bpMatch[1]);
    const diastolic = parseInt(bpMatch[2]);
    tests.push({
      name: "Blood Pressure (Systolic)",
      value: systolic,
      unit: "mmHg",
      range: "90-120",
      status: systolic > 140 ? "high" : systolic < 90 ? "low" : "normal",
    });
    tests.push({
      name: "Blood Pressure (Diastolic)",
      value: diastolic,
      unit: "mmHg",
      range: "60-80",
      status: diastolic > 90 ? "high" : diastolic < 60 ? "low" : "normal",
    });
  }

  // Glucose
  const glucoseMatch = text.match(TEST_PATTERNS.glucose);
  if (glucoseMatch) {
    const value = parseInt(glucoseMatch[1]);
    tests.push({
      name: "Fasting Glucose",
      value,
      unit: "mg/dL",
      range: "70-100",
      status: value > 125 ? "high" : value < 70 ? "low" : "normal",
    });
  }

  // HbA1c
  const hba1cMatch = text.match(TEST_PATTERNS.hbA1c);
  if (hba1cMatch) {
    const value = parseFloat(hba1cMatch[1]);
    tests.push({
      name: "HbA1c",
      value,
      unit: "%",
      range: "4.0-5.6",
      status: value > 6.5 ? "high" : value < 4 ? "low" : "normal",
    });
  }

  // Total Cholesterol
  const cholesterolMatch = text.match(TEST_PATTERNS.cholesterol);
  if (cholesterolMatch) {
    const value = parseInt(cholesterolMatch[1]);
    tests.push({
      name: "Total Cholesterol",
      value,
      unit: "mg/dL",
      range: "< 200",
      status: value > 200 ? "high" : "normal",
    });
  }

  // Hemoglobin
  const hemoMatch = text.match(TEST_PATTERNS.hemoglobin);
  if (hemoMatch) {
    const value = parseFloat(hemoMatch[1]);
    tests.push({
      name: "Hemoglobin",
      value,
      unit: "g/dL",
      range: "12-17",
      status: value < 12 ? "low" : value > 17 ? "high" : "normal",
    });
  }

  return tests;
}

function extractAge(text: string): number | null {
  const agePattern = /(\d{1,3})[- ]year[- ]old/i;
  const match = text.match(agePattern);
  if (match) {
    const age = parseInt(match[1]);
    return age > 0 && age < 150 ? age : null;
  }
  return null;
}

function extractGender(text: string): string {
  if (text.includes("female") || text.includes("woman") || text.includes("girl")) {
    return "Female";
  }
  if (text.includes("male") || text.includes("man") || text.includes("boy")) {
    return "Male";
  }
  return "Other";
}

function extractSmokingStatus(text: string): string {
  if (text.includes("smoker") || text.includes("smoking")) {
    return "Yes";
  }
  if (text.includes("non-smoker") || text.includes("never smoked")) {
    return "No";
  }
  if (text.includes("former smoker") || text.includes("quit smoking")) {
    return "Former";
  }
  return "Unknown";
}

function extractMedications(text: string): string[] {
  // Common medication keywords
  const medicationKeywords = [
    "metformin", "insulin", "lisinopril", "amlodipine", "aspirin",
    "atorvastatin", "levothyroxine", "albuterol", "sertraline",
    "omeprazole", "ibuprofen", "amoxicillin"
  ];

  const medications: string[] = [];
  for (const med of medicationKeywords) {
    if (text.includes(med)) {
      medications.push(med.charAt(0).toUpperCase() + med.slice(1));
    }
  }

  return medications;
}

function generateLocalHealthSummary(
  report: MedicalReport
): HealthSummary {
  const highRiskCount = report.tests.filter(t => t.status === "high").length;
  const borderlineCount = report.tests.filter(t => t.status === "borderline").length;

  let shortTermRisk = 25 + highRiskCount * 15 + borderlineCount * 5;
  let longTermRisk = 30 + highRiskCount * 12 + borderlineCount * 8;

  if (report.smokingStatus === "Yes") {
    shortTermRisk += 15;
    longTermRisk += 20;
  }

  if (report.age > 50) {
    longTermRisk += 10;
  }

  if (report.diagnoses.length > 2) {
    shortTermRisk += 10;
    longTermRisk += 15;
  }

  shortTermRisk = Math.min(95, shortTermRisk);
  longTermRisk = Math.min(95, longTermRisk);

  const getLabel = (score: number): "Low" | "Moderate" | "High" => {
    if (score < 34) return "Low";
    if (score < 67) return "Moderate";
    return "High";
  };

  const shortTermLabel = getLabel(shortTermRisk);
  const longTermLabel = getLabel(longTermRisk);

  const keyFindings: string[] = [
    ...report.tests
      .filter(t => t.status === "high")
      .map(t => `${t.name}: ${t.value} ${t.unit} (elevated)`),
    ...report.diagnoses.map(d => `Diagnosed condition: ${d}`),
    `Age: ${report.age} years`,
  ];

  return {
    summary: `Based on the medical report analysis, the patient (age ${report.age}) has ${report.diagnoses.length > 0 ? report.diagnoses.join(", ") : "no documented diagnoses"} with ${highRiskCount} elevated test values. ` +
      `This suggests ${shortTermLabel.toLowerCase()} short-term health risk and ${longTermLabel.toLowerCase()} long-term health risk. ` +
      `Note: This is a local analysis without AI - for more detailed insights, please wait for API quota reset or upgrade to paid plan.`,
    
    keyFindings,
    
    currentHealthIssues: report.diagnoses.length > 0 
      ? report.diagnoses.map(d => `Diagnosed condition: ${d}`)
      : ["No specific diagnoses documented in report"],
    
    futureHealthRisks: {
      shortTerm: [
        `${shortTermLabel} risk in next 1-2 years - Monitor your documented conditions closely`,
        `Key risk factor: ${highRiskCount} elevated test values requiring medical attention`,
      ],
      longTerm: [
        `${longTermLabel} risk in 5-10 years - Consider preventive measures now`,
        `Age-related factor: Patient is ${report.age} years old - health maintenance increasingly important`,
        `Multiple diagnoses compound long-term risk - regular specialist follow-up recommended`,
      ],
      preventiveMeasures: [
        "Regular medical check-ups (every 6-12 months)",
        "Monitor documented health conditions closely",
        "Follow medical advice for any diagnosed conditions",
        "For comprehensive AI-powered risk prediction, please enable API quota",
      ],
    },
    
    recommendations: [
      "Regular medical check-ups recommended",
      "Monitor documented health conditions closely",
      "Follow medical advice for any diagnosed conditions",
      "For comprehensive AI-powered analysis, please try again when API quota resets",
    ],

    insuranceInsights: {
      coverageGaps: `Based on ${report.diagnoses.length > 0 ? report.diagnoses.join(", ") : "current health status"}, patient may need comprehensive coverage`,
      riskProfile: shortTermLabel,
      recommendedCoverage: [
        "Comprehensive hospitalization coverage",
        "Outpatient care coverage for ongoing management",
        "Specialist consultation access",
        "Regular health check-up coverage",
      ],
    },
    
    riskScore: {
      shortTerm: shortTermRisk,
      longTerm: longTermRisk,
      shortTermLabel,
      longTermLabel,
      factors: [
        ...report.tests
          .filter(t => t.status === "high")
          .map((t, i) => ({
            name: t.name,
            contribution: 15,
            explanation: `${t.name} of ${t.value} ${t.unit} exceeds normal range`,
          })),
        ...(report.smokingStatus === "Yes"
          ? [{
              name: "Smoking Status",
              contribution: 15,
              explanation: "Active smoking increases cardiovascular risks",
            }]
          : []),
        ...(report.diagnoses.length > 0
          ? [{
              name: "Multiple Diagnoses",
              contribution: 10,
              explanation: `${report.diagnoses.length} documented health conditions`,
            }]
          : []),
      ],
    },
  };
}
