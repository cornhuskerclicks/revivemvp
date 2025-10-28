"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function deleteAndroid(androidId: string) {
  try {
    const supabase = await createClient()

    // Get the authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      throw new Error("Unauthorized")
    }

    // Delete the android (cascade will handle sessions and messages)
    const { error } = await supabase.from("androids").delete().eq("id", androidId).eq("user_id", user.id)

    if (error) throw error

    // Revalidate the library page
    revalidatePath("/library")

    return { success: true }
  } catch (error) {
    console.error("Error deleting android:", error)
    return { success: false, error: "Failed to delete android" }
  }
}
