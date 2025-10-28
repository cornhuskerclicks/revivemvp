import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import NavBar from "@/components/nav-bar"
import DashboardTabs from "@/components/dashboard-tabs"

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).single()

  const { data: campaigns } = await supabase
    .from("sms_campaigns")
    .select("*")
    .eq("user_id", data.user.id)
    .order("created_at", { ascending: false })

  const { data: androids } = await supabase
    .from("androids")
    .select("*")
    .eq("user_id", data.user.id)
    .order("created_at", { ascending: false })

  const { data: twilioAccount } = await supabase
    .from("twilio_accounts")
    .select("*")
    .eq("user_id", data.user.id)
    .single()

  const { data: inboxMessages } = await supabase
    .from("sms_messages")
    .select(`
      *,
      campaign_contacts (
        lead_name,
        phone_number
      ),
      sms_campaigns (
        name
      )
    `)
    .eq("direction", "inbound")
    .order("created_at", { ascending: false })
    .limit(50)

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-aether/10 rounded-full blur-[120px]" />
      </div>

      <NavBar userEmail={data.user.email} userName={profile?.full_name || undefined} />

      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="mb-8 animate-fade-in-up">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
            Welcome back, {profile?.full_name || "there"}
          </h1>
          <p className="text-white-secondary text-lg">Manage your SMS campaigns, track replies, and test AI prompts.</p>
        </div>

        <DashboardTabs
          campaigns={campaigns || []}
          androids={androids || []}
          twilioAccount={twilioAccount}
          inboxMessages={inboxMessages || []}
          userId={data.user.id}
        />
      </div>

      <footer className="border-t border-white/10 mt-16 relative z-10">
        <div className="container mx-auto px-4 py-6">
          <p
            className="text-center text-sm text-white-secondary uppercase tracking-wider"
            style={{ fontVariant: "small-caps" }}
          >
            Powered by Aether Intelligence • RE:VIVE SaaS Platform
          </p>
        </div>
      </footer>
    </div>
  )
}
