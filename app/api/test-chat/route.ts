import { openai } from "@ai-sdk/openai"

export const runtime = "edge"

export async function GET() {
  try {
    const result = await openai("gpt-4-turbo").doGenerate({
      inputFormat: "messages",
      mode: { type: "regular" },
      prompt: [{ role: "user", content: [{ type: "text", text: "Say 'RE:VIVE system active.'" }] }],
    })

    return Response.json({
      message: result.text,
      status: "operational",
    })
  } catch (error) {
    return Response.json(
      {
        error: "OpenAI connection failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
