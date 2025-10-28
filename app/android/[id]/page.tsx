import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import AndroidChat from "@/components/android-chat"
import NavBar from "@/components/nav-bar"

export default async function AndroidPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  // Redirect to the unified Coffee Date Demo interface
  redirect(`/demo/${id}`)

  const supabase = await createClient()

  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData?.user) {
    redirect("/auth/login")
  }

  const { data: android, error: androidError } = await supabase
    .from("androids")
    .select("*")
    .eq("id", id)
    .eq("user_id", userData.user.id)
    .single()

  if (androidError || !android) {
    notFound()
  }

  const { data: sessions } = await supabase
    .from("sessions")
    .select("*")
    .eq("android_id", id)
    .order("created_at", { ascending: false })

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", userData.user.id).single()

  return (
    <div className="min-h-screen bg-background">
      <NavBar userEmail={userData.user.email} userName={profile?.full_name || undefined} />

      <AndroidChat android={android} sessions={sessions || []} userId={userData.user.id} />
    </div>
  )
}
