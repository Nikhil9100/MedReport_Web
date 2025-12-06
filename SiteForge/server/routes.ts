import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { extractMedicalData } from "./openai";
import { matchPlans, calculateNetAnnualCost } from "./matching";
import { uploadReportRequestSchema, matchRequestSchema, policySchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Health check endpoint for monitoring and deployment verification
  app.get("/api/health", (req, res) => {
    res.status(200).json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development",
    });
  });

  app.post("/api/upload", async (req, res) => {
    try {
      const parsed = uploadReportRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ 
          error: "Invalid request", 
          details: parsed.error.errors 
        });
      }

      const { fileData, fileType, fileName } = parsed.data;

      const session = await storage.createSession();

      const { medicalReport, healthSummary } = await extractMedicalData(
        fileData,
        fileType,
        fileName
      );

      const updated = await storage.updateSession(session.id, {
        medicalReport,
        healthSummary,
      });

      res.json(updated);
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ 
        error: "Failed to process upload",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.get("/api/report/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const session = await storage.getSession(id);

      if (!session) {
        return res.status(404).json({ error: "Report not found or expired" });
      }

      res.json(session);
    } catch (error) {
      console.error("Get report error:", error);
      res.status(500).json({ error: "Failed to fetch report" });
    }
  });

  app.post("/api/report/:id/match", async (req, res) => {
    try {
      const { id } = req.params;
      const session = await storage.getSession(id);

      if (!session) {
        return res.status(404).json({ error: "Report not found or expired" });
      }

      const { budget, priorities, existingPolicy, updatedReport } = req.body;

      if (updatedReport && session.medicalReport) {
        session.medicalReport = {
          ...session.medicalReport,
          age: updatedReport.age ?? session.medicalReport.age,
          gender: updatedReport.gender ?? session.medicalReport.gender,
          diagnoses: updatedReport.diagnoses ?? session.medicalReport.diagnoses,
          tests: updatedReport.tests ?? session.medicalReport.tests,
        };
      }

      if (!session.medicalReport || !session.healthSummary) {
        return res.status(400).json({ error: "Medical report data not available" });
      }

      const plans = await storage.getInsurancePlans();

      const preferences = {
        budget: budget || 25000,
        priorities: priorities || ["low_premium"],
        existingPolicy: existingPolicy || undefined,
      };

      const recommendations = matchPlans(
        plans,
        session.medicalReport,
        session.healthSummary,
        preferences,
        existingPolicy
      );

      const updated = await storage.updateSession(id, {
        medicalReport: session.medicalReport,
        existingPolicy: existingPolicy || undefined,
        preferences,
        recommendations,
      });

      res.json(updated);
    } catch (error) {
      console.error("Match error:", error);
      res.status(500).json({ error: "Failed to generate recommendations" });
    }
  });

  app.post("/api/report/:id/export", async (req, res) => {
    try {
      const { id } = req.params;
      const session = await storage.getSession(id);

      if (!session) {
        return res.status(404).json({ error: "Report not found or expired" });
      }

      res.json({
        success: true,
        message: "PDF generation would happen here in production",
        pdfUrl: null,
        reportData: {
          medicalReport: session.medicalReport,
          healthSummary: session.healthSummary,
          recommendations: session.recommendations?.slice(0, 3),
          existingPolicy: session.existingPolicy,
          generatedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("Export error:", error);
      res.status(500).json({ error: "Failed to generate PDF" });
    }
  });

  app.post("/api/policy/parse", async (req, res) => {
    try {
      const { fileData, fileName } = req.body;

      const parsedPolicy = {
        provider: "Sample Insurance Co.",
        planName: "Health Shield Gold",
        sumInsured: 500000,
        annualPremium: 15000,
        preExistingWaitYears: 2,
        coPayPct: 10,
        exclusions: ["Cosmetic surgery", "Experimental treatments"],
      };

      res.json(parsedPolicy);
    } catch (error) {
      console.error("Policy parse error:", error);
      res.status(500).json({ error: "Failed to parse policy document" });
    }
  });

  app.get("/api/plans", async (req, res) => {
    try {
      const plans = await storage.getInsurancePlans();
      res.json(plans);
    } catch (error) {
      console.error("Get plans error:", error);
      res.status(500).json({ error: "Failed to fetch insurance plans" });
    }
  });

  return httpServer;
}
