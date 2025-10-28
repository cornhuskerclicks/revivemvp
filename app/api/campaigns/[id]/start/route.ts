import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Update campaign status to active
    const { error: updateError } = await supabase
      .from("sms_campaigns")
      .update({ status: "active" })
      .eq("id", params.id)
      .eq("user_id", user.id)

    if (updateError) {
      throw updateError
    }

    // Get campaign contacts to send first batch
    const { data: contacts } = await supabase
      .from("campaign_contacts")
      .select("*")
      .eq("campaign_id", params.id)
      .eq("status", "pending")
      .limit(50)

    // Trigger sending via Twilio (you can implement batch sending here)
    // For now, we just update the status

    return NextResponse.json({ success: true, message: "Campaign started" })
  } catch (error: any) {
    console.error("[v0] Error starting campaign:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
