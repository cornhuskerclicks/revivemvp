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

    const { phone_number, country_code } = await req.json()

    // Phone number costs: $1 setup + $2/month recurring
    const SETUP_FEE = 1.0
    const MONTHLY_FEE = 2.0

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

    // Create payment intent for setup fee
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(SETUP_FEE * 100), // Convert to cents
      currency: "usd",
      customer: customerId,
      metadata: {
        user_id: user.id,
        type: "phone_number_setup",
        phone_number,
        country_code,
        monthly_fee: MONTHLY_FEE.toString(),
      },
      description: `Phone Number Setup: ${phone_number}`,
    })

    // Create subscription for monthly recurring charge
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Phone Number: ${phone_number}`,
              description: "Monthly phone number rental",
            },
            unit_amount: Math.round(MONTHLY_FEE * 100),
            recurring: {
              interval: "month",
            },
          },
        },
      ],
      metadata: {
        user_id: user.id,
        type: "phone_number_monthly",
        phone_number,
      },
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      setupFee: SETUP_FEE,
      monthlyFee: MONTHLY_FEE,
      subscriptionId: subscription.id,
    })
  } catch (err: any) {
    console.error("[v0] Phone payment error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
