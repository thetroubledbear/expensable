import { Storage } from "@google-cloud/storage"

let _storage: Storage | null = null
let _bucket: ReturnType<Storage["bucket"]> | null = null

function getBucket() {
  if (!_bucket) {
    if (!_storage) {
      _storage = process.env.GCS_SERVICE_ACCOUNT_KEY
        ? new Storage({ credentials: JSON.parse(process.env.GCS_SERVICE_ACCOUNT_KEY) })
        : new Storage()
    }
    _bucket = _storage.bucket(process.env.GCS_BUCKET || "expensable")
  }
  return _bucket
}

export async function uploadFile(key: string, body: Buffer, contentType: string): Promise<string> {
  await getBucket().file(key).save(body, { contentType })
  return key
}

export async function getFileBuffer(key: string): Promise<Buffer> {
  const [data] = await getBucket().file(key).download()
  return data
}

export async function getPresignedUrl(key: string, expiresIn = 3600): Promise<string> {
  const [url] = await getBucket().file(key).getSignedUrl({
    action: "read",
    expires: Date.now() + expiresIn * 1000,
  })
  return url
}

export async function deleteFile(key: string): Promise<void> {
  await getBucket().file(key).delete()
}

export function buildStorageKey(householdId: string, fileId: string, filename: string): string {
  return `households/${householdId}/files/${fileId}/${filename}`
}
