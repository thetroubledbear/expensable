import type { FileType } from "@expensable/types"

const MIME_MAP: Record<string, FileType> = {
  "text/csv": "csv",
  "application/csv": "csv",
  "application/pdf": "pdf",
  "image/jpeg": "image",
  "image/png": "image",
  "image/webp": "image",
  "image/heic": "image",
}

export function mimeToFileType(mime: string): FileType | null {
  return MIME_MAP[mime] ?? null
}

export const ACCEPTED_MIME_TYPES = Object.keys(MIME_MAP)
export const MAX_FILE_SIZE_MB = 25
