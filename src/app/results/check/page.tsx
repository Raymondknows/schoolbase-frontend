"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertCircle, ChevronRight, Filter, GraduationCap, Lock } from "lucide-react";
import { Building2, ShieldCheck } from "lucide-react";
import { AppLogo } from "@/components/app-logo";
import { ErrorModal } from "@/components/ui/error-modal";
import { getBackendUrl } from "@/lib/backend-url";
import ParentPageShell from "@/components/parent-page-shell";
import { WaecReportCard } from "@/components/teacher/waec-report-card";
import { ContextualAdSlot } from "@/components/login-page-ad-slot";

interface Result {
  id: string;
  subject: string;
  assessmentId: string;
  caScore?: number;
  testScore?: number;
  examScore?: number;
  totalScore?: number;
  grade?: string;
  termId?: string | null;
  term?: string | null;
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

function ResultWorkspace({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background px-4 py-6 sm:px-8 sm:py-10">
      <div className="mx-auto grid max-w-6xl overflow-hidden border border-border bg-surface lg:grid-cols-[.8fr_1.2fr]">
        <section className="relative hidden overflow-hidden border-r border-border bg-brand/5 p-10 lg:flex lg:flex-col lg:justify-between">
          <div className="absolute right-0 top-0 h-2/3 w-2/3 bg-brand-light/50 [clip-path:polygon(35%_0,100%_0,100%_100%,0_60%)]" />
          <div className="relative">
            <AppLogo href="/" size="lg" />
            <p className="mt-16 text-xs font-bold uppercase tracking-[.18em] text-brand">SchoolBase results</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight text-foreground">Access your school results.</h2>
            <p className="mt-4 max-w-sm text-sm leading-7 text-muted">Use the school code, admission number, and result PIN provided by your school to view published academic results.</p>
          </div>
          <div className="relative grid gap-3 text-sm text-muted">
            <div className="flex items-center gap-3 border border-border bg-surface px-4 py-3"><Building2 className="h-4 w-4 text-brand" /> Built for school communities</div>
            <div className="flex items-center gap-3 border border-border bg-surface px-4 py-3"><ShieldCheck className="h-4 w-4 text-brand" /> PIN-protected access</div>
          </div>
        </section>
        <section className="p-6 sm:p-10">
          <div className="mb-8 flex justify-center lg:hidden"><AppLogo href="/" size="lg" /></div>
          {children}
          <div className="mt-6"><ContextualAdSlot path="/results/check" compact /></div>
        </section>
      </div>
    </div>
  );
}

export default function PublicResultCheckPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const [selectedTerm, setSelectedTerm] = useState<Term | null>(null);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string | null>(null);
  const [reportCardData, setReportCardData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinChecking, setPinChecking] = useState(false);
  const [pinVerifiedChildId, setPinVerifiedChildId] = useState<string | null>(null);
  const [verifiedPin, setVerifiedPin] = useState<string | null>(null);
  const [pinRequired, setPinRequired] = useState(false);
  const [schoolCode, setSchoolCode] = useState("");
  const [admissionNo, setAdmissionNo] = useState("");
  const [pin, setPin] = useState("");
  const [termId, setTermId] = useState("");
  const [reportCards, setReportCards] = useState<any[]>([]);
  const [student, setStudent] = useState<any>(null);
  const [school, setSchool] = useState<any>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const backendUrl = getBackendUrl();
  const selectedResult = results.find((result) => result.assessmentId === selectedAssessmentId) ?? null;
  const activeResultsLabel = selectedTerm
    ? `${selectedTerm.name}${selectedResult?.subject ? ` • ${selectedResult.subject}` : ""}`
    : selectedResult?.subject || "Results";

