import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { campaign_name, use_case } = await req.json()

    // Validate required fields
    if (!campaign_name || !use_case) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get user's A2P registration
    const { data: registration, error: regError } = await supabase
      .from("a2p_registrations")
      .select("*")
      .eq("user_id", user.id)
      .single()

    if (regError || !registration) {
      return NextResponse.json({ error: "No brand registration found. Please register brand first." }, { status: 400 })
    }

    if (!registration.brand_id) {
      return NextResponse.json({ error: "Brand ID not found" }, { status: 400 })
    }

    // Register A2P campaign
    const campaignResponse = await fetch("https://messaging.twilio.com/v1/a2p/Campaigns", {
      method: "POST",
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        BrandRegistrationSid: registration.brand_id,
        CampaignUseCase: use_case,
        Description: `${campaign_name} - Lead reactivation campaign`,
        MessageFlow: "Outbound SMS for lead reactivation and appointment booking",
        MessageSamples: JSON.stringify([
          "Hi [Name], this is [Agent] from [Company]. We wanted to reconnect about your interest in [Service]. Are you still looking?",
          "Thanks for your interest! Would you like to schedule a quick call to discuss your needs?",
        ]),
        UsAppToPersonUsecase: use_case,
      }),
    })

    if (!campaignResponse.ok) {
      const error = await campaignResponse.text()
      throw new Error(`Failed to register campaign: ${error}`)
    }

    const campaign = await campaignResponse.json()

    // Update database
    const { data: updated, error: updateError } = await supabase
      .from("a2p_registrations")
      .update({
        campaign_id: campaign.sid,
        campaign_name,
        use_case,
        status: "campaign_registered",
      })
      .eq("user_id", user.id)
      .select()
      .single()

    if (updateError) {
      throw new Error(`Database error: ${updateError.message}`)
    }

    return NextResponse.json({
      success: true,
      campaign_id: campaign.sid,
      registration: updated,
    })
  } catch (err: any) {
    console.error("[v0] Campaign Registration Error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
