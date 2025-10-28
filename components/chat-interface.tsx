"use client"
import { useRef, useEffect, useState } from "react"
import type React from "react"

import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Send, ChevronDown, ChevronUp } from "lucide-react"
import type { Android } from "@/lib/types"

interface ChatInterfaceProps {
  android: Android
}

function MessageSkeleton() {
  return (
    <div className="flex justify-start">
      <div className="max-w-[75%] rounded-2xl px-4 py-2.5 bg-muted">
        <div className="space-y-2 animate-pulse">
          <div className="h-3 rounded bg-muted-foreground/20 w-48" />
          <div className="h-3 rounded bg-muted-foreground/20 w-32" />
        </div>
      </div>
    </div>
  )
}

function extractFirstMessage(prompt: string): string {
  const match = prompt.match(/FIRST MESSAGE SENT:\s*\n(.*?)(?=\n\n|$)/s)
  if (match && match[1]) {
    return match[1].trim()
  }
  return "Hi! This is your assistant. Did you recently inquire about our services?"
}

export default function ChatInterface({ android }: ChatInterfaceProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [showOriginal, setShowOriginal] = useState(true)
  const [input, setInput] = useState("")

  const firstMessage = extractFirstMessage(android.prompt || "")

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: `/api/chat?androidId=${android.id}`,
    }),
  })

  const isLoading = status === "in_progress"

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    sendMessage({ text: input.trim() })
    setInput("")
  }

  return (
    <Card className="h-[600px] max-h-[600px] flex flex-col glass glass-border">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="text-white">{android.name}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0 min-h-0 overflow-hidden">
        <div className="flex-shrink-0 p-3 bg-black/40 border-b border-white/10">
          <p className="text-sm mb-2 text-white-secondary">
            The user has already received your first SMS. This chat starts with their reply.
          </p>
          <button
            onClick={() => setShowOriginal(!showOriginal)}
            className="text-xs underline flex items-center gap-1 text-white-secondary hover:text-aether"
          >
            {showOriginal ? (
              <>
                <ChevronUp className="h-3 w-3" />
                Hide original message
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3" />
                Show original message
              </>
            )}
          </button>
          {showOriginal && (
            <div className="mt-2 p-2 text-xs rounded bg-black/60 text-white border border-white/10">
              "{firstMessage}"
            </div>
          )}
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-white-secondary">Start the conversation...</p>
            </div>
          ) : (
            messages.map((message) => {
              const textContent =
                typeof message.content === "string"
                  ? message.content
                  : message.parts
                    ? message.parts
                        .filter((part: any) => part.type === "text")
                        .map((part: any) => part.text)
                        .join("")
                    : ""

              return (
                <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                      message.role === "user" ? "bg-aether text-white" : "bg-black/60 text-white border border-white/10"
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{textContent}</p>
                  </div>
                </div>
              )
            })
          )}
          {isLoading && <MessageSkeleton />}
          <div ref={messagesEndRef} />
        </div>

        <div className="flex-shrink-0 p-4 border-t border-white/10">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type the user's reply here..."
              disabled={isLoading}
              autoComplete="off"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/50"
            />
            <Button
              type="submit"
              disabled={isLoading || !input.trim()}
              size="icon"
              className="bg-aether text-white hover:aether-glow"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  )
}
