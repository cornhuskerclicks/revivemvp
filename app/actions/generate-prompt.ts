"use server"

import { createClient } from "@/lib/supabase/server"
import { buildCoffeeDatePrompt } from "@/lib/templates/coffee-date-template"

interface CoffeeDateFormData {
  businessName: string
  androidName: string
  serviceType: string
  shortService: string
  nicheQuestion: string
  valueProp: string
  calendarLink: string
  regionTone: string
  industryTraining: string
  website: string
  openingHours: string
  promiseLine: string
}

export async function generatePrompt(formData: CoffeeDateFormData, userId: string) {
  try {
    const filledPrompt = buildCoffeeDatePrompt(formData)

    const supabase = await createClient()

    const { data, error } = await supabase
      .from("androids")
      .insert({
        user_id: userId,
        name: formData.androidName || `${formData.businessName} Android`,
        prompt: filledPrompt,
        business_context: {
          ...formData,
          company_name: formData.businessName,
          niche: formData.serviceType,
        },
        company_name: formData.businessName,
        niche: formData.serviceType,
      })
      .select()
      .single()

    if (error) throw error

    return { success: true, prompt: filledPrompt, androidId: data.id }
  } catch (error) {
    console.error("Error generating prompt:", error)
    return { success: false, error: "Failed to generate prompt" }
  }
}
