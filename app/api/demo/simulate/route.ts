import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { generateText } from "ai"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { androidId, leadName, conversationHistory } = body

    // Get Android details
    const { data: android } = await supabase.from("androids").select("*").eq("id", androidId).single()

    if (!android) {
      return NextResponse.json({ error: "Android not found" }, { status: 404 })
    }

    // Generate simulated reply using OpenAI
    const prompt = `You are simulating a lead named ${leadName} responding to an SMS campaign. 
    
Android Prompt Context:
${android.prompt}

Conversation so far:
${conversationHistory.map((msg: any) => `${msg.role}: ${msg.content}`).join("\n")}

Generate a realistic response from the lead's perspective. Keep it brief (1-2 sentences) and conversational, like an SMS reply.`

    const { text } = await generateText({
      model: "openai/gpt-4o-mini",
      prompt,
    })

    return NextResponse.json({ success: true, reply: text })
  } catch (error: any) {
    console.error("[v0] Demo simulation error:", error)
    return NextResponse.json({ error: error.message || "Failed to simulate reply" }, { status: 500 })
  }
}
