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
          <p className="text-white-secondary">Configure your Sleeping Beauty drip campaign</p>
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

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="dripSize" className="text-white">
              Drip Size
            </Label>
            <Input
              id="dripSize"
              type="number"
              min="1"
              max="1000"
              value={data.dripSize || 100}
              onChange={(e) => setData({ ...data, dripSize: Number.parseInt(e.target.value) })}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
            />
            <p className="text-xs text-white-secondary mt-1">Leads per batch (default: 100)</p>
          </div>

          <div>
            <Label htmlFor="dripInterval" className="text-white">
              Drip Interval (days)
            </Label>
            <Input
              id="dripInterval"
              type="number"
              min="1"
              max="30"
              value={data.dripIntervalDays || 3}
              onChange={(e) => setData({ ...data, dripIntervalDays: Number.parseInt(e.target.value) })}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
            />
            <p className="text-xs text-white-secondary mt-1">Days between batches (default: 3)</p>
          </div>
        </div>

        <div>
          <Label className="text-white mb-2 block">Message Intervals (days between messages)</Label>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor="interval1" className="text-xs text-white-secondary">
                1st → 2nd
              </Label>
              <Input
                id="interval1"
                type="number"
                min="1"
                max="30"
                value={data.messageIntervals?.[0] || 2}
                onChange={(e) =>
                  setData({
                    ...data,
                    messageIntervals: [
                      Number.parseInt(e.target.value),
                      data.messageIntervals?.[1] || 5,
                      data.messageIntervals?.[2] || 30,
                    ],
                  })
                }
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
              />
            </div>
            <div>
              <Label htmlFor="interval2" className="text-xs text-white-secondary">
                2nd → 3rd
              </Label>
              <Input
                id="interval2"
                type="number"
                min="1"
                max="30"
                value={data.messageIntervals?.[1] || 5}
                onChange={(e) =>
                  setData({
                    ...data,
                    messageIntervals: [
                      data.messageIntervals?.[0] || 2,
                      Number.parseInt(e.target.value),
                      data.messageIntervals?.[2] || 30,
                    ],
                  })
                }
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
              />
            </div>
            <div>
              <Label htmlFor="interval3" className="text-xs text-white-secondary">
                Restart Cycle
              </Label>
              <Input
                id="interval3"
                type="number"
                min="1"
                max="90"
                value={data.messageIntervals?.[2] || 30}
                onChange={(e) =>
                  setData({
                    ...data,
                    messageIntervals: [
                      data.messageIntervals?.[0] || 2,
                      data.messageIntervals?.[1] || 5,
                      Number.parseInt(e.target.value),
                    ],
                  })
                }
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
              />
            </div>
          </div>
          <p className="text-xs text-white-secondary mt-2">Default: 2, 5, 30 days (Sleeping Beauty pattern)</p>
        </div>
      </div>

      <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
        <p className="text-sm text-blue-400 mb-2">
          <strong>Sleeping Beauty Workflow:</strong>
        </p>
        <ul className="text-xs text-blue-300 space-y-1 list-disc list-inside">
          <li>Send 1st message → wait {data.messageIntervals?.[0] || 2} days</li>
          <li>Send 2nd message → wait {data.messageIntervals?.[1] || 5} days</li>
          <li>Send 3rd message → wait {data.messageIntervals?.[2] || 30} days</li>
          <li>Restart cycle for non-responders automatically</li>
        </ul>
      </div>
    </div>
  )
}
