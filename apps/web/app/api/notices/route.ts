import { NextResponse } from "next/server"
import { getPayload } from "payload"
import config from "@payload-config"

export const revalidate = 60

export async function GET() {
  try {
    const payload = await getPayload({ config })
    const now = new Date().toISOString()

    const result = await payload.find({
      collection: "notices",
      where: {
        and: [
          { active: { equals: true } },
          {
            or: [
              { target: { equals: "both" } },
              { target: { equals: "mobile" } },
            ],
          },
          {
            or: [
              { expiresAt: { exists: false } },
              { expiresAt: { greater_than: now } },
            ],
          },
        ],
      },
      limit: 10,
      sort: "-createdAt",
    })

    return NextResponse.json(result.docs)
  } catch {
    return NextResponse.json([])
  }
}
