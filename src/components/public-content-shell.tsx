import Link from "next/link";
import { ArrowRight, BadgeCheck } from "lucide-react";

interface PublicContentShellProps {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
  ctaTitle?: string;
  ctaText?: string;
  ctaHref?: string;
  ctaLabel?: string;
}

export function PublicContentShell({
  eyebrow,
  title,
  description,
  children,
  ctaTitle = "See how SchoolBase fits your school",
  ctaText = "Bring administration, academics, fees, communication, and parents into one clearer operating platform.",
  ctaHref = "/purchase",
  ctaLabel = "Get Started",
}: PublicContentShellProps) {
  return (
    <main className="overflow-hidden bg-background">
      <section className="border-b border-border bg-[#f6faff]">
        <div className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">{eyebrow}</p>
          <h1 className="mt-5 max-w-4xl text-4xl font-bold leading-[1.08] tracking-tight text-foreground sm:text-6xl">{title}</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-muted sm:text-xl">{description}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={ctaHref} className="inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-hover">{ctaLabel} <ArrowRight className="h-4 w-4" /></Link>
            <Link href="/platform" className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-5 py-3 text-sm font-semibold text-foreground transition hover:border-brand hover:text-brand">Explore the Platform</Link>
          </div>
        </div>
      </section>
      {children}
      <section className="bg-brand py-16 text-white sm:py-20">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 px-6 md:flex-row md:items-center">
          <div><p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">SchoolBase</p><h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">{ctaTitle}</h2><p className="mt-3 max-w-xl leading-7 text-white/80">{ctaText}</p></div>
          <Link href={ctaHref} className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-brand hover:bg-blue-50">{ctaLabel} <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>
    </main>
  );
}

export function ContentSection({ title, intro, children }: { title: string; intro?: string; children: React.ReactNode }) {
  return <section className="border-b border-border py-16 sm:py-20"><div className="mx-auto max-w-6xl px-6"><div className="max-w-3xl"><h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{title}</h2>{intro && <p className="mt-4 text-lg leading-8 text-muted">{intro}</p>}</div><div className="mt-10">{children}</div></div></section>;
}

export function ContentItem({ title, text }: { title: string; text: string }) {
  return <article className="border border-border bg-white p-6"><div className="flex items-start gap-3"><BadgeCheck className="mt-1 h-5 w-5 shrink-0 text-brand" /><div><h3 className="text-lg font-semibold text-foreground">{title}</h3><p className="mt-2 leading-7 text-muted">{text}</p></div></div></article>;
}
