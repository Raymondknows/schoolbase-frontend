"use client";

import { useState } from "react";
import { Bell, Check, Play, Volume2, X } from "lucide-react";
import { playBellPattern, type BellRingMode, type BellTone, unlockAudio } from "@/lib/sounds";

type ToneOption = { value: BellTone; label: string; detail: string };
const tones: ToneOption[] = [
  { value: "traditional", label: "Traditional school bell", detail: "Rich, resonant two-strike bell" },
  { value: "deep", label: "Deep campus bell", detail: "Loud low-frequency hall bell" },
  { value: "mechanical", label: "Mechanical bell", detail: "Classic double ring" },
  { value: "carillon", label: "Carillon", detail: "Ceremonial multi-note bell" },
  { value: "siren", label: "Siren call", detail: "Powerful alternating public signal" },
  { value: "police", label: "Police siren", detail: "Rising and falling emergency whoop" },
  { value: "urgent", label: "Urgent period bell", detail: "Strong repeating signal" },
  { value: "classic", label: "Classic chime", detail: "Warm two-note signal" },
  { value: "double", label: "Double bell", detail: "Clear repeating signal" },
  { value: "school", label: "Bright school bell", detail: "Bright three-note signal" },
  { value: "soft", label: "Soft progression", detail: "Gentler campus signal" },
  { value: "marimba", label: "Marimba call", detail: "Friendly distinctive signal" },
  { value: "alert", label: "Priority alert", detail: "Strong attention signal" },
];

export default function AdminBellManager({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [enabled, setEnabled] = useState(() => typeof window !== "undefined" && window.localStorage.getItem("schoolbase:bells-enabled") === "true");
  const [tone, setTone] = useState<BellTone>(() => (typeof window !== "undefined" && (window.localStorage.getItem("schoolbase:bell-tone") as BellTone)) || "classic");
  const [ringMode, setRingMode] = useState<BellRingMode>(() => (typeof window !== "undefined" && (window.localStorage.getItem("schoolbase:bell-ring-mode") as BellRingMode)) || "count");
  const [ringCount, setRingCount] = useState(() => Number(typeof window !== "undefined" ? window.localStorage.getItem("schoolbase:bell-ring-count") || "1" : "1"));

  if (!isOpen) return null;

  const updateEnabled = (value: boolean) => {
    unlockAudio();
    setEnabled(value);
    window.localStorage.setItem("schoolbase:bells-enabled", String(value));
    if (value) playBellPattern(tone, ringMode, ringCount);
  };

  const updateTone = (value: BellTone) => {
    setTone(value);
    window.localStorage.setItem("schoolbase:bell-tone", value);
  };

  const testTone = () => {
    unlockAudio();
    playBellPattern(tone, ringMode, ringCount);
  };

  const updateRingMode = (value: BellRingMode) => {
    setRingMode(value);
    window.localStorage.setItem("schoolbase:bell-ring-mode", value);
  };

  const updateRingCount = (value: number) => {
    setRingCount(value);
    window.localStorage.setItem("schoolbase:bell-ring-count", String(value));
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 px-4 py-6 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-labelledby="bell-modal-title">
      <section className="w-full max-w-lg rounded-2xl border border-border bg-surface p-5 shadow-2xl sm:p-6">
        <header className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600"><Bell className="h-5 w-5" /></div>
            <div><h2 id="bell-modal-title" className="text-lg font-semibold text-foreground">School bell settings</h2><p className="mt-1 text-sm text-muted">Use the published timetable periods as your school bell.</p></div>
          </div>
          <button type="button" onClick={onClose} className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-background hover:text-foreground" aria-label="Close school bell settings" title="Close"><X className="h-4 w-4" /></button>
        </header>

        <label className="mt-6 flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-border bg-background p-4">
          <span><span className="block text-sm font-semibold text-foreground">Play on every period</span><span className="mt-1 block text-xs text-muted">Ring when each published period begins.</span></span>
          <input type="checkbox" checked={enabled} onChange={(event) => updateEnabled(event.target.checked)} className="h-5 w-5 accent-brand" />
        </label>

        <div className="mt-6">
          <label htmlFor="bell-tone" className="flex items-center justify-between gap-3 text-sm font-semibold text-foreground">
            <span>Bell tone<span className="mt-1 block text-xs font-normal text-muted">Choose the sound.</span></span>
            <Volume2 className="h-4 w-4 text-brand" />
          </label>
          <select id="bell-tone" value={tone} onChange={(event) => updateTone(event.target.value as BellTone)} className="mt-3 w-full rounded-xl border border-border bg-background px-3 py-3 text-sm font-semibold text-foreground outline-none focus:border-brand">
            {tones.map((option) => <option key={option.value} value={option.value}>{option.label} - {option.detail}</option>)}
          </select>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <label htmlFor="bell-ring-mode" className="text-sm font-semibold text-foreground">Ring pattern<span className="mt-1 block text-xs font-normal text-muted">Choose ring pattern.</span><select id="bell-ring-mode" value={ringMode} onChange={(event) => updateRingMode(event.target.value as BellRingMode)} className="mt-3 w-full rounded-xl border border-border bg-background px-3 py-3 text-sm font-semibold text-foreground outline-none focus:border-brand"><option value="count">A set number of times</option><option value="continuous">Continuous for 30 seconds</option></select></label>
          <label htmlFor="bell-ring-count" className="text-sm font-semibold text-foreground">Number of rings<span className="mt-1 block text-xs font-normal text-muted">Used when a set number is selected.</span><select id="bell-ring-count" value={ringCount} disabled={ringMode === "continuous"} onChange={(event) => updateRingCount(Number(event.target.value))} className="mt-3 w-full rounded-xl border border-border bg-background px-3 py-3 text-sm font-semibold text-foreground outline-none focus:border-brand disabled:cursor-not-allowed disabled:opacity-50"><option value={1}>1 ring</option><option value={2}>2 rings</option><option value={3}>3 rings</option><option value={4}>4 rings</option><option value={5}>5 rings</option></select></label>
        </div>

        <footer className="mt-6 flex items-center justify-between gap-3 border-t border-border pt-4"><span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${enabled ? "text-[#137333]" : "text-muted"}`}>{enabled ? <Check className="h-3.5 w-3.5" /> : null}{enabled ? "Bell enabled" : "Bell disabled"}</span><div className="flex gap-2"><button type="button" onClick={testTone} className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground hover:bg-surface"><Play className="h-4 w-4" /> Test tone</button><button type="button" onClick={onClose} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand/90">Done</button></div></footer>
      </section>
    </div>
  );
}
