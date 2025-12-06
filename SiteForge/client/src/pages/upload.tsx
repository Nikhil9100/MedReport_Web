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

export function UploadPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showConsent, setShowConsent] = useState(false);
  const [hasConsented, setHasConsented] = useState(false);

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
