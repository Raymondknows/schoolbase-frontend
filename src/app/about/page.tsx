import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, HeartHandshake, Lightbulb, ShieldCheck, Users } from 'lucide-react'

export const metadata: Metadata = {
  title: 'About SchoolBase | School Management Platform',
  description:
    'Learn about SchoolBase and our mission to simplify school management for West African schools with fee collection, WhatsApp parent communication, and result publishing.',
  openGraph: {
    title: 'About SchoolBase',
    description:
      'Discover how SchoolBase is transforming school management for West African schools.',
    url: 'https://schoolbase.live/about',
    type: 'website',
  },
}

export default function AboutPage() {
  return (
    <div className="overflow-hidden bg-background">
      <section className="relative border-b border-border bg-[#f6faff]">
        <div className="mx-auto grid max-w-6xl gap-14 px-6 py-20 sm:py-28 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
          <div className="relative z-10">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">About SchoolBase</p>
            <h1 className="mt-6 max-w-3xl text-4xl font-bold leading-[1.08] tracking-tight text-foreground sm:text-6xl">Making school operations feel simpler, clearer, and more connected.</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted sm:text-xl">We are building the school management platform we wish every school team had: practical software that helps people spend less time chasing information and more time moving the school forward.</p>
            <div className="mt-9 flex flex-wrap gap-3"><Link href="/platform" className="inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-hover">Explore the platform <ArrowRight className="h-4 w-4" /></Link><Link href="/contact" className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-5 py-3 text-sm font-semibold text-foreground transition hover:border-brand hover:text-brand">Talk to our team</Link></div>
          </div>
          <div className="relative min-h-[360px] lg:min-h-[430px]"><div className="absolute inset-4 border border-brand/20 bg-white shadow-[18px_18px_0_0_#dcecff] sm:inset-8" /><div className="relative flex min-h-[360px] flex-col justify-between border border-brand/30 bg-white p-6 shadow-xl sm:min-h-[430px] sm:p-9"><div className="flex items-center justify-between border-b border-border pb-5"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Our mission</p><p className="mt-2 text-xl font-semibold text-foreground">Better tools for better school days</p></div><div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand text-white"><Users className="h-5 w-5" /></div></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{[{ label: 'Founded', value: '2025', tone: 'bg-[#eaf4ff]' }, { label: 'Focus', value: 'Schools', tone: 'bg-[#f1f7f4]' }, { label: 'Approach', value: 'Practical', tone: 'bg-[#fff7e8]' }, { label: 'Region', value: 'West Africa', tone: 'bg-[#f2efff]' }, { label: 'Support', value: 'Human', tone: 'bg-[#edf7f8]' }, { label: 'Purpose', value: 'Clarity', tone: 'bg-[#fff0f0]' }].map((item) => <div key={item.label} className={`${item.tone} border border-black/5 p-4`}><p className="text-xs text-muted">{item.label}</p><p className="mt-3 text-xl font-semibold text-foreground">{item.value}</p></div>)}</div><div className="border-t border-border pt-5 text-sm text-muted"><span className="font-semibold text-brand">School-first thinking.</span> Every product decision starts with the work schools actually do.</div></div></div>
        </div>
      </section>
      <section className="py-20 sm:py-24"><div className="mx-auto max-w-6xl px-6"><div className="max-w-3xl"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">Our story</p><h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-5xl">Technology should remove friction from the school day.</h2><p className="mt-5 text-lg leading-8 text-muted">SchoolBase was founded by ClickBase Technologies Ltd after seeing school teams work across paper files, spreadsheets, disconnected payment records, and delayed parent updates. We built one connected system to bring those workflows together.</p><p className="mt-4 text-lg leading-8 text-muted">Today, SchoolBase is helping schools across Nigeria, Ghana, Liberia, Sierra Leone, and The Gambia operate with more confidence and less administrative drag.</p></div><div className="mt-12 grid gap-4 md:grid-cols-3">{[{ icon: Lightbulb, title: 'Simple by design', text: 'The best school software is the software every member of the team can use confidently.' }, { icon: ShieldCheck, title: 'Built for trust', text: 'School records, payments, results, and communication deserve dependable systems and clear visibility.' }, { icon: HeartHandshake, title: 'Close to schools', text: 'We build with the realities of West African schools in mind, from local payments to practical support.' }].map((item) => { const Icon = item.icon; return <div key={item.title} className="border border-border bg-white p-6 transition hover:-translate-y-1 hover:border-brand/50 hover:shadow-lg"><div className="flex h-11 w-11 items-center justify-center bg-brand-light text-brand"><Icon className="h-5 w-5" /></div><h3 className="mt-6 text-xl font-semibold text-foreground">{item.title}</h3><p className="mt-3 leading-7 text-muted">{item.text}</p></div> })}</div></div></section>
      <section className="border-y border-border bg-[#f6faff] py-20 sm:py-24"><div className="mx-auto max-w-6xl px-6"><div className="max-w-3xl"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">Why schools choose us</p><h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-5xl">A complete foundation without unnecessary complexity.</h2></div><div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{['Fees, results, communication, and administration in one platform', 'Transparent plans with no hidden costs', 'Dedicated support for your school team', 'Workflows that connect the people and records in your school'].map((reason) => <div key={reason} className="flex items-start gap-3 border border-border bg-white p-5"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand" /><span className="text-sm leading-7 text-foreground">{reason}</span></div>)}</div></div></section>
      <section className="bg-brand py-16 text-white sm:py-20"><div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 px-6 md:flex-row md:items-center"><div><p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">Build a better school workflow</p><h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">See what SchoolBase can do for your team.</h2></div><Link href="/signup" className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-brand hover:bg-blue-50">Start Your School <ArrowRight className="h-4 w-4" /></Link></div></section>
    </div>
  )
}
