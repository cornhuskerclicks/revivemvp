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

    if (body && from) {
      // Convert form data to JSON payload for RPC
      const payload = {
        MessageSid: messageSid,
        MessageStatus: messageStatus,
        From: from,
        To: to,
        Body: body,
      }

      // Call the RPC function to handle inbound message
      const { error } = await supabase.rpc("handle_inbound_message", { payload })

      if (error) {
        console.error("[v0] Error handling inbound message:", error)
      }

      const { data: contact } = await supabase
        .from("campaign_contacts")
        .select("id, campaign_id")
        .eq("phone_number", from)
        .single()

      if (contact) {
        // Use the new RPC function to mark as responded and cancel queue
        await supabase.rpc("mark_contact_responded", {
          p_phone_number: from,
          p_campaign_id: contact.campaign_id,
        })

        await supabase
          .from("campaign_contacts")
          .update({
            last_message_at: new Date().toISOString(),
          })
          .eq("id", contact.id)
      }
    }

    // Handle delivery status updates
    if (messageSid && messageStatus) {
      const { data: message } = await supabase.from("sms_messages").select("*").eq("twilio_sid", messageSid).single()

      if (message) {
        const updateData: any = { status: messageStatus }

        if (messageStatus === "delivered") {
          updateData.delivered_at = new Date().toISOString()
        }

        await supabase.from("sms_messages").update(updateData).eq("twilio_sid", messageSid)

        if (messageStatus === "delivered") {
          await supabase.rpc("log_campaign_event", {
            p_campaign_id: message.campaign_id,
            p_event_type: "Message Delivered",
            p_details: `Message ${messageSid} delivered successfully`,
          })
        } else if (messageStatus === "failed" || messageStatus === "undelivered") {
          await supabase.rpc("log_campaign_event", {
            p_campaign_id: message.campaign_id,
            p_event_type: "Message Failed",
            p_details: `Message ${messageSid} failed with status: ${messageStatus}`,
          })
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Twilio webhook error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
