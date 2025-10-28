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

    const { company_name, ein, vertical, contact_name, contact_email } = await req.json()

    // Validate required fields
    if (!company_name || !ein || !vertical || !contact_name || !contact_email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Create Twilio subaccount
    const subaccountResponse = await fetch("https://api.twilio.com/2010-04-01/Accounts.json", {
      method: "POST",
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        FriendlyName: `${company_name} Subaccount`,
      }),
    })

    if (!subaccountResponse.ok) {
      const error = await subaccountResponse.text()
      throw new Error(`Failed to create subaccount: ${error}`)
    }

    const subaccount = await subaccountResponse.json()

    // Register A2P brand via Twilio Messaging API
    const brandResponse = await fetch("https://messaging.twilio.com/v1/a2p/BrandRegistrations", {
      method: "POST",
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        CustomerProfileBundleSid: "auto", // Twilio will auto-create
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
      throw new Error(`Failed to register brand: ${error}`)
    }

    const brand = await brandResponse.json()

    // Store in database
    const { data: registration, error: dbError } = await supabase
      .from("a2p_registrations")
      .insert({
        user_id: user.id,
        subaccount_sid: subaccount.sid,
        brand_id: brand.sid,
        status: "brand_registered",
        company_name,
        ein,
        vertical,
        contact_name,
        contact_email,
      })
      .select()
      .single()

    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`)
    }

    // Store Twilio account credentials
    await supabase.from("twilio_accounts").insert({
      user_id: user.id,
      account_sid: subaccount.sid,
      auth_token: subaccount.auth_token,
      subaccount_sid: subaccount.sid,
    })

    return NextResponse.json({
      success: true,
      subaccount_sid: subaccount.sid,
      brand_id: brand.sid,
      registration,
    })
  } catch (err: any) {
    console.error("[v0] Brand Registration Error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
