"use server"

import { generateText } from "ai"
import { createClient } from "@/lib/supabase/server"
import type { Message } from "@/lib/types"

export async function sendMessage(sessionId: string, userMessage: string, systemPrompt: string) {
  try {
    const supabase = await createClient()

    // Save user message
    const { error: userError } = await supabase.from("messages").insert({
      session_id: sessionId,
      role: "user",
      content: userMessage,
    })

    if (userError) throw userError

    // Get conversation history
    const { data: history } = await supabase
      .from("messages")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true })
      .limit(20)

    // Build messages array with system prompt
    const messages = [
      { role: "system" as const, content: systemPrompt },
      ...(history?.map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })) || []),
    ]

    // Generate AI response with SMS-style settings
    const { text } = await generateText({
      model: "openai/gpt-4o",
      messages,
      temperature: 0.7,
      maxTokens: 150, // Keep responses short like SMS
    })

    // Save assistant message
    const { data: assistantMessage, error: assistantError } = await supabase
      .from("messages")
      .insert({
        session_id: sessionId,
        role: "assistant",
        content: text,
      })
      .select()
      .single()

    if (assistantError) throw assistantError

    return { success: true, assistantMessage: assistantMessage as Message }
  } catch (error) {
    console.error("Error sending message:", error)
    return { success: false, error: "Failed to send message" }
  }
}
