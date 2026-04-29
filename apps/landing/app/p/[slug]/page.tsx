import { getPayload } from "payload"
import config from "@payload-config"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import Link from "next/link"
import { LogoMark } from "@expensable/ui"
import { ArrowRight } from "lucide-react"
import { convertLexicalToHTML } from "@payloadcms/richtext-lexical/html"
import { defaultHTMLConverters } from "@payloadcms/richtext-lexical/html"

export const revalidate = 60

const APP_URL = process.env.APP_URL ?? "http://localhost:3000"

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  try {
    const payload = await getPayload({ config })
    const { docs } = await payload.find({
      collection: "pages",
      where: { and: [{ slug: { equals: slug } }, { status: { equals: "published" } }] },
      limit: 1,
    })
    const page = docs[0] as unknown as { title: string; seo?: { title?: string; description?: string } } | undefined
    if (!page) return {}
    return {
      title: page.seo?.title ?? page.title,
      description: page.seo?.description,
    }
  } catch {
    return {}
  }
}

type LayoutBlock =
  | { blockType: "hero"; heading?: string; subheading?: string; ctaLabel?: string; ctaUrl?: string }
  | { blockType: "cta"; heading?: string; subheading?: string; primaryLabel?: string; primaryUrl?: string; secondaryLabel?: string; secondaryUrl?: string }
  | { blockType: "richText"; content?: unknown }
  | { blockType: "featureGrid"; heading?: string; features?: Array<{ title: string; description: string }> }

export default async function DynamicPage({ params }: Props) {
  const { slug } = await params

  let page: { title: string; content?: unknown; layout?: LayoutBlock[] } | null = null

  try {
    const payload = await getPayload({ config })
    const { docs } = await payload.find({
      collection: "pages",
      where: { and: [{ slug: { equals: slug } }, { status: { equals: "published" } }] },
      limit: 1,
    })
    page = (docs[0] as unknown as typeof page) ?? null
  } catch {}

  if (!page) notFound()
  const p = page as { title: string; content?: unknown; layout?: LayoutBlock[] }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <LogoMark className="w-7 h-7 rounded-lg" />
            <span className="text-slate-900 font-semibold text-[15px] tracking-tight">Expensable</span>
          </Link>
          <Link href={`${APP_URL}/login`} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
            Sign in
          </Link>
        </div>
      </header>

      <main className="flex-1 pt-24">
        {p.layout?.map((block: LayoutBlock, i: number) => {
          switch (block.blockType) {
            case "hero":
              return (
                <section key={i} className="py-20 px-4 sm:px-6 bg-gradient-to-b from-slate-50 to-white text-center">
                  <div className="max-w-3xl mx-auto">
                    <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight mb-5">{block.heading}</h1>
                    {block.subheading && <p className="text-lg text-slate-500 leading-relaxed mb-8">{block.subheading}</p>}
                    {block.ctaLabel && block.ctaUrl && (
                      <Link href={block.ctaUrl} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors">
                        {block.ctaLabel} <ArrowRight className="w-4 h-4" />
                      </Link>
                    )}
                  </div>
                </section>
              )
            case "cta":
              return (
                <section key={i} className="py-16 px-4 sm:px-6">
                  <div className="max-w-2xl mx-auto text-center bg-gradient-to-br from-emerald-50 to-slate-50 rounded-3xl border border-emerald-100 p-10">
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">{block.heading}</h2>
                    {block.subheading && <p className="text-slate-500 mb-8">{block.subheading}</p>}
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      {block.primaryLabel && block.primaryUrl && (
                        <Link href={block.primaryUrl} className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors">
                          {block.primaryLabel} <ArrowRight className="w-4 h-4" />
                        </Link>
                      )}
                      {block.secondaryLabel && block.secondaryUrl && (
                        <Link href={block.secondaryUrl} className="inline-flex items-center justify-center px-6 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors">
                          {block.secondaryLabel}
                        </Link>
                      )}
                    </div>
                  </div>
                </section>
              )
            case "featureGrid":
              return (
                <section key={i} className="py-16 px-4 sm:px-6">
                  <div className="max-w-6xl mx-auto">
                    {block.heading && <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 text-center mb-10">{block.heading}</h2>}
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {block.features?.map((f, j) => (
                        <div key={j} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                          <h3 className="font-semibold text-slate-900 mb-2">{f.title}</h3>
                          <p className="text-sm text-slate-500 leading-relaxed">{f.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              )
            case "richText":
              if (!block.content) return null
              return (
                <section key={i} className="py-12 px-4 sm:px-6">
                  <div
                    className="max-w-2xl mx-auto prose prose-slate"
                    dangerouslySetInnerHTML={{
                      __html: convertLexicalToHTML({
                        data: block.content as any,
                        converters: defaultHTMLConverters,
                      }),
                    }}
                  />
                </section>
              )
            default:
              return null
          }
        })}
      </main>
    </div>
  )
}
