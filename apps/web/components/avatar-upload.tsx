"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Camera, Trash2, Loader2 } from "lucide-react"

interface Props {
  currentUrl: string | null
  userName: string | null | undefined
}

export function AvatarUpload({ currentUrl, userName }: Props) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(currentUrl)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")

  const initials = (userName ?? "?")[0].toUpperCase()

  async function handleFile(file: File) {
    setError("")
    setUploading(true)

    const localPreview = URL.createObjectURL(file)
    setPreview(localPreview)

    const form = new FormData()
    form.append("file", file)

    const res = await fetch("/api/user/avatar", { method: "POST", body: form })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? "Upload failed")
      setPreview(currentUrl)
      setUploading(false)
      return
    }

    setPreview(data.url)
    setUploading(false)
    router.refresh()
  }

  async function handleRemove() {
    setError("")
    setUploading(true)
    const res = await fetch("/api/user/avatar", { method: "DELETE" })
    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? "Failed to remove")
    } else {
      setPreview(null)
    }
    setUploading(false)
    router.refresh()
  }

  return (
    <div className="flex items-center gap-5">
      {/* Avatar circle */}
      <div className="relative shrink-0">
        <div className="w-16 h-16 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center">
          {preview ? (
            <img src={preview} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <span className="text-xl font-semibold text-slate-500">{initials}</span>
          )}
        </div>
        {uploading && (
          <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
            <Loader2 className="w-5 h-5 text-white animate-spin" />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <Camera className="w-3.5 h-3.5" />
            {preview ? "Change photo" : "Upload photo"}
          </button>
          {preview && (
            <button
              type="button"
              disabled={uploading}
              onClick={handleRemove}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-100 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Remove
            </button>
          )}
        </div>
        <p className="text-xs text-slate-400">JPEG, PNG, or WebP · max 5 MB</p>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
          e.target.value = ""
        }}
      />
    </div>
  )
}
