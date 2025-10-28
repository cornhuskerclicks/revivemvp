"use client"

import { Button } from "@/components/ui/button"
import { Plus, Play, Pause, CheckCircle, Megaphone, Eye } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useState } from "react"

interface CampaignsTabProps {
  campaigns: any[]
  userId: string
}

export default function CampaignsTab({ campaigns }: CampaignsTabProps) {
  const { toast } = useToast()
  const [loadingCampaigns, setLoadingCampaigns] = useState<Record<string, boolean>>({})

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/10 text-green-400 border-green-500/20"
      case "paused":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
      case "completed":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20"
      default:
        return "bg-gray-500/10 text-gray-400 border-gray-500/20"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <Play className="h-3 w-3" />
      case "paused":
        return <Pause className="h-3 w-3" />
      case "completed":
        return <CheckCircle className="h-3 w-3" />
      default:
        return null
    }
  }

  const handleStartCampaign = async (campaignId: string) => {
    setLoadingCampaigns((prev) => ({ ...prev, [campaignId]: true }))

    try {
      const response = await fetch(`/api/campaigns/${campaignId}/start`, {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to start campaign")
      }

      toast({
        title: "Campaign started successfully",
        description: "Messages are being sent to your leads.",
      })

      // Refresh the page to show updated status
      window.location.reload()
    } catch (error) {
      toast({
        title: "Error starting campaign",
        description: "Please try again or complete A2P registration in Settings.",
        variant: "destructive",
      })
    } finally {
      setLoadingCampaigns((prev) => ({ ...prev, [campaignId]: false }))
    }
  }

  const handlePauseCampaign = async (campaignId: string) => {
    setLoadingCampaigns((prev) => ({ ...prev, [campaignId]: true }))

    try {
      const response = await fetch(`/api/campaigns/${campaignId}/pause`, {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to pause campaign")
      }

      toast({
        title: "Campaign paused",
        description: "No more messages will be sent until you resume.",
      })

      window.location.reload()
    } catch (error) {
      toast({
        title: "Error pausing campaign",
        description: "Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoadingCampaigns((prev) => ({ ...prev, [campaignId]: false }))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Your Campaigns</h2>
          <p className="text-white-secondary">Create and manage SMS campaigns</p>
        </div>
        <Button
          asChild
          className="bg-gradient-to-r from-aether to-aether/80 text-white hover:shadow-[0_0_30px_rgba(8,159,239,0.4)]"
        >
          <Link href="/campaigns/new">
            <Plus className="h-4 w-4 mr-2" />
            New Campaign
          </Link>
        </Button>
      </div>

      {campaigns.length === 0 ? (
        <div className="text-center py-16 rounded-xl glass glass-border">
          <div className="w-16 h-16 rounded-full bg-aether/10 flex items-center justify-center mx-auto mb-4">
            <Megaphone className="h-8 w-8 text-aether" />
          </div>
          <p className="text-white-secondary mb-4">No campaigns yet. Create your first one!</p>
          <Button asChild className="bg-aether text-white hover:aether-glow">
            <Link href="/campaigns/new">Create Campaign</Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-xl glass glass-border overflow-hidden">
          <table className="w-full">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-white">Campaign Name</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-white">Status</th>
                <th className="text-center px-6 py-4 text-sm font-semibold text-white">Total Leads</th>
                <th className="text-center px-6 py-4 text-sm font-semibold text-white">Sent</th>
                <th className="text-center px-6 py-4 text-sm font-semibold text-white">Replies</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-white">Created</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-white">Actions</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((campaign) => (
                <tr key={campaign.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-white">{campaign.name}</div>
                    {campaign.twilio_phone_number && (
                      <div className="text-xs text-white-secondary">{campaign.twilio_phone_number}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <Badge className={`${getStatusColor(campaign.status)} flex items-center gap-1 w-fit`}>
                      {getStatusIcon(campaign.status)}
                      {campaign.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-center text-white">{campaign.total_leads}</td>
                  <td className="px-6 py-4 text-center text-white">{campaign.sent}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-aether font-semibold">{campaign.replies}</span>
                  </td>
                  <td className="px-6 py-4 text-white-secondary text-sm">
                    {new Date(campaign.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {campaign.status === "draft" && (
                        <Button
                          size="sm"
                          onClick={() => handleStartCampaign(campaign.id)}
                          disabled={loadingCampaigns[campaign.id]}
                          className="bg-green-500 text-white hover:bg-green-600"
                        >
                          <Play className="h-3 w-3 mr-1" />
                          Start
                        </Button>
                      )}
                      {campaign.status === "active" && (
                        <Button
                          size="sm"
                          onClick={() => handlePauseCampaign(campaign.id)}
                          disabled={loadingCampaigns[campaign.id]}
                          className="bg-yellow-500 text-white hover:bg-yellow-600"
                        >
                          <Pause className="h-3 w-3 mr-1" />
                          Pause
                        </Button>
                      )}
                      {campaign.status === "paused" && (
                        <Button
                          size="sm"
                          onClick={() => handleStartCampaign(campaign.id)}
                          disabled={loadingCampaigns[campaign.id]}
                          className="bg-green-500 text-white hover:bg-green-600"
                        >
                          <Play className="h-3 w-3 mr-1" />
                          Resume
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-aether hover:text-aether/80 hover:bg-aether/10"
                        asChild
                      >
                        <Link href={`/campaigns/${campaign.id}`}>
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Link>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
