import { Metadata } from 'next'
import {
  ArrowUpRight,
  Bell,
  CheckCircle2,
  CreditCard,
  DollarSign,
  LayoutDashboard,
  MessageSquare,
  Smartphone,
  TrendingUp,
  Users,
} from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Parent Solutions | SchoolBase',
  description:
    'Stay connected with your child\'s school. Get fee notifications on WhatsApp, track results in real-time, and never miss important updates.',
  keywords: [
    'parent communication app',
    'school portal parents',
    'fee notification app',
    'student results tracking',
  ],
  openGraph: {
    title: 'Parent Solutions | SchoolBase',
    description: 'Stay connected with your child\'s school on WhatsApp',
  },
}

const statCards = [
  { label: 'Fee visibility', value: '100%', sub: 'Clear due dates and balances', href: '/parent/invoices', icon: DollarSign },
  { label: 'Parent updates', value: 'Instant', sub: 'Alerts on WhatsApp', href: '/parent/announcements', icon: MessageSquare },
  { label: 'Results access', value: '24/7', sub: 'Track progress anytime', href: '/parent/results', icon: TrendingUp },
  { label: 'Support', value: '1 place', sub: 'Fees, updates, and communication', href: '/parent', icon: LayoutDashboard },
]

const featureCards = [
  { icon: DollarSign, title: 'Instant fee notifications', description: 'See due amounts, scheduled dates, and payment status in a simple mobile-first view.' },
  { icon: TrendingUp, title: 'Track results in real time', description: 'Follow your child’s academic progress as soon as results are published by the school.' },
  { icon: Bell, title: 'School announcements', description: 'Receive key changes, reminders, and events in one clear communication channel.' },
  { icon: Smartphone, title: 'Easy fee payments', description: 'Pay approved charges through a simple flow that fits how busy families already operate.' },
  { icon: Users, title: 'Direct communication', description: 'Connect with teachers and school staff without losing context or missing updates.' },
  { icon: CreditCard, title: 'Payment history', description: 'Review invoices, receipts, and past payments whenever you need a clear record.' },
]

const quickWins = [
  'Know exactly when fees are due and what is owed',
  'Receive school updates without searching through messages',
  'See progress reports as soon as they are published',
  'Pay school charges through a simpler mobile-first flow',
  'Stay informed and involved in your child’s school journey',
  'Reduce confusion with better communication and clearer records',
]

export default function ParentsPage() {
  return (
    <div className="overflow-hidden bg-background">
      <section className="relative border-b border-border bg-[#f6faff]">
        <div className="mx-auto grid max-w-6xl gap-14 px-6 py-20 sm:py-28 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
          <div className="relative z-10">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">For parents</p>
            <h1 className="mt-6 max-w-3xl text-4xl font-bold leading-[1.08] tracking-tight text-foreground sm:text-6xl">
              Stay connected to your child’s school, without the stress.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted sm:text-xl">
              Keep fees, announcements, and academic updates in one simple, mobile-friendly place that is easy to follow.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/login" className="inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-hover">
                Parent login <ArrowUpRight className="h-4 w-4" />
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
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Parent view</p>
                  <p className="mt-2 text-xl font-semibold text-foreground">One clear school overview</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand text-white"><Bell className="h-5 w-5" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {[
                  { label: 'Fees', value: 'Due', tone: 'bg-[#eaf4ff]' },
                  { label: 'Results', value: 'Live', tone: 'bg-[#f1f7f4]' },
                  { label: 'Alerts', value: 'Instant', tone: 'bg-[#fff7e8]' },
                  { label: 'Updates', value: 'Clear', tone: 'bg-[#f2efff]' },
                  { label: 'History', value: 'View', tone: 'bg-[#edf7f8]' },
                  { label: 'Support', value: 'Easy', tone: 'bg-[#fff0f0]' },
                ].map((item) => (
                  <div key={item.label} className={`${item.tone} border border-black/5 p-4`}>
                    <p className="text-xs text-muted">{item.label}</p>
                    <p className="mt-3 text-xl font-semibold text-foreground">{item.value}</p>
                  </div>
                ))}
              </div>
              <div className="border-t border-border pt-5 text-sm text-muted">
                <span className="font-semibold text-brand">Clear communication.</span> Families know what matters, without the extra confusion.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="overview" className="py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">The core idea</p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-5xl">Make school communication more useful, easier to trust, and easier to act on.</h2>
            <p className="mt-5 text-lg leading-8 text-muted">SchoolBase helps parents stay informed about fees, school updates, attendance, and academic progress without chasing information across multiple messages or channels.</p>
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
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-5xl">The parent-side benefits that make the difference.</h2>
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
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">A clearer parent experience</p>
            <h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">Stay informed and connected without the confusion.</h2>
          </div>
          <Link href="/login" className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-brand hover:bg-blue-50">Parent login <ArrowUpRight className="h-4 w-4" /></Link>
        </div>
      </section>
    </div>
  )
}
