import { headers } from "next/headers"
import { NextResponse } from "next/server"
import Stripe from "stripe"
import { createServerClient } from "@/lib/supabase/server"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
})

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

  const supabase = await createServerClient()

  try {
    await supabase.from("stripe_webhook_logs").insert({
      event_type: event.type,
      event_data: event,
      processed: false,
    })

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

        const { error: upsertError } = await supabase.rpc("upsert_user_billing", {
          p_user_id: userId,
          p_plan_id: planId,
          p_stripe_customer_id: session.customer as string,
          p_stripe_subscription_id: session.subscription as string,
          p_credits_remaining: plan?.monthly_credits || 0,
          p_renew_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          p_status: "active",
        })

        if (upsertError) {
          console.error("[v0] Error upserting billing:", upsertError)
        }

        await supabase.rpc("log_billing_audit", {
          p_user_id: userId,
          p_event_type: "checkout.session.completed",
          p_event_data: JSON.stringify(session),
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

        const { error: renewError } = await supabase.rpc("renew_user_credits", {
          p_stripe_customer_id: customerId,
          p_credits: plan?.monthly_credits || 0,
        })

        if (renewError) {
          console.error("[v0] Error renewing credits:", renewError)
        }

        await supabase.rpc("log_billing_audit", {
          p_user_id: userBilling.user_id,
          p_event_type: "invoice.payment_succeeded",
          p_event_data: JSON.stringify(invoice),
        })

        console.log("[v0] Credits renewed for user:", userBilling.user_id)
        break
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        // Get user billing record
        const { data: userBilling } = await supabase
          .from("user_billing")
          .select("user_id")
          .eq("stripe_customer_id", customerId)
          .single()

        if (!userBilling) {
          console.error("[v0] No billing record found for customer:", customerId)
          break
        }

        const status =
          subscription.status === "active" ? "active" : subscription.status === "canceled" ? "canceled" : "inactive"

        await supabase.rpc("update_subscription_status", {
          p_stripe_customer_id: customerId,
          p_status: status,
        })

        await supabase.rpc("log_billing_audit", {
          p_user_id: userBilling.user_id,
          p_event_type: "customer.subscription.updated",
          p_event_data: JSON.stringify(subscription),
        })

        console.log("[v0] Subscription updated for customer:", customerId)
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        // Get user billing record
        const { data: userBilling } = await supabase
          .from("user_billing")
          .select("user_id")
          .eq("stripe_customer_id", customerId)
          .single()

        if (!userBilling) {
          console.error("[v0] No billing record found for customer:", customerId)
          break
        }

        await supabase.rpc("update_subscription_status", {
          p_stripe_customer_id: customerId,
          p_status: "canceled",
        })

        await supabase.rpc("log_billing_audit", {
          p_user_id: userBilling.user_id,
          p_event_type: "customer.subscription.deleted",
          p_event_data: JSON.stringify(subscription),
        })

        console.log("[v0] Subscription canceled for customer:", customerId)
        break
      }

      default:
        console.log("[v0] Unhandled event type:", event.type)
    }

    await supabase
      .from("stripe_webhook_logs")
      .update({ processed: true })
      .eq("event_type", event.type)
      .eq("event_data", event)

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error("[v0] Webhook processing error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
