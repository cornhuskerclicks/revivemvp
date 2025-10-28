import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const messageSid = formData.get("MessageSid") as string
    const messageStatus = formData.get("MessageStatus") as string
    const from = formData.get("From") as string
    const to = formData.get("To") as string
    const body = formData.get("Body") as string

    const supabase = await createClient()

    // Handle incoming message (reply from lead)
    if (body && from) {
      // Find the contact by phone number
      const { data: contact } = await supabase
        .from("campaign_contacts")
        .select("*, sms_campaigns(*)")
        .eq("phone_number", from)
        .single()

      if (contact) {
        // Log the incoming message
        await supabase.from("sms_messages").insert({
          campaign_id: contact.campaign_id,
          contact_id: contact.id,
          message_body: body,
          message_type: "reply",
          direction: "inbound",
          status: "received",
          twilio_sid: messageSid,
          created_at: new Date().toISOString(),
        })

        // Update contact status
        await supabase
          .from("campaign_contacts")
          .update({
            status: "replied",
            last_message_at: new Date().toISOString(),
          })
          .eq("id", contact.id)

        // Update campaign reply count
        await supabase.rpc("increment_campaign_replies", { campaign_id: contact.campaign_id })
      }
    }

    // Handle delivery status updates
    if (messageSid && messageStatus) {
      const { data: message } = await supabase.from("sms_messages").select("*").eq("twilio_sid", messageSid).single()

      if (message) {
        const updateData: any = { status: messageStatus }

        if (messageStatus === "delivered") {
          updateData.delivered_at = new Date().toISOString()
          // Update campaign delivered count
          await supabase.rpc("increment_campaign_delivered", { campaign_id: message.campaign_id })
        } else if (messageStatus === "failed" || messageStatus === "undelivered") {
          // Update campaign failed count
          await supabase.rpc("increment_campaign_failed", { campaign_id: message.campaign_id })
        }

        await supabase.from("sms_messages").update(updateData).eq("twilio_sid", messageSid)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Twilio webhook error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
