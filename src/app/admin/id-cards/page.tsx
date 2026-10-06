"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BadgeDollarSign, Check, CreditCard, Download, FileText, Search, ShieldCheck, Users } from "lucide-react";
import { resolveFileUrl } from "@/lib/api-client";
import QRCode from "qrcode";

type IdCardOrientation = "PORTRAIT" | "LANDSCAPE";
type IdCardTemplate = {
  id: string;
  label: string;
  description: string;
  tier: "STANDARD" | "PREMIUM";
  defaultOrientation: IdCardOrientation;
  orientations: IdCardOrientation[];
};
type ParentPortalQr = { available: boolean; reason: string | null };
type CardAward = { id: string; awardType: "UNITS" | "FULL_ORDER"; availableUnits: number; currency: string; eligibleTiers: string[]; terms?: string | null; expiresAt?: string | null };
type IdCardStudent = {
  id: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  admissionNo?: string | null;
  photoUrl?: string | null;
  classId?: string | null;
  class?: { name: string; arm?: string | null } | null;
};
type IdCardOrder = {
  id: string;
  status: string;
  paymentStatus: string;
  currency: string;
  amountMinor: number;
  createdAt: string;
  quantity: number;
  templateId: string;
  templateTier: string;
};

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { credentials: "include", ...init });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error || "The ID Card Studio request failed.");
  return data as T;
}

function formatMinorCurrency(amount: number, currency = "NGN") {
  const safeCurrency = /^[A-Z]{3}$/.test(currency) ? currency : "NGN";
  const value = Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: safeCurrency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(value / 100));
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" });
}

