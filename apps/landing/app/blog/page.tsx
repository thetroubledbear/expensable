import { getPayload } from "payload"
import config from "@payload-config"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { LogoMark } from "@expensable/ui"

export const revalidate = 60

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

export default async function BlogIndex() {
  let posts: Array<{ slug: string; title: string; excerpt?: string | null; publishedAt?: string | null; author?: string | null }> = []

  try {
    const payload = await getPayload({ config })
    const { docs } = await payload.find({
      collection: "posts",
      where: { status: { equals: "published" } },
      sort: "-publishedAt",
      limit: 50,
    })
    posts = docs as unknown as typeof posts
  } catch {}

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <LogoMark className="w-7 h-7 rounded-lg" />
            <span className="text-slate-900 font-semibold text-[15px] tracking-tight">Expensable</span>
          </Link>
          <Link href={`${APP_URL}/login`} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
            Sign in
          </Link>
        </div>
      </header>

      <main className="flex-1 pt-28 pb-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mb-2">Blog</h1>
          <p className="text-slate-500 mb-10">Updates, guides, and product news from the Expensable team.</p>

          {posts.length === 0 ? (
            <p className="text-slate-400">No posts published yet.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {posts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 py-8 hover:opacity-80 transition-opacity"
                >
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors mb-1">
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p className="text-slate-500 text-sm leading-relaxed line-clamp-2">{post.excerpt}</p>
                    )}
                    <div className="flex items-center gap-3 mt-3 text-xs text-slate-400">
                      {post.author && <span>{post.author}</span>}
                      {post.publishedAt && (
                        <span>{new Date(post.publishedAt).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}</span>
                      )}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 transition-colors shrink-0 mt-1" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
