import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus, Coffee, BookOpen, Sparkles } from "lucide-react"
import NavBar from "@/components/nav-bar"
import DemoStartButton from "@/components/demo-start-button"

export default async function DashboardPage() {
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

  const { data: recentSessions } = await supabase
    .from("sessions")
    .select("*, messages(*)")
    .eq("user_id", data.user.id)
    .order("updated_at", { ascending: false })
    .limit(1)

  const recentSession = recentSessions?.[0]

  const tips = [
    "Ask about results, not readiness — you'll uncover true intent faster.",
    "Listen for pain points in their current process — that's where value lives.",
    "Mirror their energy level to build instant rapport.",
    "Use the 'feel, felt, found' framework to handle objections smoothly.",
    "Always end with a clear next step — never leave it ambiguous.",
  ]
  const randomTip = tips[Math.floor(Math.random() * tips.length)]

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-aether/10 rounded-full blur-[120px]" />
      </div>

      <NavBar userEmail={data.user.email} userName={profile?.full_name || undefined} />

      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="mb-12 animate-fade-in-up">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
            Welcome back, {profile?.full_name || "there"} — ready to revive another conversation?
          </h1>
          <p className="text-white-secondary text-lg mb-8">Your AI Androids, demos, and prompts are ready to go.</p>

          <div className="flex flex-wrap gap-4">
            <Button
              asChild
              className="bg-gradient-to-r from-aether to-aether/80 text-white hover:shadow-[0_0_30px_rgba(8,159,239,0.4)] hover:scale-105 transition-all duration-300"
            >
              <Link href="/prompt-generator">
                <Plus className="h-4 w-4 mr-2" />
                Create Android
              </Link>
            </Button>
            <DemoStartButton androids={androids || []} />
            <Button
              asChild
              variant="ghost"
              className="bg-white/5 text-white hover:bg-white/10 hover:shadow-[0_0_20px_rgba(8,159,239,0.2)] hover:scale-105 transition-all duration-300"
            >
              <Link href="/library">
                <BookOpen className="h-4 w-4 mr-2" />
                View Prompt Library
              </Link>
            </Button>
          </div>
        </div>

        <div className="mb-8 p-6 rounded-xl glass glass-border animate-fade-in-up animation-delay-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-white-secondary">AI Credits</h3>
            <span className="text-sm text-aether font-semibold">80% remaining</span>
          </div>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-2">
            <div className="h-full w-[80%] bg-gradient-to-r from-aether to-aether/60 rounded-full" />
          </div>
          <p className="text-xs text-white-secondary">
            Free access for Aether students • Upgrade or top up credits after graduation.
          </p>
        </div>

        <div className="mb-12 animate-fade-in-up animation-delay-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white mb-6">Your AI Androids</h2>
            {androids && androids.length > 0 && (
              <Button variant="ghost" asChild className="text-aether hover:text-aether/80 hover:bg-aether/10">
                <Link href="/library">View All →</Link>
              </Button>
            )}
          </div>

          {!androids || androids.length === 0 ? (
            <div className="text-center py-16 rounded-xl glass glass-border">
              <div className="w-16 h-16 rounded-full bg-aether/10 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-8 w-8 text-aether" />
              </div>
              <p className="text-white-secondary mb-4">No androids yet. Create your first one!</p>
              <Button asChild className="bg-aether text-white hover:aether-glow">
                <Link href="/prompt-generator">Get Started</Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
              <div className="flex gap-4 min-w-max md:grid md:grid-cols-2 lg:grid-cols-3 md:min-w-0">
                {androids.slice(0, 6).map((android, index) => {
                  const companyName =
                    android.business_context?.company_name || android.business_context?.businessName || "My Business"
                  const niche = android.business_context?.niche || android.business_context?.industry || "General"
                  const getCompanyInitials = (name: string) => {
                    return name
                      .split(" ")
                      .map((word) => word[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)
                  }

                  return (
                    <div
                      key={android.id}
                      className="min-w-[300px] md:min-w-0 p-6 rounded-xl glass glass-border hover:shadow-[0_0_30px_rgba(8,159,239,0.15)] hover:-translate-y-1 transition-all duration-300 group animate-fade-in-up"
                      style={{ animationDelay: `${300 + index * 100}ms` }}
                    >
                      <div className="flex items-start gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-white/10 to-white/5 border border-white/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-white">{getCompanyInitials(companyName)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-semibold text-white mb-1 truncate">
                            {companyName} — {android.name}
                          </h3>
                          <p className="text-xs text-white-secondary">Niche: {niche}</p>
                        </div>
                        <div className="relative flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-aether to-aether/60 flex items-center justify-center">
                            <Sparkles className="h-4 w-4 text-white" />
                          </div>
                          <div className="absolute inset-0 rounded-full bg-aether/30 animate-ping" />
                        </div>
                      </div>
                      <p className="text-sm text-white-secondary line-clamp-2 mb-4">
                        {android.prompt.substring(0, 80)}...
                      </p>
                      <Button
                        variant="outline"
                        className="w-full border-aether text-aether hover:bg-aether hover:text-white bg-transparent group-hover:shadow-[0_0_20px_rgba(8,159,239,0.3)] transition-all"
                        asChild
                      >
                        <Link href={`/demo/${android.id}`}>Open</Link>
                      </Button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {recentSession && (
          <div className="mb-12 animate-fade-in-up animation-delay-400">
            <h2 className="text-2xl font-bold text-white mb-6">Recent Demos</h2>
            <div className="p-6 rounded-xl glass glass-border hover:shadow-[0_0_30px_rgba(8,159,239,0.15)] transition-all duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-aether/20 flex items-center justify-center">
                  <Coffee className="h-4 w-4 text-aether" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{recentSession.title}</h3>
                  <p className="text-xs text-white-secondary">
                    Last active {new Date(recentSession.updated_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              {recentSession.messages && recentSession.messages.length > 0 && (
                <div className="space-y-2 mb-4">
                  {recentSession.messages.slice(-2).map((msg: any) => (
                    <div
                      key={msg.id}
                      className={`p-3 rounded-lg text-sm ${
                        msg.role === "user" ? "bg-white/5 text-white ml-8" : "bg-aether/10 text-white-secondary mr-8"
                      }`}
                    >
                      {msg.content.substring(0, 100)}
                      {msg.content.length > 100 && "..."}
                    </div>
                  ))}
                </div>
              )}
              <Button
                asChild
                className="w-full bg-gradient-to-r from-aether to-aether/80 text-white hover:shadow-[0_0_30px_rgba(8,159,239,0.4)] transition-all"
              >
                <Link href={`/demo/${recentSession.android_id}`}>Continue Demo</Link>
              </Button>
            </div>
          </div>
        )}

        <div className="mb-12 animate-fade-in-up animation-delay-500">
          <div className="p-6 rounded-xl glass glass-border bg-gradient-to-br from-aether/5 to-transparent">
            <div className="flex items-center gap-3 mb-3">
              <Coffee className="h-5 w-5 text-aether" />
              <h3 className="text-lg font-semibold text-white">Coffee Date Tip of the Day</h3>
            </div>
            <p className="text-white-secondary italic">"{randomTip}"</p>
          </div>
        </div>
      </div>

      <footer className="border-t border-white/10 mt-16 relative z-10">
        <div className="container mx-auto px-4 py-6">
          <p
            className="text-center text-sm text-white-secondary uppercase tracking-wider"
            style={{ fontVariant: "small-caps" }}
          >
            Powered by Aether Intelligence • Revival Chat™ System • Built for Coffee Dates
          </p>
        </div>
      </footer>
    </div>
  )
}