function TemplateArtwork({
  templateId,
  orientation,
  schoolName = "SCHOOL NAME",
  studentName = "STUDENT NAME",
  admissionNo = "ADMISSION NO.",
  className = "CLASS",
  photoUrl,
  logoUrl,
  size = "thumbnail",
}: {
  templateId: string;
  orientation: IdCardOrientation;
  schoolName?: string;
  studentName?: string;
  admissionNo?: string;
  className?: string;
  photoUrl?: string | null;
  logoUrl?: string | null;
  size?: "thumbnail" | "proof";
}) {
  const portrait = orientation === "PORTRAIT";
  const proof = size === "proof";
  const frame = `relative mx-auto overflow-hidden border ${portrait ? proof ? "aspect-[154/243] w-44" : "aspect-[154/243] w-24" : proof ? "aspect-[243/154] w-full max-w-sm" : "aspect-[243/154] w-40"}`;
  const studentInitials = studentName.split(/\s+/).filter(Boolean).map((part) => part[0]).slice(0, 2).join("").toUpperCase();
  const portraitBlock = (className: string) => photoUrl
    ? <img src={photoUrl} alt="" className={`${className} shrink-0 object-cover`} />
    : <span className={`${className} flex shrink-0 items-center justify-center bg-[#e3ebeb] text-[7px] font-bold text-[#31575b]`}>{studentInitials}</span>;
  const schoolMark = logoUrl ? <img src={logoUrl} alt="" className={`${proof ? "h-6 w-6" : "h-4 w-4"} shrink-0 bg-white object-contain p-0.5`} /> : null;

  if (templateId === "crestClassic") {
    return <div className={`${frame} border-[#c8a85a] bg-white text-center text-[#173f35]`}><div className={`flex items-center justify-center ${proof ? "gap-2 px-3 py-3 text-[10px]" : "gap-1 px-1 py-2 text-[6px]"} bg-[#173f35] font-bold tracking-wide text-white`}>{schoolMark}<span className="min-w-0 truncate">{schoolName}</span></div><div className={proof ? "h-1 bg-[#c8a85a]" : "h-0.5 bg-[#c8a85a]"}/><div className={`mx-auto flex items-center justify-center rounded-full border border-[#c8a85a] font-bold ${proof ? "mt-4 h-11 w-11 text-[10px]" : "mt-2 h-6 w-6 text-[6px]"}`}>CREST</div>{portraitBlock(`mx-auto border border-[#c8a85a] ${proof ? "mt-2 h-20 w-16" : "mt-1 h-8 w-7"}`)}<div className={`truncate px-2 font-bold ${proof ? "mt-2 text-sm" : "mt-1 px-1 text-[7px]"}`}>{studentName}</div><div className={`truncate px-2 ${proof ? "mt-1 text-[10px]" : "mt-0.5 px-1 text-[5px]"}`}>{admissionNo}</div></div>;
  }

  if (templateId === "inkSaver") {
    return <div className={`${frame} border-black bg-white text-black`}><div className={`flex items-center ${proof ? "gap-2 px-3 py-3 text-[10px]" : "gap-1 px-1 py-2 text-[6px]"} font-bold`}>{schoolMark}<span className="min-w-0 truncate">{schoolName}</span></div><div className="h-px bg-black"/><div className={`flex ${proof ? "gap-4 p-4" : "gap-2 p-2"} ${portrait ? "flex-col items-center text-center" : "items-center"}`}>{portraitBlock(`grayscale ${proof ? "h-20 w-16" : "h-10 w-8"}`)}<div className="min-w-0"><div className={`truncate font-bold ${proof ? "text-sm" : "text-[7px]"}`}>{studentName}</div><div className={`truncate ${proof ? "mt-2 text-[10px]" : "mt-1 text-[5px]"}`}>{admissionNo}</div><div className={`truncate ${proof ? "mt-2 text-[10px]" : "mt-1 text-[5px]"}`}>{className}</div><div className={`bg-black ${proof ? "mt-2 h-0.5 w-20" : "mt-1 h-px w-10"}`}/></div></div></div>;
  }

  if (templateId === "houseTeam") {
    return <div className={`${frame} border-[#194c91] bg-white text-[#193b65]`}><div className={`absolute inset-y-0 left-0 bg-[#e2a229] ${proof ? "w-3" : "w-2"}`}/><div className={`ml-2 flex items-center bg-[#194c91] text-white ${proof ? "gap-2 px-3 py-3 text-[10px]" : "gap-1 px-1 py-2 text-[6px]"} font-bold`}>{schoolMark}<span className="min-w-0 truncate">{schoolName} · TEAM</span></div><div className={`ml-2 flex ${proof ? "gap-4 p-4" : "gap-2 p-2"} ${portrait ? "flex-col items-center text-center" : "items-center"}`}>{portraitBlock(`border-[#e2a229] ${proof ? "h-20 w-16 border-4" : "h-9 w-7 border-2"}`)}<div className="min-w-0"><div className={`truncate font-bold ${proof ? "text-sm" : "text-[7px]"}`}>{studentName}</div><div className={`mt-2 truncate ${proof ? "text-[10px]" : "mt-1 text-[5px]"}`}>HOUSE / {className}</div><div className={`mt-2 truncate ${proof ? "text-[10px]" : "mt-1 text-[5px]"}`}>{admissionNo}</div></div></div></div>;
  }

  if (templateId === "earlyLearners") {
    return <div className={`${frame} border-[#e7c46b] bg-[#fff7df] text-[#394738]`}><div className={`flex items-center text-white ${proof ? "gap-2 px-3 py-3 text-[10px]" : "gap-1 px-1 py-2 text-[6px]"} bg-[#e6a84a] font-bold`}>{schoolMark}<span className="min-w-0 truncate">{schoolName}</span></div><div className={`mx-auto overflow-hidden rounded-full border-4 border-[#e6a84a] ${proof ? "mt-4 h-20 w-20" : "mt-2 h-10 w-10 border-2"}`}>{photoUrl ? <img src={photoUrl} alt="" className="h-full w-full object-cover" /> : <span className={`flex h-full items-center justify-center bg-[#f0dfbb] font-bold ${proof ? "text-sm" : "text-[7px]"}`}>{studentInitials}</span>}</div><div className={`truncate px-2 text-center font-bold ${proof ? "mt-3 text-sm" : "mt-1 px-1 text-[8px]"}`}>{studentName}</div><div className={`truncate px-2 text-center ${proof ? "mt-2 text-[10px]" : "mt-1 px-1 text-[5px]"}`}>{className} · {admissionNo}</div></div>;
  }

  if (templateId === "seniorCollege") {
    return <div className={`${frame} border-[#b9c4c4] bg-white text-[#263b3d]`}><div className={proof ? "h-2 bg-[#263b3d]" : "h-1 bg-[#263b3d]"}/><div className={`absolute border border-[#d5dddd] ${proof ? "inset-2" : "inset-1"}`}/><div className={`relative flex h-full items-center ${proof ? "gap-4 p-6" : "gap-2 p-3"}`}>{portraitBlock(proof ? "h-24 w-18" : "h-12 w-9")}<div className="min-w-0"><div className={`truncate font-bold tracking-wide ${proof ? "text-[10px]" : "text-[5px]"}`}>{schoolName}</div><div className={`bg-[#263b3d] ${proof ? "my-2 h-0.5 w-24" : "my-1 h-px w-12"}`}/><div className={`truncate font-bold ${proof ? "text-sm" : "text-[7px]"}`}>{studentName}</div><div className={`mt-2 ${proof ? "text-[10px]" : "mt-1 text-[5px]"}`}>STUDENT IDENTIFICATION</div><div className={`mt-2 truncate ${proof ? "text-[10px]" : "mt-1 text-[5px]"}`}>{admissionNo} · {className}</div></div></div></div>;
  }

  return <div className={`${frame} border-[#b9c8c9] bg-white text-[#183e48]`}><div className={`flex items-center text-white ${proof ? "gap-2 px-3 py-3 text-[10px]" : "gap-1 px-1 py-2 text-[6px]"} bg-[#146b72] font-bold`}>{schoolMark}<span className="min-w-0 truncate">{schoolName}</span></div><div className={`flex ${proof ? "gap-4 p-4" : "gap-2 p-2"} ${portrait ? "flex-col items-center text-center" : "items-center"}`}>{portraitBlock(proof ? "h-20 w-16" : "h-10 w-8")}<div className="min-w-0"><div className={`font-semibold tracking-wide ${proof ? "text-[10px]" : "text-[5px]"}`}>STUDENT ID</div><div className={`mt-1 truncate font-bold ${proof ? "text-sm" : "text-[7px]"}`}>{studentName}</div><div className={`mt-2 truncate ${proof ? "text-[10px]" : "mt-1 text-[5px]"}`}>{admissionNo}</div><div className={`mt-2 truncate ${proof ? "text-[10px]" : "mt-1 text-[5px]"}`}>{className}</div><div className={`bg-[#146b72]/20 ${proof ? "mt-2 h-2 w-24" : "mt-1 h-1 w-12"}`}/></div></div></div>;
}

