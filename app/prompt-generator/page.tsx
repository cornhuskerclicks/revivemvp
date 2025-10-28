import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import PromptGeneratorForm from "@/components/prompt-generator-form"
import NavBar from "@/components/nav-bar"

export default async function PromptGeneratorPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).single()

  return (
    <div className="min-h-screen bg-background">
      <NavBar userEmail={data.user.email} userName={profile?.full_name || undefined} />

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-white">Create Your Android</h1>
          <p className="text-white-secondary">
            Answer a few questions about your business and we'll generate a powerful Coffee Date prompt
          </p>
        </div>

        <PromptGeneratorForm userId={data.user.id} />
      </div>
    </div>
  )
}
