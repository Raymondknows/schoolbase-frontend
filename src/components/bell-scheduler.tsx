"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
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
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);
  const dragRef = useRef({ offsetX: 0, offsetY: 0, dragging: false });

  useEffect(() => {
    const savedPosition = window.localStorage.getItem("schoolbase:bell-position");
    if (!savedPosition) return;
    try {
      const parsed = JSON.parse(savedPosition);
      if (typeof parsed.left === "number" && typeof parsed.top === "number") {
        setPosition(parsed);
      }
    } catch {
      window.localStorage.removeItem("schoolbase:bell-position");
    }
  }, []);

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
    const interval = window.setInterval(() => setCurrentTime(new Date()), 1000);
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

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    dragRef.current = {
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      dragging: true,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setPosition({ left: rect.left, top: rect.top });
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.dragging) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const nextPosition = {
      left: Math.min(Math.max(8, event.clientX - dragRef.current.offsetX), Math.max(8, window.innerWidth - rect.width - 8)),
      top: Math.min(Math.max(8, event.clientY - dragRef.current.offsetY), Math.max(8, window.innerHeight - rect.height - 8)),
    };
    setPosition(nextPosition);
    window.localStorage.setItem("schoolbase:bell-position", JSON.stringify(nextPosition));
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    dragRef.current.dragging = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  if (!schedule) return null;
  return (
    <div
      className={`fixed z-50 max-w-[calc(100vw-1rem)] print:hidden touch-none select-none cursor-grab active:cursor-grabbing ${position ? "" : "right-5 top-5"}`}
      style={position ? { left: position.left, top: position.top } : undefined}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <button
        type="button"
        onClick={toggle}
        className={`inline-flex max-w-full cursor-pointer items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold shadow-sm backdrop-blur-sm transition ${enabled ? "border-emerald-500 bg-emerald-500 text-white shadow-emerald-500/20" : "border-border bg-slate-100 text-slate-700 hover:border-brand/30 hover:text-brand"}`}
        title={enabled ? "Disable school bell" : "Enable school bell"}
      >
        <span className={`flex h-6 w-6 items-center justify-center rounded-full ${enabled ? "bg-white/15 text-white" : "bg-white text-slate-700"}`}>
          {enabled ? <Check className="h-3.5 w-3.5" /> : <BellOff className="h-3.5 w-3.5" />}
        </span>
        {enabled ? `School bell on · ${new Intl.DateTimeFormat("en-GB", { timeZone: schedule.timezone, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(currentTime)}` : "Enable school bell"}
      </button>
    </div>
  );
}
