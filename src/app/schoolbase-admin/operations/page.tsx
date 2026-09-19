"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Activity, AlertTriangle, CheckCircle2, ClipboardList, Database, Download, LifeBuoy, RefreshCw, ShieldCheck } from "lucide-react";
import { playBellTone, playCloseTone, playOpenTone, unlockAudio } from "@/lib/sounds";

type OperationsStatus = {
  service?: string;
  database?: { status?: string; responseMs?: number };
  endpointChecks?: Array<{ key: string; label: string; status: string; httpStatus?: number | null; responseMs?: number; providerStatus?: string; error?: string }>;
  uptimeSeconds?: number;
  checkedAt?: string;
  responseMs?: number;
  environment?: string;
  attention?: { recentAuditEvents?: Array<{ id: string; event: string; details: string; createdAt: string }>; attentionEvents?: Array<{ id: string; event: string; details: string; createdAt: string }>; openSupportRequests?: number };
  ads?: { campaignsByStatus?: Record<string, number>; impressions?: number; clicks?: number };
};

export default function OperationsPage() {
  const [status, setStatus] = useState<OperationsStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState("");
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const previousServiceRef = useRef<string | null>(null);

  const loadStatus = async () => {
    setLoading(true);
    const response = await fetch('/schoolbase-admin/api/operations/status', { credentials: 'include', cache: 'no-store' });
    const nextStatus = await response.json().catch(() => ({ service: 'unavailable' }));
    const nextService = nextStatus?.service || 'unavailable';
    const previousService = previousServiceRef.current;

    unlockAudio();

    if (previousService && previousService !== nextService) {
      if (nextService === 'ready') {
        playCloseTone();
      } else if (nextService === 'degraded') {
        playBellTone('alert', 0.9);
      } else if (nextService === 'down' || nextService === 'unavailable') {
        playBellTone('urgent', 1.1);
      }
    }

    previousServiceRef.current = nextService;
    setStatus(nextStatus);
    setLoading(false);
  };

  useEffect(() => {
    const unlock = () => unlockAudio();
    window.addEventListener("pointerdown", unlock, { once: true, passive: true });
    window.addEventListener("keydown", unlock, { once: true, passive: true });

    void loadStatus();
    const interval = window.setInterval(() => void loadStatus(), 30000);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      window.clearInterval(interval);
    };
  }, []);

  const downloadDatabase = async () => {
    setExporting(true);
    setMessage("");
    try {
      const response = await fetch('/schoolbase-admin/api/operations/database-export', { credentials: 'include' });
      if (!response.ok) throw new Error((await response.json().catch(() => null))?.error || 'Database export failed');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = response.headers.get('content-disposition')?.match(/filename="([^"]+)"/)?.[1] || 'schoolbase-database.sql';
      link.click();
      URL.revokeObjectURL(url);
      setMessage('Database export downloaded. Store it in an encrypted backup location.');
      playCloseTone();
      setIsExportModalOpen(false);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Database export failed');
    } finally {
      setExporting(false);
    }
  };

  const openExportModal = () => {
    playOpenTone();
    setMessage("");
    setIsExportModalOpen(true);
  };

  const closeExportModal = () => {
    if (exporting) return;
    playCloseTone();
    setIsExportModalOpen(false);
  };

  const overallStatus = status?.service === 'ready' ? 'OPERATIONAL' : status?.service === 'degraded' ? 'DEGRADED' : 'DOWN';
  const endpointChecks = status?.endpointChecks || [];
  const upCount = endpointChecks.filter((check) => check.status === 'UP').length;
  const downCount = endpointChecks.filter((check) => check.status === 'DOWN').length;
  const attentionEvents = status?.attention?.attentionEvents || [];
  const recentAuditEvents = status?.attention?.recentAuditEvents || [];
  const openSupportRequests = status?.attention?.openSupportRequests || 0;
  const indicatorClass = (value: string) => value === 'UP' || value === 'ready' ? 'bg-emerald-500' : value === 'DEGRADED' || value === 'degraded' ? 'bg-amber-500' : 'bg-red-500';
  const signalClass = (value: string) => value === 'UP' ? 'bg-emerald-500' : value === 'DEGRADED' ? 'bg-amber-500' : 'bg-red-500';
  const signalVariant = (value: string) => value === 'UP' ? 'is-healthy' : value === 'DEGRADED' ? 'is-warning' : 'is-critical';
  const uptime = status?.uptimeSeconds ? `${Math.floor(status.uptimeSeconds / 86400)}d ${Math.floor((status.uptimeSeconds % 86400) / 3600)}h` : '—';
  const adsDrafts = status?.ads?.campaignsByStatus?.DRAFT || 0;
  const adsSubmitted = status?.ads?.campaignsByStatus?.SUBMITTED || 0;
  const adsLive = status?.ads?.campaignsByStatus?.LIVE || 0;

  return (
    <main className="operations-page min-h-screen bg-background px-2 py-4 text-foreground sm:px-8 sm:py-6 lg:px-12">
      <style>{`@keyframes operations-pulse { 0%,100% { opacity: 1; box-shadow: 0 0 0 0 rgb(10 102 194 / .4) } 50% { opacity: .55; box-shadow: 0 0 0 7px rgb(10 102 194 / 0) } } @keyframes operations-scan { from { transform: translateX(-100%) } to { transform: translateX(100%) } } @keyframes operations-dot-healthy { 0%,12%,100% { opacity: 1; transform: scale(1); box-shadow: 0 0 0 0 rgb(16 185 129 / .8) } 28%,42% { opacity: .18; transform: scale(.72); box-shadow: 0 0 0 10px rgb(16 185 129 / 0) } 58% { opacity: 1; transform: scale(1.12); box-shadow: 0 0 0 0 rgb(16 185 129 / .9) } } @keyframes operations-dot-warning { 0%,100% { opacity: 1; transform: scale(1); box-shadow: 0 0 0 0 rgb(245 158 11 / .65) } 42% { opacity: .35; transform: scale(.8); box-shadow: 0 0 0 8px rgb(245 158 11 / 0) } 70% { opacity: .85; transform: scale(1.05); box-shadow: 0 0 0 0 rgb(245 158 11 / .7) } } @keyframes operations-dot-critical { 0%,100% { opacity: 1; transform: scale(1); box-shadow: 0 0 0 0 rgb(239 68 68 / .55) } 50% { opacity: .25; transform: scale(.7); box-shadow: 0 0 0 12px rgb(239 68 68 / 0) } } .operations-pulse { animation: operations-pulse 0.9s ease-in-out infinite } .operations-grid { background-image: linear-gradient(to right, rgb(148 163 184 / .10) 1px, transparent 1px), linear-gradient(to bottom, rgb(148 163 184 / .10) 1px, transparent 1px); background-size: 24px 24px; } .operations-scan { animation: operations-scan 3.2s linear infinite; } .operations-page > div > header, .operations-page > div > section, .operations-page .grid > div { border-radius: 0 !important; box-shadow: none !important; } .operations-status-bar { position: relative; display: block; width: .8rem; height: .8rem; border-radius: 9999px; overflow: visible; transition: opacity 180ms ease; } .operations-status-bar.is-healthy { animation: operations-dot-healthy 0.55s ease-in-out infinite; } .operations-status-bar.is-warning { animation: operations-dot-warning 1.2s ease-in-out infinite; } .operations-status-bar.is-critical { animation: operations-dot-critical 1.8s ease-in-out infinite; } @media (prefers-reduced-motion: reduce) { .operations-pulse, .operations-scan, .operations-status-bar.is-healthy, .operations-status-bar.is-warning, .operations-status-bar.is-critical { animation: none } }`}</style>
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="relative overflow-hidden border border-border bg-surface px-6 pb-8 pt-8 sm:px-8 sm:pb-10 sm:pt-10">
          <div className="operations-scan pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-brand/10 to-transparent" />
          <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-brand"><span className="operations-pulse h-2.5 w-2.5 rounded-full bg-brand" /> SchoolBase observability</div>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Operations cockpit</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Live infrastructure posture, endpoint telemetry, incident signals, and secure recovery controls.</p>
            </div>
            <div className="flex flex-wrap gap-2"><span className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-xs font-semibold text-muted"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Auto-refresh 30s</span><button type="button" onClick={() => void loadStatus()} className="inline-flex items-center justify-center gap-2 rounded-md border border-brand bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh</button></div>
          </div>
        </header>

        <section className="operations-grid border border-border bg-surface p-5 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4"><span className={`operations-pulse inline-flex h-5 w-5 rounded-full ${indicatorClass(overallStatus)}`} /><div><p className="text-xs font-bold uppercase tracking-[.14em] text-muted">Live system posture</p><p className="mt-1 text-2xl font-semibold text-foreground">{overallStatus}</p></div></div>
            <div className="grid grid-cols-3 gap-6 text-left sm:text-right"><div><p className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400">{upCount}</p><p className="text-xs text-muted">Systems up</p></div><div><p className={`text-2xl font-semibold ${downCount ? 'text-red-600 dark:text-red-400' : 'text-foreground'}`}>{downCount}</p><p className="text-xs text-muted">Needs attention</p></div><div><p className="text-2xl font-semibold text-foreground">{uptime}</p><p className="text-xs text-muted">Process uptime</p></div></div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="border border-border bg-surface p-5"><div className="flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-[.12em] text-muted">API service</p><span className={`h-3 w-3 rounded-full ${indicatorClass(status?.service || 'DOWN')}`} /></div><p className="mt-3 text-2xl font-semibold text-foreground">{status?.service || 'Checking'}</p><p className="mt-1 text-xs text-muted">Environment: {status?.environment || '—'}</p></div>
          <div className="border border-border bg-surface p-5"><div className="flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-[.12em] text-muted">Database</p><Database className="h-5 w-5 text-brand" /></div><p className="mt-3 text-2xl font-semibold text-foreground">{status?.database?.status || 'Checking'}</p><p className="mt-1 text-xs text-muted">Response: {status?.database?.responseMs ?? '—'} ms</p></div>
          <div className="border border-border bg-surface p-5"><div className="flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-[.12em] text-muted">Last full check</p><ShieldCheck className="h-5 w-5 text-brand" /></div><p className="mt-3 text-lg font-semibold text-foreground">{status?.checkedAt ? new Date(status.checkedAt).toLocaleTimeString() : 'Checking'}</p><p className="mt-1 text-xs text-muted">Total response: {status?.responseMs ?? '—'} ms</p></div>
        </section>

        <section className="border border-border bg-surface p-5 sm:p-6"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-brand">Ads & Marketplace</p><h2 className="mt-2 text-xl font-semibold text-foreground">Advertising workflow health</h2><p className="mt-1 text-sm text-muted">Public applications, review queue, live campaigns, and delivery signals.</p></div><Link href="/schoolbase-admin/ads" className="text-sm font-semibold text-brand hover:text-brand-hover">Open Ads</Link></div><div className="mt-5 grid gap-3 sm:grid-cols-5"><div className="border border-border bg-background p-4"><p className="text-xs text-muted">Drafts</p><p className="mt-2 text-2xl font-semibold text-foreground">{adsDrafts}</p></div><div className="border border-border bg-background p-4"><p className="text-xs text-muted">Awaiting review</p><p className="mt-2 text-2xl font-semibold text-foreground">{adsSubmitted}</p></div><div className="border border-border bg-background p-4"><p className="text-xs text-muted">Live</p><p className="mt-2 text-2xl font-semibold text-foreground">{adsLive}</p></div><div className="border border-border bg-background p-4"><p className="text-xs text-muted">Impressions</p><p className="mt-2 text-2xl font-semibold text-foreground">{(status?.ads?.impressions || 0).toLocaleString()}</p></div><div className="border border-border bg-background p-4"><p className="text-xs text-muted">Clicks</p><p className="mt-2 text-2xl font-semibold text-foreground">{(status?.ads?.clicks || 0).toLocaleString()}</p></div></div></section>

        <section className="border border-border bg-surface p-5 sm:p-6"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-brand">Service matrix</p><h2 className="mt-2 text-xl font-semibold text-foreground">Endpoint & API reachability</h2><p className="mt-1 text-sm text-muted">Expected 401/403 responses count as reachable. Network and server failures are surfaced immediately.</p></div><Activity className="h-6 w-6 text-brand" /></div><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{endpointChecks.map((check) => <div key={check.key} className="border border-border bg-background p-4 transition hover:border-brand/40 hover:bg-brand-light/20"><span className={`operations-status-bar ${signalClass(check.status)} ${signalVariant(check.status)}`} aria-label={`${check.label} ${check.status}`} /><div className="mt-4 flex items-center justify-between gap-2"><p className="text-sm font-semibold text-foreground">{check.label}</p><p className={`text-xs font-bold uppercase tracking-[.1em] ${check.status === 'UP' ? 'text-emerald-700' : check.status === 'DEGRADED' ? 'text-amber-700' : 'text-red-700'}`}>{check.status}</p></div><div className="mt-3 flex items-end justify-between gap-2"><p className="text-sm font-medium text-foreground">{check.providerStatus ? `${check.providerStatus} · ` : ''}{check.responseMs ?? '—'} ms</p><p className="text-xs text-muted">HTTP {check.httpStatus ?? '—'}{check.error ? ` · ${check.error}` : ''}</p></div></div>)}</div></section>

        <section className="grid gap-4 lg:grid-cols-[1.25fr_.75fr]">
          <div className="border border-border bg-surface p-5 sm:p-6"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-brand">Attention center</p><h2 className="mt-2 text-xl font-semibold text-foreground">Signals that need a human</h2><p className="mt-1 text-sm text-muted">Operational incidents from the last 24 hours, drawn from the platform audit trail.</p></div><AlertTriangle className={`h-5 w-5 ${attentionEvents.length ? 'text-amber-600' : 'text-emerald-600'}`} /></div><div className="mt-5 space-y-2">{attentionEvents.length ? attentionEvents.slice(0, 5).map((event) => <div key={event.id} className="border border-amber-200 bg-amber-50/60 px-3 py-3"><div className="flex items-center justify-between gap-3"><p className="text-xs font-bold uppercase tracking-[.1em] text-amber-800">{event.event}</p><p className="text-[11px] text-amber-700">{new Date(event.createdAt).toLocaleTimeString()}</p></div><p className="mt-1 text-sm text-amber-950">{event.details}</p></div>) : <div className="flex items-center gap-3 border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"><CheckCircle2 className="h-5 w-5" /> No flagged operational events in the last 24 hours.</div>}</div><Link href="/schoolbase-admin/audit" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand hover:text-brand-hover"><ClipboardList className="h-4 w-4" /> Open full audit trail</Link></div>
          <div className="border border-border bg-surface p-5 sm:p-6"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-brand">Response queue</p><h2 className="mt-2 text-xl font-semibold text-foreground">Support & governance</h2></div><LifeBuoy className="h-5 w-5 text-brand" /></div><div className="mt-5 flex items-end gap-3"><p className={`text-4xl font-semibold ${openSupportRequests ? 'text-amber-700' : 'text-foreground'}`}>{openSupportRequests}</p><p className="pb-1 text-sm text-muted">open support requests</p></div><p className="mt-2 text-sm leading-6 text-muted">Use Support for customer-impacting issues and Audit Trail for who changed what.</p><div className="mt-5 flex flex-wrap gap-2"><Link href="/schoolbase-admin/support" className="inline-flex items-center gap-2 rounded-md bg-brand px-3 py-2 text-sm font-semibold text-white hover:bg-brand-hover"><LifeBuoy className="h-4 w-4" /> Open support</Link><Link href="/schoolbase-admin/audit" className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-semibold text-brand hover:bg-background"><ClipboardList className="h-4 w-4" /> Review audit</Link></div><p className="mt-5 border-t border-border pt-4 text-xs text-muted">{recentAuditEvents.length} audit events observed in the last 24 hours.</p></div>
        </section>

        <section className="border border-border bg-surface p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-brand">Recovery control</p><h2 className="mt-2 text-xl font-semibold text-foreground">Complete database export</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-muted">Downloads a full MySQL dump including tables, routines, and triggers. Every request is recorded in the platform audit log.</p></div><button type="button" disabled={exporting} onClick={openExportModal} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-50"><Download className="h-4 w-4" />{exporting ? 'Preparing export...' : 'Download database'}</button></div>
          {message ? <div className="mt-5 rounded-md border border-border bg-background p-3 text-sm text-foreground">{message}</div> : null}
          <div className="mt-5 flex items-start gap-3 border-t border-border pt-4 text-xs leading-5 text-muted"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand" /><p>Store downloaded exports encrypted, restrict access, and test restoration in a separate environment. This control is intentionally limited to platform administrators.</p></div>
        </section>
      </div>

      {isExportModalOpen ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4">
          <style>{`@keyframes operations_export_modal_enter { from { transform: translateX(36px) scale(.98); opacity: 0 } to { transform: translateX(0) scale(1); opacity: 1 } }`}</style>
          <div className="w-full max-w-2xl overflow-hidden rounded-md border border-border bg-surface shadow-[0_16px_50px_rgba(10,102,194,0.16)]" style={{ animation: "operations_export_modal_enter 320ms cubic-bezier(.2,.9,.2,1)" }}>
            <div className="flex items-start justify-between gap-4 border-b border-border/70 bg-brand/10 px-4 py-4 sm:px-6 sm:py-5">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.12em] text-brand"><Database className="h-4 w-4" /> Recovery control</div>
                <h2 className="mt-2 text-2xl font-bold text-foreground">Download complete database</h2>
                <p className="mt-1 text-sm text-muted">Create a full SQL export for secure backup and recovery.</p>
              </div>
              <button type="button" onClick={closeExportModal} disabled={exporting} aria-label="Close database export dialog" className="flex h-8 w-8 items-center justify-center rounded-md border border-border transition-colors hover:bg-background disabled:opacity-50">×</button>
            </div>
            <div className="space-y-5 px-4 py-4 sm:space-y-6 sm:px-6 sm:py-6">
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"><div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" /><div><p className="font-semibold">This file contains all SchoolBase records.</p><p className="mt-1 leading-6">Store it only in an encrypted, access-controlled backup location. Do not email it, upload it to public storage, or commit it to source control.</p></div></div></div>
              <div className="grid gap-3 sm:grid-cols-3"><div className="rounded-lg border border-border bg-background p-3"><p className="text-xs text-muted">Format</p><p className="mt-1 text-sm font-semibold text-foreground">MySQL SQL</p></div><div className="rounded-lg border border-border bg-background p-3"><p className="text-xs text-muted">Contents</p><p className="mt-1 text-sm font-semibold text-foreground">Full database</p></div><div className="rounded-lg border border-border bg-background p-3"><p className="text-xs text-muted">Audit</p><p className="mt-1 text-sm font-semibold text-foreground">Recorded</p></div></div>
              {message ? <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{message}</div> : null}
              <div className="flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:justify-end"><button type="button" onClick={closeExportModal} disabled={exporting} className="flex-1 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-background disabled:opacity-50">Cancel</button><button type="button" onClick={() => void downloadDatabase()} disabled={exporting} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:opacity-50"><Download className="h-4 w-4" />{exporting ? 'Preparing export...' : 'Confirm download'}</button></div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}