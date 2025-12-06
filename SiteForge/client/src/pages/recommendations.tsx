import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Download, Loader2, Award, TrendingDown, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ProgressStepper } from "@/components/progress-stepper";
import { HealthSummaryCard } from "@/components/health-summary-card";
import { PlanRecommendationCard } from "@/components/plan-recommendation-card";
import { ComparisonChart } from "@/components/comparison-chart";
import { PDFReportPreview } from "@/components/pdf-report-preview";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { ReportSession, NetAnnualCost } from "@shared/schema";

export function RecommendationsPage() {
  const [, params] = useRoute("/recommendations/:id");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const reportId = params?.id;
  const [isDownloading, setIsDownloading] = useState(false);

  const { data: report, isLoading, error } = useQuery<ReportSession>({
    queryKey: ["/api/report", reportId],
    enabled: !!reportId,
  });

  const calculateExistingPolicyCost = (): NetAnnualCost | undefined => {
    if (!report?.existingPolicy || !report?.healthSummary) return undefined;
    
    const policy = report.existingPolicy;
    const riskLevel = report.healthSummary.riskScore.shortTermLabel;
    
    const expectedUsage = riskLevel === "Low" ? 5000 : riskLevel === "Moderate" ? 20000 : 60000;
    const expectedOOP = expectedUsage * (policy.coPayPct / 100);
    
    return {
      annualPremium: policy.annualPremium,
      expectedOOP,
      totalNetCost: policy.annualPremium + expectedOOP,
    };
  };

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const jsPDF = (await import("jspdf")).jsPDF;
      
      const element = document.getElementById("pdf-preview");
      if (!element) {
        throw new Error("Preview element not found");
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff"
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      const pageHeight = pdf.internal.pageSize.getHeight();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const imgHeight = (canvas.height * pageWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, pageWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pageWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save("MedReport_Insurance_Recommendation.pdf");

      toast({
        title: "Report downloaded",
        description: "Your insurance recommendation report has been saved.",
      });
    } catch (error) {
      console.error("PDF generation error:", error);
      toast({
        title: "Download failed",
        description: "There was an error generating your PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header showNav={false} />
        <main className="flex-1 py-8 md:py-12">
          <div className="max-w-6xl mx-auto px-4 md:px-6 space-y-8">
            <ProgressStepper currentStep={4} className="mb-8" />
            <div className="space-y-6">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !report || !report.recommendations) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header showNav={false} />
        <main className="flex-1 py-8 md:py-12">
          <div className="max-w-4xl mx-auto px-4 md:px-6 text-center space-y-4">
            <h1 className="text-2xl font-semibold">Recommendations Not Available</h1>
            <p className="text-muted-foreground">
              We couldn't generate recommendations for this report. Please try again.
            </p>
            <Button onClick={() => navigate("/upload")} data-testid="button-start-over">
              Start Over
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const existingPolicyCost = calculateExistingPolicyCost();
  const topRecommendation = report.recommendations[0];
  const totalSavings = topRecommendation?.savings || 0;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header showNav={false} />

      <main className="flex-1 py-8 md:py-12">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <ProgressStepper currentStep={4} className="mb-8" />

          <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
              <div className="space-y-2">
                <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
                  Your Insurance Recommendations
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl">
                  Based on your health profile, we've found the best insurance plans for you.
                </p>
              </div>

              {totalSavings > 0 && report.existingPolicy && (
                <Card className="bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900">
                      <TrendingDown className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm text-emerald-700 dark:text-emerald-300">Estimated Annual Savings</p>
                      <p className="text-2xl font-bold text-emerald-800 dark:text-emerald-200" data-testid="text-total-savings">
                        ₹{totalSavings.toLocaleString("en-IN")}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {report.healthSummary && (
              <HealthSummaryCard summary={report.healthSummary} />
            )}

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">Top 3 Recommended Plans</h2>
              </div>
              
              <div className="space-y-4">
                {report.recommendations.slice(0, 3).map((match, index) => (
                  <PlanRecommendationCard
                    key={match.plan.id}
                    match={match}
                    rank={index + 1}
                    showSavings={!!report.existingPolicy}
                  />
                ))}
              </div>
            </div>

            <ComparisonChart
              existingPolicy={report.existingPolicy}
              existingPolicyCost={existingPolicyCost}
              recommendations={report.recommendations}
            />

            {!report.existingPolicy && (
              <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30">
                <CardContent className="p-4 flex items-start gap-4">
                  <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-medium text-amber-800 dark:text-amber-200">
                      No existing policy provided
                    </p>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      To see potential savings, go back and enter your current insurance policy details. 
                      This will help us calculate exactly how much you could save by switching.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => navigate(`/review/${reportId}`)}
                      data-testid="button-add-policy"
                    >
                      Add Current Policy
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {report.medicalReport && report.healthSummary && (
              <div id="pdf-preview">
                <PDFReportPreview
                  medicalReport={report.medicalReport}
                  healthSummary={report.healthSummary}
                  existingPolicy={report.existingPolicy}
                  recommendations={report.recommendations}
                  onDownload={handleDownloadPDF}
                  isDownloading={isDownloading}
                />
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
              <Button
                variant="ghost"
                onClick={() => navigate(`/review/${reportId}`)}
                className="gap-2"
                data-testid="button-back-to-review"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Review
              </Button>

              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => navigate("/")}
                  data-testid="button-start-new"
                >
                  Start New Analysis
                </Button>
                <Button
                  onClick={handleDownloadPDF}
                  disabled={isDownloading}
                  className="gap-2"
                  data-testid="button-download-report"
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Download Report
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
