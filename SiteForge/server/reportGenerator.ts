/**
 * Structured Report Generator
 * Creates formatted, downloadable medical analysis reports
 */

import type { MedicalReport, HealthSummary, PlanMatch } from "@shared/schema";

export interface StructuredReport {
  patientInfo: {
    reportId: string;
    generatedDate: string;
    disclaimer: string;
  };
  medicalProfile: {
    age: number;
    gender: string;
    diagnoses: string[];
    medications: string[];
    smokingStatus: string;
  };
  healthAssessment: {
    summary: string;
    keyFindings: string[];
    riskAssessment: {
      shortTerm: { score: number; label: string; factors: any[] };
      longTerm: { score: number; label: string; factors: any[] };
    };
  };
  labResults: {
    tests: any[];
    analysisDate?: string;
  };
  recommendations?: {
    insurancePlans: any[];
    comparison: {
      currentPolicy?: any;
      recommendedPlan?: any;
      estimatedSavings?: number;
    };
  };
}

/**
 * Generate a structured report from medical data
 */
export function generateStructuredReport(
  medicalReport: MedicalReport,
  healthSummary: HealthSummary,
  recommendations?: PlanMatch[],
  existingPolicy?: any
): StructuredReport {
  const now = new Date();

  return {
    patientInfo: {
      reportId: medicalReport.id,
      generatedDate: now.toISOString(),
      disclaimer: "This report is for informational purposes only. It does not constitute medical advice. " +
        "Please consult with licensed healthcare providers for medical decisions.",
    },
    medicalProfile: {
      age: medicalReport.age,
      gender: medicalReport.gender,
      diagnoses: medicalReport.diagnoses,
      medications: medicalReport.medications,
      smokingStatus: medicalReport.smokingStatus,
    },
    healthAssessment: {
      summary: healthSummary.summary,
      keyFindings: healthSummary.keyFindings,
      riskAssessment: {
        shortTerm: {
          score: healthSummary.riskScore.shortTerm,
          label: healthSummary.riskScore.shortTermLabel,
          factors: healthSummary.riskScore.factors.filter(f => f.name.toLowerCase().includes("short") || f.contribution > 10),
        },
        longTerm: {
          score: healthSummary.riskScore.longTerm,
          label: healthSummary.riskScore.longTermLabel,
          factors: healthSummary.riskScore.factors.filter(f => f.name.toLowerCase().includes("long") || f.contribution > 10),
        },
      },
    },
    labResults: {
      tests: medicalReport.tests.map(test => ({
        name: test.name,
        value: test.value,
        unit: test.unit,
        range: test.range,
        status: test.status,
        interpretation: getTestInterpretation(test.name, test.status),
      })),
      analysisDate: new Date().toISOString(),
    },
    recommendations: recommendations ? {
      insurancePlans: recommendations.slice(0, 3).map((match, index) => ({
        rank: index + 1,
        planName: match.plan.planName,
        provider: match.plan.provider,
        sumInsured: match.plan.sumInsured,
        estimatedPremium: match.estimatedPremium,
        coPayPercentage: match.plan.coPayPct,
        preExistingWaitPeriod: match.plan.preExistingWaitYears,
        score: {
          coverage: match.coverageFitScore,
          affordability: match.affordabilityScore,
          overall: (match.coverageFitScore + match.affordabilityScore) / 2,
        },
        reasons: match.reasons,
        warnings: match.warnings,
      })),
      comparison: {
        currentPolicy: existingPolicy ? {
          provider: existingPolicy.provider,
          planName: existingPolicy.planName,
          sumInsured: existingPolicy.sumInsured,
          annualPremium: existingPolicy.annualPremium,
        } : undefined,
        recommendedPlan: recommendations.length > 0 ? {
          provider: recommendations[0].plan.provider,
          planName: recommendations[0].plan.planName,
          sumInsured: recommendations[0].plan.sumInsured,
          estimatedPremium: recommendations[0].estimatedPremium,
        } : undefined,
        estimatedSavings: existingPolicy && recommendations.length > 0 
          ? existingPolicy.annualPremium - recommendations[0].estimatedPremium
          : undefined,
      },
    } : undefined,
  };
}

/**
 * Format report as JSON for download
 */
export function formatReportAsJSON(report: StructuredReport): string {
  return JSON.stringify(report, null, 2);
}

/**
 * Format report as HTML for viewing/printing
 */
