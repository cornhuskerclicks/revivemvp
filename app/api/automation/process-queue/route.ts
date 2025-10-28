import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Verify this is called from a cron job or authorized source
    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all messages due to be sent
    const { data: dueMessages, error: queueError } = await supabase.rpc("process_due_messages")

    if (queueError) {
      console.error("[v0] Error fetching due messages:", queueError)
      throw queueError
    }

    if (!dueMessages || dueMessages.length === 0) {
      return NextResponse.json({ success: true, processed: 0, message: "No messages due" })
    }

    console.log(`[v0] Processing ${dueMessages.length} due messages`)

    const results = {
      sent: 0,
      failed: 0,
      errors: [] as any[],
    }

    // Process each message
    for (const msg of dueMessages) {
      try {
        // Get Twilio credentials for this campaign
        const { data: campaign } = await supabase
          .from("sms_campaigns")
          .select("*, twilio_accounts!inner(*)")
          .eq("id", msg.campaign_id)
          .single()

        if (!campaign || !campaign.twilio_accounts) {
          throw new Error("No Twilio account configured for campaign")
        }

        const twilioAccount = campaign.twilio_accounts
        const fromNumber = campaign.twilio_phone_number

        // Send via Twilio
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccount.account_sid}/Messages.json`
        const authHeader = `Basic ${Buffer.from(`${twilioAccount.account_sid}:${twilioAccount.auth_token}`).toString("base64")}`

        const response = await fetch(twilioUrl, {
          method: "POST",
          headers: {
            Authorization: authHeader,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            To: msg.phone_number,
            From: fromNumber,
            Body: msg.message_body,
          }),
        })

        const twilioData = await response.json()

        if (response.ok) {
          // Mark queue item as sent
          await supabase
            .from("automation_queue")
            .update({
              status: "sent",
              processed_at: new Date().toISOString(),
            })
            .eq("campaign_id", msg.campaign_id)
            .eq("contact_id", msg.contact_id)
            .eq("message_number", msg.message_number)

          // Update contact status
          const statusMap: Record<number, string> = {
            1: "1st_sent",
            2: "2nd_sent",
            3: "3rd_sent",
          }

          await supabase
            .from("campaign_contacts")
            .update({
              status: statusMap[msg.message_number] || "1st_sent",
              last_message_sent_at: new Date().toISOString(),
              message_count: msg.message_number,
            })
            .eq("id", msg.contact_id)

          // Log message
          await supabase.from("sms_messages").insert({
            campaign_id: msg.campaign_id,
            contact_id: msg.contact_id,
            message_body: msg.message_body,
            message_type: `sequence_${msg.message_number}`,
            sequence_number: msg.message_number,
            direction: "outbound",
            status: "sent",
            twilio_sid: twilioData.sid,
            sent_at: new Date().toISOString(),
          })

          // Schedule next message if not the last one
          if (msg.message_number < 3) {
            await supabase.rpc("schedule_next_message", {
              p_contact_id: msg.contact_id,
              p_campaign_id: msg.campaign_id,
              p_current_message_number: msg.message_number,
            })
          }

          results.sent++
        } else {
          throw new Error(twilioData.message || "Twilio API error")
        }
      } catch (error: any) {
        console.error(`[v0] Error sending message to ${msg.phone_number}:`, error)

        // Mark as failed
        await supabase
          .from("automation_queue")
          .update({
            status: "failed",
            error_message: error.message,
            processed_at: new Date().toISOString(),
          })
          .eq("campaign_id", msg.campaign_id)
          .eq("contact_id", msg.contact_id)
          .eq("message_number", msg.message_number)

        results.failed++
        results.errors.push({
          phone: msg.phone_number,
          error: error.message,
        })
      }
    }

    // Check for dormant contacts to restart
    const { data: restartedCount } = await supabase.rpc("restart_dormant_contacts")

    console.log(`[v0] Processed ${results.sent} messages, ${results.failed} failed, ${restartedCount || 0} restarted`)

    return NextResponse.json({
      success: true,
      processed: dueMessages.length,
      sent: results.sent,
      failed: results.failed,
      restarted: restartedCount || 0,
      errors: results.errors,
    })
  } catch (error: any) {
    console.error("[v0] Automation queue processing error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Automation queue processor",
    note: "Use POST with cron secret to process queue",
  })
}
