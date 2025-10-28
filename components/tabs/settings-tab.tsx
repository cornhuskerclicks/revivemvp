"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle, AlertCircle, Loader2, Send } from "lucide-react"
import { useRouter } from "next/navigation"
import A2PRegistration from "@/components/a2p-registration"

interface SettingsTabProps {
  twilioAccount: any
  userId: string
}

export default function SettingsTab({ twilioAccount, userId }: SettingsTabProps) {
  const router = useRouter()
  const [accountSid, setAccountSid] = useState(twilioAccount?.account_sid || "")
  const [authToken, setAuthToken] = useState("")
  const [phoneNumber, setPhoneNumber] = useState(twilioAccount?.phone_number || "")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [testPhone, setTestPhone] = useState("")
  const [isSendingTest, setIsSendingTest] = useState(false)
  const [testError, setTestError] = useState<string | null>(null)
  const [testSuccess, setTestSuccess] = useState(false)

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch("/api/twilio/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountSid, authToken, phoneNumber }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to connect Twilio")
      }

      setSuccess(true)
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSendingTest(true)
    setTestError(null)
    setTestSuccess(false)

    try {
      // Create a test campaign ID (you can modify this to use a real campaign)
      const testCampaignId = "00000000-0000-0000-0000-000000000000"

      const response = await fetch("/api/twilio/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: testCampaignId,
          messageBody: "Test message from RE:VIVE by Aether. Your Twilio integration is working! 🎉",
          contacts: [{ phone_number: testPhone }],
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to send test SMS")
      }

      setTestSuccess(true)
      setTestPhone("")
    } catch (err: any) {
      setTestError(err.message)
    } finally {
      setIsSendingTest(false)
    }
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <A2PRegistration userId={userId} />

      <div className="border-t border-white/10 pt-8">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Twilio Connection (Legacy)</h2>
          <p className="text-white-secondary">
            Or connect your existing Twilio account manually (not recommended for new users)
          </p>
        </div>

        <div className="p-6 rounded-xl glass glass-border">
          {twilioAccount?.is_verified ? (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-green-500/10 border border-green-500/20 mb-6">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <div>
                <p className="text-green-400 font-semibold">Twilio Connected</p>
                <p className="text-sm text-white-secondary">Account SID: {twilioAccount.account_sid}</p>
                {twilioAccount.phone_number && (
                  <p className="text-sm text-white-secondary">Phone: {twilioAccount.phone_number}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20 mb-6">
              <AlertCircle className="h-5 w-5 text-yellow-400" />
              <div>
                <p className="text-yellow-400 font-semibold">No Twilio Account Connected</p>
                <p className="text-sm text-white-secondary">Enter your credentials below to get started</p>
              </div>
            </div>
          )}

          <form onSubmit={handleConnect} className="space-y-4">
            <div>
              <Label htmlFor="accountSid" className="text-white">
                Account SID
              </Label>
              <Input
                id="accountSid"
                type="text"
                placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                value={accountSid}
                onChange={(e) => setAccountSid(e.target.value)}
                required
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
              />
              <p className="text-xs text-white-secondary mt-1">Find this in your Twilio Console dashboard</p>
            </div>

            <div>
              <Label htmlFor="authToken" className="text-white">
                Auth Token
              </Label>
              <Input
                id="authToken"
                type="password"
                placeholder="••••••••••••••••••••••••••••••••"
                value={authToken}
                onChange={(e) => setAuthToken(e.target.value)}
                required
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
              />
              <p className="text-xs text-white-secondary mt-1">Your Twilio Auth Token (kept secure)</p>
            </div>

            <div>
              <Label htmlFor="phoneNumber" className="text-white">
                Twilio Phone Number (Optional)
              </Label>
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="+1234567890"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
              />
              <p className="text-xs text-white-secondary mt-1">Your Twilio phone number for sending SMS</p>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {success && (
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <p className="text-sm text-green-400">Twilio account connected successfully!</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-aether to-aether/80 text-white hover:shadow-[0_0_30px_rgba(8,159,239,0.4)]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Connect Twilio Account"
              )}
            </Button>
          </form>
        </div>

        {twilioAccount?.is_verified && (
          <div className="p-6 rounded-xl glass glass-border">
            <h3 className="text-lg font-semibold text-white mb-2">Send Test SMS</h3>
            <p className="text-white-secondary mb-4">
              Verify your Twilio integration is working by sending a test message to your phone.
            </p>

            <form onSubmit={handleSendTest} className="space-y-4">
              <div>
                <Label htmlFor="testPhone" className="text-white">
                  Phone Number
                </Label>
                <Input
                  id="testPhone"
                  type="tel"
                  placeholder="+1234567890"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  required
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                />
                <p className="text-xs text-white-secondary mt-1">Include country code (e.g., +1 for US)</p>
              </div>

              {testError && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-sm text-red-400">{testError}</p>
                </div>
              )}

              {testSuccess && (
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <p className="text-sm text-green-400">Test SMS sent successfully! Check your phone.</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={isSendingTest}
                className="w-full bg-gradient-to-r from-aether to-aether/80 text-white hover:shadow-[0_0_30px_rgba(8,159,239,0.4)]"
              >
                {isSendingTest ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Test SMS
                  </>
                )}
              </Button>
            </form>
          </div>
        )}

        <div className="p-6 rounded-xl glass glass-border">
          <h3 className="text-lg font-semibold text-white mb-2">Need a Twilio Account?</h3>
          <p className="text-white-secondary mb-4">
            Sign up for Twilio to get your Account SID and Auth Token. New accounts get free trial credits.
          </p>
          <Button variant="outline" asChild className="border-white/10 text-white hover:bg-white/5 bg-transparent">
            <a href="https://www.twilio.com/try-twilio" target="_blank" rel="noopener noreferrer">
              Sign Up for Twilio
            </a>
          </Button>
        </div>

        <div className="p-6 rounded-xl glass glass-border">
          <h3 className="text-lg font-semibold text-white mb-2">Webhook Setup</h3>
          <p className="text-white-secondary mb-4">
            To receive replies and delivery updates, configure your Twilio webhook URL:
          </p>
          <div className="p-3 rounded-lg bg-white/5 border border-white/10 mb-4">
            <code className="text-sm text-aether break-all">https://www.aetherrevive.com/api/twilio/webhook</code>
          </div>
          <p className="text-xs text-white-secondary mb-4">
            Go to Twilio Console → Phone Numbers → Manage → Active Numbers → Select your number → Messaging Webhook
          </p>
          <Button variant="outline" asChild className="border-white/10 text-white hover:bg-white/5 bg-transparent">
            <a
              href="https://console.twilio.com/us1/develop/phone-numbers/manage/incoming"
              target="_blank"
              rel="noopener noreferrer"
            >
              Open Twilio Console
            </a>
          </Button>
        </div>
      </div>
    </div>
  )
}
