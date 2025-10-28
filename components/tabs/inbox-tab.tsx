"use client"

import { MessageSquare, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface InboxTabProps {
  messages: any[]
}

export default function InboxTab({ messages }: InboxTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Inbox</h2>
          <p className="text-white-secondary">All incoming Twilio replies</p>
        </div>
        <Button variant="outline" className="border-white/10 text-white hover:bg-white/5 bg-transparent">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
      </div>

      {messages.length === 0 ? (
        <div className="text-center py-16 rounded-xl glass glass-border">
          <div className="w-16 h-16 rounded-full bg-aether/10 flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="h-8 w-8 text-aether" />
          </div>
          <p className="text-white-secondary mb-2">No messages yet</p>
          <p className="text-sm text-white-secondary">Incoming replies from your campaigns will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className="p-6 rounded-xl glass glass-border hover:shadow-[0_0_30px_rgba(8,159,239,0.15)] transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {message.campaign_contacts?.lead_name || "Unknown Lead"}
                  </h3>
                  <p className="text-sm text-white-secondary">{message.campaign_contacts?.phone_number}</p>
                </div>
                <div className="text-right">
                  <Badge className="bg-aether/10 text-aether border-aether/20 mb-2">
                    {message.sms_campaigns?.name || "Unknown Campaign"}
                  </Badge>
                  <p className="text-xs text-white-secondary">{new Date(message.created_at).toLocaleString()}</p>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <p className="text-white">{message.message_body}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
