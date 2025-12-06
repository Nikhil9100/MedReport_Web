import { Shield, FileText, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import { Link } from "wouter";

interface HeaderProps {
  showNav?: boolean;
}

export function Header({ showNav = true }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 md:px-8 flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex items-center justify-center w-9 h-9 rounded-md bg-primary text-primary-foreground">
            <FileText className="h-5 w-5" />
          </div>
          <span className="text-xl font-semibold tracking-tight" data-testid="text-logo">
            MedReport
          </span>
        </Link>

        {showNav && (
          <nav className="hidden md:flex items-center gap-6">
            <a
              href="#how-it-works"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              data-testid="link-how-it-works"
            >
              How it Works
            </a>
            <a
              href="#privacy"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              data-testid="link-privacy"
            >
              Privacy
            </a>
            <a
              href="#faq"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              data-testid="link-faq"
            >
              FAQ
            </a>
          </nav>
        )}

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 text-xs font-medium">
            <Shield className="h-3.5 w-3.5" />
            <span>Privacy-first</span>
          </div>
          <ThemeToggle />
          <Link href="/upload">
            <Button data-testid="button-get-started">
              Get Started
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