  const loadData = async () => {
    setError(null);
    setLoading(false);
    setResults([]);
    setReportCards([]);
    setReportCardData(null);
    setSelectedAssessmentId(null);
    setSelectedTerm(null);
    setTerms([]);
    setStudent(null);
    setSchool(null);
    setChildren([]);
    setSelectedChildId(null);
    setStatusMessage(null);
    setPinRequired(false);
    setPinError(null);
    setPinInput("");
    setPinVerifiedChildId(null);
    setVerifiedPin(null);
    setPinChecking(false);
    setSchoolCode("");
    setAdmissionNo("");
    setPin("");
    setTermId("");
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setDownloadError(null);
    setPinRequired(false);
    setPinError(null);
    setResults([]);
    setReportCards([]);
    setReportCardData(null);
    setSelectedAssessmentId(null);

    try {
      const response = await fetch(`${backendUrl}/api/results/check`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schoolCode, admissionNo, pin, termId }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (data?.requiresPin) {
          const nextStudent = data.student || null;
          const nextSchool = data.school || null;

          if (nextStudent && nextSchool) {
            setStudent(nextStudent);
            setSchool(nextSchool);
            setPinRequired(true);
            setPinInput("");
            setLoading(false);
            return;
          }
        }

        if (typeof data?.error === "string" && /pin|expired/i.test(data.error)) {
          setPinError(data.error);
          setPinRequired(true);
          setStudent(data.student || student);
          setSchool(data.school || school);
          setLoading(false);
          return;
        }

        throw new Error(data?.error || "Unable to check results");
      }

      const nextResults: Result[] = data.results || [];
      const nextReportCards = data.reportCards || [];
      const nextTerms = nextResults.reduce<Term[]>((acc, item) => {
        const termIdValue = item.termId ?? item.id ?? null;
        const termName = item.term ?? "Latest Term";
        if (!termIdValue) return acc;
        const exists = acc.some((existing) => existing.id === termIdValue || existing.name === termName);
        if (!exists) {
          acc.push({ id: termIdValue, name: termName });
        }
        return acc;
      }, []);

      const nextStudent = data.student || null;
      const nextSchool = data.school || null;
      const nextChild: Child = {
        id: nextStudent?.id || `${schoolCode}-${admissionNo}`,
        firstName: nextStudent?.firstName || nextStudent?.name || admissionNo,
        lastName: nextStudent?.lastName || "",
        admissionNo: nextStudent?.admissionNo || admissionNo,
      };

      setChildren((current) => {
        const exists = current.some((child) => child.id === nextChild.id || child.admissionNo === nextChild.admissionNo);
        if (exists) {
          return current;
        }
        return [nextChild, ...current];
      });
      setSelectedChildId(nextChild.id);
      setResults(nextResults);
      setReportCards(nextReportCards);
      setTerms(nextTerms);
      setStudent(nextStudent);
      setSchool(nextSchool);

      const nextSelectedTerm = data.term
        ? { id: data.term.id, name: data.term.name, sortOrder: data.term.sortOrder }
        : nextTerms[0] ?? null;
      setSelectedTerm(nextSelectedTerm);
      setTermId(data.term?.id || "");

      const firstAssessmentId = nextResults[0]?.assessmentId ?? null;
      const matchedReportCard = nextReportCards.find((card: any) => card.assessmentId === firstAssessmentId) || nextReportCards[0] || null;
      setSelectedAssessmentId(firstAssessmentId);
      setReportCardData(matchedReportCard);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to check results");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async (pupilId: string) => {
    if (!selectedAssessmentId || !pupilId || !school?.id) {
      setDownloadError("Report card details are not available yet.");
      return;
    }

    try {
      setDownloadError(null);
      const response = await fetch(`/api/pdf-reports/${selectedAssessmentId}/${pupilId}`, {
        credentials: "include",
        headers: {
          "x-school-id": school.id,
        },
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}));
        throw new Error(errorPayload?.error || "Failed to download PDF");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      const studentName = [student?.lastName, student?.firstName].filter(Boolean).join(" ").trim() || student?.admissionNo || "student";
      const termName = selectedTerm?.name || "results";
      const safeStudentName = studentName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const safeTermName = termName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const fileName = `${safeStudentName || "student"}-${safeTermName || "results"}.pdf`;
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to download PDF";
      setDownloadError(message);
      console.error("PDF download failed:", err);
    }
  };

  const handleUnlockResults = async () => {
    if (!pinInput.trim() || !student) {
      setPinError("Please enter a valid PIN");
      return;
    }

    setPinChecking(true);
    setPinError(null);

    try {
      // For the public page, we verify PIN by re-sending the original check request
      // with the updated PIN from the modal
      const response = await fetch(`${backendUrl}/api/results/check`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          schoolCode, 
          admissionNo, 
          pin: pinInput, 
          termId 
        }),
      });

      const data = await response.json().catch(() => ({}));
      
      if (!response.ok) {
        // If still getting PIN error, show it
        if (data?.error?.includes("PIN")) {
          setPinError(data.error);
        } else {
          setPinError("Unable to verify PIN. Please try again.");
        }
        return;
      }

      // PIN verified successfully - update the pin state and clear the modal
      setPin(pinInput);
      setPinRequired(false);
      setPinInput("");
      setVerifiedPin(pinInput);
      setPinVerifiedChildId(student.id);
      
      // Update results with the newly fetched data
      const nextResults: Result[] = data.results || [];
      const nextReportCards = data.reportCards || [];
      setStatusMessage(typeof data?.message === 'string' ? data.message : null);
      setResults(nextResults);
      setReportCards(nextReportCards);
      
      const firstAssessmentId = nextResults[0]?.assessmentId ?? null;
      const matchedReportCard = nextReportCards.find((card: any) => card.assessmentId === firstAssessmentId) || nextReportCards[0] || null;
      setSelectedAssessmentId(firstAssessmentId);
      setReportCardData(matchedReportCard);
    } catch (err) {
      setPinError(err instanceof Error ? err.message : "Unable to verify PIN");
    } finally {
      setPinChecking(false);
    }
  };

  if (loading) {
    return (
      <ParentPageShell onRefresh={loadData}>
        <ResultWorkspace><div className="space-y-6">
          <div className="space-y-2">
            <div className="h-10 w-48 bg-slate-200 rounded-lg animate-pulse"></div>
            <div className="h-5 w-64 bg-slate-100 rounded animate-pulse"></div>
          </div>
          <div className="border border-border bg-white p-5 space-y-4 animate-pulse">
            <div className="h-5 w-32 bg-slate-200 rounded"></div>
            {[1, 2].map((i) => (
              <div key={i} className="h-10 w-24 bg-slate-100 rounded inline-block mr-2"></div>
            ))}
          </div>
          {[1, 2].map((i) => (
            <div key={i} className="border border-border bg-white p-5 space-y-3 animate-pulse">
              <div className="h-5 w-40 bg-slate-200 rounded"></div>
              <div className="h-16 w-full bg-slate-100 rounded"></div>
            </div>
          ))}
        </div></ResultWorkspace>
      </ParentPageShell>
    );
  }

  if (error) {
    return (
      <ParentPageShell onRefresh={loadData}>
        <ErrorModal
          isOpen={Boolean(error)}
          onClose={() => setError(null)}
          title="Error"
          message={error}
          type="error"
          confirmLabel="Close"
        />
        <ResultWorkspace><div className="border border-border bg-white p-8 text-center"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">RESULT CHECKER</p><h1 className="mt-3 text-2xl font-semibold text-foreground">We couldn&apos;t load results</h1><p className="mt-2 text-sm text-muted">Close this message and try the check again.</p></div></ResultWorkspace>
      </ParentPageShell>
    );
  }

  if (pinRequired && student && school) {
    return (
      <ParentPageShell onRefresh={loadData}>
        <ErrorModal
          isOpen={Boolean(pinError)}
          onClose={() => setPinError(null)}
          title="Invalid PIN"
          message={pinError || "The supplied PIN is invalid or has expired."}
          type="error"
          confirmLabel="Close"
        />
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-foreground/40 p-4">
          <div className="border border-border bg-white shadow-xl max-w-md w-full p-8 space-y-6">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-brand-light flex items-center justify-center mb-4">
                <Lock className="w-8 h-8 text-brand" />
              </div>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">PIN Required</h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                Enter the result PIN provided by the school to view the results for {[student.lastName, student.firstName].filter(Boolean).join(" ") || "this student"}.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">PIN</label>
                <input
                  value={pinInput}
                  onChange={(event) => setPinInput(event.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !pinChecking && handleUnlockResults()}
                  placeholder="Enter PIN"
                  type="password"
                  maxLength={20}
                  autoFocus
                  className="w-full border border-border bg-background px-4 py-3 text-center text-lg font-semibold text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                />
              </div>

              <button
                type="button"
                onClick={handleUnlockResults}
                disabled={pinChecking || !pinInput.trim()}
                className="w-full bg-brand px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
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

  const selectedAssessment = results.find((result) => result.assessmentId === selectedAssessmentId) || null;
  const selectedChild = children.find((child) => child.id === selectedChildId) || null;
  const visibleResults = results.reduce<Result[]>((acc, result) => {
    const exists = acc.some((item) => item.assessmentId === result.assessmentId || item.subject === result.subject);
    if (!exists) {
      acc.push(result);
    }
    return acc;
  }, []);

  return (
    <ParentPageShell onRefresh={loadData}>
      <ErrorModal
        isOpen={Boolean(pinError)}
        onClose={() => setPinError(null)}
        title="Invalid PIN"
        message={pinError || "The supplied PIN is invalid or has expired."}
        type="error"
        confirmLabel="Close"
      />
      <ResultWorkspace><div className="space-y-4 print:space-y-0">
        <div className="border-b border-border pb-6 print:hidden">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">RESULT CHECKER</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-foreground">Academic results</h1>
          <p className="mt-2 text-sm text-muted">Check a student&apos;s published results with a school code, admission number, and PIN.</p>
        </div>

        {children.length === 0 && (
          <div className="w-full print:hidden">
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <Filter className="h-5 w-5 text-brand" />
              <h2 className="font-semibold text-foreground">Check Results</h2>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="mt-1">
                  <label className="mb-2 block text-sm font-medium text-foreground">School Code</label>
                  <input
                    id="results-school-code"
                    name="results-school-code"
                    value={schoolCode}
                    onChange={(event) => setSchoolCode(event.target.value)}
                    placeholder="Enter school slug or initials"
                    autoComplete="off"
                    data-lpignore="true"
                    className="w-full border border-border bg-background px-3 py-3 text-sm text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                    required
                  />
                </div>
                <div className="mt-1">
                  <label className="mb-2 block text-sm font-medium text-foreground">Admission Number</label>
                  <input
                    id="results-admission-number"
                    name="results-admission-number"
                    value={admissionNo}
                    onChange={(event) => setAdmissionNo(event.target.value)}
                    placeholder="Enter admission number"
                    autoComplete="off"
                    data-lpignore="true"
                    className="w-full border border-border bg-background px-3 py-3 text-sm text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="mt-1">
                  <label className="mb-2 block text-sm font-medium text-foreground">Term</label>
                  <select
                    id="results-term"
                    name="results-term"
                    value={termId}
                    onChange={(event) => setTermId(event.target.value)}
                    autoComplete="off"
                    className="w-full border border-border bg-background px-3 py-3 text-sm text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                  >
                    <option value="">Latest Term</option>
                    {terms.map((term) => (
                      <option key={term.id} value={term.id}>
                        {term.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mt-1">
                  <label className="mb-2 block text-sm font-medium text-foreground">PIN</label>
                  <input
                    id="results-pin"
                    name="results-pin"
                    value={pin}
                    onChange={(event) => setPin(event.target.value)}
                    placeholder="Enter result PIN"
                    type="password"
                    maxLength={20}
                    autoComplete="new-password"
                    data-lpignore="true"
                    className="w-full border border-border bg-background px-3 py-3 text-sm text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                  />
                </div>
              </div>

              <div className="mt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {loading ? "Checking..." : "Check Results"}
                </button>
              </div>
            </form>
          </div>
        )}

        {children.length > 0 && (
          <div className="mx-auto mt-6 w-full max-w-7xl">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
              <div className="w-full shrink-0 xl:max-w-[340px] print:hidden">
                <div className="border border-border bg-white p-5 shadow-sm transition-shadow">
                  <div className="mb-4 flex items-center gap-3">
                    <GraduationCap className="h-5 w-5 text-brand" />
                    <h2 className="font-semibold text-foreground">Select Student</h2>
                  </div>
                  <div className="mb-4 border border-border bg-[#f6faff] px-3 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">End of Term Examination</p>
                    <p className="mt-1 text-sm font-semibold text-foreground">{activeResultsLabel}</p>
                  </div>
                  <div className="overflow-x-auto pb-1">
                    <div className="flex gap-2 min-w-[max-content]">
                      {children.map((child) => (
                        <button
                          key={child.id}
                          type="button"
                          onClick={() => {
                            setSelectedChildId(child.id);
                            const syncedStudent = student && student.id === child.id ? student : null;
                            if (syncedStudent) {
                              setStudent(syncedStudent);
                              setSchool(school);
                            } else {
                              setStudent(null);
                              setSchool(null);
                              setResults([]);
                              setReportCards([]);
                              setReportCardData(null);
                              setSelectedAssessmentId(null);
                            }
                          }}
                          className={`border px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                            selectedChild?.id === child.id
                              ? "border-brand bg-brand text-white shadow-sm"
                              : "border-border bg-background text-foreground hover:border-brand"
                          }`}
                        >
                          {[child.lastName, child.firstName].filter(Boolean).join(" ")} ({child.admissionNo || "—"})
                        </button>
                      ))}
                    </div>
                  </div>

                  {selectedChild && (
                    <div className="mt-4 border border-border bg-[#f6faff] p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand/10 text-sm font-semibold text-brand">
                          {`${selectedChild.firstName?.[0] || "S"}${selectedChild.lastName?.[0] || ""}`.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground">
                            {[selectedChild.lastName, selectedChild.firstName].filter(Boolean).join(" ")}
                          </p>
                          <p className="mt-1 text-xs text-muted">Admission No: {selectedChild.admissionNo || "—"}</p>
                          <p className="text-xs text-muted">Class: {student?.className || "—"}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {student && (
                <div className="min-w-0 flex-1 print:max-w-full">
                  <div className="space-y-6 border border-border bg-white p-5 shadow-sm transition-shadow print:border-0 print:bg-transparent print:p-0 print:rounded-none print:shadow-none print:space-y-0">
                    {visibleResults.length === 0 ? (
                      <div className="border border-border bg-background p-10 text-center print:hidden">
                        <GraduationCap className="mx-auto mb-3 h-12 w-12 text-brand" />
                        <p className="text-muted">
                          {statusMessage || 'No published results are available yet for this student. Results will appear here once the school publishes them.'}
                        </p>
                      </div>
                    ) : (
                      <>
                        {downloadError ? (
                          <div className="border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 print:hidden">
                            {downloadError}
                          </div>
                        ) : null}

                        {reportLoading ? (
                          <div className="py-12 text-center text-muted">Loading report card...</div>
                        ) : reportCardData && selectedAssessmentId ? (
                          <WaecReportCard
                            assessmentId={selectedAssessmentId}
                            pupilId={student.id}
                            data={reportCardData}
                            onDownloadPDF={handleDownloadPdf}
                            onPrint={() => window.print()}
                          />
                        ) : (
                          <div className="border border-border bg-background p-12 text-center">
                            <GraduationCap className="mx-auto mb-3 h-12 w-12 text-brand" />
                            <p className="text-muted">No report card available</p>
                          </div>
                        )}

                        <div className="flex justify-end print:hidden">
                          <Link
                            href={selectedAssessmentId ? `/parent/results/${selectedAssessmentId}/${student.id}` : "/parent/results"}
                            className="inline-flex items-center gap-2 text-sm font-semibold text-brand hover:text-brand/80"
                          >
                            Open full report card
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div></ResultWorkspace>
    </ParentPageShell>
  );
}
