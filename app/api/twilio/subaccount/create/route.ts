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

    // Get user profile for company name
    const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).single()

    const friendlyName = profile?.full_name || user.email?.split("@")[0] || "User"

    const subaccountResponse = await fetch("https://api.twilio.com/2010-04-01/Accounts.json", {
      method: "POST",
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        FriendlyName: `${friendlyName} - RE:VIVE Subaccount`,
      }),
    })

    if (!subaccountResponse.ok) {
      const error = await subaccountResponse.text()
      console.error("[v0] Subaccount creation failed:", error)
      throw new Error(`Failed to create subaccount: ${error}`)
    }

    const subaccount = await subaccountResponse.json()

    const { data: twilioAccount, error: dbError } = await supabase
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
      throw new Error(`Database error: ${dbError.message}`)
    }

    await supabase.from("a2p_registrations").insert({
      user_id: user.id,
      subaccount_sid: subaccount.sid,
      status: "pending",
    })

    return NextResponse.json({
      success: true,
      subaccount_sid: subaccount.sid,
      account: twilioAccount,
    })
  } catch (err: any) {
    console.error("[v0] Subaccount Creation Error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
