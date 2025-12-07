import { Link } from "wouter";
import { 
  FileText, Shield, BarChart3, Award, Upload, ChevronRight, 
  Check, ArrowRight, Clock, Lock, Zap, HelpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

const features = [
  {
    icon: FileText,
    title: "Upload Medical Report",
    description: "Upload your medical report (PDF or image) and we automatically extract key health data, diagnoses, and test results.",
  },
  {
    icon: BarChart3,
    title: "Compare Policies",
    description: "Upload your current policy or enter details manually. We'll calculate your actual costs and compare options.",
  },
  {
    icon: Award,
    title: "Get Best Plan & Savings",
    description: "Receive ranked recommendations with match scores, estimated savings, and clear explanations for each plan.",
  },
];

const processSteps = [
  { step: 1, title: "Upload", description: "Upload your medical report" },
  { step: 2, title: "Extract", description: "AI extracts health data" },
  { step: 3, title: "Review", description: "Verify extracted values" },
  { step: 4, title: "Recommend", description: "Get personalized plans" },
  { step: 5, title: "Download", description: "Save your report" },
];

const faqs = [
  {
    question: "How does MedReport protect my privacy?",
    answer: "Your documents are processed securely with encryption in transit. All uploaded files and extracted data are automatically deleted after 24 hours. We never store your personal health information permanently or share it with third parties."
  },
  {
    question: "How accurate are the insurance recommendations?",
    answer: "Our recommendations are based on matching your health profile with plan coverage, comparing costs, and analyzing waiting periods. However, actual premiums may vary based on your complete medical history. Always verify quotes with insurance providers directly."
  },
  {
    question: "What file formats are supported?",
    answer: "We support PDF documents and image files (JPG, PNG) up to 20MB. For best results, upload clear, high-resolution scans of your medical reports."
  },
  {
    question: "Is this free to use?",
    answer: "Yes, MedReport is completely free to use. This is a demonstration application designed to help you understand your insurance options. No payment or registration is required."
  },
  {
    question: "Can I compare my existing policy?",
    answer: "Yes! You can upload your current policy document or manually enter the details. We'll calculate your current costs and show you potential savings with alternative plans."
  },
];

export function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        <section className="relative min-h-[85vh] flex items-center py-16 md:py-24 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/10" />
          <div className="absolute top-20 right-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          
          <div className="relative max-w-7xl mx-auto px-4 md:px-8">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div className="space-y-8">
                <div className="space-y-4">
                  <Badge variant="secondary" className="gap-1.5 py-1.5">
                    <Zap className="h-3.5 w-3.5" />
                    AI-Powered Insurance Advisor
                  </Badge>
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
                    Right insurance.{" "}
                    <span className="text-primary">Based on your medical report.</span>
                  </h1>
                  <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-xl">
                    Upload your medical report (and your current policy if you have one). 
                    We extract medical facts, compute risk, and recommend the best, cost-saving 
                    insurance plans — with an easy one-page report.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/upload">
                    <Button size="lg" className="w-full sm:w-auto gap-2 px-8" data-testid="button-upload-report">
                      <Upload className="h-5 w-5" />
                      Upload Report
                    </Button>
                  </Link>
                  <Link href="/upload?compare=true">
                    <Button size="lg" variant="outline" className="w-full sm:w-auto gap-2 px-8" data-testid="button-compare-policy">
                      <BarChart3 className="h-5 w-5" />
                      Compare My Policy
                    </Button>
                  </Link>
                </div>

                <div className="flex flex-wrap items-center gap-6 pt-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-emerald-600" />
                    <span>Privacy-first</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <span>Auto-delete in 24h</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-primary" />
                    <span>Demo uses synthetic data</span>
                  </div>
                </div>
              </div>

              <div className="relative hidden lg:block">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent rounded-2xl blur-2xl" />
                <Card className="relative overflow-hidden">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
                          <FileText className="h-4 w-4 text-primary-foreground" />
                        </div>
                        <span className="font-semibold">MedReport</span>
                      </div>
                      <Badge variant="secondary">Sample Report</Badge>
                    </div>
                    
                    <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                      <h4 className="font-medium text-sm">Health Summary</h4>
                      <p className="text-xs text-muted-foreground">
                        Your report shows Type 2 Diabetes (HbA1c 8.2%) and elevated blood pressure (150/95). 
                        This indicates moderate short-term risk and may affect insurance premiums.
                      </p>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="text-amber-600 bg-amber-50">Short-term: Moderate</Badge>
                        <Badge variant="outline" className="text-amber-600 bg-amber-50">Long-term: Moderate</Badge>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Top Recommendation</h4>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                        <div>
                          <p className="font-medium text-sm">Star Health Gold</p>
                          <p className="text-xs text-muted-foreground">Best match for your profile</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-emerald-700 dark:text-emerald-400">Save ₹8,500/yr</p>
                          <p className="text-xs text-muted-foreground">Match: 92%</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24 bg-muted/30" id="how-it-works">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-semibold mb-4">How It Works</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Get personalized insurance recommendations in three simple steps
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Card key={index} className="relative overflow-hidden hover-elevate group">
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <Icon className="h-6 w-6" />
                      </div>
                      <h3 className="text-xl font-semibold">{feature.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-semibold mb-4">Your Journey</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                From upload to download in 5 simple steps
              </p>
            </div>

            <div className="hidden md:flex items-center justify-between max-w-4xl mx-auto">
              {processSteps.map((step, index) => (
                <div key={step.step} className="flex items-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold text-lg">
                      {step.step}
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-sm">{step.title}</p>
                      <p className="text-xs text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                  {index < processSteps.length - 1 && (
                    <div className="flex-1 h-0.5 bg-primary/20 mx-4 relative">
                      <ChevronRight className="absolute -right-2 -top-2.5 h-5 w-5 text-primary/40" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="md:hidden space-y-4">
              {processSteps.map((step) => (
                <div key={step.step} className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold shrink-0">
                    {step.step}
                  </div>
                  <div>
                    <p className="font-medium">{step.title}</p>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24 bg-muted/30" id="privacy">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <Badge variant="secondary" className="gap-1.5">
                  <Shield className="h-3.5 w-3.5" />
                  Privacy First
                </Badge>
                <h2 className="text-3xl md:text-4xl font-semibold">
                  Your data stays yours
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  We take your privacy seriously. Your medical documents are processed securely 
                  and automatically deleted. We never store your personal health information permanently.
                </p>
                <ul className="space-y-3">
                  {[
                    "Encrypted data transmission",
                    "Automatic 24-hour deletion",
                    "No permanent storage of health data",
                    "Demo uses synthetic data only",
                  ].map((item, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950">
                        <Check className="h-3 w-3 text-emerald-600" />
                      </div>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-primary/10 rounded-2xl blur-2xl" />
                <Card className="relative">
                  <CardContent className="p-8 text-center space-y-4">
                    <div className="flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950 mx-auto">
                      <Shield className="h-10 w-10 text-emerald-600" />
                    </div>
                    <h3 className="text-xl font-semibold">Privacy Protected</h3>
                    <p className="text-muted-foreground">
                      Your documents are never stored beyond the analysis session
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24" id="faq">
          <div className="max-w-3xl mx-auto px-4 md:px-8">
            <div className="text-center mb-12">
              <Badge variant="secondary" className="gap-1.5 mb-4">
                <HelpCircle className="h-3.5 w-3.5" />
                FAQ
              </Badge>
              <h2 className="text-3xl md:text-4xl font-semibold mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-lg text-muted-foreground">
                Everything you need to know about MedReport
              </p>
            </div>

            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left" data-testid={`faq-trigger-${index}`}>
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        <section className="py-16 md:py-24 bg-primary text-primary-foreground">
          <div className="max-w-4xl mx-auto px-4 md:px-8 text-center space-y-8">
            <h2 className="text-3xl md:text-4xl font-semibold">
              Ready to find your best insurance plan?
            </h2>
            <p className="text-lg opacity-90 max-w-2xl mx-auto">
              Upload your medical report now and get personalized recommendations in minutes.
            </p>
            <Link href="/upload">
              <Button size="lg" variant="secondary" className="gap-2 px-8" data-testid="button-cta-get-started">
                Get Started
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
