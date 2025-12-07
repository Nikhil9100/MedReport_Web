import { Download, FileText, Shield, AlertTriangle, Award, IndianRupee } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { MedicalReport, HealthSummary, Policy, PlanMatch } from "@shared/schema";

interface PDFReportPreviewProps {
  medicalReport: MedicalReport;
  healthSummary: HealthSummary;
  existingPolicy?: Policy | null;
  recommendations: PlanMatch[];
  onDownload: () => void;
  isDownloading?: boolean;
  className?: string;
}

export function PDFReportPreview({
  medicalReport,
  healthSummary,
  existingPolicy,
  recommendations,
  onDownload,
  isDownloading = false,
  className
}: PDFReportPreviewProps) {
  const formatCurrency = (value: number) => {
    if (value >= 100000) {
      return `₹${(value / 100000).toFixed(1)}L`;
    }
    return `₹${value.toLocaleString("en-IN")}`;
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "normal": return "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30";
      case "borderline": return "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30";
      case "high": return "text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/30";
      default: return "";
    }
  };

  return (
    <Card className={cn("", className)} data-testid="card-pdf-preview">
      <CardHeader>
        <div>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            One-Page Report Preview
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Your personalized insurance recommendation report (use download buttons below for JSON, HTML, or CSV formats)
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg p-6 bg-white dark:bg-background space-y-6" style={{ aspectRatio: "8.5/11" }}>
          <div className="flex items-center justify-between border-b pb-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary text-primary-foreground">
                <FileText className="h-4 w-4" />
              </div>
              <span className="font-semibold">MedReport</span>
            </div>
            <div className="text-right text-xs text-muted-foreground">
              <p>Insurance Recommendation Report</p>
              <p>Generated: {new Date().toLocaleDateString()}</p>
            </div>
          </div>

          <div className="space-y-2 p-4 rounded-lg bg-muted/30">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Health Summary</h3>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={cn("text-xs", 
                  healthSummary.riskScore.shortTermLabel === "Low" ? "bg-emerald-50 text-emerald-700" :
                  healthSummary.riskScore.shortTermLabel === "Moderate" ? "bg-amber-50 text-amber-700" :
                  "bg-red-50 text-red-700"
                )}>
                  Short-term: {healthSummary.riskScore.shortTermLabel}
                </Badge>
                <Badge variant="outline" className={cn("text-xs",
                  healthSummary.riskScore.longTermLabel === "Low" ? "bg-emerald-50 text-emerald-700" :
                  healthSummary.riskScore.longTermLabel === "Moderate" ? "bg-amber-50 text-amber-700" :
                  "bg-red-50 text-red-700"
                )}>
                  Long-term: {healthSummary.riskScore.longTermLabel}
                </Badge>
              </div>
            </div>
            <p className="text-xs leading-relaxed">{healthSummary.summary}</p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Key Medical Values</h3>
            <div className="grid grid-cols-3 gap-2">
              {medicalReport.tests.slice(0, 6).map((test, index) => (
                <div key={index} className={cn("p-2 rounded text-xs", getStatusClass(test.status))}>
                  <p className="font-medium">{test.name}</p>
                  <p className="font-mono">{test.value} {test.unit}</p>
                  <p className="text-[10px] opacity-70">Ref: {test.range}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-sm flex items-center gap-1.5">
              <Award className="h-4 w-4 text-primary" />
              Top Recommendations
            </h3>
            <div className="grid gap-2">
              {recommendations.slice(0, 3).map((match, index) => (
                <div key={match.plan.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium">{match.plan.planName}</p>
                      <p className="text-muted-foreground">{match.plan.provider}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(match.estimatedPremium)}/yr</p>
                    {match.savings && match.savings > 0 && (
                      <p className="text-emerald-600 text-[10px]">Save {formatCurrency(match.savings)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Actionable Next Steps</h3>
            <ul className="text-xs space-y-1 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-primary mt-1.5 shrink-0" />
                Compare coverage details and network hospitals before deciding
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-primary mt-1.5 shrink-0" />
                Contact providers for exact premium quotes based on your medical history
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-primary mt-1.5 shrink-0" />
                Review waiting periods for pre-existing conditions before switching
              </li>
            </ul>
          </div>

          <Separator />

          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <div className="flex items-center gap-1">
              <Shield className="h-3 w-3" />
              <span>Privacy-first • Data auto-deletes in 24 hours</span>
            </div>
            <div className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              <span>Not medical or legal advice. Consult professionals.</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
