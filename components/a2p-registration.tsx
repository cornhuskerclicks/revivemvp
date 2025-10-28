"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle, Loader2, Phone, Building2, FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"

interface A2PRegistrationProps {
  userId: string
}

export default function A2PRegistration({ userId }: A2PRegistrationProps) {
  const { toast } = useToast()
  const supabase = createClient()

  const [registration, setRegistration] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentStep, setCurrentStep] = useState(1)

  // Step 1: Brand Registration
  const [companyName, setCompanyName] = useState("")
  const [ein, setEin] = useState("")
  const [vertical, setVertical] = useState("")
  const [contactName, setContactName] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [isRegisteringBrand, setIsRegisteringBrand] = useState(false)

  // Step 2: Campaign Registration
  const [campaignName, setCampaignName] = useState("")
  const [useCase, setUseCase] = useState("")
  const [isRegisteringCampaign, setIsRegisteringCampaign] = useState(false)

  // Step 3: Buy Number
  const [areaCode, setAreaCode] = useState("402")
  const [countryCode, setCountryCode] = useState("US")
  const [isBuyingNumber, setIsBuyingNumber] = useState(false)

  useEffect(() => {
    fetchRegistration()
  }, [])

  const fetchRegistration = async () => {
    try {
      const { data, error } = await supabase.from("a2p_registrations").select("*").eq("user_id", userId).single()

      if (error && error.code !== "PGRST116") {
        throw error
      }

      if (data) {
        setRegistration(data)
        if (data.status === "number_assigned" || data.status === "active") {
          setCurrentStep(4)
        } else if (data.status === "campaign_registered") {
          setCurrentStep(3)
        } else if (data.status === "brand_registered") {
          setCurrentStep(2)
        }
      }
    } catch (err: any) {
      console.error("[v0] Error fetching registration:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegisterBrand = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsRegisteringBrand(true)

    try {
      const response = await fetch("/api/twilio/a2p/register-brand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: companyName,
          ein,
          vertical,
          contact_name: contactName,
          contact_email: contactEmail,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to register brand")
      }

      toast({
        title: "Brand Registered",
        description: "Your business brand has been successfully registered with Twilio.",
      })

      setRegistration(data.registration)
      setCurrentStep(2)
    } catch (err: any) {
      toast({
        title: "Registration Failed",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setIsRegisteringBrand(false)
    }
  }

  const handleRegisterCampaign = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsRegisteringCampaign(true)

    try {
      const response = await fetch("/api/twilio/a2p/register-campaign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaign_name: campaignName,
          use_case: useCase,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to register campaign")
      }

      toast({
        title: "Campaign Registered",
        description: "Your A2P campaign has been successfully registered.",
      })

      setRegistration(data.registration)
      setCurrentStep(3)
    } catch (err: any) {
      toast({
        title: "Registration Failed",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setIsRegisteringCampaign(false)
    }
  }

  const handleBuyNumber = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsBuyingNumber(true)

    try {
      const response = await fetch("/api/twilio/a2p/buy-number", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          area_code: areaCode,
          country_code: countryCode,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to buy number")
      }

      toast({
        title: "Number Purchased",
        description: `Successfully purchased ${data.phone_number}${data.requires_a2p ? " (A2P compliant)" : ""}`,
      })

      setRegistration(data.registration)
      setCurrentStep(4)
    } catch (err: any) {
      toast({
        title: "Purchase Failed",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setIsBuyingNumber(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-aether" />
      </div>
    )
  }

  const steps = [
    { number: 1, title: "Register Brand", status: registration?.brand_id ? "complete" : "pending", icon: Building2 },
    {
      number: 2,
      title: "Register Campaign",
      status: registration?.campaign_id ? "complete" : "pending",
      icon: FileText,
    },
    { number: 3, title: "Buy Number", status: registration?.phone_number ? "complete" : "pending", icon: Phone },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">SMS Setup</h2>
        <p className="text-white-secondary">
          Complete these steps to start sending SMS. A2P registration is only required for US numbers.
        </p>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-between max-w-2xl">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  step.status === "complete"
                    ? "bg-green-500/20 border-green-500"
                    : currentStep === step.number
                      ? "bg-aether/20 border-aether"
                      : "bg-white/5 border-white/20"
                }`}
              >
                {step.status === "complete" ? (
                  <step.icon className="h-5 w-5 text-green-400" />
                ) : (
                  <span className="text-sm font-semibold text-white">{step.number}</span>
                )}
              </div>
              <p className="text-xs text-white-secondary mt-2 text-center">{step.title}</p>
            </div>
            {index < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 ${step.status === "complete" ? "bg-green-500" : "bg-white/10"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Register Brand */}
      {currentStep === 1 && (
        <div className="p-6 rounded-xl glass glass-border max-w-2xl">
          <h3 className="text-lg font-semibold text-white mb-4">Step 1: Register Your Brand</h3>
          <p className="text-white-secondary mb-6">
            Provide your business information to create a verified brand for A2P messaging.
          </p>

          <form onSubmit={handleRegisterBrand} className="space-y-4">
            <div>
              <Label htmlFor="companyName" className="text-white">
                Company Name
              </Label>
              <Input
                id="companyName"
                type="text"
                placeholder="Acme Inc."
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
              />
            </div>

            <div>
              <Label htmlFor="ein" className="text-white">
                EIN (Employer Identification Number)
              </Label>
              <Input
                id="ein"
                type="text"
                placeholder="12-3456789"
                value={ein}
                onChange={(e) => setEin(e.target.value)}
                required
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
              />
            </div>

            <div>
              <Label htmlFor="vertical" className="text-white">
                Business Vertical
              </Label>
              <Select value={vertical} onValueChange={setVertical} required>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Select your industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="REAL_ESTATE">Real Estate</SelectItem>
                  <SelectItem value="INSURANCE">Insurance</SelectItem>
                  <SelectItem value="PROFESSIONAL_SERVICES">Professional Services</SelectItem>
                  <SelectItem value="RETAIL">Retail</SelectItem>
                  <SelectItem value="HEALTHCARE">Healthcare</SelectItem>
                  <SelectItem value="TECHNOLOGY">Technology</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="contactName" className="text-white">
                Contact Name
              </Label>
              <Input
                id="contactName"
                type="text"
                placeholder="John Doe"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                required
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
              />
            </div>

            <div>
              <Label htmlFor="contactEmail" className="text-white">
                Contact Email
              </Label>
              <Input
                id="contactEmail"
                type="email"
                placeholder="john@acme.com"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                required
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
              />
            </div>

            <Button
              type="submit"
              disabled={isRegisteringBrand}
              className="w-full bg-gradient-to-r from-aether to-aether/80 text-white hover:shadow-[0_0_30px_rgba(8,159,239,0.4)]"
            >
              {isRegisteringBrand ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Registering Brand...
                </>
              ) : (
                "Register Brand"
              )}
            </Button>
          </form>
        </div>
      )}

      {/* Step 2: Register Campaign */}
      {currentStep === 2 && (
        <div className="p-6 rounded-xl glass glass-border max-w-2xl">
          <h3 className="text-lg font-semibold text-white mb-4">Step 2: Register Your Campaign</h3>
          <p className="text-white-secondary mb-6">
            Create an A2P campaign to define your messaging use case and get approved for sending.
          </p>

          <form onSubmit={handleRegisterCampaign} className="space-y-4">
            <div>
              <Label htmlFor="campaignName" className="text-white">
                Campaign Name
              </Label>
              <Input
                id="campaignName"
                type="text"
                placeholder="Lead Reactivation Campaign"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                required
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
              />
            </div>

            <div>
              <Label htmlFor="useCase" className="text-white">
                Use Case
              </Label>
              <Select value={useCase} onValueChange={setUseCase} required>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Select your use case" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LEAD_GENERATION">Lead Generation</SelectItem>
                  <SelectItem value="CUSTOMER_CARE">Customer Care</SelectItem>
                  <SelectItem value="ACCOUNT_NOTIFICATION">Account Notifications</SelectItem>
                  <SelectItem value="MARKETING">Marketing</SelectItem>
                  <SelectItem value="2FA">Two-Factor Authentication</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              type="submit"
              disabled={isRegisteringCampaign}
              className="w-full bg-gradient-to-r from-aether to-aether/80 text-white hover:shadow-[0_0_30px_rgba(8,159,239,0.4)]"
            >
              {isRegisteringCampaign ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Registering Campaign...
                </>
              ) : (
                "Register Campaign"
              )}
            </Button>
          </form>
        </div>
      )}

      {/* Step 3: Buy Number */}
      {currentStep === 3 && (
        <div className="p-6 rounded-xl glass glass-border max-w-2xl">
          <h3 className="text-lg font-semibold text-white mb-4">Step 3: Buy Phone Number</h3>
          <p className="text-white-secondary mb-6">
            Purchase a phone number to use for sending SMS messages. Choose your country and area code.
          </p>

          <form onSubmit={handleBuyNumber} className="space-y-4">
            <div>
              <Label htmlFor="countryCode" className="text-white">
                Country
              </Label>
              <Select value={countryCode} onValueChange={setCountryCode} required>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="US">🇺🇸 United States (Requires A2P)</SelectItem>
                  <SelectItem value="GB">🇬🇧 United Kingdom</SelectItem>
                  <SelectItem value="CA">🇨🇦 Canada</SelectItem>
                  <SelectItem value="AU">🇦🇺 Australia</SelectItem>
                  <SelectItem value="DE">🇩🇪 Germany</SelectItem>
                  <SelectItem value="FR">🇫🇷 France</SelectItem>
                  <SelectItem value="ES">🇪🇸 Spain</SelectItem>
                  <SelectItem value="IT">🇮🇹 Italy</SelectItem>
                </SelectContent>
              </Select>
              {countryCode !== "US" && (
                <p className="text-xs text-green-400 mt-1">✓ No A2P registration required for this country</p>
              )}
            </div>

            {countryCode === "US" && (
              <div>
                <Label htmlFor="areaCode" className="text-white">
                  Area Code
                </Label>
                <Input
                  id="areaCode"
                  type="text"
                  placeholder="402"
                  value={areaCode}
                  onChange={(e) => setAreaCode(e.target.value)}
                  required
                  maxLength={3}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                />
                <p className="text-xs text-white-secondary mt-1">Enter a 3-digit US area code</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={isBuyingNumber}
              className="w-full bg-gradient-to-r from-aether to-aether/80 text-white hover:shadow-[0_0_30px_rgba(8,159,239,0.4)]"
            >
              {isBuyingNumber ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Purchasing Number...
                </>
              ) : (
                "Buy Number"
              )}
            </Button>
          </form>
        </div>
      )}

      {/* Step 4: Complete */}
      {currentStep === 4 && registration && (
        <div className="p-6 rounded-xl glass glass-border max-w-2xl">
          <div className="flex items-center gap-3 p-4 rounded-lg bg-green-500/10 border border-green-500/20 mb-6">
            <CheckCircle className="h-6 w-6 text-green-400" />
            <div>
              <p className="text-green-400 font-semibold text-lg">Setup Complete!</p>
              <p className="text-sm text-white-secondary">Your subaccount is ready for compliant SMS campaigns</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
              <span className="text-white-secondary">Subaccount SID</span>
              <span className="text-white font-mono text-sm">{registration.subaccount_sid}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
              <span className="text-white-secondary">Company Name</span>
              <span className="text-white font-medium">{registration.company_name}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
              <span className="text-white-secondary">Brand ID</span>
              <span className="text-white font-mono text-sm">{registration.brand_id}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
              <span className="text-white-secondary">Campaign ID</span>
              <span className="text-white font-mono text-sm">{registration.campaign_id}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
              <span className="text-white-secondary">Phone Number</span>
              <span className="text-white font-medium">{registration.phone_number}</span>
            </div>
          </div>

          <div className="mt-6 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <p className="text-sm text-blue-400 font-medium mb-1">Billing Information</p>
            <p className="text-xs text-white-secondary">
              All billing is routed through the master RE:VIVE account. Your usage is tracked per subaccount for
              accurate Stripe billing.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
