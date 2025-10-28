// Rate limiting utility for API routes
// Prevents brute force attacks on authentication endpoints

type RateLimitStore = Map<string, { count: number; resetTime: number }>

const rateLimitStore: RateLimitStore = new Map()

interface RateLimitConfig {
  maxRequests: number
  windowMs: number
}

export function rateLimit(config: RateLimitConfig = { maxRequests: 5, windowMs: 60000 }) {
  return {
    check: (identifier: string): { success: boolean; remaining: number; resetTime: number } => {
      const now = Date.now()
      const record = rateLimitStore.get(identifier)

      // Clean up expired entries
      if (record && now > record.resetTime) {
        rateLimitStore.delete(identifier)
      }

      const currentRecord = rateLimitStore.get(identifier)

      if (!currentRecord) {
        // First request
        const resetTime = now + config.windowMs
        rateLimitStore.set(identifier, { count: 1, resetTime })
        return { success: true, remaining: config.maxRequests - 1, resetTime }
      }

      if (currentRecord.count >= config.maxRequests) {
        // Rate limit exceeded
        return { success: false, remaining: 0, resetTime: currentRecord.resetTime }
      }

      // Increment count
      currentRecord.count++
      rateLimitStore.set(identifier, currentRecord)
      return { success: true, remaining: config.maxRequests - currentRecord.count, resetTime: currentRecord.resetTime }
    },
  }
}

// Helper to get client IP from request
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")
  const realIp = request.headers.get("x-real-ip")

  if (forwarded) {
    return forwarded.split(",")[0].trim()
  }

  if (realIp) {
    return realIp
  }

  return "unknown"
}
