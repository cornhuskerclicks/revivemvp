import { headers } from "next/headers"
import { NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@supabase/supabase-js"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
})

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(req: Request) {
  const body = await req.text()
  const headersList = await headers()
  const sig = headersList.get("stripe-signature")

  if (!sig) {
    return NextResponse.json({ error: "No signature" }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    console.error("[v0] Webhook signature verification failed:", err.message)
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  console.log("[v0] Stripe webhook event:", event.type)

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.user_id
        const planId = session.metadata?.plan_id

        if (!userId || !planId) {
          console.error("[v0] Missing metadata in checkout session")
          break
        }

        // Get plan details
        const { data: plan } = await supabase.from("billing_plans").select("monthly_credits").eq("id", planId).single()

        // Create or update user billing record
        await supabase.from("user_billing").upsert({
          user_id: userId,
          plan_id: planId,
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: session.subscription as string,
          credits_remaining: plan?.monthly_credits || 0,
          renew_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          status: "active",
        })

        console.log("[v0] Billing record created for user:", userId)
        break
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        // Get user billing record
        const { data: userBilling } = await supabase
          .from("user_billing")
          .select("plan_id, user_id")
          .eq("stripe_customer_id", customerId)
          .single()

        if (!userBilling) {
          console.error("[v0] No billing record found for customer:", customerId)
          break
        }

        // Get plan credits
        const { data: plan } = await supabase
          .from("billing_plans")
          .select("monthly_credits")
          .eq("id", userBilling.plan_id)
          .single()

        // Renew credits
        await supabase
          .from("user_billing")
          .update({
            credits_remaining: plan?.monthly_credits || 0,
            renew_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            status: "active",
          })
          .eq("stripe_customer_id", customerId)

        console.log("[v0] Credits renewed for user:", userBilling.user_id)
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        // Mark subscription as canceled
        await supabase.from("user_billing").update({ status: "canceled" }).eq("stripe_customer_id", customerId)

        console.log("[v0] Subscription canceled for customer:", customerId)
        break
      }

      default:
        console.log("[v0] Unhandled event type:", event.type)
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error("[v0] Webhook processing error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
