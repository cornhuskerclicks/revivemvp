"use server"

import { createClient } from "@/lib/supabase/server"

export async function getMessages(sessionId: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true })

    if (error) throw error

    return { success: true, messages: data }
  } catch (error) {
    console.error("Error getting messages:", error)
    return { success: false, error: "Failed to get messages" }
  }
}
