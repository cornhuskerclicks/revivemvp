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

    const { data: campaign, error: campaignError } = await supabase
      .from("sms_campaigns")
      .select("*")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    }

    const { data: contacts } = await supabase
      .from("campaign_contacts")
      .select("country_code")
      .eq("campaign_id", params.id)
      .limit(1)

    const hasUSNumbers = contacts?.some((c) => c.country_code === "US" || !c.country_code)

    if (hasUSNumbers) {
      const { data: a2pReg } = await supabase.from("a2p_registrations").select("*").eq("user_id", user.id).single()

      if (!a2pReg || a2pReg.payment_status !== "paid" || !a2pReg.campaign_id) {
        return NextResponse.json(
          {
            error: "A2P registration required for US numbers. Please complete A2P setup and payment in Settings.",
            requires_a2p: true,
            requires_payment: !a2pReg || a2pReg.payment_status !== "paid",
          },
          { status: 402 },
        )
      }
    }

    const { data: billing } = await supabase.from("user_billing").select("*").eq("user_id", user.id).single()

    if (!billing || billing.status !== "active" || (billing.sms_credits_remaining || 0) <= 0) {
      return NextResponse.json(
        {
          error: "Active subscription required to send messages. Please upgrade your plan.",
          requires_subscription: true,
        },
        { status: 402 },
      )
    }

    const { error: updateError } = await supabase
      .from("sms_campaigns")
      .update({ status: "active" })
      .eq("id", params.id)
      .eq("user_id", user.id)

    if (updateError) {
      throw updateError
    }

    const { data: queueResult, error: queueError } = await supabase.rpc("queue_campaign_batch", {
      p_campaign_id: params.id,
      p_batch_size: campaign.drip_size || 100,
    })

    if (queueError) {
      console.error("[v0] Error queuing batch:", queueError)
      throw queueError
    }

    await supabase.from("campaign_audit_logs").insert({
      campaign_id: params.id,
      user_id: user.id,
      action: "campaign_started",
      details: {
        batch_size: campaign.drip_size,
        queued_contacts: queueResult,
        message_intervals: campaign.message_interval_days,
        has_us_numbers: hasUSNumbers,
      },
    })

    return NextResponse.json({
      success: true,
      message: "Campaign started successfully",
      queued_contacts: queueResult,
      drip_size: campaign.drip_size,
      intervals: campaign.message_interval_days,
    })
  } catch (error: any) {
    console.error("[v0] Error starting campaign:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
