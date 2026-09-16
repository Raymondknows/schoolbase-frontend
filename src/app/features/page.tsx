import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, BookOpen, ChevronRight, CircleDollarSign, ClipboardList, GraduationCap, Megaphone, School, Users } from 'lucide-react'
import { platformModules, platformSteps, roleCards } from '../platform/platform-content'

export const metadata: Metadata = {
  title: 'Features | SchoolBase School Management Platform',
  description:
    'Explore SchoolBase features: fee tracking, WhatsApp parent communication, result publishing, school website, attendance tracking, and more.',
  openGraph: {
    title: 'Features | SchoolBase',
    description:
      'Discover all the features SchoolBase offers for modern school management.',
    url: 'https://schoolbase.live/features',
    type: 'website',
  },
  alternates: { canonical: 'https://schoolbase.live/features' },
}

const moduleIcons = [School, CircleDollarSign, GraduationCap, Users, ClipboardList, BookOpen, CircleDollarSign, Megaphone, ClipboardList]

export default function FeaturesPage() {
  return (
    <div className="overflow-hidden bg-background">
      <section className="relative border-b border-border bg-[#f6faff]">
        <div className="mx-auto grid max-w-6xl gap-14 px-6 py-20 sm:py-28 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
          <div>
            <Link href="/platform" className="text-sm font-semibold uppercase tracking-[0.2em] text-brand hover:text-brand-hover">SchoolBase Platform</Link>
            <h1 className="mt-6 max-w-3xl text-4xl font-bold leading-[1.08] tracking-tight text-foreground sm:text-6xl">The features that keep school work connected.</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted sm:text-xl">Explore the verified capabilities behind SchoolBase, from administration and admissions to academics, fees, communication, parents, and reporting.</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="#modules" className="inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-white hover:bg-brand-hover">Explore features <ChevronRight className="h-4 w-4" /></Link>
              <Link href="/platform" className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-5 py-3 text-sm font-semibold text-foreground hover:border-brand hover:text-brand">View the platform <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </div>
          <div className="relative min-h-[360px] lg:min-h-[430px]">
            <div className="absolute inset-4 border border-brand/20 bg-white shadow-[18px_18px_0_0_#dcecff] sm:inset-8" />
            <div className="relative flex min-h-[360px] flex-col justify-between border border-brand/30 bg-white p-6 shadow-xl sm:min-h-[430px] sm:p-9">
              <div className="border-b border-border pb-5"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">School operations</p><p className="mt-2 text-xl font-semibold text-foreground">One connected feature set</p></div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{['Administration', 'Academics', 'Fees', 'Parents', 'Communication', 'Reports'].map((item) => <div key={item} className="border border-black/5 bg-brand-light p-4"><p className="text-sm font-semibold text-foreground">{item}</p><p className="mt-2 text-xs text-muted">Connected workflow</p></div>)}</div>
              <div className="border-t border-border pt-5 text-sm text-muted"><span className="font-semibold text-brand">Built around real work.</span> Each area connects to the records and people that need it.</div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-white py-20 sm:py-24"><div className="mx-auto max-w-6xl px-6"><div className="max-w-3xl"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">The feature map</p><h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-5xl">One school system, organized by the work each team does.</h2><p className="mt-5 text-lg leading-8 text-muted">Every feature area has a clear place in the platform. Open a guide to see its capabilities and connections.</p></div><div id="modules" className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{platformModules.map((module, index) => { const Icon = moduleIcons[index]; return <Link key={module.slug} href={`/docs/${module.slug}`} className="group border border-border bg-white p-6 transition hover:-translate-y-1 hover:border-brand/50 hover:shadow-lg"><div className="flex items-start justify-between gap-4"><div className="flex h-11 w-11 items-center justify-center bg-brand-light text-brand"><Icon className="h-5 w-5" /></div><ArrowRight className="h-5 w-5 text-muted transition group-hover:translate-x-1 group-hover:text-brand" /></div><p className="mt-7 text-xs font-semibold uppercase tracking-[0.16em] text-brand">{module.eyebrow}</p><h3 className="mt-2 text-xl font-semibold text-foreground">{module.title}</h3><p className="mt-3 leading-7 text-muted">{module.summary}</p></Link> })}</div></div></section>

      <section className="border-y border-border bg-[#f6faff] py-20 sm:py-24"><div className="mx-auto max-w-6xl px-6"><div className="max-w-3xl"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">How the features connect</p><h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-5xl">A practical flow from setup to insight.</h2></div><div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">{platformSteps.map((step) => <div key={step.number} className="border-t-2 border-brand bg-white p-6"><p className="text-sm font-bold text-brand">{step.number}</p><h3 className="mt-7 text-xl font-semibold text-foreground">{step.title}</h3><p className="mt-3 leading-7 text-muted">{step.text}</p></div>)}</div></div></section>

      <section className="py-20 sm:py-24"><div className="mx-auto max-w-6xl px-6"><div className="max-w-3xl"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">For the people in your school</p><h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-5xl">Relevant features for every role.</h2></div><div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{roleCards.map((role) => <Link key={role.title} href={role.href} className="group border border-border bg-white p-6 hover:border-brand/50"><h3 className="text-lg font-semibold text-foreground group-hover:text-brand">{role.title}</h3><p className="mt-3 text-sm leading-7 text-muted">{role.text}</p><span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand">Read the guide <ArrowRight className="h-4 w-4" /></span></Link>)}</div></div></section>

      <section className="bg-brand py-16 text-white sm:py-20"><div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 px-6 md:flex-row md:items-center"><div><p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">SchoolBase</p><h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">See the complete platform in context.</h2></div><Link href="/platform" className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-brand hover:bg-blue-50">Open the platform <ArrowRight className="h-4 w-4" /></Link></div></section>
    </div>
  )
}
