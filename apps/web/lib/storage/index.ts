import { Storage } from "@google-cloud/storage"

function createStorage() {
  if (process.env.GCS_SERVICE_ACCOUNT_KEY) {
    return new Storage({ credentials: JSON.parse(process.env.GCS_SERVICE_ACCOUNT_KEY) })
  }
  // Local dev: falls back to Application Default Credentials (gcloud auth application-default login)
  return new Storage()
}

const storage = createStorage()
const BUCKET = process.env.GCS_BUCKET ?? "expensable"
const bucket = storage.bucket(BUCKET)

export async function uploadFile(key: string, body: Buffer, contentType: string): Promise<string> {
  await bucket.file(key).save(body, { contentType })
  return key
}

export async function getFileBuffer(key: string): Promise<Buffer> {
  const [data] = await bucket.file(key).download()
  return data
}

export async function getPresignedUrl(key: string, expiresIn = 3600): Promise<string> {
  const [url] = await bucket.file(key).getSignedUrl({
    action: "read",
    expires: Date.now() + expiresIn * 1000,
  })
  return url
}

export async function deleteFile(key: string): Promise<void> {
  await bucket.file(key).delete()
}

export function buildStorageKey(householdId: string, fileId: string, filename: string): string {
  return `households/${householdId}/files/${fileId}/${filename}`
}
