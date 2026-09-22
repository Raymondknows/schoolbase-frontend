"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2, Info, Send } from "lucide-react";
import { WhatsAppIcon } from "@/components/ui/icons";

interface AcademicYearItem {
  id: string;
  name: string;
  isCurrent: boolean;
  terms: Array<{ id: string; name: string }>;
}

export default function NewAnnouncementPage() {
  const [submitting, setSubmitting] = useState(false);
  const [academicYears, setAcademicYears] = useState<AcademicYearItem[]>([]);
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState("");
  const [selectedTermId, setSelectedTermId] = useState("");
  const [whatsAppConnected, setWhatsAppConnected] = useState<boolean | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAcademicYears() {
      try {
        const response = await fetch("/api/admin/academic-years", {
          credentials: "include",
        });
        if (!response.ok) return;
        const data = await response.json();
        const years = (data.academicYears || []) as AcademicYearItem[];
        setAcademicYears(years);

        const defaultYear = years.find((year) => year.isCurrent) || years[0];
        if (defaultYear) {
          setSelectedAcademicYearId(defaultYear.id);
          setSelectedTermId(defaultYear.terms?.[0]?.id || "");
        }
      } catch (error) {
        console.error("Failed to load academic years:", error);
      }
    }

    loadAcademicYears();
  }, []);

  useEffect(() => {
    async function fetchWhatsAppStatus() {
      try {
        const response = await fetch("/api/admin/whatsapp/status", {
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });
        if (!response.ok) {
          setWhatsAppConnected(false);
          return;
        }
        const data = await response.json();
        setWhatsAppConnected(data?.session?.status === "connected");
      } catch {
        setWhatsAppConnected(false);
      }
    }

    void fetchWhatsAppStatus();
  }, []);

  const termOptions = useMemo(() => {
    const year = academicYears.find((item) => item.id === selectedAcademicYearId);
    return year?.terms || [];
  }, [academicYears, selectedAcademicYearId]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) {
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const formData = new FormData(event.currentTarget);
      const response = await fetch("/api/admin/announcements", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: String(formData.get("title") || "").trim(),
          body: String(formData.get("body") || "").trim(),
          publish: formData.get("publish") === "on",
          bulkApproval: formData.get("bulkApproval") === "on",
          academicYearId: formData.get("academicYearId") || undefined,
          termId: formData.get("termId") || undefined,
        }),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result?.error || "Failed to publish announcement");
      }

      const params = new URLSearchParams({
        created: "1",
        announcementId: String(result.announcementId || result.announcement?.id || ""),
        whatsappSent: String(result.whatsappSent ?? 0),
        whatsappFailed: String(result.whatsappFailed ?? 0),
        emailSent: String(result.emailSent ?? 0),
        emailFailed: String(result.emailFailed ?? 0),
        queued: result.queued ? "1" : "0",
      });
      window.location.href = `/admin/website?${params.toString()}`;
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to publish announcement");
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen pb-12">
    <div className="mx-auto max-w-7xl space-y-6 px-0 py-4 sm:px-8 sm:py-8 lg:px-12">
      {/* Back link */}
      <Link
        href="/admin/website"
        className="inline-flex items-center gap-2 text-sm font-semibold text-brand transition hover:text-brand-hover"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to announcements
      </Link>

      {/* Form */}
      <header className="relative overflow-hidden border border-border bg-surface px-6 pb-7 pt-8 sm:px-8 sm:pb-8 sm:pt-10">
      <div className="absolute right-0 top-0 h-full w-1/3 bg-brand-light/40 [clip-path:polygon(35%_0,100%_0,100%_100%,0_100%)]" />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-brand">
            <Send className="h-4 w-4" />
            School communications
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Post news</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Share announcements with parents, teachers, and the public website.
          </p>
        </div>
        {whatsAppConnected !== null && (
          <div
            className="inline-flex items-center gap-2.5 self-start rounded-full border border-border bg-surface px-2.5 py-1.5 shadow-sm sm:self-auto"
            title={whatsAppConnected ? "WhatsApp connected — Ready to send school messages" : "WhatsApp disconnected — Reconnect via settings"}
          >
            <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full ${whatsAppConnected ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
              <WhatsAppIcon className="h-4 w-4" />
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-foreground">
                {whatsAppConnected ? "Connected" : "Disconnected"}
              </span>
              <span className="hidden text-[10px] text-muted sm:inline">
                {whatsAppConnected ? "Ready" : "Reconnect"}
              </span>
            </div>
            <span className={`h-2 w-2 rounded-full ${whatsAppConnected ? "bg-emerald-500" : "bg-amber-500"}`} />
          </div>
        )}
      </div>
      </header>

      <form
        onSubmit={handleSubmit}
        className="grid w-full gap-6 border border-border bg-surface p-5 sm:p-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(260px,.65fr)]"
      >
        {submitError && (
          <div className="lg:col-span-2 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {submitError}
          </div>
        )}
        <div className="space-y-5">
        <label className="block text-sm font-semibold text-foreground">
          Headline *
          <input
            name="title"
            required
            placeholder="e.g., Holiday Schedule for December"
            className="mt-2 w-full border border-border bg-background px-3.5 py-3 text-sm text-foreground placeholder:text-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
        </label>

        <label className="block text-sm font-semibold text-foreground">
          Message *
          <textarea
            name="body"
            required
            rows={8}
            placeholder="Write your announcement here. This will be visible to parents, teachers, and students."
            className="mt-2 w-full resize-y border border-border bg-background px-3.5 py-3 text-sm leading-6 text-foreground placeholder:text-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
        </label>
        </div>

        <div className="space-y-5">
          <div className="border border-border bg-background p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center bg-brand/10 text-brand">
                <Info className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Publication settings</p>
                <p className="mt-1 text-xs leading-5 text-muted">Choose where this update belongs and how it should be released.</p>
              </div>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <label className="block text-sm font-semibold text-foreground">
            Session
            <select
              name="academicYearId"
              value={selectedAcademicYearId}
              onChange={(event) => {
                setSelectedAcademicYearId(event.target.value);
                setSelectedTermId("");
              }}
              className="mt-2 w-full border border-border bg-background px-3 py-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            >
              <option value="">Select session (optional)</option>
              {academicYears.map((year) => (
                <option key={year.id} value={year.id}>
                  {year.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-semibold text-foreground">
            Term
            <select
              name="termId"
              value={selectedTermId}
              onChange={(event) => setSelectedTermId(event.target.value)}
              disabled={!selectedAcademicYearId || termOptions.length === 0}
              className="mt-2 w-full border border-border bg-background px-3 py-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="">Select term (optional)</option>
              {termOptions.map((term) => (
                <option key={term.id} value={term.id}>
                  {term.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="flex items-start gap-3 border border-border bg-background p-3 text-sm font-medium text-foreground">
          <input
            type="checkbox"
            name="publish"
            defaultChecked
            className="h-4 w-4 rounded border-border"
          />
          <span>Publish immediately <span className="block text-xs font-normal text-muted">Uncheck to save this as a draft.</span></span>
        </label>

        <label className="flex items-start gap-3 border border-border bg-background p-3 text-sm font-medium text-foreground">
          <input
            type="checkbox"
            name="bulkApproval"
            className="mt-0.5 h-4 w-4 rounded border-border"
          />
          <span>
            I approve sending this announcement to the school&apos;s WhatsApp recipients.
            <span className="mt-1 block text-xs font-normal leading-5 text-muted">Required for larger broadcasts. Quiet hours and rate limits still apply.</span>
          </span>
        </label>

        <div className="flex flex-col-reverse gap-3 sm:flex-row lg:col-span-2">
          <Link href="/admin/website" className="sm:flex-1">
            <Button type="button" variant="outline" className="w-full">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={submitting} className="gap-2 sm:flex-1">
            <Send className="h-4 w-4" />
            {submitting ? "Publishing..." : "Publish announcement"}
          </Button>
        </div>
        </div>
      </form>

      {/* Info section */}
      <div className="grid gap-4 border border-border bg-surface p-5 sm:grid-cols-3 sm:p-6">
        {[
          "Published announcements appear on parent and teacher dashboards.",
          "Drafts stay private until your team is ready to publish.",
          "Keep updates concise so they remain easy to scan on mobile.",
        ].map((tip) => (
          <div key={tip} className="flex items-start gap-2.5 text-sm text-muted">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
            <span>{tip}</span>
          </div>
        ))}
      </div>
    </div>
    </main>
  );
}
