import Link from 'next/link'
import {
  AlertCircle,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  Clock3,
  LayoutDashboard,
  Users,
} from 'lucide-react'

export const metadata = {
  title: 'Student Attendance Tracking System | SchoolBase',
  description:
    'Track student attendance with one-click marking. Get absence alerts, attendance reports, and parent notifications automatically.',
}

const statCards = [
  { label: 'Daily marking', value: '30 sec', sub: 'Per class', href: '/admin/attendance', icon: Clock3 },
  { label: 'Absence alerts', value: 'Same day', sub: 'Parents notified instantly', href: '/parent/attendance', icon: AlertCircle },
  { label: 'Class visibility', value: '100%', sub: 'Attendance history tracked', href: '/admin/attendance', icon: Users },
  { label: 'Operations', value: '80%', sub: 'Time saved daily', href: '/admin', icon: LayoutDashboard },
]

const featureCards = [
  { icon: Clock3, title: 'One-click marking', description: 'Mark attendance for the whole class in a few seconds without paper registers.' },
  { icon: AlertCircle, title: 'Absence alerts', description: 'Send automatic WhatsApp or SMS notices to parents when a student is absent.' },
  { icon: BarChart3, title: 'Analytics and patterns', description: 'Spot frequent absenteeism and flag students who need early intervention.' },
  { icon: Users, title: 'Class-level tracking', description: 'Monitor attendance by class and identify where support is needed.' },
  { icon: CheckCircle2, title: 'Instant reports', description: 'Generate monthly or termly attendance reports with a clean operational view.' },
  { icon: BarChart3, title: 'Parent portal access', description: 'Let parents review records and keep track of attendance history anytime.' },
]

const quickWins = [
  'Reduce the daily time teachers spend on manual attendance routines',
  'Keep accurate records with an automatic, traceable attendance history',
  'Notify parents the same day when attendance issues emerge',
  'Identify at-risk students before the problem grows',
  'Make class-level attendance trends easy to act on',
  'Support compliance and stronger parent communication with one system',
]

export default function AttendancePage() {
  return (
    <div className="overflow-hidden bg-background">
      <section className="relative border-b border-border bg-[#f6faff]">
        <div className="mx-auto grid max-w-6xl gap-14 px-6 py-20 sm:py-28 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
          <div className="relative z-10">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">Attendance tracking</p>
            <h1 className="mt-6 max-w-3xl text-4xl font-bold leading-[1.08] tracking-tight text-foreground sm:text-6xl">
              Digital student attendance tracking.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted sm:text-xl">
              Mark attendance with a single click, keep records clean, and notify parents automatically when an absence needs attention.
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
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">School operations</p>
                  <p className="mt-2 text-xl font-semibold text-foreground">Accurate attendance with less admin work</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand text-white"><Clock3 className="h-5 w-5" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {[
                  { label: 'Marking', value: '30 sec', tone: 'bg-[#eaf4ff]' },
                  { label: 'Alerts', value: 'Same day', tone: 'bg-[#f1f7f4]' },
                  { label: 'Coverage', value: '100%', tone: 'bg-[#fff7e8]' },
                  { label: 'Reports', value: 'Instant', tone: 'bg-[#f2efff]' },
                  { label: 'Trends', value: 'Visible', tone: 'bg-[#edf7f8]' },
                  { label: 'Savings', value: '80%', tone: 'bg-[#fff0f0]' },
                ].map((item) => (
                  <div key={item.label} className={`${item.tone} border border-black/5 p-4`}>
                    <p className="text-xs text-muted">{item.label}</p>
                    <p className="mt-3 text-xl font-semibold text-foreground">{item.value}</p>
                  </div>
                ))}
              </div>
              <div className="border-t border-border pt-5 text-sm text-muted">
                <span className="font-semibold text-brand">Less manual work.</span> Faster follow-up when attendance issues appear.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="overview" className="py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">The core idea</p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-5xl">Accurate attendance patterns help schools act earlier and communicate better.</h2>
            <p className="mt-5 text-lg leading-8 text-muted">SchoolBase helps schools record attendance in seconds, surface patterns quickly, and notify families when a student’s attendance needs attention without adding more admin burden.</p>
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
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-5xl">The attendance gains schools can act on right away.</h2>
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
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">School operations</p>
            <h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">Keep attendance accurate, visible, and easy to act on.</h2>
          </div>
          <Link href="/signup" className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-brand hover:bg-blue-50">Start Your School <ArrowUpRight className="h-4 w-4" /></Link>
        </div>
      </section>
    </div>
  )
}
