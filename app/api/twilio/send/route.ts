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
    const { campaignId, messageBody, phoneNumbers } = body

    if (!campaignId || !messageBody || !phoneNumbers || phoneNumbers.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get campaign details
    const { data: campaign, error: campaignError } = await supabase
      .from("sms_campaigns")
      .select("*, twilio_accounts!inner(*)")
      .eq("id", campaignId)
      .eq("user_id", user.id)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    }

    const twilioAccount = campaign.twilio_accounts
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccount.account_sid}/Messages.json`
    const authHeader = `Basic ${Buffer.from(`${twilioAccount.account_sid}:${twilioAccount.auth_token}`).toString("base64")}`

    const results = []

    // Send messages to each phone number
    for (const phoneNumber of phoneNumbers) {
      try {
        const response = await fetch(twilioUrl, {
          method: "POST",
          headers: {
            Authorization: authHeader,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            To: phoneNumber,
            From: campaign.twilio_phone_number,
            Body: messageBody,
          }),
        })

        const data = await response.json()

        if (response.ok) {
          // Log successful message
          await supabase.from("sms_messages").insert({
            campaign_id: campaignId,
            message_body: messageBody,
            message_type: "outbound",
            direction: "outbound",
            status: "sent",
            twilio_sid: data.sid,
            sent_at: new Date().toISOString(),
          })

          // Update campaign stats
          await supabase.rpc("increment_campaign_sent", { campaign_id: campaignId })

          results.push({ phoneNumber, success: true, sid: data.sid })
        } else {
          // Log failed message
          await supabase.from("sms_messages").insert({
            campaign_id: campaignId,
            message_body: messageBody,
            message_type: "outbound",
            direction: "outbound",
            status: "failed",
            error_message: data.message,
          })

          results.push({ phoneNumber, success: false, error: data.message })
        }
      } catch (error: any) {
        results.push({ phoneNumber, success: false, error: error.message })
      }
    }

    return NextResponse.json({ success: true, results })
  } catch (error: any) {
    console.error("[v0] Twilio send error:", error)
    return NextResponse.json({ error: error.message || "Failed to send messages" }, { status: 500 })
  }
}
