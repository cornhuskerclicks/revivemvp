import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import NavBar from "@/components/nav-bar"
import CampaignWizard from "@/components/campaign-wizard"

export default async function NewCampaignPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).single()

  const { data: twilioAccount } = await supabase
    .from("twilio_accounts")
    .select("*")
    .eq("user_id", data.user.id)
    .single()

  if (!twilioAccount) {
    redirect("/dashboard?tab=settings")
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-aether/10 rounded-full blur-[120px]" />
      </div>

      <NavBar userEmail={data.user.email} userName={profile?.full_name || undefined} />

      <div className="container mx-auto px-4 py-8 relative z-10 max-w-4xl">
        <CampaignWizard userId={data.user.id} twilioAccount={twilioAccount} />
      </div>
    </div>
  )
}
