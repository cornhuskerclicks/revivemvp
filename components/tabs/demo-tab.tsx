"use client"

import { Sparkles, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface DemoTabProps {
  androids: any[]
}

export default function DemoTab({ androids }: DemoTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">AI Prompt Sandbox</h2>
        <p className="text-white-secondary">Test your Coffee Date prompts and simulate lead revival conversations</p>
      </div>

      <div className="p-8 rounded-xl glass glass-border bg-gradient-to-br from-aether/5 to-transparent">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-aether/20 flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-aether" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">Coffee Date Demo Mode</h3>
            <p className="text-sm text-white-secondary">Powered by OpenAI</p>
          </div>
        </div>
        <p className="text-white-secondary mb-6">
          Select an Android to simulate SMS conversations. Edit prompts, test message flows, and see how your AI
          responds to different scenarios—all without sending real messages.
        </p>
        <div className="flex items-center gap-4">
          <Button
            asChild
            className="bg-gradient-to-r from-aether to-aether/80 text-white hover:shadow-[0_0_30px_rgba(8,159,239,0.4)]"
          >
            <Link href="/prompt-generator">
              <Sparkles className="h-4 w-4 mr-2" />
              Create New Android
            </Link>
          </Button>
          <Button variant="outline" asChild className="border-white/10 text-white hover:bg-white/5 bg-transparent">
            <Link href="/library">View Library</Link>
          </Button>
        </div>
      </div>

      {androids.length === 0 ? (
        <div className="text-center py-16 rounded-xl glass glass-border">
          <p className="text-white-secondary mb-4">No Androids yet. Create one to start testing!</p>
          <Button asChild className="bg-aether text-white hover:aether-glow">
            <Link href="/prompt-generator">Create Android</Link>
          </Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {androids.map((android) => {
            const companyName =
              android.business_context?.company_name || android.business_context?.businessName || "My Business"
            const niche = android.business_context?.niche || android.business_context?.industry || "General"

            return (
              <div
                key={android.id}
                className="p-6 rounded-xl glass glass-border hover:shadow-[0_0_30px_rgba(8,159,239,0.15)] transition-all group"
              >
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-white/10 to-white/5 border border-white/20 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="h-5 w-5 text-aether" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-white mb-1 truncate">
                      {companyName} — {android.name}
                    </h3>
                    <p className="text-xs text-white-secondary">Niche: {niche}</p>
                  </div>
                </div>
                <p className="text-sm text-white-secondary line-clamp-2 mb-4">{android.prompt.substring(0, 80)}...</p>
                <Button
                  variant="outline"
                  className="w-full border-aether text-aether hover:bg-aether hover:text-white bg-transparent group-hover:shadow-[0_0_20px_rgba(8,159,239,0.3)] transition-all"
                  asChild
                >
                  <Link href={`/demo/${android.id}`}>
                    <Play className="h-4 w-4 mr-2" />
                    Test Demo
                  </Link>
                </Button>
              </div>
            )
          })}
        </div>
      )}

      <div className="p-6 rounded-xl glass glass-border bg-gradient-to-br from-purple-500/5 to-transparent border-purple-500/20">
        <h3 className="text-lg font-semibold text-white mb-2">Ready to send real messages?</h3>
        <p className="text-white-secondary mb-4">
          Complete A2P registration and launch your first campaign to start reactivating leads.
        </p>
        <Button
          variant="outline"
          asChild
          className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10 bg-transparent"
        >
          <Link href="/dashboard?tab=settings">Setup SMS</Link>
        </Button>
      </div>
    </div>
  )
}
