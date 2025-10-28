"use server"

import { createClient } from "@/lib/supabase/server"

export async function createSession(androidId: string, userId: string, title: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("sessions")
      .insert({
        android_id: androidId,
        user_id: userId,
        title,
        status: "active",
      })
      .select()
      .single()

    if (error) throw error

    return { success: true, session: data }
  } catch (error) {
    console.error("Error creating session:", error)
    return { success: false, error: "Failed to create session" }
  }
}
