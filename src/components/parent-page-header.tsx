import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowUpRight, ChevronRight } from "lucide-react";

interface ParentPageHeaderProps {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
  count?: string;
  actionLabel?: string;
  actionHref?: string;
}

export default function ParentPageHeader({
  icon: Icon,
  eyebrow,
  title,
  description,
  count,
  actionLabel = "Dashboard",
  actionHref = "/parent",
}: ParentPageHeaderProps) {
  return (
    <header className="relative overflow-hidden border border-border bg-surface px-6 pb-7 pt-10 sm:px-8 sm:pb-8 sm:pt-12">
      <div className="absolute right-0 top-0 h-full w-1/3 bg-brand-light/40 [clip-path:polygon(35%_0,100%_0,100%_100%,0_100%)]" />
      <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-brand">
            <Icon className="h-4 w-4" />
            {eyebrow}
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {count && <span className="border border-border bg-background px-3 py-2 text-xs font-semibold text-muted">{count}</span>}
          <Link href={actionHref} className="inline-flex items-center gap-2 rounded-md bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-hover">
            {actionLabel}
            {actionLabel === "Dashboard" ? <ChevronRight className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
          </Link>
        </div>
      </div>
    </header>
  );
}
