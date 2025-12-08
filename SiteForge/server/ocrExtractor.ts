import { z } from "zod";

const OcrExtractRequest = z.object({
  ocr_text: z.string().min(1, "ocr_text required"),
  document_context: z.object({
    document_type_hint: z.string().nullable().optional(),
    locale: z.string().nullable().optional(),
    extraction_priority: z.array(z.string()).nullable().optional(),
  }).optional(),
});

function nowISO(): string {
  return new Date().toISOString();
}

function cleanText(input: string): string {
  return input.replace(/[\t\r]+/g, " ").replace(/\s{2,}/g, " ").trim().slice(0, 2000);
}

export function extractFromOCR(reqBody: unknown) {
  const parsed = OcrExtractRequest.safeParse(reqBody);
  if (!parsed.success) {
    return {
      status: 400,
      body: buildInsufficient("Invalid request: ocr_text missing"),
    };
  }

  const { ocr_text, document_context } = parsed.data;
  const text = ocr_text;

  const ageMatch = text.match(/\bAge\s*:\s*(\d{1,3})\b/i);
  const sexMatch = text.match(/\bSex\s*:\s*(Male|Female|Other)\b/i);
  const nameMatch = text.match(/\bPatient\s*:\s*([A-Za-z .'-]{2,})/i);
  const bpMatch = text.match(/\bBP\s*[:\-]?\s*(\d{2,3})\s*[\/ ]\s*(\d{2,3})\s*mmHg\b/i);

  const tests: any[] = [];
  function pushTest(name: string, regex: RegExp, unit?: string) {
    const m = text.match(regex);
    if (m) {
      const raw = m[0];
      const valStr = m[1];
      const val = Number(parseFloat(valStr));
      tests.push({ name, value: isNaN(val) ? valStr : val, unit: unit || null, ref_low: null, ref_high: null, raw, confidence: 0.85 });
    }
  }
  pushTest("HbA1c", /HbA1c\s*[:\-]?\s*([0-9]+(?:\.[0-9]+)?)\s*%/i, "%");
  pushTest("Creatinine", /Creatinine\s*[:\-]?\s*([0-9]+(?:\.[0-9]+)?)/i);
  pushTest("Total Cholesterol", /Total\s+Cholesterol\s*[:\-]?\s*([0-9]+(?:\.[0-9]+)?)/i);
  pushTest("LDL", /\bLDL\b\s*[:\-]?\s*([0-9]+(?:\.[0-9]+)?)/i);
  pushTest("HDL", /\bHDL\b\s*[:\-]?\s*([0-9]+(?:\.[0-9]+)?)/i);
  pushTest("Triglycerides", /Triglycerides\s*[:\-]?\s*([0-9]+(?:\.[0-9]+)?)/i);
  pushTest("Hemoglobin", /Hemoglobin\s*[:\-]?\s*([0-9]+(?:\.[0-9]+)?)/i);

  const diagnoses: any[] = [];
  const diagLine = text.match(/Diagnosis\s*[:\-]?\s*([^\n]+)/i);
  if (diagLine) {
    const items = diagLine[1].split(/[,;]+/).map(s => s.trim()).filter(Boolean);
    for (const d of items) {
      diagnoses.push({ name: d, icd10_code: null, raw: d, confidence: 0.85 });
    }
  }

  const meds: any[] = [];
  const medsLine = text.match(/Medications?\s*[:\-]?\s*([^\n]+)/i);
  if (medsLine) {
    const items = medsLine[1].split(/[,;]+/).map(s => s.trim()).filter(Boolean);
    for (const m of items) {
      const doseFreq = m.match(/(\d+\s*mg|\d+\s*mcg)?\s*(OD|BD|TID|QID|ON)?/i);
      meds.push({ name: m.split(/\s+/)[0], dose: doseFreq?.[1] || null, frequency: doseFreq?.[2] || null, route: null, raw: m, confidence: 0.8 });
    }
  }

  const bp = bpMatch ? `${bpMatch[1]}/${bpMatch[2]} mmHg` : null;
  const systolic = bpMatch ? Number(bpMatch[1]) : null;
  const diastolic = bpMatch ? Number(bpMatch[2]) : null;

  const hasData = !!(ageMatch || sexMatch || nameMatch || diagnoses.length || tests.length || meds.length || bp);

  const warnings: string[] = [];
  if (!ageMatch) warnings.push("age missing");
  if (!sexMatch) warnings.push("sex missing");
  if (!diagnoses.length) warnings.push("diagnoses missing");

  const cleaned = cleanText(text);
  const summaryParts: string[] = [];
  if (ageMatch && sexMatch) summaryParts.push(`${ageMatch[1]}-year-old ${sexMatch[1]}`);
  if (diagnoses.length) summaryParts.push(diagnoses.map(d => d.name).join(", "));
  if (tests.length) summaryParts.push(tests.slice(0,3).map(t => `${t.name} ${t.value}${t.unit?" "+t.unit:""}`).join(", "));

  const body = {
    report_id: null,
    timestamp: nowISO(),
    extraction_status: hasData ? "partial" : "insufficient_data",
    extraction_confidence: hasData ? 0.7 : 0.0,
    patient: {
      name: nameMatch ? nameMatch[1].trim() : null,
      age: ageMatch ? Number(ageMatch[1]) : null,
      sex: sexMatch ? (sexMatch[1] as any) : null,
      patient_id: null,
      city_or_state: null,
    },
    diagnoses,
    medications: meds,
    tests,
    vitals: {
      bp,
      systolic,
      diastolic,
      hr: null,
      spo2: null,
      rr: null,
      temp_c: null,
      raw: bpMatch ? bpMatch[0] : null,
      confidence: bpMatch ? 0.85 : 0.0,
    },
    procedures: [],
    allergies: [],
    smoking_status: { status: null, raw: null, confidence: 0.0 },
    notes: hasData ? summaryParts.join(". ") + "." : "OCR text insufficient. Please upload a clear clinical document (lab/discharge/prescription or echo/ECG).",
    raw_text: cleaned,
    warnings,
    source: { document_type_hint: document_context?.document_type_hint ?? null, page_count_estimate: null },
  };

  return { status: 200, body };
}

function buildInsufficient(msg: string) {
  return {
    report_id: null,
    timestamp: nowISO(),
    extraction_status: "insufficient_data",
    extraction_confidence: 0.0,
    patient: { name: null, age: null, sex: null, patient_id: null, city_or_state: null },
    diagnoses: [],
    medications: [],
    tests: [],
    vitals: { bp: null, systolic: null, diastolic: null, hr: null, spo2: null, rr: null, temp_c: null, raw: null, confidence: 0.0 },
    procedures: [],
    allergies: [],
    smoking_status: { status: null, raw: null, confidence: 0.0 },
    notes: msg,
    raw_text: null,
    warnings: ["ocr_text missing"],
    source: { document_type_hint: null, page_count_estimate: null },
  };
}