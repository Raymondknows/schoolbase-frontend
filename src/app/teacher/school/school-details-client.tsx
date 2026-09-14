"use client";

import { Building2, CreditCard, Globe2, MapPin, Phone, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import TeacherPageHeader from "@/components/teacher-page-header";

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
      <div className="mx-auto max-w-7xl space-y-6 px-2 py-8 sm:px-8 lg:px-12">
      <TeacherPageHeader icon={Building2} title={school.name} description={school.tagline || "Key school information for your teaching work."} count={school.country || "School profile"} />

      <div className="border border-border bg-surface">
        <div className="flex flex-col gap-5 border-b border-border bg-background px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-surface">
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
                <p className="text-[11px] font-bold uppercase tracking-[.16em] text-brand">Institution profile</p>
                <p className="mt-1 text-lg font-semibold text-foreground">{school.name}</p>
                <p className="mt-1 text-sm text-muted">{[school.city, school.country].filter(Boolean).join(" · ") || "Location not set"}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-2 border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Teacher access</span>
              {school.initials ? <span className="border border-border px-3 py-2 text-xs font-bold uppercase text-muted">{school.initials}</span> : null}
            </div>
          </div>

        <div className="space-y-5 p-5 sm:p-6">

          <div className="grid gap-4 border-t border-border pt-5 sm:grid-cols-2">
            <div className="border border-border bg-background p-5">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-muted"><Phone className="h-4 w-4 text-brand" /> Contact</p>
              <div className="mt-3 space-y-2 text-sm text-foreground">
                <div className="font-medium">{school.phone || "Phone not set"}</div><div className="font-medium">{school.email || "Email not set"}</div>
              </div>
            </div>
            <div className="border border-border bg-background p-5">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-muted"><MapPin className="h-4 w-4 text-brand" /> Location</p>
              <div className="mt-3 space-y-2 text-sm text-foreground">
                <div className="font-medium">{school.address || "Address not set"}</div>
                <div className="font-medium">{[school.city, school.country].filter(Boolean).join(" · ") || "Location not set"}</div>
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
