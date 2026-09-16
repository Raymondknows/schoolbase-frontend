import Link from 'next/link'
import {
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileText,
  LayoutDashboard,
  TrendingUp,
  Users,
} from 'lucide-react'

export const metadata = {
  title: 'School Fee Management System | SchoolBase',
  description:
    'Complete school fee management solution with automated invoicing, payment tracking, and Paystack integration. Reduce collection time by 40%.',
}

const statCards = [
  { label: 'Collection rate', value: '91%', sub: 'Live payment coverage', href: '/admin/fees', icon: CreditCard },
  { label: 'Outstanding fees', value: '₦2.8M', sub: 'Across active families', href: '/admin/fees', icon: FileText },
  { label: 'Reminder flow', value: '24/7', sub: 'Automated WhatsApp follow-up', href: '/admin/notifications', icon: Clock3 },
  { label: 'Operations', value: '40%', sub: 'Lower fee collection effort', href: '/admin', icon: LayoutDashboard },
]

const featureCards = [
  { icon: CreditCard, title: 'Automated invoicing', description: 'Generate invoices for multiple students and classes in seconds with set payment deadlines.' },
  { icon: CheckCircle2, title: 'Payment tracking', description: 'Track who paid, what is due, and how much remains across the whole school.' },
  { icon: TrendingUp, title: 'Multiple payment methods', description: 'Accept online transfers, cash, and student payments through one clean workflow.' },
  { icon: FileText, title: 'Auto-generated receipts', description: 'Send instant proof of payment and reduce misunderstandings for parents and staff.' },
  { icon: Users, title: 'Parent visibility', description: 'Give families a simple portal to see invoices, due balances, and payment history.' },
  { icon: Clock3, title: 'Time savings', description: 'Reduce repetitive billing admin and focus more attention on financial planning.' },
]

const quickWins = [
  'Reduce overdue balances through clearer reminders and payment visibility',
  'Track collection performance by class, term, and student in real time',
  'Give parents a cleaner way to pay and understand what they owe',
  'Keep billing records accurate with digital receipts and audit-friendly logs',
  'Cut manual reconciliation and administrative bottlenecks',
  'Make fee health part of your school’s daily operational dashboard',
]

export default function FeesManagementPage() {
  return (
    <div className="overflow-hidden bg-background">
      <section className="relative border-b border-border bg-[#f6faff]">
        <div className="mx-auto grid max-w-6xl gap-14 px-6 py-20 sm:py-28 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
          <div className="relative z-10">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">School fee management</p>
            <h1 className="mt-6 max-w-3xl text-4xl font-bold leading-[1.08] tracking-tight text-foreground sm:text-6xl">
              Digital fee management for schools.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted sm:text-xl">
              Stop chasing payments. SchoolBase automates invoicing, tracking, and follow-up so school teams can focus on operations rather than admin bottlenecks.
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
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Finance flow</p>
                  <p className="mt-2 text-xl font-semibold text-foreground">Clearer billing and faster collections</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand text-white"><CreditCard className="h-5 w-5" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {[
                  { label: 'Collection', value: '91%', tone: 'bg-[#eaf4ff]' },
                  { label: 'Invoices', value: 'Live', tone: 'bg-[#f1f7f4]' },
                  { label: 'Reminders', value: '24/7', tone: 'bg-[#fff7e8]' },
                  { label: 'Parents', value: 'Clear', tone: 'bg-[#f2efff]' },
                  { label: 'Receipts', value: 'Auto', tone: 'bg-[#edf7f8]' },
                  { label: 'Savings', value: '40%', tone: 'bg-[#fff0f0]' },
                ].map((item) => (
                  <div key={item.label} className={`${item.tone} border border-black/5 p-4`}>
                    <p className="text-xs text-muted">{item.label}</p>
                    <p className="mt-3 text-xl font-semibold text-foreground">{item.value}</p>
                  </div>
                ))}
              </div>
              <div className="border-t border-border pt-5 text-sm text-muted">
                <span className="font-semibold text-brand">Less chasing.</span> More predictable fee collections and cleaner parent communication.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="overview" className="py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">The core idea</p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-5xl">Make fee collection visible, organized, and easier to manage.</h2>
            <p className="mt-5 text-lg leading-8 text-muted">SchoolBase gives schools a cleaner way to generate invoices, track payment status, send reminders, and keep both staff and parents aligned around what is due and what has been paid.</p>
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
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-5xl">The fee-side wins that matter to every school.</h2>
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
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">Built for school finance</p>
            <h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">Turn fee collection into a cleaner, faster system.</h2>
          </div>
          <Link href="/signup" className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-brand hover:bg-blue-50">Start Your School <ArrowUpRight className="h-4 w-4" /></Link>
        </div>
      </section>
    </div>
  )
}
