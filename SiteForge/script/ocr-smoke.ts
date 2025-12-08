import 'dotenv/config';

async function main() {
  const url = 'http://localhost:5000/api/ocr-extract';
  const body = {
    ocr_text: "Patient: Mrs A. Sharma\nAge: 62 yrs   Sex: Female\nDiagnosis: Type 2 Diabetes Mellitus, Hypertension.\nHbA1c: 8.2 % (4.0-5.6)\nBP: 150/95 mmHg\nEcho: LVEF 38% (reduced)",
    document_context: { document_type_hint: 'lab_report', locale: 'en-IN' }
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  console.log('Status:', res.status);
  const json = await res.json();
  console.log(JSON.stringify(json, null, 2));
}

main().catch(err => {
  console.error('Smoke test failed:', err);
  process.exit(1);
});