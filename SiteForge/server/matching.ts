import type { 
  MedicalReport, 
  HealthSummary, 
  Policy, 
  InsurancePlan, 
  PlanMatch, 
  MatchPreferences,
  NetAnnualCost 
} from "@shared/schema";

export function calculateNetAnnualCost(
  premium: number,
  coPayPct: number,
  riskLevel: "Low" | "Moderate" | "High"
): NetAnnualCost {
  const expectedUsageByRisk = {
    Low: 5000,
    Moderate: 20000,
    High: 60000,
  };

  const expectedUsage = expectedUsageByRisk[riskLevel];
  const expectedOOP = expectedUsage * (coPayPct / 100);

  return {
    annualPremium: premium,
    expectedOOP,
    totalNetCost: premium + expectedOOP,
  };
}

export function calculatePremiumWithRisk(
  basePremium: number,
  age: number,
  riskScore: number,
  diagnoses: string[]
): number {
  let premium = basePremium;
  
  if (age > 45) {
    premium *= 1 + (age - 45) * 0.02;
  }
  
  if (riskScore > 50) {
    premium *= 1 + (riskScore - 50) * 0.005;
  }
  
  const chronicConditions = ["diabetes", "hypertension", "heart", "cancer", "kidney"];
  const hasChronicCondition = diagnoses.some(d => 
    chronicConditions.some(c => d.toLowerCase().includes(c))
  );
  if (hasChronicCondition) {
    premium *= 1.15;
  }

  return Math.round(premium);
}

export function matchPlans(
  plans: InsurancePlan[],
  report: MedicalReport,
  summary: HealthSummary,
  preferences: MatchPreferences,
  existingPolicy?: Policy
): PlanMatch[] {
  const matches: PlanMatch[] = [];
  
  const existingCost = existingPolicy 
    ? calculateNetAnnualCost(
        existingPolicy.annualPremium,
        existingPolicy.coPayPct,
        summary.riskScore.shortTermLabel
      )
    : null;

  for (const plan of plans) {
    const estimatedPremium = calculatePremiumWithRisk(
      plan.basePremium,
      report.age,
      summary.riskScore.shortTerm,
      report.diagnoses
    );

    const coverageFitScore = calculateCoverageFit(plan, report.diagnoses);
    
    const affordabilityScore = calculateAffordability(
      estimatedPremium,
      preferences.budget || existingPolicy?.annualPremium || 20000
    );
    
    const waitingPeriodScore = calculateWaitingPeriodScore(
      plan.preExistingWaitYears,
      preferences.priorities.includes("minimal_wait")
    );
    
    const coverageQualityScore = calculateCoverageQuality(plan);
    
    const matchScore = Math.round(
      coverageFitScore + affordabilityScore + waitingPeriodScore + coverageQualityScore
    );

    const planCost = calculateNetAnnualCost(
      estimatedPremium,
      plan.coPayPct,
      summary.riskScore.shortTermLabel
    );

    const savings = existingCost 
      ? existingCost.totalNetCost - planCost.totalNetCost 
      : 0;
    
    const savingsPercentage = existingCost && existingCost.totalNetCost > 0
      ? (savings / existingCost.totalNetCost) * 100
      : 0;

    const reasons = generateReasons(plan, report, coverageFitScore, affordabilityScore, savings);
    const warnings = generateWarnings(plan, report, existingPolicy);

    matches.push({
      plan,
      matchScore,
      estimatedPremium,
      coverageFitScore,
      affordabilityScore,
      waitingPeriodScore,
      coverageQualityScore,
      reasons,
      warnings,
      savings: savings > 0 ? savings : undefined,
      savingsPercentage: savingsPercentage > 0 ? savingsPercentage : undefined,
    });
  }

  matches.sort((a, b) => {
    if (preferences.priorities.includes("low_premium")) {
      return a.estimatedPremium - b.estimatedPremium;
    }
    if (preferences.priorities.includes("high_coverage")) {
      return b.plan.sumInsured - a.plan.sumInsured;
    }
    return b.matchScore - a.matchScore;
  });

  return matches;
}

