import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sparkles, MessageSquare, Megaphone } from "lucide-react"
import Image from "next/image"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-aether opacity-[0.25] rounded-full blur-3xl animate-pulse-slow" />
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-aether opacity-[0.25] rounded-full blur-3xl animate-pulse-slow"
          style={{ animationDelay: "1.5s" }}
        />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background: "radial-gradient(circle at 50% 50%, rgba(8,159,239,0.15) 0%, transparent 50%)",
            animation: "wave 20s ease-in-out infinite",
          }}
        />
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        <nav
          className="flex items-center justify-between mb-20 glass rounded-2xl px-6 py-4 aether-glow-sm border border-white/[0.08]"
          style={{ backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
        >
          <Link href="/" className="transition-all duration-300 hover:drop-shadow-[0_0_8px_rgba(8,159,239,0.6)]">
            <Image
              src="/revive-by-aether.png"
              alt="RE:VIVE by Aether"
              width={720}
              height={225}
              className="h-[120px] w-auto animate-pulse-slow"
              priority
            />
          </Link>
          <div className="flex gap-4">
            <Button
              variant="ghost"
              asChild
              className="text-white hover:text-aether hover:bg-white/5 transition-all duration-300"
            >
              <Link href="/auth/login">Login</Link>
            </Button>
            <Button
              asChild
              className="bg-gradient-to-r from-aether to-blue-500 hover:shadow-lg hover:shadow-aether/50 transition-all duration-300 font-semibold uppercase text-sm text-white"
            >
              <Link href="/auth/sign-up">Get Started</Link>
            </Button>
          </div>
        </nav>

        <div className="max-w-5xl mx-auto text-center space-y-8 py-20 animate-fade-in relative">
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] pointer-events-none"
            style={{
              background: "radial-gradient(circle at center, rgba(8,159,239,0.15), transparent 70%)",
              filter: "blur(40px)",
            }}
          />

          <div className="inline-block px-6 py-3 rounded-full glass glass-border mb-6 aether-glow-sm relative z-10">
            <span className="text-aether text-sm font-semibold uppercase tracking-wide">AI-Powered SMS Campaigns</span>
          </div>

          <h1 className="text-7xl md:text-8xl font-extrabold tracking-tight text-balance leading-[1.1] relative z-10">
            Reactivate Leads.
            <br />
            <span className="text-aether animate-pulse-slow" style={{ textShadow: "0 0 35px rgba(8,159,239,0.5)" }}>
              Automate Follow-Ups.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-[#B4B4B4] text-balance max-w-2xl mx-auto leading-relaxed relative z-10">
            RE:VIVE is a self-service SaaS platform with managed SMS infrastructure that uploads leads and sends
            automated 3-part SMS sequences—powered by <span className="text-aether font-semibold">Aether AI</span>.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8 relative z-10">
            <Button
              size="lg"
              asChild
              className="bg-gradient-to-r from-aether to-[#007ACC] text-white hover:shadow-xl hover:shadow-aether/50 transition-all duration-300 hover:scale-[1.03] px-10 py-6 text-base font-semibold uppercase"
            >
              <Link href="/auth/sign-up">Start Free Trial</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="border-white/10 text-aether hover:bg-white/5 hover:border-aether bg-transparent transition-all duration-300 hover:scale-[1.03] px-10 py-6 text-base font-semibold uppercase"
            >
              <Link href="/auth/login">Sign In</Link>
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-6 pt-24 animate-slide-up relative z-10">
            <div
              className="p-8 rounded-[20px] glass border border-white/[0.08] hover:border-aether transition-all duration-300 group hover:scale-[1.02]"
              style={{
                transitionDelay: "0ms",
                animation: "fadeUpStagger 400ms ease-out forwards",
                opacity: 0,
              }}
            >
              <div className="h-14 w-14 rounded-xl bg-aether/10 flex items-center justify-center mb-6 group-hover:bg-aether/20 transition-all duration-300 group-hover:shadow-[0_0_25px_rgba(8,159,239,0.2)]">
                <Megaphone className="h-7 w-7 text-aether" />
              </div>
              <h3 className="text-2xl font-bold mb-4 uppercase text-white">SMS Campaigns</h3>
              <p className="text-[#B4B4B4] leading-relaxed">
                Upload leads via CSV and launch automated 3-part message sequences with managed SMS infrastructure.
              </p>
            </div>

            <div
              className="p-8 rounded-[20px] glass border border-white/[0.08] hover:border-aether transition-all duration-300 group hover:scale-[1.02]"
              style={{
                transitionDelay: "100ms",
                animation: "fadeUpStagger 400ms ease-out forwards",
                animationDelay: "100ms",
                opacity: 0,
              }}
            >
              <div className="h-14 w-14 rounded-xl bg-aether/10 flex items-center justify-center mb-6 group-hover:bg-aether/20 transition-all duration-300 group-hover:shadow-[0_0_25px_rgba(8,159,239,0.2)]">
                <MessageSquare className="h-7 w-7 text-aether" />
              </div>
              <h3 className="text-2xl font-bold mb-4 uppercase text-white">Reply Tracking</h3>
              <p className="text-[#B4B4B4] leading-relaxed">
                Monitor incoming replies in real-time and track campaign performance with detailed analytics.
              </p>
            </div>

            <div
              className="p-8 rounded-[20px] glass border border-white/[0.08] hover:border-aether transition-all duration-300 group hover:scale-[1.02]"
              style={{
                transitionDelay: "200ms",
                animation: "fadeUpStagger 400ms ease-out forwards",
                animationDelay: "200ms",
                opacity: 0,
              }}
            >
              <div className="h-14 w-14 rounded-xl bg-aether/10 flex items-center justify-center mb-6 group-hover:bg-aether/20 transition-all duration-300 group-hover:shadow-[0_0_25px_rgba(8,159,239,0.2)]">
                <Sparkles className="h-7 w-7 text-aether" />
              </div>
              <h3 className="text-2xl font-bold mb-4 uppercase text-white">AI Sandbox</h3>
              <p className="text-[#B4B4B4] leading-relaxed">
                Test your Coffee Date prompts and simulate conversations before launching real campaigns.
              </p>
            </div>
          </div>
        </div>

        <footer className="text-center py-16 mt-32 border-t border-white/[0.08]">
          <p className="text-[#999999] text-sm uppercase tracking-[1.5px]" style={{ fontVariantCaps: "small-caps" }}>
            Powered by Aether Intelligence • RE:VIVE SaaS Platform
          </p>
        </footer>
      </div>
    </div>
  )
}
