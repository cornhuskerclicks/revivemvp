import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import LibraryView from "@/components/library-view"
import NavBar from "@/components/nav-bar"

export default async function LibraryPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  const { data: androids } = await supabase
    .from("androids")
    .select("*")
    .eq("user_id", data.user.id)
    .order("created_at", { ascending: false })

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).single()

  return (
    <div className="min-h-screen bg-background">
      <NavBar userEmail={data.user.email} userName={profile?.full_name || undefined} />

      <LibraryView androids={androids || []} userId={data.user.id} />
    </div>
  )
}
