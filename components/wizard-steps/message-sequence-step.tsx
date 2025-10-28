"use client"

import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { MessageSquare, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

interface MessageSequenceStepProps {
  data: any
  setData: (data: any) => void
}

export default function MessageSequenceStep({ data, setData }: MessageSequenceStepProps) {
  const updateMessage = (index: number, value: string) => {
    const newMessages = [...data.messages]
    newMessages[index] = value
    setData({ ...data, messages: newMessages })
  }

  const generateWithAI = async () => {
    // Placeholder for AI generation
    console.log("[v0] AI generation would happen here")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-aether/20 flex items-center justify-center">
            <MessageSquare className="h-6 w-6 text-aether" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Message Sequence</h2>
            <p className="text-white-secondary">Create your 3-part message series</p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={generateWithAI}
          className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10 bg-transparent"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          Generate with AI
        </Button>
      </div>

      <div className="space-y-6">
        {[1, 2, 3].map((num) => (
          <div key={num}>
            <Label htmlFor={`message-${num}`} className="text-white flex items-center gap-2 mb-2">
              Message {num}
              <span className="text-xs text-white-secondary">({160 - data.messages[num - 1].length} chars left)</span>
            </Label>
            <Textarea
              id={`message-${num}`}
              placeholder={`Enter message ${num}...`}
              value={data.messages[num - 1]}
              onChange={(e) => updateMessage(num - 1, e.target.value)}
              rows={4}
              maxLength={160}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/40 resize-none"
            />
            <p className="text-xs text-white-secondary mt-1">
              {num === 1 && "First message - introduce yourself and create curiosity"}
              {num === 2 && "Follow-up - provide value and build interest"}
              {num === 3 && "Final message - clear call-to-action"}
            </p>
          </div>
        ))}
      </div>

      <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
        <p className="text-sm text-blue-400">
          <strong>Best Practice:</strong> Keep messages conversational, personalized, and focused on the recipient's
          needs.
        </p>
      </div>

      <div className="p-6 rounded-lg glass border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-3">Preview</h3>
        <div className="space-y-3">
          {data.messages.map(
            (msg: string, index: number) =>
              msg && (
                <div key={index} className="p-3 rounded-lg bg-aether/10 border border-aether/20">
                  <p className="text-xs text-aether font-semibold mb-1">Message {index + 1}</p>
                  <p className="text-white text-sm">{msg}</p>
                </div>
              ),
          )}
        </div>
      </div>
    </div>
  )
}
