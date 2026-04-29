import { getPayload } from "payload"
import config from "@payload-config"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { LogoMark } from "@/components/logo"
import { convertLexicalToHTML, defaultHTMLConverters } from "@payloadcms/richtext-lexical/html"

export const revalidate = 60

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  try {
    const payload = await getPayload({ config })
    const { docs } = await payload.find({
      collection: "posts",
      where: { and: [{ slug: { equals: slug } }, { status: { equals: "published" } }] },
      limit: 1,
    })
    const post = docs[0] as unknown as { title: string; seo?: { title?: string; description?: string } } | undefined
    if (!post) return {}
    return {
      title: post.seo?.title ?? post.title,
      description: post.seo?.description,
    }
  } catch {
    return {}
  }
}

export default async function BlogPost({ params }: Props) {
  const { slug } = await params

  let post: {
    title: string
    excerpt?: string | null
    content?: unknown
    publishedAt?: string | null
    author?: string | null
  } | null = null

  try {
    const payload = await getPayload({ config })
    const { docs } = await payload.find({
      collection: "posts",
      where: { and: [{ slug: { equals: slug } }, { status: { equals: "published" } }] },
      limit: 1,
    })
    post = (docs[0] as unknown as typeof post) ?? null
  } catch {}

  if (!post) notFound()
  const p = post as { title: string; excerpt?: string | null; content?: unknown; publishedAt?: string | null; author?: string | null }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <LogoMark className="w-7 h-7 rounded-lg" />
            <span className="text-slate-900 font-semibold text-[15px] tracking-tight">Expensable</span>
          </Link>
          <Link href="/login" className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
            Sign in
          </Link>
        </div>
      </header>

      <main className="flex-1 pt-28 pb-16 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto">
          <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-700 transition-colors mb-8">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to blog
          </Link>

          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mb-4">{p.title}</h1>

          <div className="flex items-center gap-3 text-sm text-slate-400 mb-8 pb-8 border-b border-slate-100">
            {p.author && <span>{p.author}</span>}
            {p.publishedAt && (
              <span>{new Date(p.publishedAt).toLocaleDateString("en", { month: "long", day: "numeric", year: "numeric" })}</span>
            )}
          </div>

          {p.excerpt && (
            <p className="text-lg text-slate-600 leading-relaxed mb-8 font-medium">{p.excerpt}</p>
          )}

          {p.content && (
            <div
              className="prose prose-slate max-w-none"
              dangerouslySetInnerHTML={{
                __html: convertLexicalToHTML({
                  data: p.content as any,
                  converters: defaultHTMLConverters,
                }),
              }}
            />
          )}
        </div>
      </main>
    </div>
  )
}
