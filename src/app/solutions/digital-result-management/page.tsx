import Link from 'next/link'
import {
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  FileText,
  LayoutDashboard,
  TrendingDown,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react'

export const metadata = {
  title: 'Digital Result Management System | SchoolBase',
  description:
  'Manage student results digitally with configured grading, class positioning, report generation, and controlled parent publication.',
}

const statCards = [
  { label: 'Result entry', value: 'Digital', sub: 'Teacher score workflows', href: '/admin/results', icon: Zap },
  { label: 'Grade calculation', value: 'Configured', sub: 'School assessment rules', href: '/admin/results', icon: BarChart3 },
  { label: 'Parent visibility', value: 'Published', sub: 'After admin release', href: '/parent/results', icon: FileText },
  { label: 'Operations', value: 'Connected', sub: 'Admin and teacher workflow', href: '/admin', icon: LayoutDashboard },
]

const featureCards = [
  { icon: Zap, title: 'Fast result entry', description: 'Teachers enter marks once and the system handles calculation, ranking, and review.' },
  { icon: BarChart3, title: 'Automatic grading', description: 'Apply school grading rules consistently without manual formula errors or data loss.' },
  { icon: FileText, title: 'Instant reports', description: 'Generate professional result reports in seconds and share them to parents immediately.' },
  { icon: Users, title: 'Class positioning', description: 'Show each student’s rank and class performance at a glance across the entire cohort.' },
  { icon: BarChart3, title: 'School broadsheet', description: 'View subject-by-student performance in one clean matrix for quick decision-making.' },
  { icon: TrendingDown, title: 'Progress tracking', description: 'Compare term-to-term performance to catch gaps early and support each learner.' },
]

const quickWins = [
  'Reduce teacher workload and eliminate repetitive score calculations',
  'Keep grade records consistent and traceable across the school term',
  'Give parents access to academic progress as soon as results are published',
  'Identify weak subjects and intervention needs without manual spreadsheet work',
  'Use class-wide data to guide academic planning and leadership reviews',
  'Turn reporting cycles into a predictable, organized process',
]

export default function ResultsPage() {
  return (
    <div className="overflow-hidden bg-background">
      <section className="relative border-b border-border bg-[#f6faff]">
        <div className="mx-auto grid max-w-6xl gap-14 px-6 py-20 sm:py-28 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
          <div className="relative z-10">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">Digital results</p>
            <h1 className="mt-6 max-w-3xl text-4xl font-bold leading-[1.08] tracking-tight text-foreground sm:text-6xl">
              Digital result management for schools.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted sm:text-xl">
              Stop using paper result sheets. SchoolBase handles grading, class positioning, and publishing in one connected workflow so teachers move faster with fewer errors.
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
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Results flow</p>
                  <p className="mt-2 text-xl font-semibold text-foreground">One system for grades and reporting</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand text-white"><FileText className="h-5 w-5" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {[
                  { label: 'Entry', value: '3x faster', tone: 'bg-[#eaf4ff]' },
                  { label: 'Grading', value: '100%', tone: 'bg-[#f1f7f4]' },
                  { label: 'Reports', value: 'Live', tone: 'bg-[#fff7e8]' },
                  { label: 'Parents', value: '24h', tone: 'bg-[#f2efff]' },
                  { label: 'Ranking', value: 'Auto', tone: 'bg-[#edf7f8]' },
                  { label: 'Tracking', value: 'Clear', tone: 'bg-[#fff0f0]' },
                ].map((item) => (
                  <div key={item.label} className={`${item.tone} border border-black/5 p-4`}>
                    <p className="text-xs text-muted">{item.label}</p>
                    <p className="mt-3 text-xl font-semibold text-foreground">{item.value}</p>
                  </div>
                ))}
              </div>
              <div className="border-t border-border pt-5 text-sm text-muted">
                <span className="font-semibold text-brand">Fewer errors.</span> Better academic visibility for teachers, leaders, and parents.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="overview" className="py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">The core idea</p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-5xl">Modern result workflows that save time and improve accuracy.</h2>
            <p className="mt-5 text-lg leading-8 text-muted">SchoolBase turns result entry, grading, class ranking, and parent publishing into a single connected process so schools can move faster without losing control of standards.</p>
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
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-5xl">The wins schools notice first.</h2>
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
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">Better results</p>
            <h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">Turn result publishing into a faster, cleaner workflow.</h2>
          </div>
          <Link href="/signup" className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-brand hover:bg-blue-50">Start Your School <ArrowUpRight className="h-4 w-4" /></Link>
        </div>
      </section>
    </div>
  )
}
