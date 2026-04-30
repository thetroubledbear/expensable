"use client"

import { Trash2 } from "lucide-react"

export function FileDeleteButton({
  fileId,
  isOwner,
  onDelete,
}: {
  fileId: string
  isOwner: boolean
  onDelete?: () => void
}) {
  if (!isOwner) return null

  return (
    <button
      onClick={onDelete}
      className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
      title="Delete file"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  )
}
