// Rate limiting middleware for auth endpoints
import { NextResponse } from "next/server"
import { rateLimit, getClientIp } from "@/lib/rate-limit"

const limiter = rateLimit({
  maxRequests: 5,
  windowMs: 60000, // 1 minute
})

export async function POST(request: Request) {
  const ip = getClientIp(request)
  const { success, remaining, resetTime } = limiter.check(ip)

  if (!success) {
    return NextResponse.json(
      {
        error: "Too many requests. Please try again later.",
        resetTime: new Date(resetTime).toISOString(),
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": "5",
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": resetTime.toString(),
        },
      },
    )
  }

  return NextResponse.json(
    { success: true },
    {
      headers: {
        "X-RateLimit-Limit": "5",
        "X-RateLimit-Remaining": remaining.toString(),
        "X-RateLimit-Reset": resetTime.toString(),
      },
    },
  )
}
