import { NextResponse } from "next/server"
import { getPayload } from "payload"
import config from "@payload-config"

// GET /api/cms/pages — list published pages (for nav menus, sitemaps)
export async function GET() {
  try {
    const payload = await getPayload({ config })
    const { docs } = await payload.find({
      collection: "pages",
      where: { status: { equals: "published" } },
      select: { title: true, slug: true },
      sort: "title",
    })
    return NextResponse.json(docs)
  } catch {
    return NextResponse.json([])
  }
}
