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
    const { campaignId, messageBody, contacts } = body

    if (!campaignId || !messageBody || !contacts || contacts.length === 0) {
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

    for (const contact of contacts) {
      try {
        const response = await fetch(twilioUrl, {
          method: "POST",
          headers: {
            Authorization: authHeader,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            To: contact.phone_number,
            From: campaign.twilio_phone_number,
            Body: messageBody,
          }),
        })

        const data = await response.json()

        if (response.ok) {
          await supabase.rpc("log_sms_message", {
            p_campaign_id: campaignId,
            p_contact_id: contact.id,
            p_direction: "outbound",
            p_message_body: messageBody,
            p_status: "sent",
            p_twilio_sid: data.sid,
          })

          await supabase.rpc("log_campaign_event", {
            p_campaign_id: campaignId,
            p_event_type: "Message Sent",
            p_details: `Message sent to ${contact.phone_number}`,
          })

          results.push({ phoneNumber: contact.phone_number, success: true, sid: data.sid })
        } else {
          await supabase.rpc("log_sms_message", {
            p_campaign_id: campaignId,
            p_contact_id: contact.id,
            p_direction: "outbound",
            p_message_body: messageBody,
            p_status: "failed",
            p_twilio_sid: null,
          })

          await supabase
            .from("sms_messages")
            .update({ error_message: data.message })
            .eq("campaign_id", campaignId)
            .eq("contact_id", contact.id)
            .eq("status", "failed")
            .order("created_at", { ascending: false })
            .limit(1)

          results.push({ phoneNumber: contact.phone_number, success: false, error: data.message })
        }
      } catch (error: any) {
        results.push({ phoneNumber: contact.phone_number, success: false, error: error.message })
      }
    }

    return NextResponse.json({ success: true, results })
  } catch (error: any) {
    console.error("[v0] Twilio send error:", error)
    return NextResponse.json({ error: error.message || "Failed to send messages" }, { status: 500 })
  }
}
