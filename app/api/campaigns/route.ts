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
    const { name, twilioPhoneNumber, batchSize, leads, messages, dripSize, dripIntervalDays, messageIntervals } = body

    const { data: campaign, error: campaignError } = await supabase
      .from("sms_campaigns")
      .insert({
        user_id: user.id,
        name,
        twilio_phone_number: twilioPhoneNumber,
        batch_size: batchSize,
        total_leads: leads.length,
        status: "draft",
        drip_size: dripSize || 100,
        drip_interval_days: dripIntervalDays || 3,
        message_interval_days: messageIntervals || [2, 5, 30],
      })
      .select()
      .single()

    if (campaignError) throw campaignError

    const contactsToInsert = leads.map((lead: any) => ({
      campaign_id: campaign.id,
      lead_name: lead.lead_name,
      phone_number: lead.phone_number,
      tags: lead.tags || [],
      status: "uncontacted",
    }))

    const { error: contactsError } = await supabase.from("campaign_contacts").insert(contactsToInsert)

    if (contactsError) throw contactsError

    // Store message templates
    const messagesToInsert = messages.map((msg: string, index: number) => ({
      campaign_id: campaign.id,
      message_body: msg,
      message_type: `sequence_${index + 1}`,
      sequence_number: index + 1,
      direction: "outbound",
      status: "pending",
    }))

    const { error: messagesError } = await supabase.from("sms_messages").insert(messagesToInsert)

    if (messagesError) throw messagesError

    // Log audit
    await supabase.from("campaign_audit_logs").insert({
      campaign_id: campaign.id,
      user_id: user.id,
      action: "campaign_created",
      details: { name, total_leads: leads.length },
    })

    return NextResponse.json({ success: true, campaign })
  } catch (error: any) {
    console.error("[v0] Campaign creation error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
