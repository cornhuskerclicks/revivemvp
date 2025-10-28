"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, Trash2, Play, Sparkles } from "lucide-react"
import type { Android } from "@/lib/types"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface LibraryViewProps {
  androids: Android[]
  userId: string
}

export default function LibraryView({ androids: initialAndroids, userId }: LibraryViewProps) {
  const [androids, setAndroids] = useState(initialAndroids)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<"date" | "company" | "name">("date")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [androidToDelete, setAndroidToDelete] = useState<Android | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const filteredAndroids = androids.filter((android) => {
    const searchLower = searchQuery.toLowerCase()
    const companyName = android.business_context?.company_name || android.business_context?.businessName || ""
    const niche = android.business_context?.niche || android.business_context?.industry || ""

    return (
      android.name.toLowerCase().includes(searchLower) ||
      android.prompt.toLowerCase().includes(searchLower) ||
      companyName.toLowerCase().includes(searchLower) ||
      niche.toLowerCase().includes(searchLower)
    )
  })

  const sortedAndroids = [...filteredAndroids].sort((a, b) => {
    switch (sortBy) {
      case "company": {
        const aCompany = a.business_context?.company_name || a.business_context?.businessName || ""
        const bCompany = b.business_context?.company_name || b.business_context?.businessName || ""
        return aCompany.localeCompare(bCompany)
      }
      case "name":
        return a.name.localeCompare(b.name)
      case "date":
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }
  })

  const handleDeleteClick = (android: Android) => {
    setAndroidToDelete(android)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!androidToDelete) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/androids/${androidToDelete.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setAndroids(androids.filter((a) => a.id !== androidToDelete.id))
        setDeleteDialogOpen(false)
        setAndroidToDelete(null)
      } else {
        console.error("Failed to delete android")
      }
    } catch (error) {
      console.error("Error deleting android:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  const getCompanyInitials = (companyName?: string) => {
    if (!companyName) return "AB"
    return companyName
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8 animate-fade-in-up">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Android Library</h1>
          <p className="text-white-secondary">Manage your AI Androids across all clients and businesses</p>
        </div>
        <Button
          asChild
          className="bg-gradient-to-r from-aether to-aether/80 text-white hover:shadow-[0_0_30px_rgba(8,159,239,0.4)] hover:scale-105 transition-all duration-300"
        >
          <Link href="/prompt-generator">
            <Plus className="h-4 w-4 mr-2" />
            New Android
          </Link>
        </Button>
      </div>

      <div className="mb-8 flex flex-col md:flex-row gap-4 animate-fade-in-up animation-delay-100">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white-secondary" />
          <Input
            placeholder="Search by company or Android name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white-secondary focus:border-aether"
          />
        </div>
        <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
          <SelectTrigger className="w-full md:w-[200px] bg-white/5 border-white/10 text-white">
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Date Created</SelectItem>
            <SelectItem value="company">Company</SelectItem>
            <SelectItem value="name">Android Name</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {sortedAndroids.length === 0 ? (
        <div className="text-center py-16 rounded-xl glass glass-border animate-fade-in-up animation-delay-200">
          <div className="w-16 h-16 rounded-full bg-aether/10 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="h-8 w-8 text-aether" />
          </div>
          <p className="text-white-secondary mb-4">
            {searchQuery ? "No androids found matching your search" : "No androids yet. Create your first one!"}
          </p>
          {!searchQuery && (
            <Button asChild className="bg-aether text-white hover:aether-glow">
              <Link href="/prompt-generator">Get Started</Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedAndroids.map((android, index) => {
            const companyName =
              android.business_context?.company_name || android.business_context?.businessName || "My Business"
            const niche = android.business_context?.niche || android.business_context?.industry || "General"
            const promptPreview = android.prompt.substring(0, 120)

            return (
              <div
                key={android.id}
                className="p-6 rounded-xl glass glass-border hover:shadow-[0_0_30px_rgba(8,159,239,0.2)] hover:-translate-y-1 transition-all duration-300 group animate-fade-in-up flex flex-col"
                style={{ animationDelay: `${200 + index * 50}ms` }}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-white/10 to-white/5 border border-white/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-white">{getCompanyInitials(companyName)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-white mb-1 truncate">
                      {companyName} — {android.name}
                    </h3>
                    <p className="text-xs text-white-secondary">
                      Niche: {niche} | Created: {new Date(android.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-aether to-aether/60 flex items-center justify-center">
                      <Sparkles className="h-5 w-5 text-white" />
                    </div>
                    <div className="absolute inset-0 rounded-full bg-aether/30 animate-ping" />
                  </div>
                </div>

                <div className="flex-1 mb-4">
                  <p className="text-sm text-white-secondary line-clamp-3">{promptPreview}...</p>
                </div>

                <div className="flex gap-2 border-t border-white/10 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 border-aether text-aether hover:bg-aether hover:text-white bg-transparent group-hover:shadow-[0_0_20px_rgba(8,159,239,0.3)] transition-all"
                    asChild
                    title={`Click to open demo for ${companyName}`}
                  >
                    <Link href={`/demo/${android.id}`}>
                      <Play className="h-4 w-4 mr-2" />
                      Open
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-500 bg-transparent transition-all"
                    onClick={() => handleDeleteClick(android)}
                    title="Delete Android"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-background-secondary border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Delete Android</DialogTitle>
            <DialogDescription className="text-white-secondary">
              Are you sure you want to delete "{androidToDelete?.name}"? This action cannot be undone and will also
              delete all associated sessions and messages.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
              className="bg-transparent border-white/20 text-white hover:bg-white/5"
            >
              Cancel
            </Button>
            <Button
              className="bg-red-500 text-white hover:bg-red-600"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
