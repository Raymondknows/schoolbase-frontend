"use client";

import Link from "next/link";
import { ArrowLeft, Building2, CreditCard, Globe2, MapPin, Phone, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";

type TeacherSchoolDetailsProps = {
  school: {
    name: string;
    logoUrl?: string | null;
    tagline?: string | null;
    initials?: string | null;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    city?: string | null;
    country?: string | null;
    manualPaymentAccountName?: string | null;
    manualPaymentAccountNumber?: string | null;
    manualPaymentBankName?: string | null;
    currency?: string | null;
    timezone?: string | null;
    websiteEnabled?: boolean | null;
  };
};

export function TeacherSchoolDetailsContent({ school }: TeacherSchoolDetailsProps) {
  const [effectiveCurrency, setEffectiveCurrency] = useState<string>(school?.currency || "NGN");

  useEffect(() => {
    let active = true;

    async function loadCurrency() {
      try {
        const countryRes = await fetch("/api/country/config");
        if (!countryRes.ok) {
          throw new Error("Country config request failed");
        }

        const countryConfig = await countryRes.json();
        if (active) {
          setEffectiveCurrency(countryConfig?.data?.currency || school?.currency || "NGN");
        }
      } catch (err) {
        console.error("[TeacherSchoolPage] Country config fetch error:", err);
        if (active) {
          setEffectiveCurrency(school?.currency || "NGN");
        }
      }
    }

    loadCurrency();
    return () => {
      active = false;
    };
  }, [school?.currency]);

  const paymentDetailsAvailable =
    Boolean(school.manualPaymentAccountName) ||
    Boolean(school.manualPaymentAccountNumber) ||
    Boolean(school.manualPaymentBankName);

  return (
    <main className="min-h-screen pb-12">
      <div className="mx-auto max-w-7xl space-y-6 px-5 py-8 sm:px-8 lg:px-12">
      <div className="flex flex-col justify-between gap-4 border-b border-border pb-6 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-brand">
            <Building2 className="h-[17px] w-[17px]" /> Teacher workspace
          </div>
          <h1 className="mt-2 text-3xl font-bold text-foreground sm:text-4xl">School details</h1>
          <p className="mt-1 text-muted">Key school information for your teaching work.</p>
        </div>
        <Link
          href="/teacher"
          aria-label="Back to teacher dashboard"
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-brand transition hover:bg-brand-light"
        >
          <ArrowLeft className="h-5 w-5" />
          Dashboard
        </Link>
      </div>

      <div className="border border-border bg-surface">
        <div className="border-b border-border bg-background px-5 py-3 text-xs font-bold uppercase tracking-[.12em] text-muted">School identity</div>
        <div className="space-y-5 p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-20 w-20 items-center justify-center rounded-lg border border-border bg-muted overflow-hidden">
                {school.logoUrl ? (
                  <img
                    src={school.logoUrl}
                    alt={`${school.name} logo`}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <span className="text-xs text-muted">No logo</span>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.28em] text-muted">School</p>
                <p className="mt-1 text-lg font-semibold text-foreground truncate">{school.name}</p>
                {school.tagline ? <p className="mt-1 text-sm text-muted truncate">{school.tagline}</p> : null}
              </div>
            </div>

            {school.initials ? (
              <div className="border border-border px-3 py-1 text-xs font-semibold uppercase text-foreground">
                {school.initials}
              </div>
            ) : null}
          </div>

          <div className="grid gap-4 border-t border-border pt-5 sm:grid-cols-2">
            <div className="border border-border bg-background p-4">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-muted"><Phone className="h-4 w-4 text-brand" /> Contact</p>
              <div className="mt-3 space-y-2 text-sm text-foreground">
                <div>Phone: {school.phone || "Not set"}</div><div>Email: {school.email || "Not set"}</div>
              </div>
            </div>
            <div className="border border-border bg-background p-4">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-muted"><MapPin className="h-4 w-4 text-brand" /> Location</p>
              <div className="mt-3 space-y-2 text-sm text-foreground">
                <div>Address: {school.address || "Not set"}</div>
                <div>City / Country: {[school.city, school.country].filter(Boolean).join(" • ") || "Not set"}</div>
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-5">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-muted"><CreditCard className="h-4 w-4 text-brand" /> School account</p>
            {paymentDetailsAvailable ? (
              <div className="mt-3 space-y-2 text-sm text-foreground">
                {school.manualPaymentAccountName ? <div>Account name: {school.manualPaymentAccountName}</div> : null}
                {school.manualPaymentAccountNumber ? <div>Account number: {school.manualPaymentAccountNumber}</div> : null}
                {school.manualPaymentBankName ? <div>Bank: {school.manualPaymentBankName}</div> : null}
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted">Account details have not been published yet.</p>
            )}
          </div>

          <div className="grid gap-4 border-t border-border pt-5 text-sm text-foreground sm:grid-cols-2">
            <div>
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-muted"><Globe2 className="h-4 w-4 text-brand" /> Currency</p>
              <p className="mt-2 font-semibold">{effectiveCurrency}</p>
            </div>
            <div>
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-muted"><ShieldCheck className="h-4 w-4 text-brand" /> Timezone</p>
              <p className="mt-2 font-semibold">{school.timezone}</p>
            </div>
          </div>

          <div className="border-t border-border pt-5 text-sm text-muted">
            Website status: {school.websiteEnabled ? "Enabled" : "Disabled"}
          </div>
        </div>
      </div>

      <div className="border border-dashed border-[#9ac7ea] bg-[#f3f9fe] px-4 py-3 text-sm text-muted">
        <p>Note: If any of these details look incorrect, please contact your school administrator to update the school profile.</p>
      </div>
      </div>
    </main>
  );
}
