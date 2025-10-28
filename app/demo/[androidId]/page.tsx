import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import DemoChat from "@/components/demo-chat"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { AlertCircle } from "lucide-react"

export default async function DemoPage({ params }: { params: Promise<{ androidId: string }> }) {
  const { androidId } = await params
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  const { data: android, error: androidError } = await supabase
    .from("androids")
    .select("*")
    .eq("id", androidId)
    .single()

  if (androidError || !android) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(8,159,239,0.15)_0%,_transparent_70%)]" />

        <div className="relative z-10 text-center px-4 max-w-md">
          <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="h-10 w-10 text-red-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">Android Not Found</h1>
          <p className="text-white-secondary mb-8">
            No Android connected — return to Dashboard to create one or select an existing Android.
          </p>
          <Button
            asChild
            className="bg-gradient-to-r from-aether to-aether/80 text-white hover:shadow-[0_0_30px_rgba(8,159,239,0.4)]"
          >
            <Link href="/dashboard">Return to Dashboard</Link>
          </Button>
        </div>
      </div>
    )
  }

  return <DemoChat android={android} userId={data.user.id} />
}
