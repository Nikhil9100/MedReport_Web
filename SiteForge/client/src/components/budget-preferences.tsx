import { useState, useEffect } from "react";
import { Wallet, Shield, Clock, Sparkles, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { MatchPreferences } from "@shared/schema";

interface BudgetPreferencesProps {
  onPreferencesChange: (preferences: MatchPreferences) => void;
  initialPreferences?: MatchPreferences;
  className?: string;
}

type Priority = "low_premium" | "high_coverage" | "minimal_wait";

const priorityOptions: { id: Priority; label: string; icon: typeof Wallet; description: string }[] = [
  { id: "low_premium", label: "Low Premium", icon: Wallet, description: "Prioritize lower monthly/annual costs" },
  { id: "high_coverage", label: "High Coverage", icon: Shield, description: "Maximize sum insured and benefits" },
  { id: "minimal_wait", label: "Minimal Wait", icon: Clock, description: "Shortest pre-existing condition waiting period" },
];

export function BudgetPreferences({ 
  onPreferencesChange, 
  initialPreferences,
  className 
}: BudgetPreferencesProps) {
  const [budget, setBudget] = useState<number>(initialPreferences?.budget || 25000);
  const [priorities, setPriorities] = useState<Priority[]>(
    (initialPreferences?.priorities as Priority[]) || ["low_premium"]
  );

  useEffect(() => {
    onPreferencesChange({
      budget,
      priorities,
      existingPolicy: initialPreferences?.existingPolicy,
    });
  }, [budget, priorities]);

  const togglePriority = (priority: Priority) => {
    setPriorities(prev => {
      if (prev.includes(priority)) {
        return prev.filter(p => p !== priority);
      }
      return [...prev, priority];
    });
  };

  const formatCurrency = (value: number) => {
    if (value >= 100000) {
      return `₹${(value / 100000).toFixed(1)}L`;
    }
    return `₹${(value / 1000).toFixed(0)}K`;
  };

  return (
    <Card className={cn("", className)} data-testid="card-budget-preferences">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Your Preferences
        </CardTitle>
        <CardDescription>
          Help us find the best plans for your needs
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-1.5">
              <Wallet className="h-4 w-4 text-muted-foreground" />
              Annual Budget
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs">
                  <p>Maximum amount you're willing to pay annually for health insurance.</p>
                </TooltipContent>
              </Tooltip>
            </Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">₹</span>
              <Input
                type="number"
                value={budget}
                onChange={(e) => setBudget(parseInt(e.target.value) || 0)}
                className="w-28 h-8 text-right"
                data-testid="input-budget"
              />
            </div>
          </div>
          
          <div className="px-1">
            <Slider
              value={[budget]}
              onValueChange={([value]) => setBudget(value)}
              min={5000}
              max={100000}
              step={1000}
              className="w-full"
              data-testid="slider-budget"
            />
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>₹5K</span>
              <span>₹50K</span>
              <span>₹1L</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Label className="flex items-center gap-1.5">
            What matters most to you?
            <span className="text-xs text-muted-foreground font-normal">(Select all that apply)</span>
          </Label>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {priorityOptions.map((option) => {
              const isSelected = priorities.includes(option.id);
              const Icon = option.icon;
              
              return (
                <Button
                  key={option.id}
                  type="button"
                  variant="outline"
                  className={cn(
                    "h-auto py-3 px-4 flex flex-col items-start gap-1.5 text-left transition-all",
                    isSelected && "border-primary bg-primary/5 ring-1 ring-primary"
                  )}
                  onClick={() => togglePriority(option.id)}
                  data-testid={`button-priority-${option.id}`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className={cn(
                      "h-4 w-4",
                      isSelected ? "text-primary" : "text-muted-foreground"
                    )} />
                    <span className={cn(
                      "font-medium text-sm",
                      isSelected && "text-primary"
                    )}>
                      {option.label}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground leading-relaxed">
                    {option.description}
                  </span>
                </Button>
              );
            })}
          </div>
        </div>

        <div className="pt-2 text-center">
          <p className="text-sm text-muted-foreground">
            Budget: <span className="font-semibold text-foreground">{formatCurrency(budget)}</span> / year
            {priorities.length > 0 && (
              <> • Focusing on: <span className="font-semibold text-foreground">
                {priorities.map(p => priorityOptions.find(o => o.id === p)?.label).join(", ")}
              </span></>
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
