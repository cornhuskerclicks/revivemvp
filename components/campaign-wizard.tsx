"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRight, Check } from "lucide-react"
import { useRouter } from "next/navigation"
import CampaignSetupStep from "@/components/wizard-steps/campaign-setup-step"
import LeadsUploadStep from "@/components/wizard-steps/leads-upload-step"
import MessageSequenceStep from "@/components/wizard-steps/message-sequence-step"
import { useToast } from "@/hooks/use-toast"

interface CampaignWizardProps {
  userId: string
  twilioAccount: any
}

export default function CampaignWizard({ userId, twilioAccount }: CampaignWizardProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(1)
  const [campaignData, setCampaignData] = useState({
    name: "",
    twilioPhoneNumber: twilioAccount?.phone_number || "",
    batchSize: 50,
    dripSize: 100,
    dripIntervalDays: 3,
    messageIntervals: [2, 5, 30],
    leads: [] as any[],
    messages: ["", "", ""],
  })

  const steps = [
    { number: 1, title: "Campaign Setup", description: "Name and configure your campaign" },
    { number: 2, title: "Upload Leads", description: "Import contacts from CSV" },
    { number: 3, title: "Message Sequence", description: "Create your 3-part message series" },
  ]

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = async () => {
    try {
      const response = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...campaignData,
          userId,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create campaign")
      }

      const result = await response.json()
      const campaignId = result.campaign.id

      if (typeof window !== "undefined") {
        sessionStorage.setItem("currentCampaignId", campaignId)
      }

      toast({
        title: "Campaign created successfully",
        description: "Your campaign is ready to launch.",
      })

      router.push(`/campaigns/${campaignId}`)
    } catch (error) {
      console.error("[v0] Error creating campaign:", error)
      toast({
        title: "Error creating campaign",
        description: "Please check your inputs and try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard?tab=campaigns")}
          className="text-white hover:text-aether hover:bg-white/5 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Campaigns
        </Button>
        <h1 className="text-4xl font-bold text-white mb-2">Create New Campaign</h1>
        <p className="text-white-secondary">Follow the steps to set up your SMS campaign</p>
      </div>

      <div className="flex items-center justify-between mb-8">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                  currentStep > step.number
                    ? "bg-aether border-aether text-white"
                    : currentStep === step.number
                      ? "border-aether text-aether bg-aether/10"
                      : "border-white/20 text-white-secondary bg-white/5"
                }`}
              >
                {currentStep > step.number ? <Check className="h-6 w-6" /> : step.number}
              </div>
              <div className="mt-2 text-center">
                <p
                  className={`text-sm font-semibold ${currentStep >= step.number ? "text-white" : "text-white-secondary"}`}
                >
                  {step.title}
                </p>
                <p className="text-xs text-white-secondary hidden sm:block">{step.description}</p>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`h-0.5 flex-1 mx-4 transition-all ${currentStep > step.number ? "bg-aether" : "bg-white/10"}`}
              />
            )}
          </div>
        ))}
      </div>

      <div className="p-8 rounded-xl glass glass-border min-h-[400px]">
        {currentStep === 1 && <CampaignSetupStep data={campaignData} setData={setCampaignData} />}
        {currentStep === 2 && <LeadsUploadStep data={campaignData} setData={setCampaignData} />}
        {currentStep === 3 && <MessageSequenceStep data={campaignData} setData={setCampaignData} />}
      </div>

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 1}
          className="border-white/10 text-white hover:bg-white/5 bg-transparent"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {currentStep < 3 ? (
          <Button
            onClick={handleNext}
            className="bg-gradient-to-r from-aether to-aether/80 text-white hover:shadow-[0_0_30px_rgba(8,159,239,0.4)]"
          >
            Next Step
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={handleComplete}
            className="bg-gradient-to-r from-green-500 to-green-600 text-white hover:shadow-[0_0_30px_rgba(34,197,94,0.4)]"
          >
            <Check className="h-4 w-4 mr-2" />
            Create Campaign
          </Button>
        )}
      </div>
    </div>
  )
}
