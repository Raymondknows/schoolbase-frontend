"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertCircle, ChevronRight, Filter, GraduationCap, Lock } from "lucide-react";
import { getBackendUrl } from "@/lib/backend-url";
import ParentPageShell from "@/components/parent-page-shell";
import { WaecReportCard } from "@/components/teacher/waec-report-card";

interface Result {
  id: string;
  subject: string;
  assessmentId: string;
  caScore?: number;
  testScore?: number;
  examScore?: number;
  totalScore?: number;
  grade?: string;
}

interface Term {
  id: string;
  name: string;
  sortOrder?: number;
}

interface Child {
  id: string;
  firstName: string;
  lastName: string;
  admissionNo: string;
}

export default function ParentResultsPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const [selectedTerm, setSelectedTerm] = useState<Term | null>(null);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string | null>(null);
  const [reportCardData, setReportCardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinChecking, setPinChecking] = useState(false);
  const [pinVerifiedChildId, setPinVerifiedChildId] = useState<string | null>(null);
  const [verifiedPin, setVerifiedPin] = useState<string | null>(null);
  const [pinRequired, setPinRequired] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const backendUrl = getBackendUrl();

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${backendUrl}/api/parent/children`, {
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) throw new Error("Failed to fetch children");

      const data = await response.json();
      setChildren(data.children || []);

      if (data.children?.length > 0) {
        setSelectedChildId(data.children[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const fetchTerms = async () => {
      try {
        const backendUrl = getBackendUrl();
        const response = await fetch(`${backendUrl}/api/parent/terms`, {
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) throw new Error("Failed to fetch terms");

        const data = await response.json();
        setTerms(data.terms || []);
      } catch (err) {
        console.error("Error fetching terms:", err);
      }
    };

    fetchTerms();
  }, []);

  useEffect(() => {
    if (!selectedChildId) return;

    const fetchResults = async () => {
      try {
        const backendUrl = getBackendUrl();
        const termParam = selectedTerm ? `&termId=${selectedTerm.id}` : "";
        const pinParam = verifiedPin && pinVerifiedChildId === selectedChildId ? `&pin=${encodeURIComponent(verifiedPin)}` : "";
        const response = await fetch(
          `${backendUrl}/api/parent/results?childId=${selectedChildId}${termParam}${pinParam}`,
          {
            credentials: "include",
            headers: { "Content-Type": "application/json" },
          }
        );

        if (!response.ok) {
          const errorPayload = await response.json().catch(() => ({}));
          if (response.status === 403 && errorPayload.requiresPin) {
            setPinRequired(true);
            setPinError(errorPayload.error || "Result PIN required to view this child’s results.");
            setResults([]);
            setSelectedAssessmentId(null);
            setReportCardData(null);
            return;
          }

          throw new Error(errorPayload.error || "Failed to fetch results");
        }

        const data = await response.json();
        const nextResults: Result[] = data.results || [];
        setResults(nextResults);
        setStatusMessage(typeof data?.message === 'string' ? data.message : null);
        setPinRequired(false);
        setPinError(null);

        if (data.term && !selectedTerm) {
          setSelectedTerm(data.term);
        }

        const firstAssessmentId = nextResults[0]?.assessmentId ?? null;
        setSelectedAssessmentId((current) => {
          if (current && nextResults.some((result) => result.assessmentId === current)) {
            return current;
          }

          return firstAssessmentId;
        });
      } catch (err) {
        console.error("Error fetching results:", err);
        setPinRequired(false);
      }
    };

    fetchResults();
  }, [selectedChildId, selectedTerm, verifiedPin, pinVerifiedChildId]);

  useEffect(() => {
    if (!selectedChildId || !selectedAssessmentId) {
      setReportCardData(null);
      return;
    }

    const loadReportCard = async () => {
      try {
        setReportLoading(true);
        const response = await fetch(
          `/api/report-cards/${selectedAssessmentId}/${selectedChildId}`,
          {
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        setReportCardData(data);
      } catch (err) {
        console.error("Error loading report card:", err);
        setReportCardData(null);
      } finally {
        setReportLoading(false);
      }
    };

    loadReportCard();
  }, [selectedChildId, selectedAssessmentId]);

  const selectedChild = children.find((child) => child.id === selectedChildId) || null;
  const selectedAssessment = results.find((result) => result.assessmentId === selectedAssessmentId) || null;
  const activeResultsLabel = selectedTerm
    ? `${selectedTerm.name}${selectedAssessment?.subject ? ` • ${selectedAssessment.subject}` : ""}`
    : selectedAssessment?.subject || "Results";

  const handleUnlockResults = async () => {
    if (!selectedChild) return;

    setPinChecking(true);
    setPinError(null);

    try {
const termParam = selectedTerm ? `&termId=${selectedTerm.id}` : "";
        const response = await fetch(
          `${backendUrl}/api/parent/results?childId=${selectedChild.id}&pin=${encodeURIComponent(pinInput)}${termParam}`,
        {
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        }
      );

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setPinError(data.error || "Invalid result PIN.");
        return;
      }

      setPinVerifiedChildId(selectedChild.id);
      setVerifiedPin(pinInput.trim());
      setPinRequired(false);
      setPinError(null);
      setStatusMessage(typeof data?.message === 'string' ? data.message : null);
      setResults(data.results || []);
      setSelectedAssessmentId((current) => {
        const nextResults: Result[] = data.results || [];
        if (current && nextResults.some((result) => result.assessmentId === current)) {
          return current;
        }
        return nextResults[0]?.assessmentId ?? null;
      });
      if (data.term) {
        setSelectedTerm(data.term);
      }
    } catch (err) {
      console.error("Error unlocking results:", err);
      setPinError("Unable to validate PIN right now.");
    } finally {
      setPinChecking(false);
    }
  };

  if (loading) {
    return (
      <ParentPageShell onRefresh={loadData}>
        <div className="mx-auto max-w-7xl space-y-6 px-5 py-8 sm:px-8 lg:px-12">
          <div className="space-y-2">
            <div className="h-10 w-48 bg-slate-200 rounded-lg animate-pulse"></div>
            <div className="h-5 w-64 bg-slate-100 rounded animate-pulse"></div>
          </div>
          <div className="overflow-hidden rounded-lg border border-border bg-surface p-5 space-y-4 animate-pulse">
            <div className="h-5 w-32 bg-slate-200 rounded"></div>
            {[1, 2].map((i) => (
              <div key={i} className="h-10 w-24 bg-slate-100 rounded inline-block mr-2"></div>
            ))}
          </div>
          {[1, 2].map((i) => (
            <div key={i} className="overflow-hidden rounded-lg border border-border bg-surface p-5 space-y-3 animate-pulse">
              <div className="h-5 w-40 bg-slate-200 rounded"></div>
              <div className="h-16 w-full bg-slate-100 rounded"></div>
            </div>
          ))}
        </div>
      </ParentPageShell>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl rounded-lg border border-[#f5c2c7] bg-[#fff5f5] px-4 py-3 text-sm text-[#a61b29] flex gap-3">
        <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-red-900">Error</h3>
          <p className="text-sm text-red-700 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (pinRequired && selectedChild) {
    return (
      <ParentPageShell onRefresh={loadData}>
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md space-y-6 rounded-lg border border-border bg-surface p-6 shadow-[0_16px_50px_rgba(10,102,194,0.16)]">
            <div className="text-center">
              <div className="mb-4 flex items-center gap-2 text-brand">
                <Lock className="h-5 w-5" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Result PIN Required</h2>
                <p className="mt-2 text-sm text-muted">
                Enter the result PIN provided by the school to view {[selectedChild.lastName, selectedChild.firstName].filter(Boolean).join(' ')}'s results.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">PIN</label>
                <input
                  value={pinInput}
                  onChange={(event) => setPinInput(event.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !pinChecking && handleUnlockResults()}
                  placeholder="Enter PIN"
                  type="password"
                  maxLength={20}
                  autoFocus
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-center text-lg font-semibold text-foreground outline-none focus:border-brand"
                />
              </div>

              {pinError && (
                <div className="rounded-lg border border-[#f5c2c7] bg-[#fff5f5] p-3 flex gap-2 text-[#a61b29]">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{pinError}</p>
                </div>
              )}

              <button
                type="button"
                onClick={handleUnlockResults}
                disabled={pinChecking || !pinInput.trim()}
                className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pinChecking ? "Verifying..." : "Unlock Results"}
              </button>
            </div>

            <p className="text-center text-xs text-muted">
              Your PIN is confidential and used only to verify access.
            </p>
          </div>
        </div>
      </ParentPageShell>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl rounded-lg border border-[#f5c2c7] bg-[#fff5f5] px-4 py-3 text-sm text-[#a61b29] flex gap-3">
        <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-red-900">Error</h3>
          <p className="text-sm text-red-700 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <ParentPageShell onRefresh={loadData}>
        <div className="mx-auto max-w-7xl rounded-lg border border-dashed border-[#9ac7ea] bg-[#f3f9fe] p-14 text-center">
          <GraduationCap className="mx-auto mb-3 h-8 w-8 text-brand" />
          <p className="text-sm font-semibold text-foreground">No children linked to this account</p>
        </div>
      </ParentPageShell>
    );
  }

  return (
    <ParentPageShell onRefresh={loadData}>
      <div className="flex flex-col justify-between gap-4 border-b border-border pb-5 print:hidden sm:flex-row sm:items-end">
        <div><div className="flex items-center gap-2 text-sm font-medium text-brand"><GraduationCap className="h-4 w-4" /> Academic operations</div>
        <h1 className="mt-2 text-3xl font-bold text-foreground">Academic Results</h1>
        <p className="mt-1 text-sm text-muted">View your child&apos;s grades and assessment performance</p></div>
        <Link href="/parent" className="inline-flex items-center gap-2 self-start rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-brand hover:bg-brand-light sm:self-auto">Dashboard <ChevronRight className="h-4 w-4" /></Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-surface print:hidden">
          <div className="flex items-center gap-2 border-b border-border bg-[#f6f8fa] px-4 py-3">
          <Filter className="h-[18px] w-[18px] text-brand" />
          <h2 className="text-sm font-semibold text-foreground">Filter results</h2>
        </div>

        {pinRequired && selectedChild && (
          <div className="m-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-900">Result PIN required</p>
            <p className="mt-1 text-sm text-amber-800">Enter the result PIN provided by the school to view this child’s results.</p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input
                value={pinInput}
                onChange={(event) => setPinInput(event.target.value)}
                placeholder="Enter PIN"
                className="w-full rounded-2xl border border-amber-200 bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
              <button
                type="button"
                onClick={handleUnlockResults}
                disabled={pinChecking || !pinInput.trim()}
                className="rounded-2xl bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pinChecking ? "Checking..." : "Unlock results"}
              </button>
            </div>
            {pinError && <p className="mt-2 text-sm text-red-700">{pinError}</p>}
          </div>
        )}

        <div className="space-y-4">
          <div>
              <label className="block text-sm font-semibold text-foreground mb-3">Select Child</label>
            <div className="overflow-x-auto pb-1">
              <div className="flex min-w-[max-content] gap-2">
                {children.map((child) => (
                  <button
                    key={child.id}
                    type="button"
                    onClick={() => {
                      setSelectedChildId(child.id);
                      setSelectedTerm(null);
                      setResults([]);
                      setSelectedAssessmentId(null);
                      setReportCardData(null);
                      setPinVerifiedChildId(null);
                      setVerifiedPin(null);
                      setPinInput('');
                      setPinRequired(false);
                      setPinError(null);
                    }}
                    className={`rounded-lg border px-3 py-2 text-sm font-semibold transition-colors whitespace-nowrap ${
                      selectedChild?.id === child.id
                        ? "bg-brand text-white shadow-sm"
                        : "bg-surface text-brand border-border hover:bg-brand-light"
                    }`}
                  >
                    {[child.lastName, child.firstName].filter(Boolean).join(' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-3">Select Term</label>
            <select
              value={selectedTerm?.id || ""}
              onChange={(event) => {
                const termId = event.target.value;
                if (termId === "") {
                  setSelectedTerm(null);
                } else {
                  const term = terms.find((item) => item.id === termId);
                  setSelectedTerm(term || null);
                }
                setSelectedAssessmentId(null);
                setReportCardData(null);
              }}
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-brand"
            >
              <option value="">Latest Term</option>
              {terms.map((term) => (
                <option key={term.id} value={term.id}>
                  {term.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {selectedChild && (
        <div className="space-y-6 overflow-hidden rounded-lg border border-border bg-surface p-5 print:border-0 print:bg-transparent print:p-0 print:rounded-none print:shadow-none">
          <div className="flex items-center gap-2 border-b border-border bg-[#f6f8fa] px-4 py-3 print:hidden">
            <GraduationCap className="h-[18px] w-[18px] text-brand" />
            <div>
              <h2 className="font-semibold text-foreground">
                Results for {[selectedChild.lastName, selectedChild.firstName].filter(Boolean).join(' ')}
              </h2>
              <p className="mt-1 text-xs text-muted">{activeResultsLabel}</p>
            </div>
          </div>

          {results.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[#9ac7ea] bg-[#f3f9fe] p-14 text-center print:hidden">
              <GraduationCap className="mx-auto mb-3 h-8 w-8 text-brand" />
              <p className="text-sm text-muted">
                {statusMessage || (selectedTerm ? `No published results are available for ${selectedTerm.name} yet.` : "No published results are available yet. Results will appear here once the school publishes them.")}
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-3 print:hidden">
                {results.map((result) => (
                  <button
                    key={result.assessmentId}
                    type="button"
                    onClick={() => setSelectedAssessmentId(result.assessmentId)}
                    className={`w-full border p-4 text-left transition ${
                      selectedAssessmentId === result.assessmentId
                        ? "border-brand bg-brand/5"
                        : "border-border bg-background hover:border-brand/40"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-base font-semibold text-foreground truncate">{result.subject}</p>
                        <p className="mt-1 truncate text-sm text-muted">
                          CA {result.caScore ?? "—"} · Test {result.testScore ?? "—"} · Exam {result.examScore ?? "—"}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted" />
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3 text-sm font-medium text-brand">
                      <span>Total: {result.totalScore ?? "—"}</span>
                      <span>Grade: {result.grade || "—"}</span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="rounded-lg border border-border bg-background p-4 text-sm text-muted print:hidden">
                <p className="font-semibold text-foreground">Selected report card</p>
                <p className="mt-1">
                  {selectedAssessment
                    ? `Showing ${selectedAssessment.subject} for ${[selectedChild.lastName, selectedChild.firstName].filter(Boolean).join(' ')}`
                    : "Select an assessment to view the full report card."}
                </p>
              </div>

              {reportLoading ? (
                <div className="border border-border bg-background p-12 text-center text-muted">Loading report card...</div>
              ) : reportCardData && selectedAssessmentId ? (
                <WaecReportCard
                  assessmentId={selectedAssessmentId}
                  pupilId={selectedChildId || ""}
                  data={reportCardData}
                  onDownloadPDF={async (pupilId) => {
                    const response = await fetch(`/api/pdf-reports/${selectedAssessmentId}/${pupilId}`);
                    if (!response.ok) throw new Error("Failed to download PDF");

                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `report-${selectedAssessmentId}-${pupilId}.pdf`;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                  }}
                  onPrint={() => window.print()}
                  showDownload={false}
                />
              ) : (
                <div className="rounded-lg border border-dashed border-[#9ac7ea] bg-[#f3f9fe] p-14 text-center">
                  <GraduationCap className="mx-auto mb-3 h-8 w-8 text-brand" />
                  <p className="text-sm font-semibold text-foreground">No report card available</p>
                </div>
              )}

              <div className="flex justify-end print:hidden">
                <Link
                  href={selectedAssessmentId ? `/parent/results/${selectedAssessmentId}/${selectedChild.id}` : "/parent/results"}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-brand hover:text-brand/80"
                >
                  Open full report card
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </ParentPageShell>
  );
}
