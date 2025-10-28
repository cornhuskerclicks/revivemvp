"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Sparkles, Copy, Check } from "lucide-react"
import { generatePrompt } from "@/app/actions/generate-prompt"

interface PromptGeneratorFormProps {
  userId: string
}

export default function PromptGeneratorForm({ userId }: PromptGeneratorFormProps) {
  const router = useRouter()
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null)
  const [generatedAndroidId, setGeneratedAndroidId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const [formData, setFormData] = useState({
    businessName: "",
    androidName: "",
    serviceType: "",
    shortService: "",
    nicheQuestion: "",
    valueProp: "",
    calendarLink: "",
    regionTone: "",
    industryTraining: "",
    website: "",
    openingHours: "",
    promiseLine: "",
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleGenerate = async () => {
    setIsGenerating(true)
    try {
      const result = await generatePrompt(formData, userId)
      if (result.success && result.androidId && result.prompt) {
        setGeneratedPrompt(result.prompt)
        setGeneratedAndroidId(result.androidId)
      }
    } catch (error) {
      console.error("Error generating prompt:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopy = () => {
    if (generatedPrompt) {
      navigator.clipboard.writeText(generatedPrompt)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleUseInBuilder = () => {
    if (generatedAndroidId) {
      router.push(`/android/${generatedAndroidId}`)
    }
  }

  const isFormValid = formData.businessName && formData.androidName && formData.serviceType

  if (generatedPrompt) {
    return (
      <Card className="glass glass-border">
        <CardHeader>
          <CardTitle className="text-white">Generated Coffee Date Prompt</CardTitle>
          <CardDescription className="text-white-secondary">Your Android is ready to use</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-black/40 p-4 rounded-lg max-h-96 overflow-y-auto border border-white/10">
            <pre className="text-sm whitespace-pre-wrap font-mono text-white">{generatedPrompt}</pre>
          </div>

          <div className="flex gap-4">
            <Button
              onClick={handleCopy}
              variant="outline"
              className="flex-1 border-aether text-aether hover:bg-aether hover:text-white bg-transparent"
            >
              {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
              {copied ? "Copied!" : "Copy Prompt"}
            </Button>
            <Button onClick={handleUseInBuilder} className="flex-1 bg-aether text-white hover:aether-glow">
              Use in Android Builder
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="glass glass-border">
      <CardHeader>
        <CardTitle className="text-white">Coffee Date Prompt Generator</CardTitle>
        <CardDescription className="text-white-secondary">
          Fill in your business details to generate a custom Android prompt
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="businessName" className="text-white">
              Business Name
            </Label>
            <Input
              id="businessName"
              placeholder="e.g. Omaha Capital Investments"
              value={formData.businessName}
              onChange={(e) => handleInputChange("businessName", e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="androidName" className="text-white">
              Android Name (Admin Persona)
            </Label>
            <Input
              id="androidName"
              placeholder="e.g. Grace"
              value={formData.androidName}
              onChange={(e) => handleInputChange("androidName", e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="serviceType" className="text-white">
              Service Type / Niche
            </Label>
            <Input
              id="serviceType"
              placeholder="e.g. Real Estate Investment"
              value={formData.serviceType}
              onChange={(e) => handleInputChange("serviceType", e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="shortService" className="text-white">
              Short Service Description
            </Label>
            <Input
              id="shortService"
              placeholder="help selling or investing in property"
              value={formData.shortService}
              onChange={(e) => handleInputChange("shortService", e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/50"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="nicheQuestion" className="text-white">
              Niche Question 1
            </Label>
            <Input
              id="nicheQuestion"
              placeholder="Are you looking to sell a property or find investment opportunities?"
              value={formData.nicheQuestion}
              onChange={(e) => handleInputChange("nicheQuestion", e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/50"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="valueProp" className="text-white">
              Value Proposition
            </Label>
            <Input
              id="valueProp"
              placeholder="beat any fair market price and close fast"
              value={formData.valueProp}
              onChange={(e) => handleInputChange("valueProp", e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="calendarLink" className="text-white">
              Calendar Link
            </Label>
            <Input
              id="calendarLink"
              placeholder="https://yourcalendarlink.com"
              value={formData.calendarLink}
              onChange={(e) => handleInputChange("calendarLink", e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="regionTone" className="text-white">
              Region / Tone
            </Label>
            <Input
              id="regionTone"
              placeholder="Omaha dialect"
              value={formData.regionTone}
              onChange={(e) => handleInputChange("regionTone", e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="industryTraining" className="text-white">
              Industry Training
            </Label>
            <Input
              id="industryTraining"
              placeholder="Real Estate"
              value={formData.industryTraining}
              onChange={(e) => handleInputChange("industryTraining", e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="website" className="text-white">
              Website URL
            </Label>
            <Input
              id="website"
              placeholder="https://example.com"
              value={formData.website}
              onChange={(e) => handleInputChange("website", e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="openingHours" className="text-white">
              Opening Hours
            </Label>
            <Input
              id="openingHours"
              placeholder="Mon–Fri 9–6 CST"
              value={formData.openingHours}
              onChange={(e) => handleInputChange("openingHours", e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="promiseLine" className="text-white">
              Promise Line
            </Label>
            <Input
              id="promiseLine"
              placeholder="Fast, fair and transparent deals."
              value={formData.promiseLine}
              onChange={(e) => handleInputChange("promiseLine", e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/50"
            />
          </div>
        </div>

        <Button
          onClick={handleGenerate}
          className="w-full bg-aether text-white hover:aether-glow"
          disabled={isGenerating || !isFormValid}
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating Prompt...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Prompt
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
