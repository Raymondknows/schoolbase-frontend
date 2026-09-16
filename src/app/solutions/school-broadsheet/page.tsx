import Link from 'next/link'
import {
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  Download,
  Eye,
  FileText,
  LayoutDashboard,
  Table2,
  TrendingUp,
  Users,
} from 'lucide-react'

export const metadata = {
  title: 'School Broadsheet Software | SchoolBase',
  description:
    'View all student results in one table (pupils × subjects). Export to CSV/PDF. Identify top/bottom performers instantly. Professional reporting.',
}

const statCards = [
  { label: 'Analysis time', value: '30 min', sub: 'Saved per broadsheet', href: '/admin/results', icon: BarChart3 },
  { label: 'Accuracy', value: '100%', sub: 'Auto-ranked performance', href: '/admin/results', icon: CheckCircle2 },
  { label: 'Visibility', value: 'All classes', sub: 'At a glance', href: '/admin/results', icon: Eye },
  { label: 'Operations', value: '3x', sub: 'Faster decision making', href: '/admin', icon: LayoutDashboard },
]

const featureCards = [
  { icon: Table2, title: 'Instant broadsheet view', description: 'See the full pupil-by-subject matrix without building reports by hand.' },
  { icon: Users, title: 'Automatic ranking', description: 'Rank students by total score accurately and consistently every term.' },
  { icon: BarChart3, title: 'Subject analytics', description: 'Spot the strongest and weakest subjects across the class quickly.' },
  { icon: Eye, title: 'Mobile view', description: 'Review class data cleanly on phone or desktop without losing context.' },
  { icon: Download, title: 'Export options', description: 'Download the data as CSV or PDF and share it with stakeholders when needed.' },
  { icon: TrendingUp, title: 'Data-driven insights', description: 'See top performers, intervention needs, and subject trends from one dashboard.' },
]

const quickWins = [
  'Cut down on manual result compilation and revision time',
  'Reduce ranking errors and inconsistent class analysis',
  'Monitor performance by subject and by pupil in a single view',
  'Create cleaner parent and leadership reviews across each term',
  'Highlight intervention needs before they become long-term issues',
  'Move academic reviews into a more consistent, decision-ready workflow',
]

export default function BroadsheetPage() {
  return (
    <div className="overflow-hidden bg-background">
      <section className="relative border-b border-border bg-[#f6faff]">
        <div className="mx-auto grid max-w-6xl gap-14 px-6 py-20 sm:py-28 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
          <div className="relative z-10">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">School broadsheet</p>
            <h1 className="mt-6 max-w-3xl text-4xl font-bold leading-[1.08] tracking-tight text-foreground sm:text-6xl">
              Digital school broadsheet software.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted sm:text-xl">
              View every student and every subject in one table, export the data when needed, and spot performance patterns without spreadsheets and manual sorting.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/signup" className="inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-hover">
                Get Started <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link href="#overview" className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-5 py-3 text-sm font-semibold text-foreground transition hover:border-brand hover:text-brand">
                See the overview
              </Link>
            </div>
          </div>

          <div className="relative min-h-[360px] lg:min-h-[430px]">
            <div className="absolute inset-4 border border-brand/20 bg-white shadow-[18px_18px_0_0_#dcecff] sm:inset-8" />
            <div className="relative flex min-h-[360px] flex-col justify-between border border-brand/30 bg-white p-6 shadow-xl sm:min-h-[430px] sm:p-9">
              <div className="flex items-center justify-between border-b border-border pb-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">School view</p>
                  <p className="mt-2 text-xl font-semibold text-foreground">Every student, every subject, one table</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand text-white"><Table2 className="h-5 w-5" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {[
                  { label: 'Analysis', value: '30 min', tone: 'bg-[#eaf4ff]' },
                  { label: 'Accuracy', value: '100%', tone: 'bg-[#f1f7f4]' },
                  { label: 'Visibility', value: 'All classes', tone: 'bg-[#fff7e8]' },
                  { label: 'Exports', value: 'CSV/PDF', tone: 'bg-[#f2efff]' },
                  { label: 'Ranking', value: 'Auto', tone: 'bg-[#edf7f8]' },
                  { label: 'Insights', value: 'Clear', tone: 'bg-[#fff0f0]' },
                ].map((item) => (
                  <div key={item.label} className={`${item.tone} border border-black/5 p-4`}>
                    <p className="text-xs text-muted">{item.label}</p>
                    <p className="mt-3 text-xl font-semibold text-foreground">{item.value}</p>
                  </div>
                ))}
              </div>
              <div className="border-t border-border pt-5 text-sm text-muted">
                <span className="font-semibold text-brand">Better academic insight.</span> Class trends become easier to act on.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="overview" className="py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">The core idea</p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-5xl">Turn classroom data into clearer decisions and faster action.</h2>
            <p className="mt-5 text-lg leading-8 text-muted">SchoolBase gives schools a clean matrix of academic performance so leaders can review patterns, identify intervention needs, and share results clearly with parents and staff.</p>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {featureCards.map((card) => {
              const Icon = card.icon
              return (
                <div key={card.title} className="border border-border bg-white p-6 transition hover:-translate-y-1 hover:border-brand/50 hover:shadow-lg">
                  <div className="flex h-11 w-11 items-center justify-center bg-brand-light text-brand">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-6 text-xl font-semibold text-foreground">{card.title}</h3>
                  <p className="mt-3 leading-7 text-muted">{card.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-[#f6faff] py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">What improves immediately</p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-5xl">The academic wins that matter most.</h2>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {quickWins.map((item) => (
              <div key={item} className="flex items-start gap-3 border border-border bg-white p-5">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
                <span className="text-sm leading-7 text-foreground">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-brand py-16 text-white sm:py-20">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 px-6 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">Academic visibility</p>
            <h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">Turn classroom data into better decisions.</h2>
          </div>
          <Link href="/signup" className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-brand hover:bg-blue-50">Start Your School <ArrowUpRight className="h-4 w-4" /></Link>
        </div>
      </section>
    </div>
  )
}