function calculateCoverageFit(plan: InsurancePlan, diagnoses: string[]): number {
  const conditionMappings: Record<string, string[]> = {
    "diabetes": ["Diabetes", "Chronic Care"],
    "hypertension": ["Hypertension", "Chronic Care"],
    "heart": ["Hospitalization", "Day Care"],
    "kidney": ["Hospitalization", "Dialysis"],
    "cancer": ["Hospitalization", "Day Care", "Chemotherapy"],
  };

  let coveredConditions = 0;
  let totalConditions = diagnoses.length || 1;

  for (const diagnosis of diagnoses) {
    const lowerDiagnosis = diagnosis.toLowerCase();
    for (const [condition, requiredCovers] of Object.entries(conditionMappings)) {
      if (lowerDiagnosis.includes(condition)) {
        const hasRequiredCover = requiredCovers.some(cover => 
          plan.covers.some(c => c.toLowerCase().includes(cover.toLowerCase()))
        );
        if (hasRequiredCover) {
          coveredConditions++;
        }
        break;
      }
    }
  }

  if (diagnoses.length === 0) {
    coveredConditions = 1;
  }

  return Math.round((coveredConditions / totalConditions) * 50);
}

function calculateAffordability(estimatedPremium: number, budget: number): number {
  if (estimatedPremium <= budget * 0.7) return 25;
  if (estimatedPremium <= budget) return 20;
  if (estimatedPremium <= budget * 1.2) return 15;
  if (estimatedPremium <= budget * 1.5) return 10;
  return 5;
}

function calculateWaitingPeriodScore(waitYears: number, prioritizeMinimalWait: boolean): number {
  const baseScore = waitYears <= 1 ? 15 : waitYears <= 2 ? 12 : waitYears <= 3 ? 8 : 4;
  return prioritizeMinimalWait ? Math.min(15, baseScore + 3) : baseScore;
}

function calculateCoverageQuality(plan: InsurancePlan): number {
  let score = 0;
  
  if (plan.sumInsured >= 1000000) score += 4;
  else if (plan.sumInsured >= 500000) score += 3;
  else score += 2;
  
  if (plan.networkSizeScore >= 85) score += 3;
  else if (plan.networkSizeScore >= 70) score += 2;
  else score += 1;
  
  if (plan.coPayPct === 0) score += 3;
  else if (plan.coPayPct <= 10) score += 2;
  else score += 1;
  
  return Math.min(10, score);
}

function generateReasons(
  plan: InsurancePlan,
  report: MedicalReport,
  coverageFitScore: number,
  affordabilityScore: number,
  savings: number
): string[] {
  const reasons: string[] = [];

  if (coverageFitScore >= 40) {
    reasons.push("Excellent coverage for your specific health conditions");
  } else if (coverageFitScore >= 25) {
    reasons.push("Good coverage alignment with your medical profile");
  }

  if (affordabilityScore >= 20) {
    reasons.push("Falls within your budget with competitive pricing");
  }

  if (plan.coPayPct === 0) {
    reasons.push("No co-payment required - full claim reimbursement");
  }

  if (plan.preExistingWaitYears <= 2) {
    reasons.push("Shorter waiting period for pre-existing conditions");
  }

  if (plan.networkSizeScore >= 85) {
    reasons.push("Extensive hospital network for easy accessibility");
  }

  if (savings > 5000) {
    reasons.push(`Potential annual savings of ₹${savings.toLocaleString("en-IN")}`);
  }

  if (plan.sumInsured >= 1000000) {
    reasons.push("High sum insured provides comprehensive protection");
  }

  return reasons.slice(0, 4);
}

function generateWarnings(
  plan: InsurancePlan,
  report: MedicalReport,
  existingPolicy?: Policy
): string[] {
  const warnings: string[] = [];

  if (plan.preExistingWaitYears >= 3) {
    warnings.push(`${plan.preExistingWaitYears}-year waiting period for pre-existing conditions`);
  }

  if (plan.coPayPct >= 15) {
    warnings.push(`${plan.coPayPct}% co-payment applies to all claims`);
  }

  if (existingPolicy && plan.preExistingWaitYears > 0) {
    warnings.push("Switching may restart waiting periods for pre-existing conditions");
  }

  const chronicConditions = ["diabetes", "hypertension"];
  const hasChronicCondition = report.diagnoses.some(d =>
    chronicConditions.some(c => d.toLowerCase().includes(c))
  );

  if (hasChronicCondition && !plan.covers.some(c => 
    c.toLowerCase().includes("diabetes") || c.toLowerCase().includes("chronic")
  )) {
    warnings.push("Verify chronic condition coverage with provider");
  }

  if (plan.networkSizeScore < 70) {
    warnings.push("Limited hospital network - check availability in your area");
  }

  return warnings.slice(0, 3);
}
