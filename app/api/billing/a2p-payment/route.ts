import { NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@/lib/supabase/server"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
})

export async function POST(req: Request) {
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

    // A2P registration costs: $4 brand + $10 campaign = $14 total
    const BRAND_FEE = 4.0
    const CAMPAIGN_FEE = 10.0
    const TOTAL_FEE = BRAND_FEE + CAMPAIGN_FEE

    // Get or create Stripe customer
    const { data: billing } = await supabase
      .from("user_billing")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .single()

    let customerId = billing?.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { user_id: user.id },
      })
      customerId = customer.id

      await supabase.from("user_billing").upsert({
        user_id: user.id,
        stripe_customer_id: customerId,
      })
    }

    // Create payment intent for A2P registration
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(TOTAL_FEE * 100), // Convert to cents
      currency: "usd",
      customer: customerId,
      metadata: {
        user_id: user.id,
        type: "a2p_registration",
        brand_fee: BRAND_FEE.toString(),
        campaign_fee: CAMPAIGN_FEE.toString(),
      },
      description: "A2P Brand & Campaign Registration",
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      amount: TOTAL_FEE,
    })
  } catch (err: any) {
    console.error("[v0] A2P payment error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
