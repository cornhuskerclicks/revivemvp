"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle, AlertCircle, Loader2, Send, CreditCard, TrendingUp, Phone } from "lucide-react"
import { useRouter } from "next/navigation"
import A2PRegistration from "@/components/a2p-registration"
import { createClient } from "@/lib/supabase/client"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"

interface SettingsTabProps {
  twilioAccount: any
  userId: string
}

export default function SettingsTab({ twilioAccount, userId }: SettingsTabProps) {
  const router = useRouter()
  const { toast } = useToast()
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

  const [billing, setBilling] = useState<any>(null)
  const [plans, setPlans] = useState<any[]>([])
  const [isLoadingBilling, setIsLoadingBilling] = useState(true)
  const [isUpgrading, setIsUpgrading] = useState(false)

  const [a2pStatus, setA2pStatus] = useState<any>(null)
  const [isLoadingA2P, setIsLoadingA2P] = useState(true)

  useEffect(() => {
    fetchBillingData()
    fetchPlans()
    fetchA2PStatus()
  }, [])

  const fetchA2PStatus = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("a2p_registrations")
        .select("*, twilio_accounts(*)")
        .eq("user_id", userId)
        .single()

      if (error && error.code !== "PGRST116") {
        console.error("[v0] Error fetching A2P status:", error)
      }

      setA2pStatus(data)
    } catch (err) {
      console.error("[v0] Error fetching A2P status:", err)
    } finally {
      setIsLoadingA2P(false)
    }
  }

  const fetchBillingData = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("user_billing")
        .select("*, billing_plans(*)")
        .eq("user_id", userId)
        .eq("status", "active")
        .single()

      if (error && error.code !== "PGRST116") {
        console.error("[v0] Error fetching billing:", error)
      }

      setBilling(data)
    } catch (err) {
      console.error("[v0] Error fetching billing data:", err)
    } finally {
      setIsLoadingBilling(false)
    }
  }

  const fetchPlans = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.from("billing_plans").select("*").order("monthly_fee", { ascending: true })

      if (error) {
        console.error("[v0] Error fetching plans:", error)
        return
      }

      setPlans(data || [])
    } catch (err) {
      console.error("[v0] Error fetching plans:", err)
    }
  }

  const handleUpgrade = async (planId: string) => {
    setIsUpgrading(true)
    try {
      const response = await fetch("/api/billing/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan_id: planId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session")
      }

      // Redirect to Stripe checkout
      window.location.href = data.url
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setIsUpgrading(false)
    }
  }

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
      const testCampaignId = "00000000-0000-0000-0000-000000000000"

      const response = await fetch("/api/twilio/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: testCampaignId,
          messageBody: "Test message from RE:VIVE by Aether. Your Twilio integration is working!",
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

  const creditPercentage = billing?.billing_plans?.monthly_credits
    ? (billing.credits_remaining / billing.billing_plans.monthly_credits) * 100
    : 0

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="h-6 w-6 text-aether" />
          <h2 className="text-2xl font-bold text-white">Billing & Credits</h2>
        </div>
        <p className="text-white-secondary mb-6">Manage your subscription plan and SMS credits</p>

        {isLoadingBilling ? (
          <div className="p-6 rounded-xl glass glass-border flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-aether" />
          </div>
        ) : billing ? (
          <div className="space-y-4">
            {/* Current Plan Card */}
            <div className="p-6 rounded-xl glass glass-border">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">{billing.billing_plans?.name} Plan</h3>
                  <p className="text-2xl font-bold text-aether mt-1">${billing.billing_plans?.monthly_fee}/mo</p>
                </div>
                <div className="px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                  <span className="text-sm text-green-400 font-semibold">Active</span>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-white-secondary">SMS Credits Remaining</span>
                    <span className="text-sm font-semibold text-white">
                      {billing.credits_remaining.toLocaleString()} /{" "}
                      {billing.billing_plans?.monthly_credits.toLocaleString()}
                    </span>
                  </div>
                  <Progress value={creditPercentage} className="h-2" />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/10">
                  <span className="text-sm text-white-secondary">Next Renewal</span>
                  <span className="text-sm font-semibold text-white">
                    {new Date(billing.renew_date).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-white-secondary">Max Contacts</span>
                  <span className="text-sm font-semibold text-white">
                    {billing.billing_plans?.max_contacts.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Low Credits Warning */}
            {creditPercentage < 20 && (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0" />
                <div>
                  <p className="text-yellow-400 font-semibold">Low Credits</p>
                  <p className="text-sm text-white-secondary">
                    You're running low on SMS credits. Consider upgrading your plan.
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-6 rounded-xl glass glass-border">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20 mb-6">
              <AlertCircle className="h-5 w-5 text-yellow-400" />
              <div>
                <p className="text-yellow-400 font-semibold">No Active Subscription</p>
                <p className="text-sm text-white-secondary">Choose a plan below to start sending SMS campaigns</p>
              </div>
            </div>
          </div>
        )}

        {/* Available Plans */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-aether" />
            {billing ? "Upgrade Your Plan" : "Choose Your Plan"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`p-6 rounded-xl glass glass-border ${
                  billing?.plan_id === plan.id ? "ring-2 ring-aether" : ""
                }`}
              >
                <h4 className="text-xl font-bold text-white mb-2">{plan.name}</h4>
                <p className="text-3xl font-bold text-aether mb-4">
                  {plan.monthly_fee > 0 ? `$${plan.monthly_fee}/mo` : "Custom"}
                </p>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center gap-2 text-sm text-white-secondary">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    {plan.max_contacts.toLocaleString()} contacts
                  </li>
                  <li className="flex items-center gap-2 text-sm text-white-secondary">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    {plan.monthly_credits.toLocaleString()} SMS credits/mo
                  </li>
                </ul>
                {billing?.plan_id === plan.id ? (
                  <Button disabled className="w-full bg-white/10 text-white">
                    Current Plan
                  </Button>
                ) : plan.name === "Enterprise" ? (
                  <Button
                    variant="outline"
                    className="w-full border-white/10 text-white hover:bg-white/5 bg-transparent"
                    asChild
                  >
                    <a href="mailto:sales@aetherrevive.com">Contact Sales</a>
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={isUpgrading}
                    className="w-full bg-gradient-to-r from-aether to-aether/80 text-white hover:shadow-[0_0_30px_rgba(8,159,239,0.4)]"
                  >
                    {isUpgrading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : billing ? (
                      "Upgrade"
                    ) : (
                      "Select Plan"
                    )}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-4">
          <Phone className="h-6 w-6 text-aether" />
          <h2 className="text-2xl font-bold text-white">SMS Connection</h2>
        </div>
        <p className="text-white-secondary mb-6">
          Your Twilio subaccount is automatically created and managed for compliant A2P messaging
        </p>

        {isLoadingA2P ? (
          <div className="p-6 rounded-xl glass glass-border flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-aether" />
          </div>
        ) : a2pStatus ? (
          <div className="p-6 rounded-xl glass glass-border">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-green-500/10 border border-green-500/20 mb-4">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <div>
                <p className="text-green-400 font-semibold">Automated Connection Active</p>
                <p className="text-sm text-white-secondary">Your Twilio subaccount is ready for SMS campaigns</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
                <span className="text-white-secondary">Status</span>
                <span className="text-white font-medium capitalize">{a2pStatus.status.replace("_", " ")}</span>
              </div>
              {a2pStatus.subaccount_sid && (
                <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
                  <span className="text-white-secondary">Subaccount SID</span>
                  <span className="text-white font-mono text-sm">{a2pStatus.subaccount_sid}</span>
                </div>
              )}
              {a2pStatus.brand_id && (
                <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
                  <span className="text-white-secondary">Brand Registered</span>
                  <CheckCircle className="h-5 w-5 text-green-400" />
                </div>
              )}
              {a2pStatus.campaign_id && (
                <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
                  <span className="text-white-secondary">Campaign Registered</span>
                  <CheckCircle className="h-5 w-5 text-green-400" />
                </div>
              )}
              {a2pStatus.phone_number && (
                <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
                  <span className="text-white-secondary">Phone Number</span>
                  <span className="text-white font-medium">{a2pStatus.phone_number}</span>
                </div>
              )}
            </div>

            <div className="mt-4 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <p className="text-sm text-blue-400 font-medium mb-1">ISV Model Active</p>
              <p className="text-xs text-white-secondary">
                All billing is routed through RE:VIVE's master account. Your usage is tracked per subaccount for
                accurate billing.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-xl glass glass-border">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20 mb-4">
              <AlertCircle className="h-5 w-5 text-yellow-400" />
              <div>
                <p className="text-yellow-400 font-semibold">No SMS Connection</p>
                <p className="text-sm text-white-secondary">Complete A2P registration below to start sending SMS</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <A2PRegistration userId={userId} />

      <div className="border-t border-white/10 pt-8">
        <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20 mb-6">
          <p className="text-yellow-400 font-semibold mb-1">Legacy Connection (Deprecated)</p>
          <p className="text-sm text-white-secondary">
            Manual Twilio connection is deprecated. New users should use the automated A2P registration above for
            compliant messaging.
          </p>
        </div>

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
