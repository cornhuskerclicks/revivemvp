import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    console.log("[v0] Starting brand registration")

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      console.log("[v0] Auth error:", authError)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { company_name, ein, vertical, contact_name, contact_email, payment_intent_id } = await req.json()

    if (!company_name || !ein || !vertical || !contact_name || !contact_email) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          required: ["company_name", "ein", "vertical", "contact_name", "contact_email"],
        },
        { status: 400 },
      )
    }

    if (!payment_intent_id) {
      return NextResponse.json(
        {
          error: "Payment required",
          message: "A2P registration requires a $14 payment ($4 brand + $10 campaign)",
          payment_required: true,
        },
        { status: 402 },
      )
    }

    console.log("[v0] Checking for existing Twilio account")

    let { data: twilioAccount } = await supabase.from("twilio_accounts").select("*").eq("user_id", user.id).single()

    if (!twilioAccount) {
      console.log("[v0] No Twilio account found, creating subaccount")

      const subaccountResponse = await fetch("https://api.twilio.com/2010-04-01/Accounts.json", {
        method: "POST",
        headers: {
          Authorization:
            "Basic " +
            Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64"),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          FriendlyName: `${company_name} - RE:VIVE Subaccount`,
        }),
      })

      if (!subaccountResponse.ok) {
        const error = await subaccountResponse.text()
        console.error("[v0] Subaccount creation failed:", error)
        return NextResponse.json(
          {
            error: "Failed to create Twilio subaccount",
            details: error,
          },
          { status: 500 },
        )
      }

      const subaccount = await subaccountResponse.json()
      console.log("[v0] Subaccount created:", subaccount.sid)

      const { data: newAccount, error: dbError } = await supabase
        .from("twilio_accounts")
        .insert({
          user_id: user.id,
          account_sid: subaccount.sid,
          auth_token: subaccount.auth_token,
          subaccount_sid: subaccount.sid,
          is_verified: true,
        })
        .select()
        .single()

      if (dbError) {
        console.error("[v0] Database error:", dbError)
        return NextResponse.json({ error: `Database error: ${dbError.message}` }, { status: 500 })
      }

      twilioAccount = newAccount
    }

    console.log("[v0] Registering brand with Twilio")

    const brandResponse = await fetch("https://messaging.twilio.com/v1/a2p/BrandRegistrations", {
      method: "POST",
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        CustomerProfileBundleSid: "auto",
        A2PProfileBundleSid: "auto",
        BrandType: "STANDARD",
        CompanyName: company_name,
        Ein: ein,
        Vertical: vertical,
        Email: contact_email,
        FirstName: contact_name.split(" ")[0] || contact_name,
        LastName: contact_name.split(" ")[1] || "",
      }),
    })

    if (!brandResponse.ok) {
      const error = await brandResponse.text()
      console.error("[v0] Brand registration failed:", error)
      return NextResponse.json(
        {
          error: "Failed to register brand with Twilio",
          details: error,
        },
        { status: 500 },
      )
    }

    const brand = await brandResponse.json()

    console.log("[v0] Brand registered:", brand.sid)

    const { data: registration, error: dbError } = await supabase
      .from("a2p_registrations")
      .upsert(
        {
          user_id: user.id,
          subaccount_sid: twilioAccount.subaccount_sid,
          brand_id: brand.sid,
          status: "brand_registered",
          company_name,
          ein,
          vertical,
          contact_name,
          contact_email,
          stripe_payment_intent_id: payment_intent_id,
          payment_status: "paid",
          total_paid: 14.0,
        },
        {
          onConflict: "user_id",
        },
      )
      .select()
      .single()

    if (dbError) {
      console.error("[v0] Database error:", dbError)
      throw new Error(`Database error: ${dbError.message}`)
    }

    console.log("[v0] Brand registration complete")

    return NextResponse.json({
      success: true,
      subaccount_sid: twilioAccount.subaccount_sid,
      brand_id: brand.sid,
      registration,
    })
  } catch (err: any) {
    console.error("[v0] Brand Registration Error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
