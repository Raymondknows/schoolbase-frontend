"use client";

"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { createAnnouncement } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

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

  const termOptions = useMemo(() => {
    const year = academicYears.find((item) => item.id === selectedAcademicYearId);
    return year?.terms || [];
  }, [academicYears, selectedAcademicYearId]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    if (submitting) {
      event.preventDefault();
      return;
    }

    setSubmitting(true);
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
      <div>
        <h1 className="text-3xl font-bold text-foreground">Post news</h1>
        <p className="mt-1 text-muted">
          Share announcements with parents, teachers, and the public website.
        </p>
      </div>

      <form
        action={createAnnouncement}
        onSubmit={handleSubmit}
        className="space-y-4 rounded-xl border border-border bg-surface p-6"
      >
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
