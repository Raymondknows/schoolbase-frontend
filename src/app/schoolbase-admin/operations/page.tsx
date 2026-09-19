"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Activity, AlertTriangle, CheckCircle2, ClipboardList, Database, Download, LifeBuoy, RefreshCw, ShieldCheck } from "lucide-react";

type OperationsStatus = {
  service?: string;
  database?: { status?: string; responseMs?: number };
  endpointChecks?: Array<{ key: string; label: string; status: string; httpStatus?: number | null; responseMs?: number; error?: string }>;
  uptimeSeconds?: number;
  checkedAt?: string;
  responseMs?: number;
  environment?: string;
  attention?: { recentAuditEvents?: Array<{ id: string; event: string; details: string; createdAt: string }>; attentionEvents?: Array<{ id: string; event: string; details: string; createdAt: string }>; openSupportRequests?: number };
};

export default function OperationsPage() {
  const [status, setStatus] = useState<OperationsStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState("");

  const loadStatus = async () => {
    setLoading(true);
    const response = await fetch('/schoolbase-admin/api/operations/status', { credentials: 'include', cache: 'no-store' });
    setStatus(await response.json().catch(() => ({ service: 'unavailable' })));
    setLoading(false);
  };

  useEffect(() => {
    void loadStatus();
    const interval = window.setInterval(() => void loadStatus(), 30000);
    return () => window.clearInterval(interval);
  }, []);

  const downloadDatabase = async () => {
    if (!window.confirm('Download a complete database dump? This file contains all SchoolBase records and must be stored securely.')) return;
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
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Database export failed');
    } finally {
      setExporting(false);
    }
  };

  const overallStatus = status?.service === 'ready' ? 'OPERATIONAL' : status?.service === 'degraded' ? 'DEGRADED' : 'DOWN';
  const endpointChecks = status?.endpointChecks || [];
  const upCount = endpointChecks.filter((check) => check.status === 'UP').length;
  const downCount = endpointChecks.filter((check) => check.status === 'DOWN').length;
  const attentionEvents = status?.attention?.attentionEvents || [];
  const recentAuditEvents = status?.attention?.recentAuditEvents || [];
  const openSupportRequests = status?.attention?.openSupportRequests || 0;
  const indicatorClass = (value: string) => value === 'UP' || value === 'ready' ? 'bg-emerald-500' : value === 'DEGRADED' || value === 'degraded' ? 'bg-amber-500' : 'bg-red-500';
  const uptime = status?.uptimeSeconds ? `${Math.floor(status.uptimeSeconds / 86400)}d ${Math.floor((status.uptimeSeconds % 86400) / 3600)}h` : '—';

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-8 lg:px-12">
      <style>{`@keyframes operations-pulse { 0%,100% { opacity: 1; box-shadow: 0 0 0 0 rgb(16 185 129 / .35) } 50% { opacity: .55; box-shadow: 0 0 0 5px rgb(16 185 129 / 0) } } .operations-pulse { animation: operations-pulse 1.8s ease-in-out infinite } @media (prefers-reduced-motion: reduce) { .operations-pulse { animation: none } }`}</style>
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="relative overflow-hidden border border-border bg-surface px-6 pb-7 pt-10 sm:px-8 sm:pb-8 sm:pt-12">
          <div className="absolute right-0 top-0 h-full w-1/3 bg-brand-light/40 [clip-path:polygon(35%_0,100%_0,100%_100%,0_100%)]" />
          <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-brand"><Activity className="h-4 w-4" /> Platform operations</div>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Operations cockpit</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">A live command center for API reachability, database readiness, recovery, and platform safeguards.</p>
            </div>
            <button type="button" onClick={() => void loadStatus()} className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-brand hover:bg-background"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh status</button>
          </div>
        </header>

        <section className="border border-border bg-surface p-5 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4"><span className={`operations-pulse inline-flex h-4 w-4 rounded-full ${indicatorClass(overallStatus)}`} /><div><p className="text-xs font-bold uppercase tracking-[.14em] text-muted">Live system posture</p><p className="mt-1 text-2xl font-semibold text-foreground">{overallStatus}</p></div></div>
            <div className="grid grid-cols-3 gap-6 text-left sm:text-right"><div><p className="text-2xl font-semibold text-emerald-700">{upCount}</p><p className="text-xs text-muted">Systems up</p></div><div><p className={`text-2xl font-semibold ${downCount ? 'text-red-700' : 'text-foreground'}`}>{downCount}</p><p className="text-xs text-muted">Needs attention</p></div><div><p className="text-2xl font-semibold text-foreground">{uptime}</p><p className="text-xs text-muted">Process uptime</p></div></div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="border border-border bg-surface p-5"><div className="flex items-center justify-between"><p className="text-sm font-semibold text-foreground">API service</p><span className={`h-3 w-3 rounded-full ${indicatorClass(status?.service || 'DOWN')}`} /></div><p className="mt-3 text-2xl font-semibold text-foreground">{status?.service || 'Checking'}</p><p className="mt-1 text-xs text-muted">Environment: {status?.environment || '—'}</p></div>
          <div className="border border-border bg-surface p-5"><div className="flex items-center justify-between"><p className="text-sm font-semibold text-foreground">Database</p><Database className="h-5 w-5 text-brand" /></div><p className="mt-3 text-2xl font-semibold text-foreground">{status?.database?.status || 'Checking'}</p><p className="mt-1 text-xs text-muted">Response: {status?.database?.responseMs ?? '—'} ms</p></div>
          <div className="border border-border bg-surface p-5"><div className="flex items-center justify-between"><p className="text-sm font-semibold text-foreground">Last full check</p><ShieldCheck className="h-5 w-5 text-brand" /></div><p className="mt-3 text-lg font-semibold text-foreground">{status?.checkedAt ? new Date(status.checkedAt).toLocaleTimeString() : 'Checking'}</p><p className="mt-1 text-xs text-muted">Total response: {status?.responseMs ?? '—'} ms</p></div>
        </section>

        <section className="border border-border bg-surface p-5 sm:p-6"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-brand">Service matrix</p><h2 className="mt-2 text-xl font-semibold text-foreground">Endpoint & API reachability</h2><p className="mt-1 text-sm text-muted">Authenticated endpoint checks treat expected 401/403 responses as reachable and flag only network or server failures.</p></div><Activity className="h-6 w-6 text-brand" /></div><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{endpointChecks.map((check) => <div key={check.key} className="border border-border bg-background p-4"><div className="flex items-center justify-between gap-2"><p className="text-sm font-semibold text-foreground">{check.label}</p><span className={`operations-pulse h-3 w-3 rounded-full ${indicatorClass(check.status)}`} /></div><div className="mt-3 flex items-end justify-between gap-2"><p className={`text-sm font-semibold ${check.status === 'UP' ? 'text-emerald-700' : 'text-red-700'}`}>{check.status}</p><p className="text-xs text-muted">{check.responseMs ?? '—'} ms</p></div><p className="mt-1 text-xs text-muted">HTTP {check.httpStatus ?? '—'}{check.error ? ` · ${check.error}` : ''}</p></div>)}</div></section>

        <section className="grid gap-4 lg:grid-cols-[1.25fr_.75fr]">
          <div className="border border-border bg-surface p-5 sm:p-6"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-brand">Attention center</p><h2 className="mt-2 text-xl font-semibold text-foreground">Signals that need a human</h2><p className="mt-1 text-sm text-muted">Operational incidents from the last 24 hours, drawn from the platform audit trail.</p></div><AlertTriangle className={`h-5 w-5 ${attentionEvents.length ? 'text-amber-600' : 'text-emerald-600'}`} /></div><div className="mt-5 space-y-2">{attentionEvents.length ? attentionEvents.slice(0, 5).map((event) => <div key={event.id} className="border border-amber-200 bg-amber-50/60 px-3 py-3"><div className="flex items-center justify-between gap-3"><p className="text-xs font-bold uppercase tracking-[.1em] text-amber-800">{event.event}</p><p className="text-[11px] text-amber-700">{new Date(event.createdAt).toLocaleTimeString()}</p></div><p className="mt-1 text-sm text-amber-950">{event.details}</p></div>) : <div className="flex items-center gap-3 border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"><CheckCircle2 className="h-5 w-5" /> No flagged operational events in the last 24 hours.</div>}</div><Link href="/schoolbase-admin/audit" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand hover:text-brand-hover"><ClipboardList className="h-4 w-4" /> Open full audit trail</Link></div>
          <div className="border border-border bg-surface p-5 sm:p-6"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-brand">Response queue</p><h2 className="mt-2 text-xl font-semibold text-foreground">Support & governance</h2></div><LifeBuoy className="h-5 w-5 text-brand" /></div><div className="mt-5 flex items-end gap-3"><p className={`text-4xl font-semibold ${openSupportRequests ? 'text-amber-700' : 'text-foreground'}`}>{openSupportRequests}</p><p className="pb-1 text-sm text-muted">open support requests</p></div><p className="mt-2 text-sm leading-6 text-muted">Use Support for customer-impacting issues and Audit Trail for who changed what.</p><div className="mt-5 flex flex-wrap gap-2"><Link href="/schoolbase-admin/support" className="inline-flex items-center gap-2 rounded-md bg-brand px-3 py-2 text-sm font-semibold text-white hover:bg-brand-hover"><LifeBuoy className="h-4 w-4" /> Open support</Link><Link href="/schoolbase-admin/audit" className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-semibold text-brand hover:bg-background"><ClipboardList className="h-4 w-4" /> Review audit</Link></div><p className="mt-5 border-t border-border pt-4 text-xs text-muted">{recentAuditEvents.length} audit events observed in the last 24 hours.</p></div>
        </section>

        <section className="border border-border bg-surface p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-brand">Recovery control</p><h2 className="mt-2 text-xl font-semibold text-foreground">Complete database export</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-muted">Downloads a full MySQL dump including tables, routines, and triggers. Every request is recorded in the platform audit log.</p></div><button type="button" disabled={exporting} onClick={() => void downloadDatabase()} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-50"><Download className="h-4 w-4" />{exporting ? 'Preparing export...' : 'Download database'}</button></div>
          {message ? <div className="mt-5 rounded-md border border-border bg-background p-3 text-sm text-foreground">{message}</div> : null}
          <div className="mt-5 flex items-start gap-3 border-t border-border pt-4 text-xs leading-5 text-muted"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand" /><p>Store downloaded exports encrypted, restrict access, and test restoration in a separate environment. This control is intentionally limited to platform administrators.</p></div>
        </section>
      </div>
    </main>
  );
}