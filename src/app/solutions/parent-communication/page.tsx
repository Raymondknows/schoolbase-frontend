import Link from 'next/link'
import {
  ArrowUpRight,
  BarChart3,
  Bell,
  CheckCircle2,
  LayoutDashboard,
  MessageSquare,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react'

export const metadata = {
  title: 'Parent Communication & Student Results Sharing | SchoolBase',
  description:
    'Keep parents informed with automated result notifications, instant result access, and two-way communication. Increase parent engagement by 90%.',
}

const statCards = [
  { label: 'Parent engagement', value: '90%', sub: 'Higher response and adoption', href: '/parent', icon: Users },
  { label: 'Result alerts', value: 'Same day', sub: 'Published in real time', href: '/parent/results', icon: Bell },
  { label: 'Communication', value: '2-way', sub: 'Teacher and admin updates', href: '/parent', icon: MessageSquare },
  { label: 'Operations', value: '24/7', sub: 'Parent visibility and access', href: '/admin', icon: LayoutDashboard },
]

const featureCards = [
  { icon: Bell, title: 'Instant notifications', description: 'Send result, fee, and announcement alerts to parents immediately through WhatsApp and SMS.' },
  { icon: Users, title: 'Parent portal', description: 'Give families one place to review academic performance, attendance, and fees.' },
  { icon: TrendingUp, title: 'Progress tracking', description: 'Help parents monitor term-by-term growth and address issues before they widen.' },
  { icon: MessageSquare, title: 'Two-way communication', description: 'Let parents ask questions and receive a faster, clearer school response.' },
  { icon: Zap, title: 'Fee notifications', description: 'Ensure parents know when invoices are due and avoid late payment confusion.' },
  { icon: CheckCircle2, title: 'Announcements', description: 'Broadcast exam dates, school events, and updates directly to families in one touchpoint.' },
]

const quickWins = [
  'Keep parents up to date without waiting for paper reports or manual follow-up',
  'Improve trust through consistent, timely communication and transparent updates',
  'Reduce confusion around fees, attendance, and academic performance',
  'Make school information available on mobile, where families already engage',
  'Support early intervention when attendance or results start to slip',
  'Create a more responsive, parent-first school experience',
]

export default function ParentCommunicationPage() {
  return (
    <div className="overflow-hidden bg-background">
      <section className="relative border-b border-border bg-[#f6faff]">
        <div className="mx-auto grid max-w-6xl gap-14 px-6 py-20 sm:py-28 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
          <div className="relative z-10">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">Parent engagement</p>
            <h1 className="mt-6 max-w-3xl text-4xl font-bold leading-[1.08] tracking-tight text-foreground sm:text-6xl">
              Parent communication and results sharing, built for clarity.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted sm:text-xl">
              Results, announcements, and fee updates are published in real time so families stay informed without the usual delays and confusion.
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
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Parent experience</p>
                  <p className="mt-2 text-xl font-semibold text-foreground">One communication channel, better trust</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand text-white"><Bell className="h-5 w-5" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {[
                  { label: 'Engagement', value: '90%', tone: 'bg-[#eaf4ff]' },
                  { label: 'Alerts', value: 'Same day', tone: 'bg-[#f1f7f4]' },
                  { label: 'Results', value: 'Live', tone: 'bg-[#fff7e8]' },
                  { label: 'Fees', value: 'Clear', tone: 'bg-[#f2efff]' },
                  { label: 'Access', value: '24/7', tone: 'bg-[#edf7f8]' },
                  { label: 'Replies', value: '2-way', tone: 'bg-[#fff0f0]' },
                ].map((item) => (
                  <div key={item.label} className={`${item.tone} border border-black/5 p-4`}>
                    <p className="text-xs text-muted">{item.label}</p>
                    <p className="mt-3 text-xl font-semibold text-foreground">{item.value}</p>
                  </div>
                ))}
              </div>
              <div className="border-t border-border pt-5 text-sm text-muted">
                <span className="font-semibold text-brand">Reliable updates.</span> Families know what matters when it matters.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="overview" className="py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">The core idea</p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-5xl">Clear communication gives families more confidence in the school.</h2>
            <p className="mt-5 text-lg leading-8 text-muted">SchoolBase keeps parents informed with real-time academic updates, attendance insight, fee reminders, and school announcements without overloading them with scattered messages or delayed follow-up.</p>
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
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-5xl">The communication gains that make the biggest difference.</h2>
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
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">A stronger parent experience</p>
            <h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">Keep families informed, connected, and confident.</h2>
          </div>
          <Link href="/signup" className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-brand hover:bg-blue-50">Start Your School <ArrowUpRight className="h-4 w-4" /></Link>
        </div>
      </section>
    </div>
  )
}
