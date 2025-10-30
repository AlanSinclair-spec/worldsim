/**
 * Rate Limiting Utilities for WorldSim API Routes
 *
 * Provides simple in-memory rate limiting to prevent abuse and DoS attacks.
 * Uses IP address as the identifier for tracking requests.
 *
 * SECURITY NOTES:
 * - This is a basic implementation suitable for single-instance deployments
 * - For distributed systems, use Redis or a similar solution
 * - On Vercel, each serverless function has its own memory, so limits are per-instance
 * - For production, consider Vercel's Edge Middleware or Upstash Rate Limiting
 */

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

/**
 * In-memory store for rate limit tracking
 * Key: IP address
 * Value: { count, resetTime }
 */
const rateLimitStore = new Map<string, RateLimitRecord>();

/**
 * Clean up expired entries periodically to prevent memory leaks
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [ip, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(ip);
    }
  }
}

// Run cleanup every 5 minutes
if (typeof window === 'undefined') {
  // Only run on server-side
  setInterval(cleanupExpiredEntries, 5 * 60 * 1000);
}

/**
 * Rate limit configuration for different API endpoints
 */
export const RATE_LIMITS = {
  /** Simulation endpoints (computationally expensive) */
  simulation: {
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute
    message: 'Too many simulation requests. Please try again in a minute.',
  },
  /** Data ingestion endpoint (database writes) */
  ingest: {
    maxRequests: 20,
    windowMs: 60 * 1000, // 1 minute
    message: 'Too many upload requests. Please try again in a minute.',
  },
  /** Explanation endpoint (AI API calls) */
  explain: {
    maxRequests: 30,
    windowMs: 60 * 1000, // 1 minute
    message: 'Too many explanation requests. Please try again in a minute.',
  },
  /** General API endpoints */
  general: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
    message: 'Too many requests. Please try again in a minute.',
  },
} as const;

/**
 * Extract client IP address from Next.js request
 *
 * Checks multiple headers to handle various proxy configurations:
 * - x-forwarded-for (Vercel, most proxies)
 * - x-real-ip (Nginx)
 * - cf-connecting-ip (Cloudflare)
 *
 * @param req - Next.js request object
 * @returns IP address or 'unknown' if not found
 */
export function getClientIP(req: Request): string {
  // Check x-forwarded-for header (standard proxy header)
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // Take the first IP in the chain
    return forwardedFor.split(',')[0].trim();
  }

  // Check x-real-ip header (Nginx)
  const realIP = req.headers.get('x-real-ip');
  if (realIP) {
    return realIP.trim();
  }

  // Check cf-connecting-ip (Cloudflare)
  const cfIP = req.headers.get('cf-connecting-ip');
  if (cfIP) {
    return cfIP.trim();
  }

  // Fallback
  return 'unknown';
}

/**
 * Check if a request should be rate limited
 *
 * @param ip - Client IP address
 * @param limit - Rate limit configuration
 * @returns Object with { allowed: boolean, remaining: number, resetTime: number }
 *
 * @example
 * const result = checkRateLimit(clientIP, RATE_LIMITS.simulation);
 * if (!result.allowed) {
 *   return NextResponse.json(
 *     { success: false, error: 'Rate limit exceeded' },
 *     { status: 429, headers: { 'Retry-After': String(Math.ceil((result.resetTime - Date.now()) / 1000)) } }
 *   );
 * }
 */
export function checkRateLimit(
  ip: string,
  limit: (typeof RATE_LIMITS)[keyof typeof RATE_LIMITS]
): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  message?: string;
} {
  const now = Date.now();
  const record = rateLimitStore.get(ip);

  // No existing record - allow and create new entry
  if (!record) {
    rateLimitStore.set(ip, {
      count: 1,
      resetTime: now + limit.windowMs,
    });

    return {
      allowed: true,
      remaining: limit.maxRequests - 1,
      resetTime: now + limit.windowMs,
    };
  }

  // Existing record but window expired - reset counter
  if (now > record.resetTime) {
    rateLimitStore.set(ip, {
      count: 1,
      resetTime: now + limit.windowMs,
    });

    return {
      allowed: true,
      remaining: limit.maxRequests - 1,
      resetTime: now + limit.windowMs,
    };
  }

  // Within window - check if under limit
  if (record.count < limit.maxRequests) {
    record.count++;

    return {
      allowed: true,
      remaining: limit.maxRequests - record.count,
      resetTime: record.resetTime,
    };
  }

  // Rate limit exceeded
  return {
    allowed: false,
    remaining: 0,
    resetTime: record.resetTime,
    message: limit.message,
  };
}

/**
 * Middleware-style rate limiter for Next.js API routes
 *
 * @param req - Next.js request object
 * @param limitType - Type of rate limit to apply
 * @returns NextResponse with 429 status if rate limited, or null if allowed
 *
 * @example
 * export async function POST(req: NextRequest) {
 *   const rateLimitResponse = applyRateLimit(req, 'simulation');
 *   if (rateLimitResponse) {
 *     return rateLimitResponse;
 *   }
 *
 *   // Continue with normal request handling
 *   // ...
 * }
 */
export function applyRateLimit(
  req: Request,
  limitType: keyof typeof RATE_LIMITS
): Response | null {
  const ip = getClientIP(req);
  const limit = RATE_LIMITS[limitType];
  const result = checkRateLimit(ip, limit);

  if (!result.allowed) {
    const retryAfterSeconds = Math.ceil((result.resetTime - Date.now()) / 1000);

    console.warn(
      `[${new Date().toISOString()}] [RateLimit] ⚠️ Rate limit exceeded for IP ${ip} on ${limitType} endpoint`
    );

    return new Response(
      JSON.stringify({
        success: false,
        error: result.message || 'Rate limit exceeded',
        retryAfter: retryAfterSeconds,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(retryAfterSeconds),
          'X-RateLimit-Limit': String(limit.maxRequests),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(result.resetTime / 1000)),
        },
      }
    );
  }

  console.log(
    `[${new Date().toISOString()}] [RateLimit] ✅ Request allowed for IP ${ip} on ${limitType} endpoint (${result.remaining} remaining)`
  );

  return null;
}
