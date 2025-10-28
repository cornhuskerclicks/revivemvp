import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import NavBar from "@/components/nav-bar"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Users, MessageSquare, CheckCircle, Clock } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

export default async function CampaignDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  const { data: campaign } = await supabase
    .from("sms_campaigns")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", data.user.id)
    .single()

  if (!campaign) {
    redirect("/dashboard?tab=campaigns")
  }

  const { data: contacts } = await supabase
    .from("campaign_contacts")
    .select("*")
    .eq("campaign_id", params.id)
    .order("created_at", { ascending: false })

  const { data: messages } = await supabase
    .from("sms_messages")
    .select("*")
    .eq("campaign_id", params.id)
    .order("created_at", { ascending: false })
    .limit(50)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/10 text-green-400 border-green-500/20"
      case "draft":
        return "bg-gray-500/10 text-gray-400 border-gray-500/20"
      case "paused":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
      case "completed":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20"
      default:
        return "bg-gray-500/10 text-gray-400 border-gray-500/20"
    }
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-aether/10 rounded-full blur-[120px]" />
      </div>

      <NavBar userEmail={data.user.email} />

      <div className="container mx-auto px-4 py-8 relative z-10">
        <Button variant="ghost" asChild className="text-white hover:text-aether hover:bg-white/5 mb-6">
          <Link href="/dashboard?tab=campaigns">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Campaigns
          </Link>
        </Button>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">{campaign.name}</h1>
              <p className="text-white-secondary">Campaign details and performance</p>
            </div>
            <Badge className={getStatusColor(campaign.status)}>{campaign.status}</Badge>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            <div className="p-6 rounded-xl glass glass-border">
              <div className="flex items-center gap-3 mb-2">
                <Users className="h-5 w-5 text-aether" />
                <p className="text-sm text-white-secondary">Total Leads</p>
              </div>
              <p className="text-3xl font-bold text-white">{campaign.total_leads}</p>
            </div>

            <div className="p-6 rounded-xl glass glass-border">
              <div className="flex items-center gap-3 mb-2">
                <MessageSquare className="h-5 w-5 text-blue-400" />
                <p className="text-sm text-white-secondary">Messages Sent</p>
              </div>
              <p className="text-3xl font-bold text-white">{campaign.sent}</p>
            </div>

            <div className="p-6 rounded-xl glass glass-border">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <p className="text-sm text-white-secondary">Replies</p>
              </div>
              <p className="text-3xl font-bold text-aether">{campaign.replies}</p>
            </div>

            <div className="p-6 rounded-xl glass glass-border">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="h-5 w-5 text-yellow-400" />
                <p className="text-sm text-white-secondary">Reply Rate</p>
              </div>
              <p className="text-3xl font-bold text-white">
                {campaign.sent > 0 ? Math.round((campaign.replies / campaign.sent) * 100) : 0}%
              </p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-6 rounded-xl glass glass-border">
            <h2 className="text-xl font-bold text-white mb-4">Campaign Contacts</h2>
            {contacts && contacts.length > 0 ? (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {contacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="p-3 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-white font-medium">{contact.lead_name}</p>
                      <p className="text-sm text-white-secondary">{contact.phone_number}</p>
                    </div>
                    <Badge
                      className={
                        contact.status === "replied"
                          ? "bg-green-500/10 text-green-400 border-green-500/20"
                          : "bg-gray-500/10 text-gray-400 border-gray-500/20"
                      }
                    >
                      {contact.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-white-secondary">No contacts yet</p>
            )}
          </div>

          <div className="p-6 rounded-xl glass glass-border">
            <h2 className="text-xl font-bold text-white mb-4">Recent Messages</h2>
            {messages && messages.length > 0 ? (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {messages.map((message) => (
                  <div key={message.id} className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <Badge
                        className={
                          message.direction === "inbound"
                            ? "bg-aether/10 text-aether border-aether/20"
                            : "bg-purple-500/10 text-purple-400 border-purple-500/20"
                        }
                      >
                        {message.direction}
                      </Badge>
                      <p className="text-xs text-white-secondary">{new Date(message.created_at).toLocaleString()}</p>
                    </div>
                    <p className="text-sm text-white">{message.message_body}</p>
                    {message.status && <p className="text-xs text-white-secondary mt-1">Status: {message.status}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-white-secondary">No messages yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
