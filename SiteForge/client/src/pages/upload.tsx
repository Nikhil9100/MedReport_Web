import { useState, useCallback } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Loader2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/header";
import { ProgressStepper } from "@/components/progress-stepper";
import { UploadDropzone } from "@/components/upload-dropzone";
import { ConsentDialog } from "@/components/consent-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { ReportSession } from "@shared/schema";
import { extractOCR } from "@/lib/ocr";
import type { ExtractedMedicalReport } from "../../../shared/schema";
import { ExtractedReportDisplay } from "@/components/extracted-report-display";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

export function UploadPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showConsent, setShowConsent] = useState(false);
  const [hasConsented, setHasConsented] = useState(false);
  const [ocrText, setOcrText] = useState("");
  const [ocrResult, setOcrResult] = useState<ExtractedMedicalReport | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);

  const uploadMutation = useMutation({
    mutationFn: async (file: File): Promise<ReportSession> => {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          const base64Data = result.split(",")[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const fileType = file.type.includes("pdf") ? "pdf" : "image";

      const response = await apiRequest("POST", "/api/upload", {
        fileData: base64,
        fileType,
        fileName: file.name,
        fileSize: file.size, // Include file size for server-side validation
      });
      
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Report uploaded successfully",
        description: "We're now extracting medical information from your report.",
      });
      console.log("Navigation to review page with ID:", data.id);
      navigate(`/review/${data.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message || "There was an error uploading your file. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file);
    if (!hasConsented) {
      setShowConsent(true);
    }
  }, [hasConsented]);

  const handleConsent = () => {
    setHasConsented(true);
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  };

  const handleContinue = () => {
    if (!selectedFile) return;
    
    if (!hasConsented) {
      setShowConsent(true);
    } else {
      console.log("Uploading file...", selectedFile.name);
      uploadMutation.mutate(selectedFile);
    }
  };

  const handleOcrExtract = async () => {
    if (!ocrText.trim()) return;
    try {
      setOcrLoading(true);
      setOcrResult(null);
      const result = await extractOCR(ocrText, { document_type_hint: "lab_report", locale: "en-IN" });
      setOcrResult(result);
      toast({ title: "OCR extracted", description: "Structured data generated from pasted text." });
    } catch (e: any) {
      toast({ title: "OCR extraction failed", description: e?.message || "Unknown error", variant: "destructive" });
    } finally {
      setOcrLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header showNav={false} />

      <main className="flex-1 py-8 md:py-12">
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          <ProgressStepper currentStep={1} className="mb-8" />

          <div className="space-y-8">
            <div className="text-center space-y-2">
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
                Upload Your Medical Report
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Upload a PDF or image of your medical report. We'll extract key health 
                information and provide personalized insurance recommendations.
              </p>
            </div>

            <UploadDropzone 
              onFileSelect={handleFileSelect}
              disabled={uploadMutation.isPending}
            />

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate("/")}
                className="gap-2"
                data-testid="button-back"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>

              <div className="flex items-center gap-4">
                {selectedFile && !uploadMutation.isPending && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Shield className="h-4 w-4 text-emerald-600" />
                    <span>Your data is protected</span>
                  </div>
                )}
                
                <Button
                  onClick={handleContinue}
                  disabled={!selectedFile || uploadMutation.isPending}
                  className="gap-2 min-w-[140px]"
                  data-testid="button-continue"
                >
                  {uploadMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="text-center pt-8">
              <p className="text-sm text-muted-foreground">
                Don't have a medical report?{" "}
                <button 
                  onClick={() => {
                    const demoFile = new File(
                      ["demo content"],
                      "sample_medical_report.pdf",
                      { type: "application/pdf" }
                    );
                    setSelectedFile(demoFile);
                    setHasConsented(true);
                    uploadMutation.mutate(demoFile);
                  }}
                  className="text-primary hover:underline font-medium"
                  data-testid="button-use-sample"
                >
                  Use a sample report
                </button>
              </p>
            </div>

            {/* Optional OCR paste-and-extract panel for fast local parsing */}
            <Card className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium">Paste OCR Text (Optional)</h2>
                <div className="text-sm text-muted-foreground">Uses local parser, no AI quota</div>
              </div>
              <Textarea
                value={ocrText}
                onChange={(e) => setOcrText(e.target.value)}
                placeholder="Paste raw OCR text from clinical document"
                className="min-h-[120px]"
              />
              <div className="flex items-center gap-2">
                <Button onClick={handleOcrExtract} disabled={ocrLoading || !ocrText.trim()} className="gap-2">
                  {ocrLoading ? (<><Loader2 className="h-4 w-4 animate-spin" /> Extracting...</>) : (<>Extract OCR</>)}
                </Button>
                {ocrResult && (
                  <span className="text-sm text-muted-foreground">Status: {ocrResult.extraction_status}</span>
                )}
              </div>
              {ocrResult && (
                <div className="mt-4">
                  <ExtractedReportDisplay report={ocrResult} />
                </div>
              )}
            </Card>
          </div>
        </div>
      </main>

      <ConsentDialog
        open={showConsent}
        onOpenChange={setShowConsent}
        onConsent={handleConsent}
      />
    </div>
  );
}
