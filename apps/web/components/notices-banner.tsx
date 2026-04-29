import { getPayload } from "payload"
import config from "@payload-config"
import Link from "next/link"

const VARIANT_CLASSES: Record<string, string> = {
  info:    "bg-sky-50    border-sky-200    text-sky-900",
  warning: "bg-amber-50  border-amber-200  text-amber-900",
  success: "bg-emerald-50 border-emerald-200 text-emerald-900",
  danger:  "bg-red-50    border-red-200    text-red-900",
}
const CTA_CLASSES: Record<string, string> = {
  info:    "text-sky-700    hover:text-sky-900    underline",
  warning: "text-amber-700  hover:text-amber-900  underline",
  success: "text-emerald-700 hover:text-emerald-900 underline",
  danger:  "text-red-700    hover:text-red-900    underline",
}

export async function NoticesBanner() {
  let notices: any[] = []

  try {
    const payload = await getPayload({ config })
    const now = new Date().toISOString()
    const result = await payload.find({
      collection: "notices",
      where: {
        and: [
          { active: { equals: true } },
          { type: { equals: "banner" } },
          {
            or: [
              { target: { equals: "both" } },
              { target: { equals: "web" } },
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
      limit: 5,
      sort: "-createdAt",
    })
    notices = result.docs
  } catch {
    return null
  }

  if (!notices.length) return null

  return (
    <div className="flex flex-col gap-px">
      {notices.map((notice) => {
        const variant = notice.variant ?? "info"
        const classes = VARIANT_CLASSES[variant] ?? VARIANT_CLASSES.info
        const ctaClasses = CTA_CLASSES[variant] ?? CTA_CLASSES.info

        return (
          <div key={notice.id} className={`w-full border-b px-4 py-2.5 text-sm ${classes}`}>
            <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-semibold shrink-0">{notice.title}</span>
                {notice.body && (
                  <span className="opacity-80 truncate hidden sm:block">{notice.body}</span>
                )}
              </div>
              {notice.cta?.label && notice.cta?.url && (
                <Link href={notice.cta.url} className={`shrink-0 font-medium text-xs ${ctaClasses}`}>
                  {notice.cta.label}
                </Link>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
