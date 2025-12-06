import { useState } from "react";
import { Building2, DollarSign, Shield, Clock, AlertTriangle, Upload, FileText, Pencil } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { UploadDropzone } from "./upload-dropzone";
import { cn } from "@/lib/utils";
import type { Policy } from "@shared/schema";

interface PolicyInputProps {
  onPolicySubmit: (policy: Policy | null) => void;
  initialPolicy?: Policy | null;
  className?: string;
}

export function PolicyInput({ onPolicySubmit, initialPolicy, className }: PolicyInputProps) {
  const [hasPolicy, setHasPolicy] = useState(!!initialPolicy);
  const [activeTab, setActiveTab] = useState<"upload" | "manual">("manual");
  const [isUploading, setIsUploading] = useState(false);
  const [policy, setPolicy] = useState<Partial<Policy>>(initialPolicy || {
    provider: "",
    planName: "",
    sumInsured: 0,
    annualPremium: 0,
    preExistingWaitYears: 2,
    coPayPct: 10,
    exclusions: [],
  });
  const [exclusionInput, setExclusionInput] = useState("");

  const handleToggle = (checked: boolean) => {
    setHasPolicy(checked);
    if (!checked) {
      onPolicySubmit(null);
    }
  };

  const handleInputChange = (field: keyof Policy, value: string | number) => {
    setPolicy(prev => ({ ...prev, [field]: value }));
  };

  const addExclusion = () => {
    if (exclusionInput.trim()) {
      setPolicy(prev => ({
        ...prev,
        exclusions: [...(prev.exclusions || []), exclusionInput.trim()]
      }));
      setExclusionInput("");
    }
  };

  const removeExclusion = (index: number) => {
    setPolicy(prev => ({
      ...prev,
      exclusions: (prev.exclusions || []).filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = () => {
    if (
      policy.provider &&
      policy.planName &&
      policy.sumInsured &&
      policy.annualPremium
    ) {
      onPolicySubmit(policy as Policy);
    }
  };

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setTimeout(() => {
      setPolicy({
        provider: "Sample Insurance Co.",
        planName: "Gold Health Plan",
        sumInsured: 500000,
        annualPremium: 18000,
        preExistingWaitYears: 2,
        coPayPct: 10,
        exclusions: ["Cosmetic surgery", "Experimental treatments"],
      });
      setIsUploading(false);
      setActiveTab("manual");
    }, 1500);
  };

  const isValid = policy.provider && policy.planName && policy.sumInsured && policy.annualPremium;

  return (
    <Card className={cn("", className)} data-testid="card-policy-input">
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg font-semibold">Current Policy</CardTitle>
            <CardDescription>Compare with your existing insurance plan</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="policy-toggle" className="text-sm text-muted-foreground">
              I have a policy
            </Label>
            <Switch
              id="policy-toggle"
              checked={hasPolicy}
              onCheckedChange={handleToggle}
              data-testid="switch-has-policy"
            />
          </div>
        </div>
      </CardHeader>

      {hasPolicy && (
        <CardContent className="space-y-6">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "upload" | "manual")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload" className="gap-2" data-testid="tab-upload-policy">
                <Upload className="h-4 w-4" />
                Upload Policy
              </TabsTrigger>
              <TabsTrigger value="manual" className="gap-2" data-testid="tab-manual-entry">
                <Pencil className="h-4 w-4" />
                Enter Manually
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="mt-4">
              <UploadDropzone
                onFileSelect={handleFileUpload}
                accept=".pdf"
                title="Drop your policy document here"
                description="PDF file up to 10MB"
                disabled={isUploading}
              />
              {isUploading && (
                <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  Parsing policy document...
                </div>
              )}
            </TabsContent>

            <TabsContent value="manual" className="mt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="provider" className="flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                    Insurance Provider
                  </Label>
                  <Input
                    id="provider"
                    placeholder="e.g., Star Health, HDFC Ergo"
                    value={policy.provider || ""}
                    onChange={(e) => handleInputChange("provider", e.target.value)}
                    data-testid="input-provider"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="planName" className="flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                    Plan Name
                  </Label>
                  <Input
                    id="planName"
                    placeholder="e.g., Gold Health Plan"
                    value={policy.planName || ""}
                    onChange={(e) => handleInputChange("planName", e.target.value)}
                    data-testid="input-plan-name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sumInsured" className="flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                    Sum Insured (₹)
                  </Label>
                  <Input
                    id="sumInsured"
                    type="number"
                    placeholder="e.g., 500000"
                    value={policy.sumInsured || ""}
                    onChange={(e) => handleInputChange("sumInsured", parseInt(e.target.value) || 0)}
                    data-testid="input-sum-insured"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="annualPremium" className="flex items-center gap-1.5">
                    <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                    Annual Premium (₹)
                  </Label>
                  <Input
                    id="annualPremium"
                    type="number"
                    placeholder="e.g., 15000"
                    value={policy.annualPremium || ""}
                    onChange={(e) => handleInputChange("annualPremium", parseInt(e.target.value) || 0)}
                    data-testid="input-annual-premium"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="waitYears" className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    Pre-existing Wait (Years)
                  </Label>
                  <Input
                    id="waitYears"
                    type="number"
                    min="0"
                    max="10"
                    value={policy.preExistingWaitYears || 0}
                    onChange={(e) => handleInputChange("preExistingWaitYears", parseInt(e.target.value) || 0)}
                    data-testid="input-wait-years"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="coPay" className="flex items-center gap-1.5">
                    <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                    Co-pay (%)
                  </Label>
                  <Input
                    id="coPay"
                    type="number"
                    min="0"
                    max="100"
                    value={policy.coPayPct || 0}
                    onChange={(e) => handleInputChange("coPayPct", parseInt(e.target.value) || 0)}
                    data-testid="input-copay"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground" />
                  Exclusions
                </Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add exclusion (e.g., Organ transplant)"
                    value={exclusionInput}
                    onChange={(e) => setExclusionInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addExclusion()}
                    data-testid="input-exclusion"
                  />
                  <Button 
                    type="button" 
                    variant="secondary" 
                    onClick={addExclusion}
                    data-testid="button-add-exclusion"
                  >
                    Add
                  </Button>
                </div>
                {(policy.exclusions || []).length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(policy.exclusions || []).map((exclusion, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="gap-1 cursor-pointer hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => removeExclusion(index)}
                        data-testid={`badge-exclusion-${index}`}
                      >
                        {exclusion}
                        <span className="ml-1">×</span>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <Button 
                onClick={handleSubmit} 
                disabled={!isValid}
                className="w-full"
                data-testid="button-save-policy"
              >
                Save Policy Details
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      )}
    </Card>
  );
}
