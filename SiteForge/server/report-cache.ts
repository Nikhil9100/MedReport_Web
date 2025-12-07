/**
 * Medical Report Cache
 * Stores analyzed reports to avoid re-querying the API
 */

import crypto from "crypto";
import type { MedicalReport, HealthSummary } from "@shared/schema";

interface CachedReport {
  fileHash: string;
  medicalReport: MedicalReport;
  healthSummary: HealthSummary;
  timestamp: number;
  fileName: string;
}

const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
const reportCache = new Map<string, CachedReport>();

/**
 * Generate a hash of the file content
 */
export function generateFileHash(fileData: string): string {
  return crypto.createHash("sha256").update(fileData).digest("hex");
}

/**
 * Store analyzed report in cache
 */
export function cacheReport(
  fileData: string,
  fileName: string,
  medicalReport: MedicalReport,
  healthSummary: HealthSummary
): void {
  const fileHash = generateFileHash(fileData);
  
  reportCache.set(fileHash, {
    fileHash,
    medicalReport,
    healthSummary,
    timestamp: Date.now(),
    fileName,
  });

  console.log(`📦 Cached report: ${fileName} (hash: ${fileHash.substring(0, 8)}...)`);
}

/**
 * Retrieve cached report if it exists and is fresh
 */
export function getCachedReport(fileData: string): CachedReport | null {
  const fileHash = generateFileHash(fileData);
  const cached = reportCache.get(fileHash);

  if (!cached) {
    return null;
  }

  // Check if cache is still valid (24 hours)
  const age = Date.now() - cached.timestamp;
  if (age > CACHE_DURATION_MS) {
    reportCache.delete(fileHash);
    console.log(`🗑️ Cache expired for: ${cached.fileName}`);
    return null;
  }

  console.log(`✅ Using cached report: ${cached.fileName}`);
  return cached;
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  size: number;
  entries: Array<{ fileName: string; age: string; hash: string }>;
} {
  const entries = Array.from(reportCache.values()).map(entry => ({
    fileName: entry.fileName,
    age: formatAge(Date.now() - entry.timestamp),
    hash: entry.fileHash.substring(0, 8) + "...",
  }));

  return {
    size: reportCache.size,
    entries,
  };
}

function formatAge(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return `${seconds}s ago`;
}

/**
 * Clear entire cache
 */
export function clearCache(): void {
  reportCache.clear();
  console.log("🗑️ Cache cleared");
}
