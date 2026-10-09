"use client";

import { useEffect, useState } from "react";
import { CalendarDays, RefreshCw } from "lucide-react";
import { ErrorModal } from "@/components/ui/error-modal";

type Tournament = {
  id: string;
  title: string;
  status: string;
  scope: string;
  startsAt: string | null;
  category: { name: string };
  _count: { schools: number; participants: number };
};

export default function CompetitionTournamentsPage() {
  const [items, setItems] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/schoolbase-admin/api/competition/admin/tournaments", { credentials: "include", cache: "no-store" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error === "FEATURE_DISABLED"
          ? "School tournaments are gated off. Turn this on only after tournament operations, privacy review, and support readiness are complete."
          : data.error || "Unable to load tournaments.");
      }
      setItems(data.tournaments || []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load tournaments.");
    } finally {
      setLoading(false);
    }
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, []);

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-2 py-6 sm:px-8 sm:py-8 lg:px-12">
      <header className="flex items-end justify-between gap-3 border border-border bg-surface p-6 sm:p-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.16em] text-brand">Competition administration</p>
          <h1 className="competition-heading-light mt-2 text-3xl font-semibold text-foreground">Tournaments</h1>
          <p className="mt-2 text-sm text-muted">School registrations, rounds, matches, and qualification operations.</p>
        </div>
        <button type="button" onClick={() => void load()} disabled={loading} className="inline-flex h-10 items-center gap-2 border border-border px-3 text-sm font-semibold text-brand hover:bg-brand-light disabled:opacity-50">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </header>

      <section className="border border-border bg-surface">
        <div className="grid grid-cols-[1.4fr_.8fr_.7fr_.7fr] gap-3 border-b border-border bg-background px-4 py-3 text-xs font-bold uppercase tracking-wide text-muted">
          <span>Tournament</span><span>Status</span><span>Schools</span><span>Participants</span>
        </div>
        {items.length ? items.map((item) => (
          <article key={item.id} className="grid grid-cols-[1.4fr_.8fr_.7fr_.7fr] gap-3 border-b border-border px-4 py-4 text-sm last:border-0">
            <div>
              <p className="font-semibold text-foreground">{item.title}</p>
              <p className="mt-1 text-xs text-muted">{item.category.name} · {item.scope}{item.startsAt ? ` · ${new Date(item.startsAt).toLocaleDateString()}` : ""}</p>
            </div>
            <span className="text-muted">{item.status}</span>
            <span className="tabular-nums text-foreground">{item._count.schools}</span>
            <span className="tabular-nums text-foreground">{item._count.participants}</span>
          </article>
        )) : !loading && !error ? (
          <div className="p-12 text-center">
            <CalendarDays className="mx-auto h-8 w-8 text-brand" />
            <p className="mt-3 text-sm font-semibold text-foreground">No tournaments configured</p>
            <p className="mt-1 text-sm text-muted">Tournament creation remains gated until event rules and operations are ready.</p>
          </div>
        ) : null}
      </section>
      <ErrorModal isOpen={Boolean(error)} onClose={() => setError(null)} title="Competition tournaments could not be loaded" message={error || "Unable to load tournaments."} type="error" confirmLabel="Okay" />
    </main>
  );
}