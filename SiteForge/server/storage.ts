import { randomUUID } from "crypto";
import type { 
  ReportSession, 
  MedicalReport, 
  HealthSummary, 
  Policy, 
  PlanMatch, 
  InsurancePlan,
  MatchPreferences 
} from "@shared/schema";

export interface IStorage {
  createSession(): Promise<ReportSession>;
  getSession(id: string): Promise<ReportSession | undefined>;
  updateSession(id: string, data: Partial<ReportSession>): Promise<ReportSession | undefined>;
  deleteSession(id: string): Promise<boolean>;
  getInsurancePlans(): Promise<InsurancePlan[]>;
}

export class MemStorage implements IStorage {
  private sessions: Map<string, ReportSession>;
  private insurancePlans: InsurancePlan[];

  constructor() {
    this.sessions = new Map();
    this.insurancePlans = this.initializePlans();
  }

  private initializePlans(): InsurancePlan[] {
    return [
      {
        id: "plan-1",
        provider: "Star Health",
        planName: "Star Comprehensive",
        sumInsured: 500000,
        basePremium: 12000,
        covers: ["Hospitalization", "Pre & Post Care", "Day Care", "Ambulance", "Diabetes", "Hypertension"],
        preExistingWaitYears: 2,
        coPayPct: 0,
        networkSizeScore: 85,
        notes: "Wide network coverage, good claim settlement ratio",
        url: "#",
      },
      {
        id: "plan-2",
        provider: "HDFC Ergo",
        planName: "Optima Secure",
        sumInsured: 750000,
        basePremium: 15000,
        covers: ["Hospitalization", "Pre & Post Care", "Day Care", "Ambulance", "Maternity", "OPD", "Diabetes"],
        preExistingWaitYears: 3,
        coPayPct: 10,
        networkSizeScore: 90,
        notes: "Excellent claim process, restore benefit included",
        url: "#",
      },
      {
        id: "plan-3",
        provider: "ICICI Lombard",
        planName: "iHealth Plus",
        sumInsured: 500000,
        basePremium: 11000,
        covers: ["Hospitalization", "Pre & Post Care", "Day Care", "Ambulance", "Annual Health Check"],
        preExistingWaitYears: 2,
        coPayPct: 5,
        networkSizeScore: 80,
        notes: "Affordable premium with good coverage",
        url: "#",
      },
      {
        id: "plan-4",
        provider: "Max Bupa",
        planName: "Health Companion",
        sumInsured: 1000000,
        basePremium: 18000,
        covers: ["Hospitalization", "Pre & Post Care", "Day Care", "Ambulance", "Diabetes", "Hypertension", "Mental Health"],
        preExistingWaitYears: 2,
        coPayPct: 0,
        networkSizeScore: 75,
        notes: "High sum insured with comprehensive coverage",
        url: "#",
      },
      {
        id: "plan-5",
        provider: "Bajaj Allianz",
        planName: "Health Guard",
        sumInsured: 600000,
        basePremium: 13500,
        covers: ["Hospitalization", "Pre & Post Care", "Day Care", "Ambulance", "Diabetes", "Organ Donor"],
        preExistingWaitYears: 4,
        coPayPct: 15,
        networkSizeScore: 88,
        notes: "Large hospital network, higher co-pay",
        url: "#",
      },
      {
        id: "plan-6",
        provider: "Care Health",
        planName: "Care Supreme",
        sumInsured: 800000,
        basePremium: 16500,
        covers: ["Hospitalization", "Pre & Post Care", "Day Care", "Ambulance", "Diabetes", "Hypertension", "Air Ambulance"],
        preExistingWaitYears: 1,
        coPayPct: 0,
        networkSizeScore: 82,
        notes: "Shortest waiting period for pre-existing conditions",
        url: "#",
      },
      {
        id: "plan-7",
        provider: "Niva Bupa",
        planName: "Health Premia",
        sumInsured: 1500000,
        basePremium: 22000,
        covers: ["Hospitalization", "Pre & Post Care", "Day Care", "Ambulance", "Diabetes", "Hypertension", "OPD", "Wellness"],
        preExistingWaitYears: 2,
        coPayPct: 0,
        networkSizeScore: 78,
        notes: "Premium plan with OPD and wellness benefits",
        url: "#",
      },
      {
        id: "plan-8",
        provider: "Aditya Birla",
        planName: "Activ Health Platinum",
        sumInsured: 2000000,
        basePremium: 28000,
        covers: ["Hospitalization", "Pre & Post Care", "Day Care", "Ambulance", "Diabetes", "Hypertension", "Chronic Care", "Global Cover"],
        preExistingWaitYears: 2,
        coPayPct: 0,
        networkSizeScore: 85,
        notes: "Top-tier coverage with chronic disease management",
        url: "#",
      },
    ];
  }

  async createSession(): Promise<ReportSession> {
    const id = randomUUID();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    const session: ReportSession = {
      id,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };
    
    this.sessions.set(id, session);
    return session;
  }

  async getSession(id: string): Promise<ReportSession | undefined> {
    const session = this.sessions.get(id);
    if (!session) return undefined;
    
    if (new Date(session.expiresAt) < new Date()) {
      this.sessions.delete(id);
      return undefined;
    }
    
    return session;
  }

  async updateSession(id: string, data: Partial<ReportSession>): Promise<ReportSession | undefined> {
    const session = await this.getSession(id);
    if (!session) return undefined;
    
    const updated = { ...session, ...data };
    this.sessions.set(id, updated);
    return updated;
  }

  async deleteSession(id: string): Promise<boolean> {
    return this.sessions.delete(id);
  }

  async getInsurancePlans(): Promise<InsurancePlan[]> {
    return this.insurancePlans;
  }
}

export const storage = new MemStorage();
