import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowRight, BookOpen, Sparkles } from 'lucide-react'
import { blogPosts } from './data'

export const metadata: Metadata = {
  title: 'Blog | SchoolBase School Management Software',
  description:
    'Read professional SEO-rich articles on school management software, fee automation, parent communication, attendance, results publishing, and digital transformation.',
  keywords: [
    'school management software blog',
    'school software articles',
    'education technology blog',
    'digital transformation in schools',
    'parent communication software',
  ],
  alternates: {
    canonical: 'https://schoolbase.live/blog',
  },
  openGraph: {
    title: 'SchoolBase Blog | School Management Insights',
    description:
      'Explore expert articles on school operations, software, parent engagement, and results publishing.',
    url: 'https://schoolbase.live/blog',
    type: 'website',
  },
}

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-background">
      <section className="border-b border-border bg-[#f6faff] py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-brand">
              <Sparkles className="h-4 w-4" />
              SchoolBase Insights
            </div>
            <h1 className="mt-5 max-w-4xl text-4xl font-bold leading-[1.08] tracking-tight text-foreground sm:text-6xl">
              Practical thinking for better school operations
            </h1>
            <p className="mt-5 text-lg leading-8 text-muted">
              Discover practical articles on school management software, attendance tracking,
              results publishing, parent engagement, fee automation, and digital transformation.
            </p>
          </div>

          <div className="mt-10 grid gap-3 md:grid-cols-3">
            {[
              'School management software',
              'Parent communication software',
              'Results publishing software',
            ].map((tag) => (
              <div key={tag} className="border border-border bg-white px-4 py-4 text-sm font-semibold text-foreground">
                {tag}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold text-foreground">Latest posts</h2>
              <p className="mt-2 text-muted">
                SEO-optimized articles designed to help schools discover better digital workflows.
              </p>
            </div>
            <Link href="/contact" className="inline-flex items-center gap-2 text-sm font-semibold text-brand hover:text-brand/80">
              Request a demo <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-12 grid gap-8 lg:grid-cols-2">
            {blogPosts
              .slice()
              .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
              .map((post) => (
              <article key={post.slug} className="group border border-border bg-white p-8 transition-all hover:-translate-y-1 hover:border-brand/40 hover:shadow-lg">
                <div className="flex items-center gap-2 text-sm font-medium text-brand">
                  <BookOpen className="h-4 w-4" />
                  {post.category}
                </div>
                <h3 className="mt-4 text-2xl font-semibold text-foreground">
                  <Link href={`/blog/${post.slug}`} className="hover:text-brand">
                    {post.title}
                  </Link>
                </h3>
                <p className="mt-3 text-base leading-7 text-muted">{post.excerpt}</p>
                <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-muted">
                  <span>{post.readingTime}</span>
                  <span>•</span>
                  <span>{post.publishedAt}</span>
                </div>
                <div className="mt-6 flex flex-wrap gap-2">
                  {post.keywords.slice(0, 3).map((keyword) => (
                    <span key={keyword} className="border border-border bg-background px-3 py-1 text-xs font-medium text-muted">
                      {keyword}
                    </span>
                  ))}
                </div>
                <Link href={`/blog/${post.slug}`} className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-brand hover:text-brand/80">
                  Read article <ArrowRight className="h-4 w-4" />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-[#f6faff] py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="border border-border bg-white p-10">
            <h2 className="text-3xl font-bold text-foreground">Why schools choose SchoolBase</h2>
            <p className="mt-4 max-w-3xl text-lg text-muted">
              Our blog content supports schools searching for trusted solutions in school management software, fee automation, parent communication, results publishing, and school transformation.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/platform" className="inline-flex items-center rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-white hover:bg-brand/90">
                Explore the platform
              </Link>
              <Link href="/compare/manual-systems" className="inline-flex items-center rounded-lg border border-border px-5 py-3 text-sm font-semibold text-foreground hover:bg-surface">
                Compare SchoolBase
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
