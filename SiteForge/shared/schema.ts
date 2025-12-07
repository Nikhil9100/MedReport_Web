import { z } from "zod";

// Medical Test Result
export const medicalTestSchema = z.object({
  name: z.string(),
  value: z.number(),
  unit: z.string(),
  range: z.string(),
  status: z.enum(["normal", "borderline", "high"]),
});

export type MedicalTest = z.infer<typeof medicalTestSchema>;

// Medical Report
export const medicalReportSchema = z.object({
  id: z.string(),
  age: z.number(),
  gender: z.enum(["Male", "Female", "Other"]),
  diagnoses: z.array(z.string()),
  tests: z.array(medicalTestSchema),
  medications: z.array(z.string()).optional(),
  smokingStatus: z.enum(["Yes", "No", "Former"]),
  rawText: z.string().optional(),
});

export type MedicalReport = z.infer<typeof medicalReportSchema>;

// Risk Score
export const riskScoreSchema = z.object({
  shortTerm: z.number().min(0).max(100),
  longTerm: z.number().min(0).max(100),
  shortTermLabel: z.enum(["Low", "Moderate", "High"]),
  longTermLabel: z.enum(["Low", "Moderate", "High"]),
  factors: z.array(z.object({
    name: z.string(),
    contribution: z.number(),
    explanation: z.string(),
  })),
});

export type RiskScore = z.infer<typeof riskScoreSchema>;

// Health Summary
export const healthSummarySchema = z.object({
  summary: z.string(),
  keyFindings: z.array(z.string()),
  riskScore: riskScoreSchema,
});

export type HealthSummary = z.infer<typeof healthSummarySchema>;

// Insurance Policy (existing or entered by user)
export const policySchema = z.object({
  id: z.string().optional(),
  provider: z.string(),
  planName: z.string(),
  sumInsured: z.number(),
  annualPremium: z.number(),
  preExistingWaitYears: z.number(),
  coPayPct: z.number(),
  exclusions: z.array(z.string()),
  networkSize: z.enum(["small", "medium", "large"]).optional(),
});

export type Policy = z.infer<typeof policySchema>;

export const insertPolicySchema = policySchema.omit({ id: true });
export type InsertPolicy = z.infer<typeof insertPolicySchema>;

// Insurance Plan (from database)
export const insurancePlanSchema = z.object({
  id: z.string(),
  provider: z.string(),
  planName: z.string(),
  sumInsured: z.number(),
  basePremium: z.number(),
  covers: z.array(z.string()),
  preExistingWaitYears: z.number(),
  coPayPct: z.number(),
  networkSizeScore: z.number().min(0).max(100),
  notes: z.string().optional(),
  url: z.string().optional(),
});

export type InsurancePlan = z.infer<typeof insurancePlanSchema>;

// Plan Match Result
export const planMatchSchema = z.object({
  plan: insurancePlanSchema,
  matchScore: z.number().min(0).max(100),
  estimatedPremium: z.number(),
  coverageFitScore: z.number(),
  affordabilityScore: z.number(),
  waitingPeriodScore: z.number(),
  coverageQualityScore: z.number(),
  reasons: z.array(z.string()),
  warnings: z.array(z.string()),
  savings: z.number().optional(),
  savingsPercentage: z.number().optional(),
});

export type PlanMatch = z.infer<typeof planMatchSchema>;

// Net Annual Cost Calculation
export const netAnnualCostSchema = z.object({
  annualPremium: z.number(),
  expectedOOP: z.number(),
  totalNetCost: z.number(),
});

export type NetAnnualCost = z.infer<typeof netAnnualCostSchema>;

// User Preferences for matching
export const matchPreferencesSchema = z.object({
  budget: z.number().optional(),
  priorities: z.array(z.enum(["low_premium", "high_coverage", "minimal_wait"])),
  existingPolicy: policySchema.optional(),
});

export type MatchPreferences = z.infer<typeof matchPreferencesSchema>;

// Full Report Session
export const reportSessionSchema = z.object({
  id: z.string(),
  medicalReport: medicalReportSchema.optional(),
  healthSummary: healthSummarySchema.optional(),
  existingPolicy: policySchema.optional(),
  preferences: matchPreferencesSchema.optional(),
  recommendations: z.array(planMatchSchema).optional(),
  createdAt: z.string(),
  expiresAt: z.string(),
});

export type ReportSession = z.infer<typeof reportSessionSchema>;

// API Request/Response types
export const uploadReportRequestSchema = z.object({
  fileData: z.string(), // base64
  fileType: z.enum(["pdf", "image"]),
  fileName: z.string(),
  fileSize: z.number().optional(), // File size in bytes
});

export type UploadReportRequest = z.infer<typeof uploadReportRequestSchema>;

export const matchRequestSchema = z.object({
  reportId: z.string(),
  budget: z.number().optional(),
  priorities: z.array(z.enum(["low_premium", "high_coverage", "minimal_wait"])),
  existingPolicy: policySchema.optional(),
});

export type MatchRequest = z.infer<typeof matchRequestSchema>;

// Legacy User schema for compatibility
export const users = {
  id: "string",
  username: "string",
  password: "string",
};

export const insertUserSchema = z.object({
  username: z.string(),
  password: z.string(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = { id: string; username: string; password: string };
