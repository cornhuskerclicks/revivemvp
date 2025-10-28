"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sparkles, Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import type { Android } from "@/lib/types"

interface DemoAndroidSelectorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  androids: Android[]
}

export default function DemoAndroidSelectorModal({ open, onOpenChange, androids }: DemoAndroidSelectorModalProps) {
  const [selectedAndroidId, setSelectedAndroidId] = useState<string>("")
  const router = useRouter()

  const handleStartDemo = () => {
    if (selectedAndroidId) {
      router.push(`/demo/${selectedAndroidId}`)
      onOpenChange(false)
    }
  }

  const handleCreateNew = () => {
    router.push("/prompt-generator")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] glass glass-border bg-black/95 border-white/20">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white">Choose an Android to Demo</DialogTitle>
          <DialogDescription className="text-white-secondary">
            Select an existing Android or create a new one to start your Coffee Date demo.
          </DialogDescription>
        </DialogHeader>

        {androids.length === 0 ? (
          <div className="py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-aether/10 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-8 w-8 text-aether" />
            </div>
            <p className="text-white-secondary mb-6">
              You don't have any Androids yet. Create one to begin your first Coffee Date demo.
            </p>
            <Button onClick={handleCreateNew} className="bg-aether text-white hover:aether-glow">
              <Plus className="h-4 w-4 mr-2" />
              Create New Android
            </Button>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Select Android</label>
              <Select value={selectedAndroidId} onValueChange={setSelectedAndroidId}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Choose an Android..." />
                </SelectTrigger>
                <SelectContent className="bg-black/95 border-white/20">
                  {androids.map((android) => {
                    const companyName =
                      android.business_context?.company_name || android.business_context?.businessName || "My Business"
                    const niche = android.business_context?.niche || android.business_context?.industry || "General"
                    const createdDate = new Date(android.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })

                    return (
                      <SelectItem key={android.id} value={android.id} className="text-white hover:bg-white/10">
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {companyName} — {android.name}
                          </span>
                          <span className="text-xs text-white-secondary">
                            Niche: {niche} | Created: {createdDate}
                          </span>
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleStartDemo}
                disabled={!selectedAndroidId}
                className="flex-1 bg-gradient-to-r from-aether to-aether/80 text-white hover:shadow-[0_0_30px_rgba(8,159,239,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Start Demo
              </Button>
              <Button
                onClick={handleCreateNew}
                variant="outline"
                className="border-aether text-aether hover:bg-aether/10 bg-transparent"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
