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

    const { plan_id } = await req.json()

    console.log("[v0] Creating checkout session for plan_id:", plan_id)

    // Get plan details
    const { data: plan, error: planError } = await supabase.from("billing_plans").select("*").eq("id", plan_id).single()

    console.log("[v0] Plan data:", plan)
    console.log("[v0] Plan error:", planError)

    if (planError || !plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 })
    }

    if (!plan.stripe_price_id) {
      console.error("[v0] Missing stripe_price_id for plan:", plan.name)
      return NextResponse.json(
        {
          error: `Stripe price ID not configured for ${plan.name} plan. Please contact support.`,
        },
        { status: 400 },
      )
    }

    console.log("[v0] Using stripe_price_id:", plan.stripe_price_id)

    // Check if user already has a Stripe customer ID
    const { data: existingBilling } = await supabase
      .from("user_billing")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .single()

    let customerId = existingBilling?.stripe_customer_id

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          user_id: user.id,
        },
      })
      customerId = customer.id
      console.log("[v0] Created new Stripe customer:", customerId)
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [
        {
          price: plan.stripe_price_id,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard?canceled=true`,
      metadata: {
        user_id: user.id,
        plan_id: plan.id,
      },
    })

    console.log("[v0] Checkout session created:", session.id)
    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    console.error("[v0] Billing session error:", err)
    return NextResponse.json(
      {
        error: err.message,
        details: err.type || "unknown_error",
      },
      { status: 500 },
    )
  }
}
