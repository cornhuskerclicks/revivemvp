"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Save, Trash2 } from "lucide-react"

interface PostDemoModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: () => void
  onDelete: () => void
}

export default function PostDemoModal({ open, onOpenChange, onSave, onDelete }: PostDemoModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] glass glass-border bg-black/95 border-white/20">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">Save Demo Session?</DialogTitle>
          <DialogDescription className="text-white-secondary">
            Would you like to save this Coffee Date session for review or share it?
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-3 pt-4">
          <Button
            onClick={onSave}
            className="flex-1 bg-gradient-to-r from-aether to-aether/80 text-white hover:shadow-[0_0_30px_rgba(8,159,239,0.4)]"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Session
          </Button>
          <Button
            onClick={onDelete}
            variant="outline"
            className="flex-1 border-red-500/50 text-red-400 hover:bg-red-500/10 bg-transparent"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Demo
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
