"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export function FilesPoller({ hasProcessing }: { hasProcessing: boolean }) {
  const router = useRouter()

  useEffect(() => {
    if (!hasProcessing) return
    const id = setInterval(() => router.refresh(), 3000)
    return () => clearInterval(id)
  }, [hasProcessing, router])

  return null
}
