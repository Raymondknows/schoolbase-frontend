import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ArrowRight, BookOpen, Sparkles } from 'lucide-react'
import { blogPosts, getBlogPostBySlug, getRelatedPosts } from '../data'
import { ContextualAdSlot } from '@/components/login-page-ad-slot'

const INTERNAL_LINKS = {
  'best school management software': '/blog/best-school-management-software',
  'parent communication software': '/blog/parent-communication-software',
  'parent communication': '/blog/parent-communication-software',
  'results publishing software': '/blog/results-publishing-software',
  'results publishing': '/blog/results-publishing-software',
  'school fee management software': '/blog/school-fee-management-software',
  'school website and admissions platform': '/blog/school-website-admissions-platform',
  'school website': '/blog/school-website-admissions-platform',
  'secure school data management': '/blog/secure-school-data-management',
  'digital transformation in schools': '/blog/digital-transformation-in-schools',
  'school broadsheet software': '/blog/school-broadsheet-software',
  'student attendance management software': '/blog/student-attendance-management-software',
  'attendance management': '/blog/student-attendance-management-software',
  'admissions platform': '/blog/school-website-admissions-platform',
} as const

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function renderLinkedText(text: string) {
  const phrases = Object.keys(INTERNAL_LINKS).sort((a, b) => b.length - a.length)
  const regex = new RegExp(`(${phrases.map(escapeRegExp).join('|')})`, 'gi')
  const parts = text.split(regex)

  return parts.map((part, index) => {
    const lowerCased = part.toLowerCase()
    if (Object.prototype.hasOwnProperty.call(INTERNAL_LINKS, lowerCased)) {
      return (
        <Link
          key={`${part}-${index}`}
          href={INTERNAL_LINKS[lowerCased as keyof typeof INTERNAL_LINKS]}
          className="font-semibold text-brand hover:underline"
        >
          {part}
        </Link>
      )
    }

    return <span key={`${part}-${index}`}>{part}</span>
  })
}

export async function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = getBlogPostBySlug(slug)

  if (!post) {
    return {
      title: 'Blog Post Not Found | SchoolBase',
      description: 'The requested blog post could not be found.',
      alternates: {
        canonical: `https://schoolbase.live/blog/${slug}`,
      },
      robots: {
        index: false,
        follow: false,
      },
    }
  }

  const canonicalUrl = `https://schoolbase.live/blog/${post.slug}`
  const imageUrl = post.image ? `https://schoolbase.live${post.image}` : undefined

  return {
    title: `${post.title} | SchoolBase`,
    description: post.description,
    keywords: post.keywords,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: post.title,
      description: post.description,
      url: canonicalUrl,
      type: 'article',
      images: imageUrl ? [{ url: imageUrl, alt: post.title }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
      images: imageUrl ? [imageUrl] : undefined,
    },
    robots: {
      index: true,
      follow: true,
    },
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getBlogPostBySlug(slug)

  if (!post) {
    notFound()
  }

  const relatedPosts = getRelatedPosts(slug)
  const canonicalUrl = `https://schoolbase.live/blog/${post.slug}`
  const imageUrl = post.image ? `https://schoolbase.live${post.image}` : undefined
  const publishedDate = !isNaN(Date.parse(post.publishedAt)) ? new Date(post.publishedAt).toISOString() : undefined

  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Article',
            mainEntityOfPage: {
              '@type': 'WebPage',
              '@id': canonicalUrl,
            },
            headline: post.title,
            description: post.description,
            image: imageUrl ? [imageUrl] : undefined,
            author: {
              '@type': 'Person',
              name: post.authorName ?? 'SchoolBase',
            },
            publisher: {
              '@type': 'Organization',
              name: 'SchoolBase',
            },
            datePublished: publishedDate,
            dateModified: publishedDate,
          }),
        }}
      />
      <section className="border-b border-border bg-[#f6faff] py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-brand">
            <Sparkles className="h-4 w-4" />
            {post.category}
          </div>
          <h1 className="mt-5 max-w-4xl text-4xl font-bold leading-[1.08] tracking-tight text-foreground sm:text-6xl">
            {post.title}
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-muted">{post.description}</p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm text-muted">
            <span>{post.readingTime}</span>
            <span>•</span>
            <span>{post.publishedAt}</span>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {post.keywords.map((keyword) => (
              <span key={keyword} className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted">
                {keyword}
              </span>
            ))}
          </div>
          <div className="mt-8 max-w-xl">
            <ContextualAdSlot path={`/blog/${post.slug}`} compact />
          </div>
          <div className={`mt-10 grid gap-8 ${post.image ? 'lg:grid-cols-[420px_minmax(0,1fr)]' : 'lg:grid-cols-1'}`}>
            {post.image ? (
                <div className="relative overflow-hidden border border-border shadow-xl">
                <img
                  src={post.image}
                  alt={post.title}
                  className="h-[420px] w-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/90 to-transparent px-6 py-6 text-white">
                  <p className="text-sm uppercase tracking-[0.24em] text-brand-light">Author</p>
                  {post.authorName && (
                    <p className="mt-2 text-2xl font-semibold tracking-tight text-white">{post.authorName}</p>
                  )}
                  {post.authorRole && (
                    <p className="mt-2 text-sm leading-6 text-slate-200">{post.authorRole}</p>
                  )}
                </div>
              </div>
            ) : null}
            <div className="flex min-h-[420px] items-center justify-center border border-brand/30 bg-brand-light p-10 text-center">
              <div className="max-w-2xl">
                <p className="text-[6rem] font-black leading-none text-brand/80">“</p>
                <p className="mt-4 text-xl font-semibold leading-9 text-foreground">{post.hero}</p>
                <p className="mt-4 text-[6rem] font-black leading-none text-brand/80">”</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-5xl px-6">
          <article className="mt-10 space-y-10">
            {post.sections.map((section) => (
              <section key={section.heading} className="border border-border bg-white p-8">
                <h2 className="text-2xl font-semibold text-foreground">{section.heading}</h2>
                <div className="mt-4 space-y-4 text-base leading-8 text-muted">
                  {section.body.map((paragraph) => (
                    <p key={paragraph}>{renderLinkedText(paragraph)}</p>
                  ))}
                </div>
                {section.bullets && (
                  <ul className="mt-6 space-y-3 text-sm leading-7 text-muted">
                    {section.bullets.map((bullet) => (
                      <li key={bullet} className="flex gap-3">
                        <span className="mt-1 text-brand">✓</span>
                        <span>{renderLinkedText(bullet)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </article>

          <div className="mt-12 rounded-2xl border border-border bg-surface p-8">
            <div className="flex items-center gap-2 text-sm font-medium text-brand">
              <BookOpen className="h-4 w-4" />
              Related reading
            </div>
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              {relatedPosts.map((item) => (
                <Link key={item.slug} href={`/blog/${item.slug}`} className="border border-border bg-background p-5 hover:border-brand/40 hover:bg-brand-light/40">
                  <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-muted">{item.excerpt}</p>
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-12 border border-brand/20 bg-brand-light/50 p-8 text-center">
            <h2 className="text-2xl font-semibold text-foreground">Ready to modernize your school?</h2>
            <p className="mt-3 text-lg text-muted">
              Explore the full SchoolBase platform and see how it supports smarter operations, stronger communication, and better educational outcomes.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-4">
              <Link href="/platform" className="inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-white hover:bg-brand/90">
                Explore the platform <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/contact" className="inline-flex items-center rounded-lg border border-border bg-background px-5 py-3 text-sm font-semibold text-foreground hover:bg-surface">
                Book a demo
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
