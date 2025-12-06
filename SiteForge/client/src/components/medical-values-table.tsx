import { Pencil, Check, X, Info } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { MedicalTest } from "@shared/schema";

interface MedicalValuesTableProps {
  tests: MedicalTest[];
  editable?: boolean;
  onUpdate?: (tests: MedicalTest[]) => void;
  className?: string;
}

function StatusBadge({ status }: { status: "normal" | "borderline" | "high" }) {
  const config = {
    normal: { label: "Normal", className: "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400" },
    borderline: { label: "Borderline", className: "bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400" },
    high: { label: "High", className: "bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400" },
  };

  return (
    <Badge variant="outline" className={cn("font-medium", config[status].className)}>
      {config[status].label}
    </Badge>
  );
}

export function MedicalValuesTable({ 
  tests, 
  editable = false, 
  onUpdate,
  className 
}: MedicalValuesTableProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState<string>("");

  const startEditing = (index: number, value: number) => {
    setEditingIndex(index);
    setEditValue(value.toString());
  };

  const cancelEditing = () => {
    setEditingIndex(null);
    setEditValue("");
  };

  const saveEditing = () => {
    if (editingIndex === null || !onUpdate) return;
    
    const newValue = parseFloat(editValue);
    if (isNaN(newValue)) {
      cancelEditing();
      return;
    }

    const updatedTests = tests.map((test, index) => {
      if (index === editingIndex) {
        const range = test.range.split("-").map(v => parseFloat(v.trim()));
        let newStatus: "normal" | "borderline" | "high" = "normal";
        if (range.length === 2) {
          const [min, max] = range;
          if (newValue > max * 1.2 || newValue < min * 0.8) {
            newStatus = "high";
          } else if (newValue > max || newValue < min) {
            newStatus = "borderline";
          }
        }
        return { ...test, value: newValue, status: newStatus };
      }
      return test;
    });

    onUpdate(updatedTests);
    cancelEditing();
  };

  const getStatusBorder = (status: string) => {
    switch (status) {
      case "normal": return "border-l-emerald-500";
      case "borderline": return "border-l-amber-500";
      case "high": return "border-l-red-500";
      default: return "border-l-muted";
    }
  };

  return (
    <Card className={className} data-testid="card-medical-values">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          Medical Values
          {editable && (
            <span className="text-xs font-normal text-muted-foreground">(Click to edit)</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Test</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">Value</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Reference</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-muted-foreground">Status</th>
                {editable && (
                  <th className="text-center py-3 px-4 text-sm font-semibold text-muted-foreground w-20">Edit</th>
                )}
              </tr>
            </thead>
            <tbody>
              {tests.map((test, index) => (
                <tr 
                  key={index}
                  className={cn(
                    "border-b last:border-0 border-l-4 transition-colors",
                    getStatusBorder(test.status),
                    editingIndex === index && "bg-muted/50"
                  )}
                  data-testid={`row-test-${index}`}
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{test.name}</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-xs">
                          <p>Normal range: {test.range} {test.unit}</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {editingIndex === index ? (
                      <Input
                        type="number"
                        step="0.1"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-24 h-8 text-right ml-auto"
                        autoFocus
                        data-testid="input-edit-value"
                      />
                    ) : (
                      <span className="font-mono font-medium" data-testid={`text-value-${index}`}>
                        {test.value} {test.unit}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">
                    {test.range} {test.unit}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <StatusBadge status={test.status} />
                  </td>
                  {editable && (
                    <td className="py-3 px-4 text-center">
                      {editingIndex === index ? (
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={saveEditing}
                            data-testid="button-save-edit"
                          >
                            <Check className="h-4 w-4 text-emerald-600" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={cancelEditing}
                            data-testid="button-cancel-edit"
                          >
                            <X className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => startEditing(index, test.value)}
                          data-testid={`button-edit-${index}`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
