import { Check, Upload, FileSearch, ClipboardCheck, Award, Download } from "lucide-react";
import { cn } from "@/lib/utils";

const steps = [
  { id: 1, name: "Upload", icon: Upload },
  { id: 2, name: "Extract", icon: FileSearch },
  { id: 3, name: "Review", icon: ClipboardCheck },
  { id: 4, name: "Recommendations", icon: Award },
  { id: 5, name: "Download", icon: Download },
];

interface ProgressStepperProps {
  currentStep: number;
  className?: string;
}

export function ProgressStepper({ currentStep, className }: ProgressStepperProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="hidden md:flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          const Icon = step.icon;

          return (
            <div key={step.id} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-2">
                <div
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200",
                    isCompleted && "bg-primary border-primary text-primary-foreground",
                    isCurrent && "border-primary text-primary bg-primary/10",
                    !isCompleted && !isCurrent && "border-muted-foreground/30 text-muted-foreground"
                  )}
                  data-testid={`stepper-icon-${step.id}`}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </div>
                <span
                  className={cn(
                    "text-xs font-medium transition-colors",
                    isCurrent && "text-primary",
                    isCompleted && "text-foreground",
                    !isCompleted && !isCurrent && "text-muted-foreground"
                  )}
                >
                  {step.name}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-4 transition-colors",
                    currentStep > step.id ? "bg-primary" : "bg-muted-foreground/20"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
            {currentStep}
          </div>
          <div>
            <p className="text-sm font-medium">{steps[currentStep - 1]?.name}</p>
            <p className="text-xs text-muted-foreground">Step {currentStep} of {steps.length}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {steps.map((step) => (
            <div
              key={step.id}
              className={cn(
                "w-2 h-2 rounded-full transition-colors",
                currentStep >= step.id ? "bg-primary" : "bg-muted-foreground/30"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
