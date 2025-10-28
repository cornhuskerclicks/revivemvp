import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { accountSid, authToken, phoneNumber } = body

    if (!accountSid || !authToken) {
      return NextResponse.json({ error: "Account SID and Auth Token are required" }, { status: 400 })
    }

    // Verify Twilio credentials by making a test API call
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`
    const authHeader = `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`

    const verifyResponse = await fetch(twilioUrl, {
      headers: {
        Authorization: authHeader,
      },
    })

    if (!verifyResponse.ok) {
      return NextResponse.json({ error: "Invalid Twilio credentials" }, { status: 400 })
    }

    // Check if account already exists
    const { data: existingAccount } = await supabase.from("twilio_accounts").select("*").eq("user_id", user.id).single()

    if (existingAccount) {
      // Update existing account
      const { error: updateError } = await supabase
        .from("twilio_accounts")
        .update({
          account_sid: accountSid,
          auth_token: authToken,
          phone_number: phoneNumber,
          is_verified: true,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)

      if (updateError) throw updateError
    } else {
      // Create new account
      const { error: insertError } = await supabase.from("twilio_accounts").insert({
        user_id: user.id,
        account_sid: accountSid,
        auth_token: authToken,
        phone_number: phoneNumber,
        is_verified: true,
      })

      if (insertError) throw insertError
    }

    return NextResponse.json({ success: true, message: "Twilio account connected successfully" })
  } catch (error: any) {
    console.error("[v0] Twilio connection error:", error)
    return NextResponse.json({ error: error.message || "Failed to connect Twilio account" }, { status: 500 })
  }
}
