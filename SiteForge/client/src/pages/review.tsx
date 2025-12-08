import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Loader2, User, Calendar, Stethoscope, Pill } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Header } from "@/components/header";
import { ProgressStepper } from "@/components/progress-stepper";
import { HealthSummaryCard } from "@/components/health-summary-card";
import { MedicalValuesTable } from "@/components/medical-values-table";
import { ExtractedReportDisplay } from "@/components/extracted-report-display";
import { PolicyInput } from "@/components/policy-input";
import { BudgetPreferences } from "@/components/budget-preferences";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ReportSession, MedicalTest, Policy, MatchPreferences } from "@shared/schema";
import type { ExtractedMedicalReport } from "../../../shared/schema";

export function ReviewPage() {
  const [, params] = useRoute("/review/:id");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const reportId = params?.id;

  const [editedTests, setEditedTests] = useState<MedicalTest[]>([]);
  const [editedAge, setEditedAge] = useState<number>(0);
  const [editedGender, setEditedGender] = useState<string>("");
  const [editedDiagnoses, setEditedDiagnoses] = useState<string[]>([]);
  const [existingPolicy, setExistingPolicy] = useState<Policy | null>(null);
  const [preferences, setPreferences] = useState<MatchPreferences>({
    budget: 25000,
    priorities: ["low_premium"],
  });

  const { data: report, isLoading, error } = useQuery<ReportSession>({
    queryKey: ["/api/report", reportId],
    enabled: !!reportId,
  });

  useEffect(() => {
    if (report?.medicalReport) {
      setEditedTests(report.medicalReport.tests);
      setEditedAge(report.medicalReport.age);
      setEditedGender(report.medicalReport.gender);
      setEditedDiagnoses(report.medicalReport.diagnoses);
    }
  }, [report]);

  const matchMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/report/${reportId}/match`, {
        reportId,
        budget: preferences.budget,
        priorities: preferences.priorities,
        existingPolicy,
        updatedReport: {
          age: editedAge,
          gender: editedGender,
          diagnoses: editedDiagnoses,
          tests: editedTests,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/report", reportId] });
      navigate(`/recommendations/${reportId}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Error generating recommendations",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleTestsUpdate = (tests: MedicalTest[]) => {
    setEditedTests(tests);
  };

  const handlePolicySubmit = (policy: Policy | null) => {
    setExistingPolicy(policy);
    setPreferences(prev => ({ ...prev, existingPolicy: policy || undefined }));
  };

  const handlePreferencesChange = (prefs: MatchPreferences) => {
    setPreferences(prefs);
  };

  const handleContinue = () => {
    matchMutation.mutate();
  };

  const addDiagnosis = (diagnosis: string) => {
    if (diagnosis.trim() && !editedDiagnoses.includes(diagnosis.trim())) {
      setEditedDiagnoses([...editedDiagnoses, diagnosis.trim()]);
    }
  };

  const removeDiagnosis = (index: number) => {
    setEditedDiagnoses(editedDiagnoses.filter((_, i) => i !== index));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header showNav={false} />
        <main className="flex-1 py-8 md:py-12">
          <div className="max-w-6xl mx-auto px-4 md:px-6 space-y-8">
            <ProgressStepper currentStep={3} className="mb-8" />
            <div className="space-y-6">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header showNav={false} />
        <main className="flex-1 py-8 md:py-12">
          <div className="max-w-4xl mx-auto px-4 md:px-6 text-center space-y-4">
            <h1 className="text-2xl font-semibold">Report Not Found</h1>
            <p className="text-muted-foreground">
              We couldn't find the requested report. It may have expired or been deleted.
            </p>
            <Button onClick={() => navigate("/upload")} data-testid="button-upload-new">
              Upload New Report
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header showNav={false} />

      <main className="flex-1 py-8 md:py-12">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <ProgressStepper currentStep={3} className="mb-8" />

          <div className="space-y-8">
            <div className="text-center space-y-2">
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
                Review Extracted Data
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Verify the extracted information and make any corrections before we generate your recommendations.
              </p>
            </div>

            {report.medicalReport && (
              <ExtractedReportDisplay report={toExtracted(report.medicalReport)} />
            )}

            {report.healthSummary && (
              <HealthSummaryCard summary={report.healthSummary} />
            )}

            <Card data-testid="card-patient-info">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Patient Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="age" className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      Age
                    </Label>
                    <Input
                      id="age"
                      type="number"
                      min="0"
                      max="120"
                      value={editedAge}
                      onChange={(e) => setEditedAge(parseInt(e.target.value) || 0)}
                      data-testid="input-age"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select value={editedGender} onValueChange={setEditedGender}>
                      <SelectTrigger id="gender" data-testid="select-gender">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5">
                      <Stethoscope className="h-3.5 w-3.5 text-muted-foreground" />
                      Diagnoses
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {editedDiagnoses.map((diagnosis, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="cursor-pointer hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => removeDiagnosis(index)}
                          data-testid={`badge-diagnosis-${index}`}
                        >
                          {diagnosis}
                          <span className="ml-1">×</span>
                        </Badge>
                      ))}
                      <Input
                        placeholder="Add diagnosis..."
                        className="w-40 h-7 text-sm"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            addDiagnosis(e.currentTarget.value);
                            e.currentTarget.value = "";
                          }
                        }}
                        data-testid="input-add-diagnosis"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <MedicalValuesTable
              tests={editedTests}
              editable={true}
              onUpdate={handleTestsUpdate}
            />

            <PolicyInput
              onPolicySubmit={handlePolicySubmit}
              initialPolicy={existingPolicy}
            />

            <BudgetPreferences
              onPreferencesChange={handlePreferencesChange}
              initialPreferences={preferences}
            />

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
              <Button
                variant="ghost"
                onClick={() => navigate("/upload")}
                className="gap-2"
                data-testid="button-back"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Upload
              </Button>

              <Button
                onClick={handleContinue}
                disabled={matchMutation.isPending}
                className="gap-2 min-w-[180px]"
                data-testid="button-get-recommendations"
              >
                {matchMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    Get Recommendations
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function toExtracted(m: ReportSession["medicalReport"]): ExtractedMedicalReport {
  const diagnoses = (m?.diagnoses || []).map(d => ({ name: d, icd10_code: null, raw: d, confidence: 0.75 }));
  const tests = (m?.tests || []).map(t => ({
    name: t.name,
    value: t.value as any,
    unit: t.unit || null,
    ref_low: null,
    ref_high: null,
    raw: `${t.name}: ${t.value}${t.unit?" "+t.unit:""}`,
    confidence: 0.75,
  }));
  return {
    report_id: null,
    timestamp: new Date().toISOString(),
    extraction_status: "partial",
    extraction_confidence: 0.75,
    patient: { name: null, age: m?.age ?? null, sex: (m?.gender as any) ?? null, patient_id: null, city_or_state: null },
    diagnoses,
    medications: (m?.medications || []).map(name => ({ name, dose: null, frequency: null, route: null, raw: name, confidence: 0.7 })),
    tests,
    vitals: { bp: null, systolic: null, diastolic: null, hr: null, spo2: null, rr: null, temp_c: null, raw: null, confidence: 0 },
    procedures: [],
    allergies: [],
    smoking_status: { status: (m?.smokingStatus as any) ?? null, raw: m?.smokingStatus ?? null, confidence: 0.7 },
    notes: null,
    raw_text: m?.rawText ?? null,
    warnings: [],
    source: { document_type_hint: null, page_count_estimate: null },
  };
}
