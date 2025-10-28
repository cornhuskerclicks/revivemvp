"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { validatePassword } from "@/lib/password-validation"

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [passwordErrors, setPasswordErrors] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const router = useRouter()

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value
    setPassword(newPassword)

    if (newPassword) {
      const validation = validatePassword(newPassword)
      setPasswordErrors(validation.errors)
    } else {
      setPasswordErrors([])
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()

    const validation = validatePassword(password)
    if (!validation.isValid) {
      setError(validation.errors.join(". "))
      return
    }

    try {
      const rateLimitResponse = await fetch("/api/auth/rate-limit", {
        method: "POST",
      })

      if (!rateLimitResponse.ok) {
        const data = await rateLimitResponse.json()
        setError(data.error || "Too many requests. Please try again later.")
        return
      }
    } catch (err) {
      console.error("[v0] Rate limit check failed:", err)
    }

    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo:
            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
            (process.env.NEXT_PUBLIC_APP_URL
              ? `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
              : "https://revive.aetherai.app/dashboard"),
          data: {
            full_name: fullName,
          },
        },
      })
      if (error) throw error
      router.push("/auth/check-email")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    const supabase = createClient()
    setIsGoogleLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: process.env.NEXT_PUBLIC_APP_URL
            ? `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`
            : "https://revive.aetherai.app/auth/callback",
        },
      })
      if (error) throw error
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
      setIsGoogleLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 bg-black">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="h-8 w-8 rounded-lg bg-[#089FEF]" />
            <span className="text-xl font-bold text-white">RE:VIVE</span>
          </div>
          <Card className="bg-black/40 backdrop-blur-xl border-white/10">
            <CardHeader>
              <CardTitle className="text-2xl text-white">Create an account</CardTitle>
              <CardDescription className="text-white/70">Get started with RE:VIVE by Aether</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignUp}>
                <div className="flex flex-col gap-6">
                  <Button
                    type="button"
                    variant="outline"
                    style={{
                      backgroundColor: "#FFFFFF",
                      color: "#000000",
                      opacity: 1,
                      visibility: "visible",
                    }}
                    className="w-full hover:bg-white/90 border-white/20 font-medium bg-transparent"
                    onClick={handleGoogleSignUp}
                    disabled={isGoogleLoading || isLoading}
                  >
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    {isGoogleLoading ? "Connecting..." : "Continue with Google"}
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-white/10" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-black px-2 text-white/50">Or continue with email</span>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="fullName" className="text-white">
                      Full Name
                    </Label>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="John Doe"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email" className="text-white">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password" className="text-white">
                      Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={handlePasswordChange}
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                    />
                    {passwordErrors.length > 0 && (
                      <ul className="text-xs text-red-400 space-y-1">
                        {passwordErrors.map((err, idx) => (
                          <li key={idx}>• {err}</li>
                        ))}
                      </ul>
                    )}
                    {password && passwordErrors.length === 0 && (
                      <p className="text-xs text-green-400">✓ Password meets requirements</p>
                    )}
                  </div>
                  {error && <p className="text-sm text-red-400">{error}</p>}
                  <Button
                    type="submit"
                    className="w-full bg-[#089FEF] hover:bg-[#089FEF]/90 text-white"
                    disabled={isLoading || isGoogleLoading}
                  >
                    {isLoading ? "Creating account..." : "Sign Up"}
                  </Button>
                </div>
                <div className="mt-4 text-center text-sm text-white/70">
                  Already have an account?{" "}
                  <Link
                    href="/auth/login"
                    className="underline underline-offset-4 text-[#089FEF] hover:text-[#089FEF]/80"
                  >
                    Sign in
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