export function formatReportAsHTML(report: StructuredReport): string {
  const date = new Date(report.patientInfo.generatedDate).toLocaleDateString();
  const shortTermColor = getRiskColor(report.healthAssessment.riskAssessment.shortTerm.score);
  const longTermColor = getRiskColor(report.healthAssessment.riskAssessment.longTerm.score);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Medical Analysis Report - ${report.patientInfo.reportId}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; }
    .container { max-width: 900px; margin: 0 auto; background: white; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    header { border-bottom: 3px solid #2c3e50; margin-bottom: 30px; padding-bottom: 20px; }
    h1 { color: #2c3e50; font-size: 28px; margin-bottom: 10px; }
    .report-meta { color: #666; font-size: 14px; }
    h2 { color: #34495e; font-size: 20px; margin-top: 30px; margin-bottom: 15px; border-left: 4px solid #3498db; padding-left: 12px; }
    .section { margin-bottom: 25px; }
    .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 15px; }
    .info-item { background: #f8f9fa; padding: 12px; border-radius: 4px; }
    .info-label { font-weight: 600; color: #555; font-size: 12px; text-transform: uppercase; }
    .info-value { font-size: 16px; color: #2c3e50; margin-top: 4px; }
    .risk-box { background: ${shortTermColor}20; border-left: 4px solid ${shortTermColor}; padding: 15px; border-radius: 4px; margin: 10px 0; }
    .risk-score { font-size: 32px; font-weight: bold; color: ${shortTermColor}; }
    .risk-label { font-size: 14px; color: #555; margin-top: 5px; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    th { background: #34495e; color: white; padding: 12px; text-align: left; font-weight: 600; }
    td { padding: 10px 12px; border-bottom: 1px solid #ddd; }
    tr:hover { background: #f8f9fa; }
    .status-normal { background: #d4edda; color: #155724; }
    .status-borderline { background: #fff3cd; color: #856404; }
    .status-high { background: #f8d7da; color: #721c24; }
    .plan-card { background: #f8f9fa; padding: 15px; border-radius: 4px; margin: 10px 0; border-left: 4px solid #3498db; }
    .disclaimer { background: #fff3cd; border: 1px solid #ffc107; padding: 12px; border-radius: 4px; color: #856404; font-size: 12px; margin-top: 20px; }
    .print-only { display: none; }
    @media print { .print-only { display: block; } }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>Medical Analysis Report</h1>
      <div class="report-meta">
        <p><strong>Report ID:</strong> ${report.patientInfo.reportId}</p>
        <p><strong>Generated:</strong> ${date}</p>
      </div>
    </header>

    <section class="section">
      <h2>Patient Information</h2>
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">Age</div>
          <div class="info-value">${report.medicalProfile.age} years</div>
        </div>
        <div class="info-item">
          <div class="info-label">Gender</div>
          <div class="info-value">${report.medicalProfile.gender}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Diagnoses</div>
          <div class="info-value">${report.medicalProfile.diagnoses.join(", ") || "None documented"}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Smoking Status</div>
          <div class="info-value">${report.medicalProfile.smokingStatus}</div>
        </div>
      </div>
    </section>

    <section class="section">
      <h2>Health Assessment</h2>
      <p style="font-size: 16px; color: #555; margin-bottom: 15px;">${report.healthAssessment.summary}</p>
      
      <h3 style="color: #34495e; margin: 15px 0 10px 0;">Key Findings</h3>
      <ul style="margin-left: 20px;">
        ${report.healthAssessment.keyFindings.map(f => `<li style="margin-bottom: 5px;">${f}</li>`).join("")}
      </ul>

      <h3 style="color: #34495e; margin: 20px 0 15px 0;">Risk Assessment</h3>
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;">
        <div class="risk-box" style="border-left-color: ${shortTermColor};">
          <div style="font-size: 12px; color: #666; text-transform: uppercase; margin-bottom: 10px;">Short-Term Risk (1-2 years)</div>
          <div class="risk-score">${report.healthAssessment.riskAssessment.shortTerm.score}</div>
          <div class="risk-label">${report.healthAssessment.riskAssessment.shortTerm.label}</div>
        </div>
        <div class="risk-box" style="border-left-color: ${longTermColor};">
          <div style="font-size: 12px; color: #666; text-transform: uppercase; margin-bottom: 10px;">Long-Term Risk (5-10 years)</div>
          <div class="risk-score">${report.healthAssessment.riskAssessment.longTerm.score}</div>
          <div class="risk-label">${report.healthAssessment.riskAssessment.longTerm.label}</div>
        </div>
      </div>
    </section>

    <section class="section">
      <h2>Lab Results</h2>
      <table>
        <thead>
          <tr>
            <th>Test Name</th>
            <th>Value</th>
            <th>Unit</th>
            <th>Range</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${report.labResults.tests.map(t => `
            <tr>
              <td><strong>${t.name}</strong></td>
              <td>${t.value}</td>
              <td>${t.unit}</td>
              <td>${t.range}</td>
              <td><span class="status-${t.status}">${t.status.toUpperCase()}</span></td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </section>

    ${report.recommendations ? `
      <section class="section">
        <h2>Insurance Plan Recommendations</h2>
        ${report.recommendations.insurancePlans.map((plan, index) => `
          <div class="plan-card">
            <h3 style="color: #2c3e50; margin-bottom: 10px;">Recommendation #${index + 1}: ${plan.planName}</h3>
            <p style="color: #666; margin-bottom: 10px;"><strong>Provider:</strong> ${plan.provider}</p>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Sum Insured</div>
                <div class="info-value">₹${plan.sumInsured.toLocaleString("en-IN")}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Est. Annual Premium</div>
                <div class="info-value">₹${plan.estimatedPremium.toLocaleString("en-IN")}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Co-pay</div>
                <div class="info-value">${plan.coPayPercentage}%</div>
              </div>
              <div class="info-item">
                <div class="info-label">Pre-existing Wait</div>
                <div class="info-value">${plan.preExistingWaitPeriod} years</div>
              </div>
            </div>
            <p style="margin-top: 10px; font-size: 14px;"><strong>Why Recommended:</strong></p>
            <ul style="margin-left: 20px; font-size: 13px;">
              ${plan.reasons.map(r => `<li>${r}</li>`).join("")}
            </ul>
            ${plan.warnings.length > 0 ? `
              <p style="margin-top: 10px; font-size: 12px; color: #d9534f;"><strong>⚠️ Considerations:</strong></p>
              <ul style="margin-left: 20px; font-size: 12px; color: #d9534f;">
                ${plan.warnings.map(w => `<li>${w}</li>`).join("")}
              </ul>
            ` : ""}
          </div>
        `).join("")}
      </section>
    ` : ""}

    <div class="disclaimer">
      <strong>⚠️ Disclaimer:</strong> ${report.patientInfo.disclaimer} Always consult with qualified insurance providers and healthcare professionals before making coverage decisions.
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Format report as CSV for spreadsheet analysis
 */
export function formatReportAsCSV(report: StructuredReport): string {
  const lines: string[] = [];
  
  lines.push("MEDICAL ANALYSIS REPORT");
  lines.push(`Report ID,${report.patientInfo.reportId}`);
  lines.push(`Generated Date,${report.patientInfo.generatedDate}`);
  lines.push("");
  
  lines.push("PATIENT INFORMATION");
  lines.push(`Age,${report.medicalProfile.age}`);
  lines.push(`Gender,${report.medicalProfile.gender}`);
  lines.push(`Diagnoses,"${report.medicalProfile.diagnoses.join("; ")}"`);
  lines.push(`Smoking Status,${report.medicalProfile.smokingStatus}`);
  lines.push("");
  
  lines.push("HEALTH ASSESSMENT");
  lines.push(`Summary,"${report.healthAssessment.summary}"`);
  lines.push(`Short-term Risk,${report.healthAssessment.riskAssessment.shortTerm.score}`);
  lines.push(`Long-term Risk,${report.healthAssessment.riskAssessment.longTerm.score}`);
  lines.push("");
  
  lines.push("LAB RESULTS");
  lines.push("Test Name,Value,Unit,Range,Status");
  report.labResults.tests.forEach(test => {
    lines.push(`"${test.name}",${test.value},${test.unit},${test.range},${test.status}`);
  });
  
  return lines.join("\n");
}

function getTestInterpretation(testName: string, status: string): string {
  const name = testName.toLowerCase();
  const statusMap: Record<string, Record<string, string>> = {
    normal: { default: "Within normal range" },
    borderline: { default: "Slightly elevated or below normal range" },
    high: { default: "Significantly elevated or below normal range" },
  };
  return statusMap[status]?.default || "";
}

function getRiskColor(score: number): string {
  if (score <= 33) return "#27ae60"; // Green
  if (score <= 66) return "#f39c12"; // Orange
  return "#e74c3c"; // Red
}
