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

    // Update campaign status to paused
    const { error: updateError } = await supabase
      .from("sms_campaigns")
      .update({ status: "paused" })
      .eq("id", params.id)
      .eq("user_id", user.id)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({ success: true, message: "Campaign paused" })
  } catch (error: any) {
    console.error("[v0] Error pausing campaign:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
