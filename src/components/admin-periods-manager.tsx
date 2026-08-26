"use client";

import { useEffect, useState } from "react";
import { Clock3, Plus, Save, Trash2, X } from "lucide-react";
import { playCloseTone, playOpenTone } from "@/lib/sounds";

type Period = {
  id: string;
  dayOfWeek: number;
  name: string;
  startsAt: string;
  endsAt: string;
  sortOrder: number;
};

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export default function AdminPeriodsManager({
  isOpen,
  configId,
  periods,
  published,
  onClose,
  onSaved,
}: {
  isOpen: boolean;
  configId?: string;
  periods: Period[];
  published: boolean;
  onClose: () => void;
  onSaved: (periods: Period[]) => void;
}) {
  const [draftPeriods, setDraftPeriods] = useState<Period[]>(periods);
  const [selectedDay, setSelectedDay] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setDraftPeriods(periods);
      const today = new Date().getDay();
      setSelectedDay(today >= 1 && today <= 5 ? today - 1 : 0);
      setError("");
    }
  }, [isOpen, periods]);

  if (!isOpen) return null;

  function updatePeriod(periodId: string, field: "name" | "startsAt" | "endsAt", value: string) {
    setDraftPeriods((current) => current.map((period) => period.id === periodId ? { ...period, [field]: value } : period));
  }

  function addPeriod(dayOfWeek: number) {
    setDraftPeriods((current) => {
      const dayPeriods = current.filter((period) => period.dayOfWeek === dayOfWeek);
      const sortOrder = Math.max(0, ...dayPeriods.map((period) => period.sortOrder)) + 1;
      return [...current, { id: `new-${dayOfWeek}-${Date.now()}`, dayOfWeek, name: `Period ${sortOrder}`, startsAt: "08:00", endsAt: "09:00", sortOrder }];
    });
  }

  function removePeriod(periodId: string) {
    setDraftPeriods((current) => current.filter((period) => period.id !== periodId));
  }

  async function savePeriods() {
    if (!configId || published) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/timetable/configs/${configId}/periods`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ periods: draftPeriods.map(({ dayOfWeek, name, startsAt, endsAt, sortOrder }) => ({ dayOfWeek, name, startsAt, endsAt, sortOrder })) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save periods");
      onSaved(data.periods || draftPeriods);
      onClose();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not save periods");
    } finally {
      setSaving(false);
    }
  }

  const selectedDayNumber = selectedDay + 1;
  const selectedPeriods = draftPeriods
    .filter((period) => period.dayOfWeek === selectedDayNumber)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 px-4 py-6" role="dialog" aria-modal="true" aria-labelledby="periods-modal-title">
      <section className="max-h-[min(760px,calc(100vh-48px))] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-surface shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-border/70 bg-brand/10 px-5 py-4 sm:px-6">
          <div className="flex items-start gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand/10 text-brand"><Clock3 className="h-5 w-5" /></div><div><h2 id="periods-modal-title" className="text-lg font-semibold text-foreground">School periods</h2><p className="mt-1 text-sm text-muted">Adjust the default times to match your school day.</p></div></div>
          <button type="button" onClick={() => { playCloseTone(); onClose(); }} className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-background hover:text-foreground" aria-label="Close school periods" title="Close"><X className="h-4 w-4" /></button>
        </header>
        {published ? <div className="mx-5 mt-4 rounded-lg border border-[#f4d38b] bg-[#fff8e6] px-4 py-3 text-sm text-[#8a5a00] sm:mx-6">This timetable is published. Return it to draft before changing its periods.</div> : null}
        <div className="p-5 sm:p-6">
          <div className="flex items-end justify-between gap-4 rounded-xl border border-border bg-background p-4">
            <label htmlFor="school-period-day" className="min-w-0 flex-1 text-xs font-bold uppercase tracking-[.14em] text-muted">School day
              <select id="school-period-day" value={selectedDay} onChange={(event) => setSelectedDay(Number(event.target.value))} className="mt-2 w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm font-semibold normal-case tracking-normal text-foreground outline-none focus:border-brand">
                {days.map((day, index) => <option key={day} value={index}>{day}</option>)}
              </select>
            </label>
            <button type="button" disabled={published} onClick={() => addPeriod(selectedDayNumber)} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-brand/20 bg-brand/5 px-3 py-2.5 text-xs font-semibold text-brand hover:bg-brand/10 disabled:opacity-40"><Plus className="h-3.5 w-3.5" /> Add period</button>
          </div>
          <div className="mt-5 flex items-center justify-between gap-3"><div><h3 className="text-base font-semibold text-foreground">{days[selectedDay]} periods</h3><p className="mt-1 text-xs text-muted">Edit the schedule inline.</p></div><span className="text-xs font-semibold text-muted">{selectedPeriods.length} {selectedPeriods.length === 1 ? "period" : "periods"}</span></div>
          <div className="mt-3 overflow-hidden rounded-xl border border-border">
            <div className="grid grid-cols-[minmax(0,1fr)_112px_112px_40px] gap-2 border-b border-border bg-background px-3 py-2 text-[10px] font-bold uppercase tracking-[.14em] text-muted"><span>Period</span><span>Starts</span><span>Ends</span><span /></div>
            {selectedPeriods.map((period) => <div key={period.id} className="grid grid-cols-[minmax(0,1fr)_112px_112px_40px] items-center gap-2 border-b border-border px-3 py-2 last:border-0 hover:bg-background/70"><input disabled={published} value={period.name} onChange={(event) => updatePeriod(period.id, "name", event.target.value)} className="min-w-0 rounded-md border border-transparent bg-transparent px-2 py-1.5 text-sm font-semibold text-foreground outline-none focus:border-brand focus:bg-surface disabled:opacity-60" /><input disabled={published} type="time" value={period.startsAt} onChange={(event) => updatePeriod(period.id, "startsAt", event.target.value)} className="w-full rounded-md border border-border bg-surface px-2 py-1.5 text-sm font-medium text-foreground disabled:opacity-60" aria-label={`${period.name} start time`} /><input disabled={published} type="time" value={period.endsAt} onChange={(event) => updatePeriod(period.id, "endsAt", event.target.value)} className="w-full rounded-md border border-border bg-surface px-2 py-1.5 text-sm font-medium text-foreground disabled:opacity-60" aria-label={`${period.name} end time`} /><button type="button" disabled={published} onClick={() => removePeriod(period.id)} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted hover:bg-[#fff5f5] hover:text-error disabled:opacity-40" aria-label={`Remove ${period.name}`} title="Remove period"><Trash2 className="h-4 w-4" /></button></div>)}
            {!selectedPeriods.length && <div className="px-4 py-8 text-center text-sm text-muted">No periods configured for {days[selectedDay]}.</div>}
          </div>
        </div>
        {error ? <p className="mx-5 mb-4 rounded-lg bg-[#fff5f5] px-3 py-2 text-sm text-error sm:mx-6">{error}</p> : null}
        <footer className="flex justify-end gap-3 border-t border-border px-5 py-4 sm:px-6"><button type="button" onClick={() => { playCloseTone(); onClose(); }} className="rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-background">Cancel</button><button type="button" disabled={saving || published} onClick={savePeriods} className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"><Save className="h-4 w-4" /> {saving ? "Saving..." : "Save periods"}</button></footer>
      </section>
    </div>
  );
}
