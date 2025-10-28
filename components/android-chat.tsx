"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Play, ChevronDown, ChevronUp, RefreshCw } from "lucide-react"
import type { Android, Session } from "@/lib/types"
import ChatInterface from "@/components/chat-interface"
import { createSession } from "@/app/actions/create-session"
import Link from "next/link"

interface AndroidChatProps {
  android: Android
  sessions: Session[]
  userId: string
}

export default function AndroidChat({ android, sessions: initialSessions, userId }: AndroidChatProps) {
  const [sessions, setSessions] = useState(initialSessions)
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isPromptExpanded, setIsPromptExpanded] = useState(false)
  const [isUpdatingPrompt, setIsUpdatingPrompt] = useState(false)

  const handleNewSession = async () => {
    setIsCreating(true)
    try {
      const result = await createSession(android.id, userId, `Demo ${new Date().toLocaleDateString()}`)
      if (result.success && result.session) {
        setSessions([result.session, ...sessions])
        setActiveSessionId(result.session.id)
      }
    } catch (error) {
      console.error("Error creating session:", error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleUpdatePrompt = async () => {
    setIsUpdatingPrompt(true)
    try {
      const response = await fetch("/api/update-grace-prompt", {
        method: "POST",
      })
      const result = await response.json()

      if (result.success) {
        alert("✅ Prompt updated! Page will refresh to load the new prompt.")
        window.location.reload()
      } else {
        alert("❌ Error: " + (result.error || "Failed to update prompt"))
        setIsUpdatingPrompt(false)
      }
    } catch (error) {
      console.error("Error updating prompt:", error)
      alert("❌ Error updating prompt. Check console for details.")
      setIsUpdatingPrompt(false)
    }
  }

  const activeSession = sessions.find((s) => s.id === activeSessionId)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid lg:grid-cols-[320px_1fr] gap-6">
        <div className="space-y-6">
          <Card className="glass glass-border">
            <CardHeader>
              <CardTitle className="text-white">{android.name}</CardTitle>
              <CardDescription className="text-white-secondary">AI Android</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-white">Prompt Preview</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsPromptExpanded(!isPromptExpanded)}
                    className="h-6 px-2 text-white hover:text-aether"
                  >
                    {isPromptExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </Button>
                </div>
                <div
                  className={`text-xs text-white-secondary bg-black/40 rounded-lg p-3 overflow-auto scrollbar-hide transition-all border border-white/10 ${
                    isPromptExpanded ? "max-h-96" : "max-h-24"
                  }`}
                >
                  <pre className="whitespace-pre-wrap font-mono text-[10px] leading-relaxed text-white">
                    {android.prompt}
                  </pre>
                </div>
              </div>
              {android.name === "Grace" && (
                <Button
                  variant="secondary"
                  className="w-full bg-aether text-white hover:aether-glow"
                  onClick={handleUpdatePrompt}
                  disabled={isUpdatingPrompt}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isUpdatingPrompt ? "animate-spin" : ""}`} />
                  Update to Coffee Date Prompt
                </Button>
              )}
              <Button
                variant="outline"
                className="w-full border-aether text-aether hover:bg-aether hover:text-white bg-transparent"
                asChild
              >
                <Link href="/dashboard">Back to Dashboard</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="glass glass-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-white">Sessions</CardTitle>
                <Button
                  size="sm"
                  onClick={handleNewSession}
                  disabled={isCreating}
                  className="bg-aether text-white hover:aether-glow"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {sessions.length === 0 ? (
                <p className="text-sm text-white-secondary">No sessions yet</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-auto scrollbar-hide">
                  {sessions.map((session) => (
                    <button
                      key={session.id}
                      onClick={() => setActiveSessionId(session.id)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        activeSessionId === session.id
                          ? "bg-aether text-white border-aether"
                          : "glass glass-border text-white hover:border-aether"
                      }`}
                    >
                      <p className="text-sm font-medium">{session.title}</p>
                      <p className="text-xs opacity-70">{new Date(session.created_at).toLocaleDateString()}</p>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          {!activeSession ? (
            <Card className="h-[600px] flex items-center justify-center glass glass-border">
              <CardContent className="text-center">
                <Play className="h-12 w-12 text-aether mx-auto mb-4" />
                <p className="text-lg font-medium mb-2 text-white">No Active Session</p>
                <p className="text-sm text-white-secondary mb-4">Create a new session to start chatting</p>
                <Button
                  onClick={handleNewSession}
                  disabled={isCreating}
                  className="bg-aether text-white hover:aether-glow"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Session
                </Button>
              </CardContent>
            </Card>
          ) : (
            <ChatInterface android={android} />
          )}
        </div>
      </div>
    </div>
  )
}
