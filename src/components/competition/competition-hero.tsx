import Image from "next/image";
import type { ReactNode } from "react";

type CompetitionHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
  compact?: boolean;
};

export default function CompetitionHero({ eyebrow, title, description, children, compact = false }: CompetitionHeroProps) {
  return (
    <header className={`relative isolate flex flex-col justify-between overflow-hidden bg-[#102943] px-6 py-7 text-white sm:px-10 sm:py-9 ${compact ? "min-h-[250px] sm:min-h-[280px]" : "min-h-[400px] sm:min-h-[460px] lg:min-h-[500px]"}`}>
      <Image src="/competition.png" alt="Students celebrating an academic competition achievement together" fill priority sizes="(min-width: 1280px) 1200px, 100vw" className="-z-20 object-cover object-center" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#071b2c]/95 via-[#0c2a43]/78 to-[#0c2a43]/28" />
      <div className="relative flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-white/75">
        <span className="h-2 w-2 rounded-full bg-emerald-300" />{eyebrow}
      </div>
      <div className={`relative flex w-full flex-col justify-between gap-7 sm:flex-row sm:items-end ${compact ? "py-7 sm:py-8" : "py-12 sm:py-14"}`}>
        <div className="max-w-3xl">
          <h1 className={`font-semibold leading-tight text-white ${compact ? "text-3xl sm:text-4xl" : "text-4xl sm:text-5xl lg:text-6xl"}`}>{title}</h1>
          <p className={`max-w-2xl text-sm leading-7 text-white/85 sm:text-base ${compact ? "mt-3" : "mt-5"}`}>{description}</p>
        </div>
        {children ? <div className="relative shrink-0">{children}</div> : null}
      </div>
      {!compact ? <div className="relative text-xs font-semibold uppercase tracking-[.16em] text-white/70">A SchoolBase academic challenge experience</div> : null}
    </header>
  );
}