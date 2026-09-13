"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { getBackendUrl } from "@/lib/backend-url";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
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
        const response = await fetch(`${getBackendUrl()}/api/admin/whatsapp/status`, {
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
      const response = await fetch(`${getBackendUrl()}/api/admin/announcements`, {
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
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Back link */}
      <Link
        href="/admin/website"
        className="flex items-center gap-2 text-sm text-brand hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to announcements
      </Link>

      {/* Form */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Post news</h1>
          <p className="mt-1 text-muted">
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

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-xl border border-border bg-surface p-6"
      >
        {submitError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {submitError}
          </div>
        )}
        <label className="block text-sm font-medium">
          Title *
          <input
            name="title"
            required
            placeholder="e.g., Holiday Schedule for December"
            className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </label>

        <label className="block text-sm font-medium">
          Message *
          <textarea
            name="body"
            required
            rows={8}
            placeholder="Write your announcement here. This will be visible to parents, teachers, and students."
            className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium">
            Session
            <select
              name="academicYearId"
              value={selectedAcademicYearId}
              onChange={(event) => {
                setSelectedAcademicYearId(event.target.value);
                setSelectedTermId("");
              }}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
            >
              <option value="">Select session (optional)</option>
              {academicYears.map((year) => (
                <option key={year.id} value={year.id}>
                  {year.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-medium">
            Term
            <select
              name="termId"
              value={selectedTermId}
              onChange={(event) => setSelectedTermId(event.target.value)}
              disabled={!selectedAcademicYearId || termOptions.length === 0}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand disabled:cursor-not-allowed disabled:opacity-60"
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

        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            name="publish"
            defaultChecked
            className="h-4 w-4 rounded border-border"
          />
          Publish immediately
          <span className="text-xs text-muted">(uncheck to save as draft)</span>
        </label>

        <label className="flex items-start gap-2 text-sm font-medium">
          <input
            type="checkbox"
            name="bulkApproval"
            className="mt-0.5 h-4 w-4 rounded border-border"
          />
          <span>
            I approve sending this announcement to the school&apos;s WhatsApp recipients.
            <span className="mt-1 block text-xs font-normal text-muted">Required for larger broadcasts. Quiet hours and rate limits still apply.</span>
          </span>
        </label>

        <div className="flex gap-3">
          <Button type="submit" disabled={submitting} className="flex-1">
            {submitting ? "Publishing…" : "Post announcement"}
          </Button>
          <Link href="/admin/website" className="flex-1">
            <Button type="button" variant="outline" className="w-full">
              Cancel
            </Button>
          </Link>
        </div>
      </form>

      {/* Info section */}
      <div className="rounded-lg border border-border bg-surface/50 p-4 text-sm text-muted">
        <p className="font-medium text-foreground">Tips:</p>
        <ul className="mt-2 space-y-1 list-inside list-disc">
          <li>Published announcements appear on parents and teachers' dashboards</li>
          <li>Draft announcements can be edited before publishing</li>
          <li>Keep announcements clear and concise for better readability</li>
        </ul>
      </div>
    </div>
  );
}
