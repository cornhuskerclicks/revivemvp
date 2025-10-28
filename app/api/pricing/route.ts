import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: pricing, error } = await supabase
      .from("pricing_config")
      .select("*")
      .order("item_type", { ascending: true })

    if (error) throw error

    // Format pricing for easy lookup
    const formattedPricing = {
      phone_numbers: {} as Record<string, { setup: number; monthly: number }>,
      a2p: {
        brand: pricing.find((p) => p.item_type === "a2p_brand")?.final_price || 5.0,
        campaign: pricing.find((p) => p.item_type === "a2p_campaign")?.final_price || 12.5,
        total: 0,
      },
    }

    formattedPricing.a2p.total = formattedPricing.a2p.brand + formattedPricing.a2p.campaign

    // Group phone number pricing by country
    pricing
      .filter((p) => p.item_type.startsWith("phone_number"))
      .forEach((p) => {
        if (!formattedPricing.phone_numbers[p.country_code]) {
          formattedPricing.phone_numbers[p.country_code] = { setup: 0, monthly: 0 }
        }
        if (p.item_type === "phone_number_setup") {
          formattedPricing.phone_numbers[p.country_code].setup = p.final_price
        } else if (p.item_type === "phone_number_monthly") {
          formattedPricing.phone_numbers[p.country_code].monthly = p.final_price
        }
      })

    return NextResponse.json(formattedPricing)
  } catch (error: any) {
    console.error("[v0] Error fetching pricing:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
