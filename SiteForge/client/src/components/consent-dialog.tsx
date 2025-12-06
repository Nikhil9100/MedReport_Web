import { Shield, Clock, Lock, FileText, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useState } from "react";

interface ConsentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConsent: () => void;
}

export function ConsentDialog({ open, onOpenChange, onConsent }: ConsentDialogProps) {
  const [agreed, setAgreed] = useState(false);

  const handleConsent = () => {
    if (agreed) {
      onConsent();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" data-testid="dialog-consent">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Privacy & Data Consent
          </DialogTitle>
          <DialogDescription>
            Before processing your medical report, please review our data handling practices.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <Lock className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium">Secure Processing</p>
              <p className="text-xs text-muted-foreground">
                Your documents are processed securely and encrypted during transmission.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <Clock className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium">Automatic Deletion</p>
              <p className="text-xs text-muted-foreground">
                All uploaded documents and extracted data are automatically deleted after 24 hours.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <FileText className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium">Demo Purpose</p>
              <p className="text-xs text-muted-foreground">
                This is a demonstration application. For actual insurance decisions, consult licensed professionals.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-700 dark:text-amber-300">Important Disclaimer</p>
              <p className="text-xs text-amber-600 dark:text-amber-400">
                This tool provides informational recommendations only. It does not constitute medical, legal, or financial advice. 
                Always verify information with insurance providers directly.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-start gap-2 pt-2">
          <Checkbox
            id="consent"
            checked={agreed}
            onCheckedChange={(checked) => setAgreed(checked === true)}
            data-testid="checkbox-consent"
          />
          <Label htmlFor="consent" className="text-sm leading-relaxed cursor-pointer">
            I understand that this is a demo application and I consent to the processing of my uploaded documents 
            according to the practices described above.
          </Label>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-consent">
            Cancel
          </Button>
          <Button onClick={handleConsent} disabled={!agreed} data-testid="button-accept-consent">
            I Agree & Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
