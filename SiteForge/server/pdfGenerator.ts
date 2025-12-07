/**
 * PDF Report Generator using PDFKit
 * Generates professional PDF reports with all health analysis and insurance recommendations
 */

import PDFDocument from "pdfkit";
import type { StructuredReport } from "./reportGenerator";

export function generatePDFReport(report: StructuredReport): Buffer {
  const doc = new PDFDocument({
    margin: 40,
    bufferPages: true,
  });

  const chunks: Buffer[] = [];
  doc.on("data", (chunk) => chunks.push(chunk));

  const { patientInfo, medicalProfile, healthAssessment, labResults, recommendations } = report;

  // Helper function for section titles
  const addSectionTitle = (title: string) => {
    doc.fontSize(14).font("Helvetica-Bold").text(title, { underline: true });
    doc.moveDown(0.5);
  };

  const addSubsectionTitle = (title: string) => {
    doc.fontSize(11).font("Helvetica-Bold").text(title);
    doc.moveDown(0.3);
  };

  // Header
  doc.fontSize(24).font("Helvetica-Bold").text("MedReport", { align: "center" });
  doc.fontSize(12).font("Helvetica").text("Health Analysis & Insurance Recommendation Report", {
    align: "center",
  });
  doc.moveDown(0.5);

  doc
    .fontSize(9)
    .font("Helvetica")
    .text(`Generated: ${patientInfo.generatedDate}`, { align: "center" });
  doc.fontSize(8).font("Helvetica").text(`Report ID: ${patientInfo.reportId}`, { align: "center" });
  doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
  doc.moveDown(1);

  // Disclaimer
  doc
    .fontSize(8)
    .font("Helvetica")
    .text(patientInfo.disclaimer, { width: 480, align: "justify", color: "#666" });
  doc.moveDown(0.5);

  // Patient Information
  addSectionTitle("Patient Information");
  doc.fontSize(10).font("Helvetica");
  doc.text(`Age: ${medicalProfile.age} years`);
  doc.text(`Gender: ${medicalProfile.gender}`);
  doc.text(`Smoking Status: ${medicalProfile.smokingStatus}`);
  doc.moveDown(0.5);

  // Medical Summary
  addSectionTitle("Health Summary");
  doc.fontSize(10).font("Helvetica").text(healthAssessment.summary);
  doc.moveDown(0.5);

  // Diagnoses
  if (medicalProfile.diagnoses.length > 0) {
    addSubsectionTitle("Diagnoses:");
    medicalProfile.diagnoses.forEach((diagnosis) => {
      doc.fontSize(10).text(`  • ${diagnosis}`);
    });
    doc.moveDown(0.5);
  }

  // Test Results
  if (labResults.tests && labResults.tests.length > 0) {
    addSubsectionTitle("Test Results:");
    labResults.tests.forEach((test) => {
      const status = test.status ? test.status.toUpperCase() : "NORMAL";
      doc.fontSize(9).text(
        `  • ${test.name}: ${test.value} ${test.unit} (Range: ${test.range}) [${status}]`
      );
    });
    doc.moveDown(0.5);
  }

  // Key Findings
  if (healthAssessment.keyFindings && healthAssessment.keyFindings.length > 0) {
    addSectionTitle("Key Findings");
    healthAssessment.keyFindings.forEach((finding) => {
      doc.fontSize(10).text(`  • ${finding}`);
    });
    doc.moveDown(0.5);
  }

  // Risk Assessment
  if (healthAssessment.riskAssessment) {
    addSectionTitle("Risk Assessment");
    const { shortTerm, longTerm } = healthAssessment.riskAssessment;

    doc.fontSize(10).font("Helvetica");
    doc.text(`Short-term Risk: ${shortTerm.label} (Score: ${shortTerm.score}/100)`);
    doc.text(`Long-term Risk: ${longTerm.label} (Score: ${longTerm.score}/100)`);

    if (shortTerm.factors && shortTerm.factors.length > 0) {
      doc.moveDown(0.3);
      addSubsectionTitle("Risk Factors:");
      shortTerm.factors.forEach((factor) => {
        doc.fontSize(9).text(`  • ${factor.name} (+${factor.contribution}): ${factor.explanation}`);
      });
    }
    doc.moveDown(0.5);
  }

  // Insurance Recommendations
  if (recommendations && recommendations.insurancePlans && recommendations.insurancePlans.length > 0) {
    doc.addPage();
    addSectionTitle("Top Insurance Plan Recommendations");
    recommendations.insurancePlans.slice(0, 3).forEach((match: any, index: number) => {
      if (index > 0) {
        doc.addPage();
      }
      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text(`Recommendation ${index + 1}: ${match.plan.provider} - ${match.plan.planName}`);
      doc.moveDown(0.3);
      doc.fontSize(10).font("Helvetica");
      doc.text(`Sum Insured: ₹${match.plan.sumInsured.toLocaleString("en-IN")}`);
      doc.text(`Annual Premium: ₹${match.plan.basePremium.toLocaleString("en-IN")}`);
      doc.text(`Match Score: ${Math.round(match.matchScore * 100)}%`);
      doc.text(`Savings vs Current: ₹${(match.savings || 0).toLocaleString("en-IN")}`);
      if (match.reasoning && match.reasoning.length > 0) {
        doc.moveDown(0.3);
        addSubsectionTitle("Why this plan:");
        match.reasoning.forEach((reason: string) => {
          doc.fontSize(10).text(`  • ${reason}`);
        });
      }
      if (match.concerns && match.concerns.length > 0) {
        doc.moveDown(0.3);
        addSubsectionTitle("Things to note:");
        match.concerns.forEach((concern: string) => {
          doc.fontSize(10).text(`  • ${concern}`);
        });
      }
      doc.moveDown(0.5);
    });
  }

  // Existing Policy Comparison
  if (recommendations && recommendations.comparison && recommendations.comparison.currentPolicy) {
    doc.addPage();
    addSectionTitle("Current Policy Analysis");
    doc.fontSize(10).font("Helvetica");
    const policy = recommendations.comparison.currentPolicy;
    doc.text(`Provider: ${policy.provider}`);
    doc.text(`Plan: ${policy.planName}`);
    doc.text(`Sum Insured: ₹${policy.sumInsured.toLocaleString("en-IN")}`);
    doc.text(`Annual Premium: ₹${policy.annualPremium.toLocaleString("en-IN")}`);
    doc.moveDown(0.5);
  }

  // Footer
  const totalPages = doc.bufferedPageRange().count;
  for (let i = 0; i < totalPages; i++) {
    doc.switchToPage(i);
    doc
      .fontSize(8)
      .font("Helvetica")
      .text(
        `Page ${i + 1} of ${totalPages} | Generated by MedReport | This report is for informational purposes only`,
        50,
        doc.page.height - 30,
        { align: "center", width: 500 }
      );
  }

  doc.end();

  return Buffer.concat(chunks);
}
