import { AlertTriangle, TrendingUp, TrendingDown, Activity, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { HealthSummary, RiskScore } from "@shared/schema";

interface HealthSummaryCardProps {
  summary: HealthSummary;
  className?: string;
}

function RiskBadge({ label, score, riskLabel }: { label: string; score: number; riskLabel: string }) {
  const getColorClass = () => {
    if (riskLabel === "Low") return "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800";
    if (riskLabel === "Moderate") return "bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800";
    return "bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800";
  };

  const Icon = riskLabel === "Low" ? TrendingDown : riskLabel === "Moderate" ? Activity : TrendingUp;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border cursor-help",
          getColorClass()
        )}>
          <Icon className="h-3.5 w-3.5" />
          <span>{label}: {riskLabel}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-xs">
        <p>Risk score: {score}/100. {riskLabel === "Low" ? "Lower scores indicate better health outcomes." : riskLabel === "Moderate" ? "Some factors require attention." : "Several factors need immediate consideration."}</p>
      </TooltipContent>
    </Tooltip>
  );
}

export function HealthSummaryCard({ summary, className }: HealthSummaryCardProps) {
  const { riskScore } = summary;

  return (
    <Card className={cn("", className)} data-testid="card-health-summary">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Health Summary
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <RiskBadge 
              label="Short-term" 
              score={riskScore.shortTerm} 
              riskLabel={riskScore.shortTermLabel} 
            />
            <RiskBadge 
              label="Long-term" 
              score={riskScore.longTerm} 
              riskLabel={riskScore.longTermLabel} 
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-base leading-relaxed" data-testid="text-health-summary">
          {summary.summary}
        </p>

        {summary.keyFindings.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Key Findings
            </h4>
            <ul className="space-y-2">
              {summary.keyFindings.map((finding, index) => (
                <li 
                  key={index}
                  className="flex items-start gap-2 text-sm"
                  data-testid={`text-finding-${index}`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  <span>{finding}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {summary.currentHealthIssues && summary.currentHealthIssues.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Current Health Issues
            </h4>
            <ul className="space-y-2">
              {summary.currentHealthIssues.map((issue, index) => (
                <li 
                  key={index}
                  className="flex items-start gap-2 text-sm"
                  data-testid={`text-health-issue-${index}`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                  <span>{issue}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {summary.futureHealthRisks && (
          <>
            {summary.futureHealthRisks.shortTerm && summary.futureHealthRisks.shortTerm.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  ⚠️ Short-term Health Risks (1-2 years)
                </h4>
                <ul className="space-y-2">
                  {summary.futureHealthRisks.shortTerm.map((risk, index) => (
                    <li 
                      key={index}
                      className="flex items-start gap-2 text-sm"
                      data-testid={`text-short-term-risk-${index}`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 shrink-0" />
                      <span>{risk}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {summary.futureHealthRisks.longTerm && summary.futureHealthRisks.longTerm.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  📊 Long-term Health Risks (5-10 years)
                </h4>
                <ul className="space-y-2">
                  {summary.futureHealthRisks.longTerm.map((risk, index) => (
                    <li 
                      key={index}
                      className="flex items-start gap-2 text-sm"
                      data-testid={`text-long-term-risk-${index}`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-2 shrink-0" />
                      <span>{risk}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {summary.futureHealthRisks.preventiveMeasures && summary.futureHealthRisks.preventiveMeasures.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  ✅ Preventive Measures
                </h4>
                <ul className="space-y-2">
                  {summary.futureHealthRisks.preventiveMeasures.map((measure, index) => (
                    <li 
                      key={index}
                      className="flex items-start gap-2 text-sm"
                      data-testid={`text-preventive-measure-${index}`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                      <span>{measure}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}

        {summary.insuranceInsights && (
          <div className="space-y-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 uppercase tracking-wide">
              🏥 Insurance Recommendations
            </h4>
            
            {summary.insuranceInsights.riskProfile && (
              <div className="text-sm">
                <span className="font-medium text-blue-900 dark:text-blue-100">Your Risk Profile: </span>
                <span className="text-blue-800 dark:text-blue-200">{summary.insuranceInsights.riskProfile}</span>
              </div>
            )}

            {summary.insuranceInsights.coverageGaps && (
              <div className="text-sm">
                <span className="font-medium text-blue-900 dark:text-blue-100">Coverage Needs: </span>
                <span className="text-blue-800 dark:text-blue-200">{summary.insuranceInsights.coverageGaps}</span>
              </div>
            )}

            {summary.insuranceInsights.recommendedCoverage && summary.insuranceInsights.recommendedCoverage.length > 0 && (
              <div className="space-y-2">
                <p className="font-medium text-blue-900 dark:text-blue-100 text-sm">Recommended Coverage Features:</p>
                <ul className="space-y-1">
                  {summary.insuranceInsights.recommendedCoverage.map((coverage, index) => (
                    <li 
                      key={index}
                      className="flex items-start gap-2 text-sm text-blue-800 dark:text-blue-200"
                    >
                      <span className="text-blue-600 dark:text-blue-400 mt-1">•</span>
                      <span>{coverage}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {summary.recommendations && summary.recommendations.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Medical Recommendations
            </h4>
            <ul className="space-y-2">
              {summary.recommendations.map((rec, index) => (
                <li 
                  key={index}
                  className="flex items-start gap-2 text-sm"
                  data-testid={`text-recommendation-${index}`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {riskScore.factors.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              Risk Contributors
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs">
                  <p>These factors contribute to your overall risk assessment and may affect insurance premiums and coverage options.</p>
                </TooltipContent>
              </Tooltip>
            </h4>
            <div className="grid gap-2">
              {riskScore.factors.map((factor, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between gap-4 p-3 rounded-lg bg-muted/50"
                  data-testid={`factor-${index}`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{factor.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{factor.explanation}</p>
                  </div>
                  <Badge 
                    variant={factor.contribution > 15 ? "destructive" : factor.contribution > 8 ? "secondary" : "outline"}
                    className="shrink-0"
                  >
                    +{factor.contribution}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
