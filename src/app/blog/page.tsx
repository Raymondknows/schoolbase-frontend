import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowRight, BookOpen, ChevronRight, Sparkles } from 'lucide-react'
import { blogPosts } from './data'
import { ContextualAdSlot } from '@/components/login-page-ad-slot'

export const metadata: Metadata = {
  title: 'Blog | SchoolBase School Management Software',
  description:
    'Read practical articles on school management, fees, parent communication, attendance, results, and digital transformation for West African schools.',
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
      'Practical ideas for school operations, technology, family engagement, and academic workflows.',
    url: 'https://schoolbase.live/blog',
    type: 'website',
  },
}

function PostMeta({ readingTime, publishedAt }: { readingTime: string; publishedAt: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
      <span>{readingTime}</span>
      <span aria-hidden="true">·</span>
      <time>{publishedAt}</time>
    </div>
  )
}

export default function BlogPage() {
  const orderedPosts = blogPosts
    .slice()
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
  const [featuredPost, ...remainingPosts] = orderedPosts
  const groupedPosts = remainingPosts.reduce<Record<string, typeof remainingPosts>>((groups, post) => {
    groups[post.category] ||= []
    groups[post.category].push(post)
    return groups
  }, {})

  return (
    <div className="overflow-hidden bg-background">
      <section className="border-b border-border bg-[#f6faff]">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 sm:py-20 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:gap-14 lg:py-24">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-brand">
              <Sparkles className="h-4 w-4" /> SchoolBase Insights
            </p>
            <h1 className="mt-6 max-w-3xl text-4xl font-bold leading-[1.08] tracking-tight text-foreground sm:text-6xl">
              Practical ideas for a school that runs better.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted sm:text-xl">
              Clear, useful guidance for the work behind every school day: records, fees, teaching,
              results, communication, and the systems that connect them.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <a href="#latest" className="inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-hover">
                Browse the insights <ArrowRight className="h-4 w-4" />
              </a>
              <Link href="/platform" className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-5 py-3 text-sm font-semibold text-foreground transition hover:border-brand hover:text-brand">
                Explore the platform <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {featuredPost ? (
            <article className="relative border border-brand/25 bg-white p-6 shadow-[12px_12px_0_0_#dcecff] sm:p-8">
              <div className="flex items-center justify-between gap-4 border-b border-border pb-5">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-brand">
                  <BookOpen className="h-4 w-4" /> Featured insight
                </p>
                <PostMeta readingTime={featuredPost.readingTime} publishedAt={featuredPost.publishedAt} />
              </div>
              <p className="mt-7 text-xs font-semibold uppercase tracking-[0.16em] text-muted">{featuredPost.category}</p>
              <h2 className="mt-3 text-2xl font-bold leading-tight text-foreground sm:text-3xl">
                <Link href={`/blog/${featuredPost.slug}`} className="transition hover:text-brand">{featuredPost.title}</Link>
              </h2>
              <p className="mt-4 leading-7 text-muted">{featuredPost.excerpt}</p>
              <div className="mt-7 grid grid-cols-3 gap-2 border-t border-border pt-5">
                {["School operations", "People & roles", "Connected workflows"].map((label) => (
                  <p key={label} className="border border-border bg-background px-3 py-3 text-xs font-semibold leading-5 text-foreground">{label}</p>
                ))}
              </div>
              <Link href={`/blog/${featuredPost.slug}`} className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-brand hover:text-brand-hover">
                Read the featured article <ArrowRight className="h-4 w-4" />
              </Link>
            </article>
          ) : null}
        </div>
      </section>

      <section className="border-b border-border bg-white py-12">
        <div className="mx-auto grid max-w-6xl gap-4 px-6 sm:grid-cols-3">
          {[
            { label: 'Understand the work', text: 'Ideas grounded in everyday school operations.' },
            { label: 'Improve a workflow', text: 'Practical next steps, not technology for its own sake.' },
            { label: 'Connect the people', text: 'Clearer handoffs between schools, teachers, and families.' },
          ].map((item, index) => (
            <div key={item.label} className="flex gap-4 border-t-2 border-brand bg-background p-5">
              <span className="text-sm font-bold text-brand">{String(index + 1).padStart(2, '0')}</span>
              <div>
                <h2 className="font-semibold text-foreground">{item.label}</h2>
                <p className="mt-1 text-sm leading-6 text-muted">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-6xl px-6">
          <ContextualAdSlot path="/blog" compact />
        </div>
      </section>

      <section id="latest" className="scroll-mt-8 py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">Explore the library</p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-5xl">Ideas for the work schools do every day.</h2>
            <p className="mt-5 text-lg leading-8 text-muted">Browse by subject, find the workflow you want to improve, and follow the related guides from there.</p>
          </div>

          <div className="mt-12 space-y-16">
            {Object.entries(groupedPosts).map(([category, posts], groupIndex) => (
              <section key={category} className={groupIndex % 2 === 0 ? '' : '-mx-6 border-y border-border bg-[#f6faff] px-6 py-10 sm:py-12'}>
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">Topic {String(groupIndex + 1).padStart(2, '0')}</p>
                    <h3 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{category}</h3>
                  </div>
                  <p className="text-sm text-muted">{posts.length} {posts.length === 1 ? 'article' : 'articles'}</p>
                </div>
                <div className="mt-6 grid gap-3 lg:grid-cols-2">
                  {posts.map((post) => (
                    <article key={post.slug} className="group flex h-full flex-col border border-border bg-white p-6 transition hover:border-brand/40 hover:shadow-md sm:p-7">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-brand">{post.category}</span>
                        <PostMeta readingTime={post.readingTime} publishedAt={post.publishedAt} />
                      </div>
                      <h4 className="mt-5 text-xl font-semibold leading-snug text-foreground sm:text-2xl">
                        <Link href={`/blog/${post.slug}`} className="transition group-hover:text-brand">{post.title}</Link>
                      </h4>
                      <p className="mt-3 flex-1 leading-7 text-muted">{post.excerpt}</p>
                      <Link href={`/blog/${post.slug}`} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand hover:text-brand-hover">
                        Read article <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                      </Link>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-brand py-16 text-white sm:py-20">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 px-6 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">A connected operating platform for schools</p>
            <h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">Give every part of your school a clearer place to work.</h2>
            <p className="mt-4 max-w-2xl leading-7 text-white/80">Explore how school records, academics, finance, and family communication fit together in SchoolBase.</p>
          </div>
          <Link href="/platform" className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-brand transition hover:bg-blue-50">
            Explore SchoolBase <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  )
}
