import { useState } from "react";
import { 
  ChevronDown, ChevronUp, Shield, DollarSign, Clock, Building2, 
  Check, AlertTriangle, ExternalLink, Phone, FileText, TrendingDown,
  Award, Star
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { PlanMatch } from "@shared/schema";

interface PlanRecommendationCardProps {
  match: PlanMatch;
  rank: number;
  showSavings?: boolean;
  className?: string;
}

export function PlanRecommendationCard({ 
  match, 
  rank,
  showSavings = true,
  className 
}: PlanRecommendationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { plan, matchScore, estimatedPremium, savings, savingsPercentage, reasons, warnings } = match;

  const formatCurrency = (value: number) => {
    if (value >= 100000) {
      return `₹${(value / 100000).toFixed(1)}L`;
    }
    return `₹${value.toLocaleString("en-IN")}`;
  };

  const getRankBadge = () => {
    if (rank === 1) return { label: "Best Match", className: "bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400" };
    if (rank === 2) return { label: "Great Option", className: "bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400" };
    return { label: "Good Choice", className: "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400" };
  };

  const rankBadge = getRankBadge();

  return (
    <Card className={cn("overflow-hidden", className)} data-testid={`card-plan-${plan.id}`}>
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-muted text-muted-foreground shrink-0">
              <Building2 className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-xl font-semibold" data-testid="text-plan-name">
                  {plan.planName}
                </CardTitle>
                <Badge variant="outline" className={rankBadge.className}>
                  {rank === 1 && <Star className="h-3 w-3 mr-1 fill-current" />}
                  {rankBadge.label}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">{plan.provider}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="relative w-16 h-16">
                <svg className="w-16 h-16 transform -rotate-90">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="none"
                    className="text-muted"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="none"
                    strokeDasharray={`${(matchScore / 100) * 176} 176`}
                    strokeLinecap="round"
                    className="text-primary"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold" data-testid="text-match-score">{matchScore}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Match Score</p>
            </div>

            {showSavings && savings !== undefined && savings > 0 && (
              <div className="text-center px-4 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
                <div className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                  <TrendingDown className="h-4 w-4" />
                  <span className="text-lg font-bold" data-testid="text-savings">
                    {formatCurrency(savings)}
                  </span>
                </div>
                <p className="text-xs text-emerald-600 dark:text-emerald-500">
                  Save {savingsPercentage?.toFixed(0)}%/yr
                </p>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium" data-testid="text-premium">
                {formatCurrency(estimatedPremium)}/yr
              </p>
              <p className="text-xs text-muted-foreground">Premium</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium" data-testid="text-sum-insured">
                {formatCurrency(plan.sumInsured)}
              </p>
              <p className="text-xs text-muted-foreground">Sum Insured</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{plan.preExistingWaitYears} years</p>
              <p className="text-xs text-muted-foreground">Wait Period</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{plan.coPayPct}%</p>
              <p className="text-xs text-muted-foreground">Co-pay</p>
            </div>
          </div>
        </div>

        <Button
          variant="ghost"
          className="w-full justify-between"
          onClick={() => setIsExpanded(!isExpanded)}
          data-testid="button-expand-plan"
        >
          <span className="text-sm">{isExpanded ? "Hide" : "Show"} Details</span>
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>

        {isExpanded && (
          <div className="space-y-4 pt-2">
            <Separator />
            
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">Score Breakdown</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Coverage Fit</span>
                  <span className="font-medium">{match.coverageFitScore}/50</span>
                </div>
                <Progress value={(match.coverageFitScore / 50) * 100} className="h-1.5" />
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Affordability</span>
                  <span className="font-medium">{match.affordabilityScore}/25</span>
                </div>
                <Progress value={(match.affordabilityScore / 25) * 100} className="h-1.5" />
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Waiting Period</span>
                  <span className="font-medium">{match.waitingPeriodScore}/15</span>
                </div>
                <Progress value={(match.waitingPeriodScore / 15) * 100} className="h-1.5" />
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Coverage Quality</span>
                  <span className="font-medium">{match.coverageQualityScore}/10</span>
                </div>
                <Progress value={(match.coverageQualityScore / 10) * 100} className="h-1.5" />
              </div>
            </div>

            {reasons.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-1.5">
                  <Award className="h-4 w-4 text-primary" />
                  Why We Recommend This
                </h4>
                <ul className="space-y-1.5">
                  {reasons.map((reason, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {warnings.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Things to Consider
                </h4>
                <ul className="space-y-1.5">
                  {warnings.map((warning, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                      <span>{warning}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {plan.covers.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">What's Covered</h4>
                <div className="flex flex-wrap gap-2">
                  {plan.covers.map((cover, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {cover}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Next Steps</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Button variant="outline" className="justify-start gap-2" data-testid="button-call-provider">
                  <Phone className="h-4 w-4" />
                  Call Provider
                </Button>
                <Button variant="outline" className="justify-start gap-2" data-testid="button-view-documents">
                  <FileText className="h-4 w-4" />
                  Documents
                </Button>
                {plan.url && (
                  <Button variant="outline" className="justify-start gap-2" asChild>
                    <a href={plan.url} target="_blank" rel="noopener noreferrer" data-testid="link-apply">
                      <ExternalLink className="h-4 w-4" />
                      Apply Online
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
