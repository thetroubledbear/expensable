import { requireAuth } from "@/lib/auth/session"

export default async function UploadPage() {
  await requireAuth()
  return (
    <div>
      <h1 className="text-2xl font-semibold">Upload Files</h1>
      <p className="text-gray-500 mt-1">Upload CSV, PDF, or receipt images</p>
      {/* Phase 2: UploadDropzone component */}
    </div>
  )
}
