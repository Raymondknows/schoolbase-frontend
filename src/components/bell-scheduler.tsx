"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, Check } from "lucide-react";
import { playBellPattern, stopBellPattern, type BellRingMode, type BellTone, unlockAudio } from "@/lib/sounds";

type BellEvent = { id: string; dayOfWeek: number; label: string; time: string; enabled: boolean };
type BellSchedule = { timezone: string; events: BellEvent[] };

function getLocalTime(timezone: string) {
  return new Intl.DateTimeFormat("en-GB", { timeZone: timezone, hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date());
}

function getLocalDay(timezone: string, date: Date) {
  const weekday = new Intl.DateTimeFormat("en-US", { timeZone: timezone, weekday: "long" }).format(date);
  return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].indexOf(weekday);
}

export default function BellScheduler() {
  const [enabled, setEnabled] = useState(false);
  const [schedule, setSchedule] = useState<BellSchedule | null>(null);
  const [currentTime, setCurrentTime] = useState(() => new Date());

  useEffect(() => {
    setEnabled(window.localStorage.getItem("schoolbase:bells-enabled") === "true");
    let cancelled = false;
    const load = async () => {
      try {
        const response = await fetch("/api/bells/active", { credentials: "include", cache: "no-store" });
        if (!response.ok) return;
        const data = await response.json();
        if (!cancelled) setSchedule(data.schedule || null);
      } catch {
        // Bell notifications are non-blocking.
      }
    };
    load();
    const refresh = window.setInterval(load, 60000);
    return () => { cancelled = true; window.clearInterval(refresh); };
  }, []);

  useEffect(() => {
    if (!enabled || !schedule) return;
    const checkBell = () => {
      const now = new Date();
      const localTime = getLocalTime(schedule.timezone);
      const dayOfWeek = getLocalDay(schedule.timezone, now);
      const event = schedule.events.find((item) => item.enabled && item.dayOfWeek === dayOfWeek && item.time === localTime);
      if (!event) return;
      const key = `${new Intl.DateTimeFormat("en-CA", { timeZone: schedule.timezone }).format(now)}-${event.id}-${localTime}`;
      if (window.sessionStorage.getItem("schoolbase:last-bell") === key) return;
      window.sessionStorage.setItem("schoolbase:last-bell", key);
      const tone = (window.localStorage.getItem("schoolbase:bell-tone") || "classic") as BellTone;
      const ringMode = (window.localStorage.getItem("schoolbase:bell-ring-mode") || "count") as BellRingMode;
      const ringCount = Number(window.localStorage.getItem("schoolbase:bell-ring-count") || "1");
      playBellPattern(tone, ringMode, ringCount, () => window.localStorage.getItem("schoolbase:bells-enabled") === "true");
    };
    checkBell();
    const interval = window.setInterval(checkBell, 15000);
    return () => window.clearInterval(interval);
  }, [enabled, schedule]);

  useEffect(() => {
    const interval = window.setInterval(() => setCurrentTime(new Date()), 30000);
    return () => window.clearInterval(interval);
  }, []);

  const toggle = () => {
    const next = !enabled;
    unlockAudio();
    if (next) {
      const tone = (window.localStorage.getItem("schoolbase:bell-tone") || "classic") as BellTone;
      const ringMode = (window.localStorage.getItem("schoolbase:bell-ring-mode") || "count") as BellRingMode;
      const ringCount = Number(window.localStorage.getItem("schoolbase:bell-ring-count") || "1");
      playBellPattern(tone, ringMode, ringCount);
    }
    setEnabled(next);
    window.localStorage.setItem("schoolbase:bells-enabled", String(next));
    if (!next) stopBellPattern();
  };

  if (!schedule) return null;
  return (
    <div className="fixed bottom-5 right-5 z-50 print:hidden">
      <button type="button" onClick={toggle} className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold shadow-lg backdrop-blur-sm transition ${enabled ? "border-[#b7dfc0] bg-[#edf8ef] text-[#137333]" : "border-border bg-surface text-muted hover:text-brand"}`} title={enabled ? "Disable school bell" : "Enable school bell"}>
        {enabled ? <Check className="h-3.5 w-3.5" /> : <BellOff className="h-3.5 w-3.5" />}
        {enabled ? `School bell on · ${new Intl.DateTimeFormat("en-GB", { timeZone: schedule.timezone, hour: "2-digit", minute: "2-digit" }).format(currentTime)}` : "Enable school bell"}
      </button>
    </div>
  );
}
