"use client";

import { useEffect, useState } from "react";
import { Phone, Mail, MapPin, AlertCircle } from "lucide-react";
import { getBackendUrl } from "@/lib/backend-url";
import ParentPageShell from "@/components/parent-page-shell";
import { useEffectiveCurrency } from "../parent-school-context";

interface PaymentAccount {
  id: string;
  label: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  branchName?: string | null;
  currency?: string | null;
  purpose?: string | null;
  isDefault?: boolean;
}

interface SchoolInfo {
  id: string;
  name: string;
  address: string;
  phone?: string;
  email?: string;
  principal?: string;
  motto?: string;
  logo?: string;
  schoolHours?: {
    start: string;
    end: string;
  };
  country?: string;
  logoUrl?: string;
  city?: string;
  currency?: string;
  initials?: string;
  termCount?: number;
  principalComment?: string;
  manualPaymentAccountName?: string | null;
  manualPaymentAccountNumber?: string | null;
  manualPaymentBankName?: string | null;
  paymentAccounts?: PaymentAccount[];
  paymentInstructions?: string | null;
  tagline?: string | null;
}

export default function SchoolPage() {
  const [school, setSchool] = useState<SchoolInfo | null>(null);
  const [schoolLogoUrl, setSchoolLogoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [calling, setCalling] = useState(false);
  const effectiveCurrency = useEffectiveCurrency(school);

  const loadData = async () => {
    try {
      const backendUrl = getBackendUrl();
      
      const res = await fetch(`${backendUrl}/api/parent/school`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        throw new Error('Failed to load school information');
      }

      const data = await res.json();
      setSchool(data);

      try {
        if (data?.id) {
          const logoRes = await fetch(`/api/school-logo/${encodeURIComponent(data.id)}`);

          if (logoRes.ok) {
            const blob = await logoRes.blob();
            setSchoolLogoUrl(URL.createObjectURL(blob));
          } else {
            setSchoolLogoUrl(null);
          }
        } else {
          setSchoolLogoUrl(null);
        }
      } catch (logoErr) {
        console.error("Error loading school logo:", logoErr);
        setSchoolLogoUrl(null);
      }

      setLoading(false);
    } catch (err) {
      console.error("Error loading school:", err);
      setError(err instanceof Error ? err.message : 'Failed to load school information');
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    return () => {
      if (schoolLogoUrl) {
        URL.revokeObjectURL(schoolLogoUrl);
      }
    };
  }, [schoolLogoUrl]);

  const handleCallSchool = () => {
    if (!school?.phone) {
      return;
    }

    setCalling(true);
    window.location.href = `tel:${school.phone}`;
    setTimeout(() => setCalling(false), 1500);
  };

  if (loading) {
    return (
      <ParentPageShell onRefresh={loadData}>
        <div className="space-y-6">
          <div className="flex items-end gap-3">
            <div className="h-20 w-20 bg-slate-200 rounded-2xl animate-pulse"></div>
            <div className="space-y-2 flex-1">
              <div className="h-4 w-24 bg-slate-100 rounded animate-pulse"></div>
              <div className="h-8 w-48 bg-slate-200 rounded animate-pulse"></div>
            </div>
          </div>
          <div className="rounded-[12px] border border-border bg-surface p-6 space-y-6 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-3">
                <div className="h-5 w-32 bg-slate-200 rounded"></div>
                <div className="h-4 w-48 bg-slate-100 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </ParentPageShell>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-10">
        <div className="rounded-[12px] border border-red-200 bg-red-50 p-5 text-sm text-red-700 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 text-red-600" />
            <div>
              <p className="font-semibold text-red-900">Unable to load school data</p>
              <p className="mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!school) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-12">
        <div className="rounded-[12px] border border-border bg-surface p-8 text-center shadow-sm">
          <p className="text-sm text-muted">School information not available.</p>
        </div>
      </div>
    );
  }

  const contactLabel = school.email || school.phone ? 'Reach out to the school directly' : 'No direct contact details provided';
  const legacyPaymentAccount: PaymentAccount[] = school.manualPaymentAccountName || school.manualPaymentAccountNumber || school.manualPaymentBankName
    ? [{
        id: 'legacy-payment-account',
        label: 'General Fees',
        bankName: school.manualPaymentBankName || '',
        accountName: school.manualPaymentAccountName || '',
        accountNumber: school.manualPaymentAccountNumber || '',
        currency: school.currency,
      }]
    : [];
  const paymentAccounts = school.paymentAccounts?.length ? school.paymentAccounts : legacyPaymentAccount;

  return (
    <ParentPageShell onRefresh={loadData}>
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-4 flex items-end gap-3">
          <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-2xl bg-background border border-border/30">
            {schoolLogoUrl ? (
              <img src={schoolLogoUrl} alt="School logo" className="h-full w-full object-contain p-2" />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-brand/10 text-3xl font-bold text-brand">
                {school.initials || school.name?.charAt(0) || 'S'}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">School profile</p>
            <h1 className="mt-2 text-3xl font-semibold text-foreground truncate">{school.name}</h1>
          </div>
        </div>
      </div>

        {school.tagline || school.motto ? (
          <p className="mb-6 text-sm leading-6 text-muted">{school.tagline || school.motto}</p>
        ) : null}

        {/* Quick Actions */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={handleCallSchool}
            disabled={!school.phone || calling}
            className="flex-1 flex items-center justify-center gap-1 rounded-[12px] bg-brand px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Phone className="h-4 w-4" />
            Call
          </button>
          <a
            href={school.email ? `mailto:${school.email}` : '#'}
            className="flex-1 flex items-center justify-center gap-1 rounded-[12px] border border-border bg-surface px-3 py-2 text-sm font-semibold text-foreground transition hover:border-brand/40 hover:text-brand"
            aria-disabled={!school.email}
          >
            <Mail className="h-4 w-4" />
            Email
          </a>
        </div>

        {/* Main Card Container */}
        <div className="rounded-[12px] border border-border bg-surface p-6 shadow-sm space-y-6">
        {/* Contact Details */}
        <div>
          <p className="text-lg font-bold text-foreground mb-5 tracking-tight">Contact Details</p>
          <div className="space-y-4">
            {school.phone ? (
              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand" />
                <div className="flex-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">Phone</p>
                  <p className="mt-1 text-base font-medium text-foreground">{school.phone}</p>
                </div>
              </div>
            ) : null}

            {school.email ? (
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand" />
                <div className="flex-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">Email</p>
                  <a href={`mailto:${school.email}`} className="mt-1 block text-base font-medium text-brand hover:underline break-all">
                    {school.email}
                  </a>
                </div>
              </div>
            ) : null}

            {school.address || school.city || school.country ? (
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand" />
                <div className="flex-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">Address</p>
                  <p className="mt-1 text-base font-medium text-foreground">
                    {[school.address, school.city, school.country].filter(Boolean).join(', ') || 'Not provided'}
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border/50" />

        {/* School Info */}
        <div>
          <p className="text-lg font-bold text-foreground mb-5 tracking-tight">School Information</p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">Terms per year</p>
              <p className="mt-2 text-lg font-semibold text-foreground">{typeof school.termCount === 'number' ? school.termCount : '-'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">Currency</p>
              <p className="mt-2 text-lg font-semibold text-foreground">{effectiveCurrency || '-'}</p>
            </div>
            {school.schoolHours ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">School hours</p>
                <p className="mt-2 text-lg font-semibold text-foreground">{school.schoolHours.start} – {school.schoolHours.end}</p>
              </div>
            ) : null}
          </div>
        </div>

        {/* Principal's Message */}
        {school.principalComment ? (
          <>
            <div className="border-t border-border/50" />
            <div>
              <p className="text-lg font-bold text-foreground mb-5 tracking-tight">Principal's Message</p>
              <p className="text-sm leading-6 text-foreground/80">{school.principalComment}</p>
            </div>
          </>
        ) : null}

        {/* Payments Section */}
        {paymentAccounts.length > 0 ? (
          <>
            <div className="border-t border-border/50" />
            <div>
              <p className="text-lg font-bold text-foreground mb-5 tracking-tight">Bank Transfer Details</p>
              <div className="grid gap-4 sm:grid-cols-2">
                {paymentAccounts.map((account) => (
                  <div key={account.id} className="rounded-xl border border-border bg-background p-4">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-semibold text-foreground">{account.label}</p>
                      {account.isDefault ? <span className="rounded-full bg-brand-light px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-brand">Default</span> : null}
                    </div>
                    <dl className="mt-4 space-y-2 text-sm">
                      {account.bankName ? <div><dt className="text-xs uppercase tracking-wide text-muted">Bank</dt><dd className="font-medium text-foreground">{account.bankName}</dd></div> : null}
                      {account.accountName ? <div><dt className="text-xs uppercase tracking-wide text-muted">Account name</dt><dd className="font-medium text-foreground">{account.accountName}</dd></div> : null}
                      {account.accountNumber ? <div><dt className="text-xs uppercase tracking-wide text-muted">Account number</dt><dd className="font-mono font-medium text-foreground">{account.accountNumber}</dd></div> : null}
                      {account.branchName ? <div><dt className="text-xs uppercase tracking-wide text-muted">Branch</dt><dd className="font-medium text-foreground">{account.branchName}</dd></div> : null}
                      {account.purpose ? <div><dt className="text-xs uppercase tracking-wide text-muted">Purpose</dt><dd className="font-medium text-foreground">{account.purpose}</dd></div> : null}
                    </dl>
                  </div>
                ))}
              </div>
              {school.paymentInstructions ? <p className="mt-4 text-sm leading-6 text-foreground/80 whitespace-pre-wrap">{school.paymentInstructions}</p> : null}
            </div>
          </>
        ) : null}
      </div>
    </ParentPageShell>
  );
}