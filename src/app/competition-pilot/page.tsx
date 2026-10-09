"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpenCheck, Mail, ShieldCheck, Sparkles, Trophy } from "lucide-react";

const carouselLines = [
  "Practice with purpose.",
  "Build confidence one challenge at a time.",
  "Celebrate progress, not just scores.",
];

export default function CompetitionPilotPage() {
  const [activeLine, setActiveLine] = useState(0);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) return;
    const timer = window.setInterval(() => setActiveLine((current) => (current + 1) % carouselLines.length), 4200);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="relative isolate min-h-[640px] overflow-hidden bg-[#102943] text-white sm:min-h-[720px]">
        <Image
          src="/competition.png"
          alt="Students celebrating a learning achievement together"
          fill
          priority
          sizes="100vw"
          className="-z-20 object-cover object-center"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#071b2c]/95 via-[#0c2a43]/80 to-[#0c2a43]/20" />
        <div className="mx-auto flex min-h-[640px] max-w-7xl flex-col justify-between px-5 py-8 sm:min-h-[720px] sm:px-10 sm:py-12 lg:px-14">
          <Link href="/" className="inline-flex w-fit items-center gap-3" aria-label="SchoolBase home">
            <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/35 bg-white/10"><Trophy className="h-5 w-5" /></span>
            <span className="text-sm font-bold tracking-wide">SchoolBase <span className="font-normal text-white/70">Competition</span></span>
          </Link>

          <div className="max-w-3xl pb-12 pt-16 sm:pb-16">
            <p className="inline-flex items-center gap-2 border border-white/30 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[.15em] text-white/90">
              <span className="h-2 w-2 rounded-full bg-emerald-300" /> School pilot
            </p>
            <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-tight sm:text-6xl">Learn. Compete. Represent Your School.</h1>
            <div className="mt-5 min-h-8" aria-live="polite" aria-atomic="true">
              <p key={activeLine} className="text-lg text-white/85 motion-safe:animate-[pilot-line-in_.45s_ease-out] sm:text-xl">{carouselLines[activeLine]}</p>
            </div>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-white/80 sm:text-base">
              We’re inviting a small group of schools to help shape SchoolBase’s academic challenge experience. Students practise through timed challenges, with access connected to their existing SchoolBase guardian relationship.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/contact?topic=competition-pilot" className="inline-flex h-12 items-center gap-2 bg-white px-5 text-sm font-semibold text-[#102943] transition hover:bg-[#e6f1f8]">
                Ask about the pilot <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="mailto:support@schoolbase.live?subject=SchoolBase%20Competition%20pilot" className="inline-flex h-12 items-center gap-2 border border-white/60 bg-white/5 px-5 text-sm font-semibold text-white transition hover:bg-white/15">
                <Mail className="h-4 w-4" /> Email the team
              </a>
            </div>
            <p className="mt-4 text-xs leading-5 text-white/70">Pilot participation is optional. Championship and tournament events are not being advertised as available.</p>
          </div>

          <div className="flex items-center gap-2" aria-label={`Message ${activeLine + 1} of ${carouselLines.length}`}>
            {carouselLines.map((line, index) => (
              <button key={line} type="button" onClick={() => setActiveLine(index)} aria-label={`Show message ${index + 1}`} aria-current={index === activeLine ? "true" : undefined} className={`h-1.5 transition-all ${index === activeLine ? "w-10 bg-white" : "w-4 bg-white/45 hover:bg-white/70"}`} />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-px border-x border-border bg-border sm:grid-cols-3">
        <article className="bg-surface p-6 sm:p-8"><BookOpenCheck className="h-5 w-5 text-brand" /><h2 className="mt-4 text-lg font-semibold">Academic practice</h2><p className="mt-2 text-sm leading-6 text-muted">Timed question challenges give students another way to practise what they’re learning.</p></article>
        <article className="bg-surface p-6 sm:p-8"><ShieldCheck className="h-5 w-5 text-brand" /><h2 className="mt-4 text-lg font-semibold">Linked to school records</h2><p className="mt-2 text-sm leading-6 text-muted">Participation uses the student and guardian relationships already managed in SchoolBase.</p></article>
        <article className="bg-surface p-6 sm:p-8"><Sparkles className="h-5 w-5 text-brand" /><h2 className="mt-4 text-lg font-semibold">A pilot shaped with schools</h2><p className="mt-2 text-sm leading-6 text-muted">We’re gathering school feedback before expanding the experience or announcing events.</p></article>
      </section>

      <style>{`@keyframes pilot-line-in { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: translateY(0) } } @media (prefers-reduced-motion: reduce) { .motion-safe\\:animate-\\[pilot-line-in_\\.45s_ease-out\\] { animation: none !important; } }`}</style>
    </main>
  );
}