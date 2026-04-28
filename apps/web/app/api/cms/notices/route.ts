import { NextRequest, NextResponse } from "next/server"
import { getPayload } from "payload"
import config from "@payload-config"

// GET /api/cms/notices?target=web|mobile
// Used by web app and mobile app to fetch active notices
export async function GET(req: NextRequest) {
  const target = req.nextUrl.searchParams.get("target") // 'web' | 'mobile'
  const now = new Date().toISOString()

  try {
    const payload = await getPayload({ config })

    const { docs } = await payload.find({
      collection: "notices",
      where: {
        and: [
          { active: { equals: true } },
          {
            or: [
              { expiresAt: { exists: false } },
              { expiresAt: { greater_than: now } },
            ],
          },
          ...(target
            ? [
                {
                  or: [
                    { target: { equals: target } },
                    { target: { equals: "both" } },
                  ],
                },
              ]
            : []),
        ],
      },
      limit: 10,
      sort: "-createdAt",
    })

    return NextResponse.json(docs, {
      headers: { "Cache-Control": "no-store" },
    })
  } catch {
    return NextResponse.json([], { status: 200 })
  }
}
