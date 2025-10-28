"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Coffee } from "lucide-react"
import DemoAndroidSelectorModal from "@/components/demo-android-selector-modal"
import type { Android } from "@/lib/types"

interface DemoStartButtonProps {
  androids: Android[]
}

export default function DemoStartButton({ androids }: DemoStartButtonProps) {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <Button
        onClick={() => setShowModal(true)}
        variant="outline"
        className="border-aether text-aether hover:bg-aether/10 bg-transparent hover:scale-105 transition-all duration-300"
      >
        <Coffee className="h-4 w-4 mr-2" />
        Start Coffee Date Demo
      </Button>

      <DemoAndroidSelectorModal open={showModal} onOpenChange={setShowModal} androids={androids} />
    </>
  )
}
