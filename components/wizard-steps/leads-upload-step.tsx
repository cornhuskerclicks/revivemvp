"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Upload, FileText, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface LeadsUploadStepProps {
  data: any
  setData: (data: any) => void
}

export default function LeadsUploadStep({ data, setData }: LeadsUploadStepProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleFileUpload = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const lines = text.split("\n").filter((line) => line.trim())
      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase())

      const leads = lines.slice(1).map((line) => {
        const values = line.split(",").map((v) => v.trim())
        const lead: any = {}

        headers.forEach((header, index) => {
          if (header.includes("name")) lead.lead_name = values[index]
          if (header.includes("phone")) lead.phone_number = values[index]
          if (header.includes("tag")) lead.tags = values[index] ? [values[index]] : []
        })

        return lead
      })

      setData({ ...data, leads: leads.filter((l) => l.lead_name && l.phone_number) })
    }
    reader.readAsText(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type === "text/csv") {
      handleFileUpload(file)
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-aether/20 flex items-center justify-center">
          <Upload className="h-6 w-6 text-aether" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Upload Leads</h2>
          <p className="text-white-secondary">Import your contacts from CSV</p>
        </div>
      </div>

      <div
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
          isDragging ? "border-aether bg-aether/10" : "border-white/20 hover:border-white/40 hover:bg-white/5"
        }`}
      >
        <FileText className="h-12 w-12 text-aether mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">Drop your CSV file here</h3>
        <p className="text-white-secondary mb-4">or click to browse</p>
        <input type="file" accept=".csv" onChange={handleFileInput} className="hidden" id="csv-upload" />
        <Button
          asChild
          variant="outline"
          className="border-aether text-aether hover:bg-aether hover:text-white bg-transparent"
        >
          <label htmlFor="csv-upload" className="cursor-pointer">
            <Upload className="h-4 w-4 mr-2" />
            Choose File
          </label>
        </Button>
      </div>

      {data.leads.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">Uploaded Leads</h3>
              <p className="text-sm text-white-secondary">{data.leads.length} contacts ready to import</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setData({ ...data, leads: [] })}
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
            >
              <X className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          </div>

          <div className="max-h-64 overflow-y-auto space-y-2">
            {data.leads.slice(0, 10).map((lead: any, index: number) => (
              <div
                key={index}
                className="p-3 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between"
              >
                <div>
                  <p className="text-white font-medium">{lead.lead_name}</p>
                  <p className="text-sm text-white-secondary">{lead.phone_number}</p>
                </div>
                {lead.tags && lead.tags.length > 0 && (
                  <Badge className="bg-aether/10 text-aether border-aether/20">{lead.tags[0]}</Badge>
                )}
              </div>
            ))}
            {data.leads.length > 10 && (
              <p className="text-sm text-white-secondary text-center py-2">+ {data.leads.length - 10} more contacts</p>
            )}
          </div>
        </div>
      )}

      <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
        <p className="text-sm text-yellow-400">
          <strong>CSV Format:</strong> Your file should have columns: lead_name, phone_number, tags (optional)
        </p>
      </div>
    </div>
  )
}
