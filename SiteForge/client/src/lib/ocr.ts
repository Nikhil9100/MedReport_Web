import { apiRequest } from "@/lib/queryClient";

export interface DocumentContext {
  document_type_hint?: string | null;
  locale?: string | null;
  extraction_priority?: string[] | null;
}

export async function extractOCR(ocr_text: string, document_context?: DocumentContext) {
  const res = await apiRequest("POST", "/api/ocr-extract", {
    ocr_text,
    document_context,
  });
  return res.json();
}
