import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Policy, PlanMatch, NetAnnualCost } from "@shared/schema";

interface ComparisonChartProps {
  existingPolicy?: Policy | null;
  existingPolicyCost?: NetAnnualCost;
  recommendations: PlanMatch[];
  className?: string;
}

export function ComparisonChart({
  existingPolicy,
  existingPolicyCost,
  recommendations,
  className
}: ComparisonChartProps) {
  const formatCurrency = (value: number) => {
    if (value >= 100000) {
      return `₹${(value / 100000).toFixed(1)}L`;
    }
    return `₹${value.toLocaleString("en-IN")}`;
  };

  const formatShortCurrency = (value: number) => {
    if (value >= 100000) {
      return `${(value / 100000).toFixed(1)}L`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`;
    }
    return value.toString();
  };

  const chartData = [
    ...(existingPolicy && existingPolicyCost ? [{
      name: "Current",
      fullName: existingPolicy.planName,
      premium: existingPolicyCost.annualPremium,
      oop: existingPolicyCost.expectedOOP,
      total: existingPolicyCost.totalNetCost,
      isCurrent: true,
    }] : []),
    ...recommendations.slice(0, 3).map((match, index) => ({
      name: `Plan ${index + 1}`,
      fullName: match.plan.planName,
      premium: match.estimatedPremium,
      oop: match.estimatedPremium * (match.plan.coPayPct / 100) * 2,
      total: match.estimatedPremium + (match.estimatedPremium * (match.plan.coPayPct / 100) * 2),
      isCurrent: false,
    })),
  ];

  const colors = {
    current: "hsl(var(--muted-foreground))",
    plan1: "hsl(var(--chart-1))",
    plan2: "hsl(var(--chart-2))",
    plan3: "hsl(var(--chart-3))",
  };

  const getBarColor = (index: number, isCurrent: boolean) => {
    if (isCurrent) return colors.current;
    const planColors = [colors.plan1, colors.plan2, colors.plan3];
    return planColors[index - (existingPolicy ? 1 : 0)] || colors.plan1;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-sm mb-2">{data.fullName}</p>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Premium:</span>
              <span className="font-medium">{formatCurrency(data.premium)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Expected OOP:</span>
              <span className="font-medium">{formatCurrency(data.oop)}</span>
            </div>
            <div className="flex justify-between gap-4 border-t pt-1 mt-1">
              <span className="text-muted-foreground">Total:</span>
              <span className="font-bold">{formatCurrency(data.total)}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className={cn("", className)} data-testid="card-comparison-chart">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Annual Cost Comparison</CardTitle>
        <CardDescription>
          Net annual cost = Premium + Expected out-of-pocket expenses
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 20, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="name" 
                className="text-xs" 
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                tickFormatter={(value) => `₹${formatShortCurrency(value)}`}
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(index, entry.isCurrent)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px]">Feature</TableHead>
                {existingPolicy && (
                  <TableHead className="text-center">
                    <div className="flex flex-col items-center">
                      <span className="font-medium">Current</span>
                      <span className="text-xs font-normal text-muted-foreground truncate max-w-[100px]">
                        {existingPolicy.planName}
                      </span>
                    </div>
                  </TableHead>
                )}
                {recommendations.slice(0, 3).map((match, index) => (
                  <TableHead key={match.plan.id} className="text-center">
                    <div className="flex flex-col items-center">
                      <span className="font-medium">Plan {index + 1}</span>
                      <span className="text-xs font-normal text-muted-foreground truncate max-w-[100px]">
                        {match.plan.planName}
                      </span>
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Premium</TableCell>
                {existingPolicy && (
                  <TableCell className="text-center">
                    {formatCurrency(existingPolicy.annualPremium)}
                  </TableCell>
                )}
                {recommendations.slice(0, 3).map((match) => (
                  <TableCell key={match.plan.id} className="text-center">
                    {formatCurrency(match.estimatedPremium)}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Sum Insured</TableCell>
                {existingPolicy && (
                  <TableCell className="text-center">
                    {formatCurrency(existingPolicy.sumInsured)}
                  </TableCell>
                )}
                {recommendations.slice(0, 3).map((match) => (
                  <TableCell key={match.plan.id} className="text-center">
                    {formatCurrency(match.plan.sumInsured)}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Co-pay</TableCell>
                {existingPolicy && (
                  <TableCell className="text-center">{existingPolicy.coPayPct}%</TableCell>
                )}
                {recommendations.slice(0, 3).map((match) => (
                  <TableCell key={match.plan.id} className="text-center">
                    {match.plan.coPayPct}%
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Waiting Period</TableCell>
                {existingPolicy && (
                  <TableCell className="text-center">{existingPolicy.preExistingWaitYears} years</TableCell>
                )}
                {recommendations.slice(0, 3).map((match) => (
                  <TableCell key={match.plan.id} className="text-center">
                    {match.plan.preExistingWaitYears} years
                  </TableCell>
                ))}
              </TableRow>
              {existingPolicy && existingPolicyCost && (
                <TableRow className="bg-muted/30">
                  <TableCell className="font-semibold">Savings</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="text-muted-foreground">
                      <Minus className="h-3 w-3 mr-1" />
                      Baseline
                    </Badge>
                  </TableCell>
                  {recommendations.slice(0, 3).map((match) => {
                    const savings = match.savings || 0;
                    const isPositive = savings > 0;
                    const isNegative = savings < 0;
                    
                    return (
                      <TableCell key={match.plan.id} className="text-center">
                        <Badge
                          variant="outline"
                          className={cn(
                            isPositive && "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
                            isNegative && "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800"
                          )}
                        >
                          {isPositive ? (
                            <TrendingDown className="h-3 w-3 mr-1" />
                          ) : isNegative ? (
                            <TrendingUp className="h-3 w-3 mr-1" />
                          ) : (
                            <Minus className="h-3 w-3 mr-1" />
                          )}
                          {isPositive ? "Save " : isNegative ? "+" : ""}
                          {formatCurrency(Math.abs(savings))}
                        </Badge>
                      </TableCell>
                    );
                  })}
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
