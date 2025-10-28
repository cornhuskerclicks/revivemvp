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

    const { area_code } = await req.json()
    const areaCode = area_code || "402"

    // Get user's A2P registration
    const { data: registration, error: regError } = await supabase
      .from("a2p_registrations")
      .select("*")
      .eq("user_id", user.id)
      .single()

    if (regError || !registration) {
      return NextResponse.json({ error: "No A2P registration found" }, { status: 400 })
    }

    if (!registration.campaign_id) {
      return NextResponse.json({ error: "Campaign not registered. Please register campaign first." }, { status: 400 })
    }

    // Get Twilio account credentials
    const { data: twilioAccount, error: accountError } = await supabase
      .from("twilio_accounts")
      .select("*")
      .eq("user_id", user.id)
      .single()

    if (accountError || !twilioAccount) {
      return NextResponse.json({ error: "Twilio account not found" }, { status: 400 })
    }

    // Search for available phone numbers
    const searchResponse = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${twilioAccount.account_sid}/AvailablePhoneNumbers/US/Local.json?AreaCode=${areaCode}&SmsEnabled=true&Limit=1`,
      {
        headers: {
          Authorization:
            "Basic " + Buffer.from(`${twilioAccount.account_sid}:${twilioAccount.auth_token}`).toString("base64"),
        },
      },
    )

    if (!searchResponse.ok) {
      const error = await searchResponse.text()
      throw new Error(`Failed to search numbers: ${error}`)
    }

    const searchResult = await searchResponse.json()

    if (!searchResult.available_phone_numbers || searchResult.available_phone_numbers.length === 0) {
      return NextResponse.json({ error: `No available numbers in area code ${areaCode}` }, { status: 404 })
    }

    const phoneNumber = searchResult.available_phone_numbers[0].phone_number

    // Purchase the phone number
    const purchaseResponse = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${twilioAccount.account_sid}/IncomingPhoneNumbers.json`,
      {
        method: "POST",
        headers: {
          Authorization:
            "Basic " + Buffer.from(`${twilioAccount.account_sid}:${twilioAccount.auth_token}`).toString("base64"),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          PhoneNumber: phoneNumber,
          SmsUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://your-app.vercel.app"}/api/twilio/webhook`,
        }),
      },
    )

    if (!purchaseResponse.ok) {
      const error = await purchaseResponse.text()
      throw new Error(`Failed to purchase number: ${error}`)
    }

    const purchasedNumber = await purchaseResponse.json()

    // Update database
    const { data: updated, error: updateError } = await supabase
      .from("a2p_registrations")
      .update({
        phone_number: purchasedNumber.phone_number,
        status: "number_assigned",
      })
      .eq("user_id", user.id)
      .select()
      .single()

    if (updateError) {
      throw new Error(`Database error: ${updateError.message}`)
    }

    // Update Twilio account
    await supabase.from("twilio_accounts").update({ phone_number: purchasedNumber.phone_number }).eq("user_id", user.id)

    return NextResponse.json({
      success: true,
      phone_number: purchasedNumber.phone_number,
      registration: updated,
    })
  } catch (err: any) {
    console.error("[v0] Buy Number Error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
