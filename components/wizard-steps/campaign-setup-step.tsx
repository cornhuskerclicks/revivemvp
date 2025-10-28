"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Megaphone } from "lucide-react"

interface CampaignSetupStepProps {
  data: any
  setData: (data: any) => void
}

export default function CampaignSetupStep({ data, setData }: CampaignSetupStepProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-aether/20 flex items-center justify-center">
          <Megaphone className="h-6 w-6 text-aether" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Campaign Setup</h2>
          <p className="text-white-secondary">Configure your campaign details</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="campaignName" className="text-white">
            Campaign Name
          </Label>
          <Input
            id="campaignName"
            type="text"
            placeholder="e.g., Q1 Lead Reactivation"
            value={data.name}
            onChange={(e) => setData({ ...data, name: e.target.value })}
            className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
          />
          <p className="text-xs text-white-secondary mt-1">Give your campaign a memorable name</p>
        </div>

        <div>
          <Label htmlFor="twilioNumber" className="text-white">
            Twilio Phone Number
          </Label>
          <Input
            id="twilioNumber"
            type="tel"
            placeholder="+1234567890"
            value={data.twilioPhoneNumber}
            onChange={(e) => setData({ ...data, twilioPhoneNumber: e.target.value })}
            className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
          />
          <p className="text-xs text-white-secondary mt-1">The phone number that will send messages</p>
        </div>

        <div>
          <Label htmlFor="batchSize" className="text-white">
            Batch Size
          </Label>
          <Input
            id="batchSize"
            type="number"
            min="1"
            max="1000"
            value={data.batchSize}
            onChange={(e) => setData({ ...data, batchSize: Number.parseInt(e.target.value) })}
            className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
          />
          <p className="text-xs text-white-secondary mt-1">Number of messages to send per batch (default: 50)</p>
        </div>
      </div>

      <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
        <p className="text-sm text-blue-400">
          <strong>Tip:</strong> Start with a smaller batch size to test your campaign before scaling up.
        </p>
      </div>
    </div>
  )
}
