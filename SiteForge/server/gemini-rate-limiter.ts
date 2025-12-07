/**
 * Rate limiter for Google Gemini API
 * Prevents quota exhaustion from free tier
 */

interface RateLimitState {
  lastRequestTime: number;
  requestCount: number;
  resetTime: number;
}

const rateLimitState: RateLimitState = {
  lastRequestTime: 0,
  requestCount: 0,
  resetTime: Date.now() + 60000, // Reset every 60 seconds
};

const MIN_DELAY_MS = 2000; // 2 second minimum delay between requests
const MAX_REQUESTS_PER_MINUTE = 30; // Be conservative: free tier is 60/min

export async function checkRateLimit(): Promise<void> {
  const now = Date.now();

  // Reset counter if minute has passed
  if (now > rateLimitState.resetTime) {
    rateLimitState.requestCount = 0;
    rateLimitState.resetTime = now + 60000;
  }

  // Check if we've exceeded max requests
  if (rateLimitState.requestCount >= MAX_REQUESTS_PER_MINUTE) {
    const secondsUntilReset = Math.ceil((rateLimitState.resetTime - now) / 1000);
    throw new Error(
      `API rate limit reached. Please wait ${secondsUntilReset} seconds before trying again. ` +
      `This helps prevent quota exhaustion on the free tier (60 requests/minute limit).`
    );
  }

  // Enforce minimum delay between requests
  const timeSinceLastRequest = now - rateLimitState.lastRequestTime;
  if (timeSinceLastRequest < MIN_DELAY_MS) {
    const delayMs = MIN_DELAY_MS - timeSinceLastRequest;
    console.log(`Rate limiting: waiting ${delayMs}ms before next request`);
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }

  // Update state
  rateLimitState.lastRequestTime = Date.now();
  rateLimitState.requestCount++;
}

export function getQuotaWarning(): string {
  const secondsUntilReset = Math.ceil((rateLimitState.resetTime - Date.now()) / 1000);
  return `[${rateLimitState.requestCount}/${MAX_REQUESTS_PER_MINUTE} requests used] ` +
         `Resets in ${secondsUntilReset}s`;
}
