import { openai } from "@ai-sdk/openai"
import { streamText, convertToModelMessages, type UIMessage, consumeStream } from "ai"
import { createServerClient } from "@/lib/supabase/server"

export const runtime = "edge"

export async function POST(req: Request) {
  try {
    const url = new URL(req.url)
    const androidId = url.searchParams.get("androidId")

    console.log("🔍 NEW CHAT REQUEST - androidId:", androidId)

    if (!androidId) {
      console.error("❌ No androidId provided")
      return new Response("No androidId provided", { status: 400 })
    }

    const supabase = await createServerClient()
    const { data: android, error } = await supabase.from("androids").select("*").eq("id", androidId).single()

    if (error || !android) {
      console.error("❌ Failed to fetch android:", error)
      return new Response("Android not found", { status: 404 })
    }

    const systemPrompt = android.prompt || ""

    console.log("✅ Android:", android.name)
    console.log("✅ Full prompt length:", systemPrompt.length)
    console.log("✅ FULL SYSTEM PROMPT:", systemPrompt)

    if (!systemPrompt) {
      console.error("❌ No prompt found for android")
      return new Response("Android has no prompt", { status: 400 })
    }

    const { messages }: { messages: UIMessage[] } = await req.json()
    const modelMessages = convertToModelMessages(messages)

    console.log("✅ User messages count:", messages.length)
    console.log("✅ User messages:", JSON.stringify(messages, null, 2))
    console.log("📤 Sending to OpenAI with system prompt + user messages")

    const result = streamText({
      model: openai("gpt-4-0613"),
      system: systemPrompt,
      messages: modelMessages,
      temperature: 1.0,
      topP: 1.0,
      abortSignal: req.signal,
    })

    return result.toUIMessageStreamResponse({
      onFinish: async ({ isAborted }) => {
        if (isAborted) {
          console.log("⚠️ Request aborted")
        } else {
          console.log("✅ Response completed successfully")
        }
      },
      consumeSseStream: consumeStream,
    })
  } catch (err) {
    console.error("❌ Chat API Error:", err)
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
