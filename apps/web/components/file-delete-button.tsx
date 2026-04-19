"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Trash2, Loader2 } from "lucide-react"

export function FileDeleteButton({ fileId, isOwner }: { fileId: string; isOwner: boolean }) {
  if (!isOwner) return null
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    const res = await fetch(`/api/files/${fileId}`, { method: "DELETE" })
    if (res.ok) {
      router.refresh()
    } else {
      setDeleting(false)
      setConfirming(false)
    }
  }

  if (deleting) {
    return <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-1.5">
        <button
          onClick={handleDelete}
          className="text-xs font-medium text-red-600 hover:text-red-700 transition-colors"
        >
          Delete
        </button>
        <span className="text-slate-300">|</span>
        <button
          onClick={() => setConfirming(false)}
          className="text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
      title="Delete file"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  )
}
