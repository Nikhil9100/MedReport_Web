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
