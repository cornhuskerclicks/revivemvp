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

    if (!company_name || !ein || !vertical || !contact_name || !contact_email) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          required: ["company_name", "ein", "vertical", "contact_name", "contact_email"],
        },
        { status: 400 },
      )
    }

    let { data: twilioAccount } = await supabase.from("twilio_accounts").select("*").eq("user_id", user.id).single()

    if (!twilioAccount) {
      // Create subaccount if it doesn't exist
      const createResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/twilio/subaccount/create`, {
        method: "POST",
        headers: {
          Cookie: req.headers.get("cookie") || "",
        },
      })

      if (!createResponse.ok) {
        throw new Error("Failed to create Twilio subaccount")
      }

      const createData = await createResponse.json()
      twilioAccount = createData.account
    }

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
      throw new Error(`Failed to register brand: ${error}`)
    }

    const brand = await brandResponse.json()

    const { data: registration, error: dbError } = await supabase
      .from("a2p_registrations")
      .update({
        brand_id: brand.sid,
        status: "brand_registered",
        company_name,
        ein,
        vertical,
        contact_name,
        contact_email,
      })
      .eq("user_id", user.id)
      .select()
      .single()

    if (dbError) {
      console.error("[v0] Database error:", dbError)
      throw new Error(`Database error: ${dbError.message}`)
    }

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
