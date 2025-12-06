import { FileText, Shield, Mail, ExternalLink } from "lucide-react";
import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary text-primary-foreground">
                <FileText className="h-4 w-4" />
              </div>
              <span className="text-lg font-semibold tracking-tight">MedReport</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Making insurance decisions simpler with AI-powered medical report analysis and personalized plan recommendations.
            </p>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Shield className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>Your data is never stored permanently</span>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Quick Links</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a 
                  href="#how-it-works" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="link-footer-how-it-works"
                >
                  How it Works
                </a>
              </li>
              <li>
                <a 
                  href="#privacy" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="link-footer-privacy"
                >
                  Privacy & Security
                </a>
              </li>
              <li>
                <a 
                  href="#faq" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="link-footer-faq"
                >
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Contact & Support</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a 
                  href="mailto:support@medreport.demo" 
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="link-contact-email"
                >
                  <Mail className="h-4 w-4" />
                  support@medreport.demo
                </a>
              </li>
              <li className="text-muted-foreground">
                Demo application for educational purposes
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
            <p>
              2024 MedReport. This is a demo application using synthetic data.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
            </div>
          </div>
          <p className="mt-4 text-xs text-muted-foreground text-center md:text-left">
            <strong>Disclaimer:</strong> This tool provides informational recommendations only and does not constitute medical or legal advice. 
            Always consult with qualified professionals before making insurance decisions.
          </p>
        </div>
      </div>
    </footer>
  );
}