export default function AdminIdCardsPage() {
  const [templates, setTemplates] = useState<IdCardTemplate[]>([]);
  const [students, setStudents] = useState<IdCardStudent[]>([]);
  const [classes, setClasses] = useState<Array<{ id: string; name: string; arm?: string | null }>>([]);
  const [orders, setOrders] = useState<IdCardOrder[]>([]);
  const [awards, setAwards] = useState<CardAward[]>([]);
  const [selectedAwardId, setSelectedAwardId] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [orientation, setOrientation] = useState<IdCardOrientation>("PORTRAIT");
  const [parentPortalQr, setParentPortalQr] = useState<ParentPortalQr>({ available: false, reason: "Set a public app URL to generate a Parent Portal QR." });
  const [includeCardBack, setIncludeCardBack] = useState(false);
  const [proofSide, setProofSide] = useState<"FRONT" | "BACK">("FRONT");
  const [backQrPreview, setBackQrPreview] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [classId, setClassId] = useState("");
  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [templatesData, ordersData, studentsData, awardsData] = await Promise.all([
          requestJson<{ templates: IdCardTemplate[]; parentPortalQr: ParentPortalQr }>("/api/id-cards/templates"),
          requestJson<{ orders: IdCardOrder[] }>("/api/id-cards/orders"),
          requestJson<{ students: IdCardStudent[]; classes: Array<{ id: string; name: string; arm?: string | null }> }>("/api/id-cards/students"),
          requestJson<{ awards: CardAward[] }>("/api/id-cards/awards"),
        ]);

        if (!active) return;
        setTemplates(templatesData.templates || []);
        setParentPortalQr(templatesData.parentPortalQr);
        setOrders(ordersData.orders || []);
        setAwards(awardsData.awards || []);
        setStudents(studentsData.students || []);
        setClasses(studentsData.classes || []);
        setSelectedTemplate((current) => current || templatesData.templates?.[0]?.id || "");
        setOrientation((current) => templatesData.templates?.find((template) => template.id === selectedTemplate)?.defaultOrientation || templatesData.templates?.[0]?.defaultOrientation || current);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Unable to load ID-card studio data.");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const qrUrl = quote?.preview?.parentPortalQrUrl;
    if (!qrUrl) {
      setBackQrPreview(null);
      return () => { active = false; };
    }
    QRCode.toString(qrUrl, { type: "svg", errorCorrectionLevel: "M", margin: 1, width: 240 })
      .then((svg) => { if (active) setBackQrPreview(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`); })
      .catch(() => { if (active) setBackQrPreview(null); });
    return () => { active = false; };
  }, [quote]);

  const visibleStudents = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase();
    return students.filter((student) => {
      const matchesClass = !classId || student.classId === classId;
      const searchable = [student.firstName, student.middleName, student.lastName, student.admissionNo]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase();
      return matchesClass && (!normalizedSearch || searchable.includes(normalizedSearch));
    });
  }, [students, search, classId]);
  const previewStudent = students.find((student) => selectedIds.has(student.id)) || visibleStudents[0];

  const toggleStudent = (studentId: string) => {
    setQuote(null);
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(studentId)) next.delete(studentId);
      else if (next.size < 200) next.add(studentId);
      return next;
    });
  };

  const toggleVisibleStudents = () => {
    setQuote(null);
    setSelectedIds((current) => {
      const next = new Set(current);
      const allVisibleSelected = visibleStudents.length > 0 && visibleStudents.every((student) => next.has(student.id));
      if (allVisibleSelected) visibleStudents.forEach((student) => next.delete(student.id));
      else visibleStudents.forEach((student) => {
        if (next.size < 200) next.add(student.id);
      });
      return next;
    });
  };

  const createQuote = async () => {
    setError(null);
    setWorking(true);
    try {
      const data = await requestJson<{ quote: any; preview: any }>("/api/id-cards/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentIds: Array.from(selectedIds), templateId: selectedTemplate, orientation, includeCardBack, includeParentPortalQr: includeCardBack, awardId: selectedAwardId || undefined }),
      });
      setQuote(data);
      setProofSide("FRONT");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to create quote.");
    } finally {
      setWorking(false);
    }
  };

  const createOrderAndPay = async () => {
    if (!quote?.quote?.id) return;
    setError(null);
    setWorking(true);
    try {
      const { order } = await requestJson<{ order: IdCardOrder }>("/api/id-cards/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteId: quote.quote.id }),
      });
      if (order.paymentStatus === "PAID") {
        window.location.assign(`/admin/id-cards/orders/${encodeURIComponent(order.id)}`);
        return;
      }
      const checkout = await requestJson<{ authorizationUrl: string }>(`/api/id-cards/orders/${encodeURIComponent(order.id)}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!checkout.authorizationUrl) throw new Error("Payment provider did not return a checkout link.");
      window.location.assign(checkout.authorizationUrl);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to start payment.");
      setWorking(false);
    }
  };

  const stats = useMemo(() => {
    const paidByCurrency = orders.filter((order) => order.paymentStatus === "PAID").reduce<Record<string, number>>((totals, order) => {
      totals[order.currency] = (totals[order.currency] || 0) + (Number(order.amountMinor) || 0);
      return totals;
    }, {});
    const paid = Object.entries(paidByCurrency).map(([currency, amount]) => formatMinorCurrency(amount, currency)).join(" · ") || formatMinorCurrency(0);
    const ready = orders.filter((order) => order.status === "READY").length;
    const pending = orders.filter((order) => order.paymentStatus === "PENDING").length;
    return [
      { label: "Total orders", value: String(orders.length), detail: "Across all batches", icon: FileText },
      { label: "Paid", value: paid, detail: "Confirmed payments", icon: BadgeDollarSign },
      { label: "Ready", value: String(ready), detail: "Generated and available", icon: ShieldCheck },
      { label: "Awaiting payment", value: String(pending), detail: "Pending checkout", icon: CreditCard },
    ];
  }, [orders]);

  return (
    <main className="min-h-screen pb-12">
      <div className="mx-auto max-w-7xl space-y-6 px-2 py-6 sm:px-8 sm:py-8 lg:px-12">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-3xl font-bold text-foreground">ID Card Studio</h1>
            <p className="mt-2 max-w-3xl text-muted">Select active students, review the server-calculated price, and generate print-ready cards after verified payment.</p>
          </div>
          <Link href="/admin/students" className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover">
            <Users className="h-4 w-4" />
            Student records
          </Link>
        </div>

        {error ? (
          <div className="border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map(({ label, value, detail, icon: Icon }) => (
            <article key={label} className="flex h-full items-start gap-4 border border-border bg-surface p-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-brand/10 text-brand">
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-muted">{label}</p>
                <p className="mt-1.5 break-words text-xl font-bold text-foreground">{value}</p>
                <p className="mt-1 text-xs text-muted">{detail}</p>
              </div>
            </article>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="border border-border bg-surface p-5">
            <div className="flex flex-col gap-4 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Choose students</h2>
                <p className="mt-1 text-sm text-muted">Only active students from your school are listed. Maximum 200 students per order.</p>
              </div>
              <p className="shrink-0 text-sm font-semibold text-brand">{selectedIds.size} selected</p>
            </div>

            <div className="grid gap-3 py-4 sm:grid-cols-[1fr_220px]">
              <label className="flex items-center gap-2 border border-border bg-background px-3">
                <Search className="h-4 w-4 shrink-0 text-muted" />
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name or admission number" className="h-10 min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted" />
              </label>
              <select aria-label="Filter by class" value={classId} onChange={(event) => setClassId(event.target.value)} className="h-10 border border-border bg-background px-3 text-sm text-foreground">
                <option value="">All classes</option>
                {classes.map((schoolClass) => <option key={schoolClass.id} value={schoolClass.id}>{[schoolClass.name, schoolClass.arm].filter(Boolean).join(" ")}</option>)}
              </select>
            </div>

            <div className="mb-2 flex items-center justify-between border-b border-border pb-2 text-xs text-muted">
              <span>{visibleStudents.length} students shown{students.length >= 500 ? " (up to 500 loaded)" : ""}</span>
              <button type="button" onClick={toggleVisibleStudents} className="font-semibold text-brand hover:text-brand-hover">Select / clear shown</button>
            </div>

            <div className="max-h-[420px] divide-y divide-border overflow-y-auto">
              {loading ? <p className="py-6 text-sm text-muted">Loading students…</p> : visibleStudents.length ? visibleStudents.map((student) => {
                const photo = resolveFileUrl(student.photoUrl, student.id);
                const name = [student.firstName, student.middleName, student.lastName].filter(Boolean).join(" ");
                return (
                  <label key={student.id} className="flex cursor-pointer items-center gap-3 py-3">
                    <input type="checkbox" checked={selectedIds.has(student.id)} onChange={() => toggleStudent(student.id)} disabled={!selectedIds.has(student.id) && selectedIds.size >= 200} className="h-4 w-4 accent-brand" />
                    {photo ? <img src={photo} alt="" className="h-10 w-10 shrink-0 object-cover" /> : <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-brand/10 text-xs font-bold text-brand">{name.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase()}</span>}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-foreground">{name}</span>
                      <span className="block truncate text-xs text-muted">{student.admissionNo || "No admission number"} · {[student.class?.name, student.class?.arm].filter(Boolean).join(" ") || "No class"}</span>
                    </span>
                    {!student.photoUrl ? <span className="shrink-0 text-xs font-medium text-amber-700">No photo</span> : null}
                  </label>
                );
              }) : <p className="py-6 text-sm text-muted">No active students match these filters.</p>}
            </div>

            <div className="mt-4 grid gap-3 border-t border-border pt-4 sm:grid-cols-[1fr_auto] sm:items-end">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm font-semibold text-foreground">
                  Card design
                  <select value={selectedTemplate} onChange={(event) => {
                    const nextTemplate = templates.find((template) => template.id === event.target.value);
                    setSelectedTemplate(event.target.value);
                    if (nextTemplate && !nextTemplate.orientations.includes(orientation)) setOrientation(nextTemplate.defaultOrientation);
                    setQuote(null);
                  }} className="mt-1.5 h-11 w-full border border-border bg-background px-3 font-normal">
                    {templates.map((template) => <option key={template.id} value={template.id}>{template.label} · {template.tier}</option>)}
                  </select>
                  <span className="mt-1 block text-xs font-normal text-muted">{templates.find((template) => template.id === selectedTemplate)?.description}</span>
                  <div className="mt-3 flex items-center gap-3 border-t border-border pt-3">
                    <TemplateArtwork
                      templateId={selectedTemplate}
                      orientation={orientation}
                      studentName={previewStudent ? [previewStudent.firstName, previewStudent.middleName, previewStudent.lastName].filter(Boolean).join(" ") : undefined}
                      admissionNo={previewStudent?.admissionNo || undefined}
                      className={[previewStudent?.class?.name, previewStudent?.class?.arm].filter(Boolean).join(" ") || undefined}
                      photoUrl={previewStudent ? resolveFileUrl(previewStudent.photoUrl, previewStudent.id) : null}
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground">Live design preview</p>
                      <p className="mt-1 text-xs font-normal text-muted">{templates.find((template) => template.id === selectedTemplate)?.label || "Selected design"} · {orientation === "PORTRAIT" ? "Portrait" : "Landscape"}</p>
                    </div>
                  </div>
                </label>
                <fieldset className="text-sm font-semibold text-foreground">
                  <legend>Card layout</legend>
                  <div className="mt-1.5 grid h-11 grid-cols-2 border border-border" role="radiogroup" aria-label="Card layout">
                    {(["PORTRAIT", "LANDSCAPE"] as const).map((layout) => {
                      const available = templates.find((template) => template.id === selectedTemplate)?.orientations.includes(layout) ?? true;
                      return (
                        <label key={layout} className={`flex cursor-pointer items-center justify-center gap-2 text-sm transition ${orientation === layout ? "bg-brand text-white" : "bg-background text-muted hover:text-foreground"} ${available ? "" : "cursor-not-allowed opacity-40"}`}>
                          <input type="radio" name="id-card-layout" value={layout} checked={orientation === layout} disabled={!available} onChange={() => { setOrientation(layout); setQuote(null); }} className="sr-only" />
                          <span className={`block border border-current ${layout === "PORTRAIT" ? "h-4 w-3" : "h-3 w-4"}`} aria-hidden="true" />
                          {layout === "PORTRAIT" ? "Portrait" : "Landscape"}
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
                <fieldset className="text-sm font-semibold text-foreground">
                  <legend>Card sides</legend>
                  <div className="mt-1.5 grid h-11 grid-cols-2 border border-border" role="radiogroup" aria-label="Card sides">
                    <label className={`flex cursor-pointer items-center justify-center text-sm transition ${!includeCardBack ? "bg-brand text-white" : "bg-background text-muted hover:text-foreground"}`}>
                      <input type="radio" name="id-card-sides" checked={!includeCardBack} onChange={() => { setIncludeCardBack(false); setQuote(null); }} className="sr-only" />
                      Front only
                    </label>
                    <label className={`flex cursor-pointer items-center justify-center text-sm transition ${includeCardBack ? "bg-brand text-white" : "bg-background text-muted hover:text-foreground"} ${parentPortalQr.available ? "" : "cursor-not-allowed opacity-50"}`}>
                      <input type="radio" name="id-card-sides" checked={includeCardBack} disabled={!parentPortalQr.available} onChange={() => { setIncludeCardBack(true); setQuote(null); }} className="sr-only" />
                      Front + QR back
                    </label>
                  </div>
                  <span className="mt-1 block text-xs font-normal text-muted">The card back includes the school return instructions and a Parent Portal QR code.</span>
                  {!parentPortalQr.available && parentPortalQr.reason ? <span className="mt-1 block text-xs font-medium text-amber-800">QR back unavailable: {parentPortalQr.reason}</span> : null}
                </fieldset>
                <label className="block text-sm font-semibold text-foreground">
                  Free card award (optional)
                  <select value={selectedAwardId} onChange={(event) => { setSelectedAwardId(event.target.value); setQuote(null); }} className="mt-1.5 h-11 w-full border border-border bg-background px-3 font-normal">
                    <option value="">Pay for this batch</option>
                    {awards.filter((award) => award.availableUnits >= selectedIds.size && award.eligibleTiers.includes(templates.find((template) => template.id === selectedTemplate)?.tier || "STANDARD")).map((award) => <option key={award.id} value={award.id}>{award.availableUnits} card units available{award.expiresAt ? ` · expires ${new Date(award.expiresAt).toLocaleDateString()}` : ""}</option>)}
                  </select>
                  {selectedAwardId ? <span className="mt-1 block text-xs font-normal text-muted">The selected award must cover every card in the batch. Units are reserved at order creation and redeemed only after generation succeeds.</span> : null}
                </label>
              </div>
              <button type="button" onClick={createQuote} disabled={working || selectedIds.size === 0 || !selectedTemplate} className="inline-flex h-11 items-center justify-center gap-2 bg-brand px-4 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50">
                <Check className="h-4 w-4" /> Review price
              </button>
            </div>
          </div>

          <aside className="border border-border bg-surface p-5">
            <h2 className="text-lg font-semibold text-foreground">Order review</h2>
            <p className="mt-1 text-sm text-muted">Your total is calculated by the server from the selected students and active price rule.</p>
            {quote ? (
              <div className="mt-5 space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3 text-sm"><span className="text-muted">Cards</span><span className="font-semibold text-foreground">{quote.quote.quantity}</span></div>
                <div className="flex items-center justify-between gap-3 border-b border-border pb-3 text-sm"><span className="text-muted">Design / layout</span><span className="text-right font-semibold text-foreground">{templates.find((item) => item.id === quote.quote.templateId)?.label || quote.quote.templateId} · {quote.quote.orientation === "PORTRAIT" ? "Portrait" : "Landscape"} · {quote.quote.includeCardBack ? "Front + QR back" : "Front only"} · {quote.quote.templateTier}</span></div>
                <div className="space-y-2 border-b border-border pb-3 text-sm">
                  <p className="font-semibold text-foreground">Price breakdown</p>
                  {quote.quote.bandBreakdown?.map((band: { from: number; through: number; quantity: number; unitPriceMinor: number; lineTotalMinor: number }, index: number) => (
                    <div key={`${band.from}-${index}`} className="flex items-start justify-between gap-3 text-muted">
                      <span>{band.quantity} × {formatMinorCurrency(band.unitPriceMinor, quote.quote.currency)} base cards ({band.from}–{band.through})</span>
                      <span className="shrink-0 text-foreground">{formatMinorCurrency(band.lineTotalMinor, quote.quote.currency)}</span>
                    </div>
                  ))}
                  {quote.quote.upliftPerCardMinor > 0 ? <div className="flex items-start justify-between gap-3 text-muted"><span>{quote.quote.quantity} × premium template uplift</span><span className="shrink-0 text-foreground">{formatMinorCurrency(quote.quote.quantity * quote.quote.upliftPerCardMinor, quote.quote.currency)}</span></div> : null}
                  <div className="flex items-center justify-between border-t border-border pt-2 font-semibold text-foreground"><span>Subtotal</span><span>{formatMinorCurrency(quote.quote.subtotalMinor, quote.quote.currency)}</span></div>
                </div>
                {quote.quote.discountMinor > 0 ? <div className="flex items-center justify-between border-b border-border pb-3 text-sm"><span className="text-muted">Discount</span><span className="font-semibold text-foreground">−{formatMinorCurrency(quote.quote.discountMinor, quote.quote.currency)}</span></div> : null}
                <div className="flex items-center justify-between border-b border-border pb-3 text-sm"><span className="text-muted">Tax</span><span className="font-semibold text-foreground">{formatMinorCurrency(quote.quote.taxMinor, quote.quote.currency)}</span></div>
                {quote.quote.awardId ? <div className="flex items-center justify-between border-b border-border pb-3 text-sm"><span className="text-muted">Approved free award</span><span className="font-semibold text-emerald-700">{quote.quote.quantity} cards covered</span></div> : null}
                <div className="flex items-end justify-between gap-3"><span className="text-sm font-semibold text-foreground">{quote.quote.awardId ? "Due now" : "Due before generation"}</span><span className="text-2xl font-bold text-brand">{formatMinorCurrency(quote.quote.totalMinor, quote.quote.currency)}</span></div>
                {quote.preview?.students?.[0] ? (() => {
                  const student = quote.preview.students[0];
                  const name = [student.firstName, student.middleName, student.lastName].filter(Boolean).join(" ");
                  const photo = resolveFileUrl(student.photoUrl, student.id);
                  const schoolName = quote.preview.school?.name || "School";
                  return (
                    <div>
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted">First card proof</p>
                        {quote.quote.includeCardBack ? (
                          <div className="inline-flex border border-border text-[10px] font-semibold">
                            <button type="button" onClick={() => setProofSide("FRONT")} aria-pressed={proofSide === "FRONT"} className={`px-2 py-1 ${proofSide === "FRONT" ? "bg-brand text-white" : "text-muted"}`}>Front</button>
                            <button type="button" onClick={() => setProofSide("BACK")} aria-pressed={proofSide === "BACK"} className={`px-2 py-1 ${proofSide === "BACK" ? "bg-brand text-white" : "text-muted"}`}>Back</button>
                          </div>
                        ) : null}
                      </div>
                      {proofSide === "BACK" && quote.quote.includeCardBack ? (
                        <div className={`relative mx-auto overflow-hidden border border-border bg-[#fbfcfc] text-foreground ${quote.quote.orientation === "PORTRAIT" ? "aspect-[154/243] w-44" : "aspect-[243/154] w-full max-w-sm"}`}>
                          <div className="flex min-h-8 items-center gap-2 bg-brand px-2.5 py-1.5 text-white">
                            {quote.preview.school?.logoUrl ? <img src={resolveFileUrl(quote.preview.school.logoUrl) || undefined} alt="" className="h-5 w-5 shrink-0 bg-white object-contain p-0.5" /> : null}
                            <p className="truncate text-[10px] font-bold">STUDENT IDENTIFICATION</p>
                          </div>
                          <div className={`px-3 pt-3 ${quote.quote.orientation === "PORTRAIT" ? "text-center" : ""}`}>
                            <p className="text-[8px] font-semibold uppercase tracking-wide text-muted">This card is issued by</p>
                            <p className="mt-0.5 truncate text-xs font-bold text-foreground">{schoolName}</p>
                            <div className="my-2 border-t border-border" />
                            <p className="text-[8px] font-bold uppercase tracking-wide text-brand">If found</p>
                            <p className="mt-0.5 text-[9px] leading-3.5 text-muted">Please return it to the school office or hand it to the nearest police station.</p>
                          </div>
                          <div className={`absolute bottom-2 ${quote.quote.orientation === "PORTRAIT" ? "left-0 right-0 flex-col items-center" : "left-3 right-3 items-end justify-between"} flex gap-2 border-t border-border pt-1.5`}>
                            <div className={`min-w-0 pb-1 ${quote.quote.orientation === "PORTRAIT" ? "text-center" : ""}`}>
                              <p className="text-[8px] font-bold uppercase text-brand">Parent Portal</p>
                            </div>
                            {backQrPreview ? <img src={backQrPreview} alt="Parent Portal sign-in QR code" className="h-11 w-11 shrink-0 bg-white p-0.5" /> : <span className="flex h-11 w-11 shrink-0 items-center justify-center border border-border bg-white text-[7px] text-muted">Preparing QR</span>}
                          </div>
                        </div>
                      ) : (
                        <TemplateArtwork
                          templateId={quote.quote.templateId}
                          orientation={quote.quote.orientation}
                          schoolName={schoolName}
                          studentName={name}
                          admissionNo={student.admissionNo || "Not assigned"}
                          className={student.className || "Class not assigned"}
                          photoUrl={photo}
                          logoUrl={quote.preview.school?.logoUrl ? resolveFileUrl(quote.preview.school.logoUrl) : null}
                          size="proof"
                        />
                      )}
                      <p className="mt-2 text-center text-[10px] font-semibold text-amber-700">PREVIEW ONLY · NOT A PRODUCTION CARD</p>
                    </div>
                  );
                })() : null}
                <p className="text-xs leading-5 text-muted">Production PDFs are generated only after verified payment. Missing photos render as initials; check student records before checkout.</p>
                <button type="button" onClick={createOrderAndPay} disabled={working} className="flex h-11 w-full items-center justify-center gap-2 bg-brand px-4 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50">
                  <CreditCard className="h-4 w-4" /> {working ? "Starting…" : quote.quote.awardId ? "Use award and generate" : "Pay and generate"}
                </button>
                <p className="text-center text-xs text-muted">Quote expires {new Date(quote.quote.expiresAt).toLocaleTimeString()}</p>
              </div>
            ) : <p className="mt-5 border-t border-border pt-4 text-sm text-muted">Select students and review the price to continue.</p>}
          </aside>
        </section>

        <section className="border border-border bg-surface p-5">
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-brand" />
            <h2 className="text-lg font-semibold text-foreground">Recent orders</h2>
          </div>

          {orders.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-muted">
                    <th className="px-3 py-2 font-medium">Order</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                    <th className="px-3 py-2 font-medium">Payment</th>
                    <th className="px-3 py-2 font-medium">Cards</th>
                    <th className="px-3 py-2 font-medium">Created</th>
                    <th className="px-3 py-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 6).map((order) => (
                    <tr key={order.id} className="border-b border-border last:border-b-0">
                      <td className="px-3 py-3 font-medium text-foreground">{order.id.slice(0, 12)}</td>
                      <td className="px-3 py-3"><span className="rounded-full bg-brand/10 px-2 py-1 text-xs font-medium text-brand">{order.status}</span></td>
                      <td className="px-3 py-3 text-muted">{order.paymentStatus}</td>
                      <td className="px-3 py-3 text-muted">{order.quantity}</td>
                      <td className="px-3 py-3 text-muted">{formatDate(order.createdAt)}</td>
                      <td className="px-3 py-3">
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <Link href={`/admin/id-cards/orders/${encodeURIComponent(order.id)}`} className="font-semibold text-brand hover:text-brand-hover">View status</Link>
                          {order.status === "READY" && order.paymentStatus === "PAID" ? (
                            <>
                            <a href={`/api/id-cards/orders/${encodeURIComponent(order.id)}/download?format=CR80`} className="inline-flex items-center gap-1.5 font-semibold text-brand hover:text-brand-hover">
                            <Download className="h-4 w-4" /> CR80
                            </a>
                            <a href={`/api/id-cards/orders/${encodeURIComponent(order.id)}/download?format=A4`} className="inline-flex items-center gap-1.5 font-semibold text-brand hover:text-brand-hover">A4 sheet</a>
                            </>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted">No card orders have been created yet.</p>
          )}
        </section>
      </div>
    </main>
  );
}
