"use client";

import Link from "next/link";
import { useEffect, useState, use } from "react";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, FileText } from "lucide-react";
import { WaecReportCard } from "@/components/teacher/waec-report-card";
import { getTeacherDashboard } from "@/lib/teacher-utils";
import AdminSkeleton from "@/components/ui/skeleton";
import TeacherPageHeader from "@/components/teacher-page-header";

interface Assessment {
  id: string;
  name: string;
  phase: string;
  status: string;
  term?: { name: string; };
  results: Array<{
    pupilId: string;
    pupilName: string;
    admissionNo: string;
    caScore: number | null;
    testScore: number | null;
    examScore: number | null;
    totalScore: number | null;
    grade: string | null;
  }>;
}

export default function TeacherReportsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [studentFilter, setStudentFilter] = useState("");
  const [reportCardData, setReportCardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSchoolId = async () => {
      try {
        const dashboard = await getTeacherDashboard();
        setSchoolId(dashboard.school.id);
      } catch (err) {
        console.error("Failed to load teacher school ID:", err);
      }
    };

    const fetchAssessment = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/teacher/assessments/${id}`);
        if (!response.ok) throw new Error("Failed to fetch assessment");
        const data = await response.json();
        setAssessment(data.assessment);

        // Auto-select first student if available
        if (data.assessment.results && data.assessment.results.length > 0) {
          setSelectedStudent(data.assessment.results[0].pupilId);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchSchoolId();
    fetchAssessment();
  }, [id]);

  // Load report card data when student is selected
  useEffect(() => {
    if (!selectedStudent) return;

    const loadReportCard = async () => {
      try {
        setReportLoading(true);
        const params = new URLSearchParams();
        // Ask backend to prefer the configured signatory/principal when resolving
        // so the report includes signatory `title` when available.
        params.set('signatoryMode', 'principal');
        const response = await fetch(
          `/api/report-cards/${id}/${selectedStudent}?${params.toString()}`,
          {
            credentials: 'include',
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMsg = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
          console.error("Backend error:", errorMsg);
          throw new Error(errorMsg);
        }

        const data = await response.json();
        console.log("Report card data loaded:", data);
        
        // Validate data structure
        if (data && typeof data === 'object') {
          setReportCardData(data);
        } else {
          console.error("Invalid report card data structure:", data);
          setReportCardData(null);
        }
      } catch (err) {
        console.error("Error loading report card:", err);
        setReportCardData(null);
      } finally {
        setReportLoading(false);
      }
    };

    loadReportCard();
  }, [id, selectedStudent]);

  if (loading) {
    return <AdminSkeleton />;
  }

  if (error || !assessment) {
    return (
      <div className="mx-auto max-w-7xl px-3 py-4">
        <Link
          href={`/teacher/results/${id}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Assessment
        </Link>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{error || "Assessment not found"}</p>
        </div>
      </div>
    );
  }

  const isPublished = assessment.status === "PUBLISHED";
  
  // Deduplicate students (results may contain one entry per subject)
  const uniqueStudents = Array.from(
    new Map(assessment.results.map((r) => [r.pupilId, r])).values()
  );

  const filteredStudents = uniqueStudents.filter((student) => {
    const filter = studentFilter.trim().toLowerCase();
    if (!filter) return true;
    return (
      student.pupilName.toLowerCase().includes(filter) ||
      (student.admissionNo?.toLowerCase().includes(filter) ?? false)
    );
  });

  const handleDownloadPDF = async (pupilId: string) => {
    try {
      const headers: HeadersInit = {};
      if (schoolId) {
        headers["x-school-id"] = schoolId;
      }

      const params = new URLSearchParams();
      params.set('signatoryMode', 'principal');
      const response = await fetch(`/api/pdf-reports/${id}/${pupilId}?${params.toString()}`, {
        headers,
      });
      if (!response.ok) throw new Error("Failed to download PDF");

      const blob = await response.blob();
      const disposition = response.headers.get("content-disposition") || "";
      const filenameMatch = disposition.match(/filename=\"?([^\";]+)\"?/i);
      const filename = filenameMatch?.[1] || `report-${assessment.name}-${pupilId}.pdf`;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Failed to download PDF:", err);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-3 py-4 print:max-w-none print:p-0">
      <Link
        href={`/teacher/results/${id}`}
        className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline mb-4 print:hidden"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Assessment
      </Link>

      <div className="mb-6 print:hidden">
        <TeacherPageHeader icon={FileText} title="Report cards" description={`Generate and review professional report cards for ${assessment.name}.`} count={`${uniqueStudents.length} students`}>
          <Badge variant={isPublished ? "success" : "secondary"} className="px-3 py-2">{isPublished ? "Published" : assessment.status}</Badge>
        </TeacherPageHeader>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 print:block print:space-y-0">
        {/* Student Selector Sidebar */}
          <div className="lg:col-span-1 print:hidden">
          <div className="sticky top-4 border border-border bg-surface">
            <div className="border-b border-border bg-background px-5 py-4"><p className="text-[11px] font-bold uppercase tracking-[.14em] text-brand">Report queue</p><h2 className="mt-1 text-lg font-semibold text-foreground">Select a student</h2><p className="mt-1 text-xs text-muted">Choose a learner to preview or download their report card.</p></div>
            <div className="p-5">
            <label className="block text-xs font-semibold text-gray-600 mb-2" htmlFor="student-search">
              Search student
            </label>
            <input
              id="student-search"
              type="search"
              value={studentFilter}
              onChange={(event) => setStudentFilter(event.target.value)}
              placeholder="Search by name or admission"
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-foreground shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10 mb-4"
            />

            <label className="block text-xs font-semibold text-gray-600 mb-2" htmlFor="student-select">
              Select student
            </label>
            <select
              id="student-select"
              value={selectedStudent || ""}
              onChange={(event) => setSelectedStudent(event.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
            >
              {filteredStudents.length === 0 ? (
                <option value="">No matching students</option>
              ) : (
                filteredStudents.map((student) => (
                  <option key={student.pupilId} value={student.pupilId}>
                    {student.pupilName} — {student.admissionNo}
                  </option>
                ))
              )}
            </select>
            <div className="mt-4 flex items-center justify-between border-t border-border pt-4 text-xs text-muted"><span>Available reports</span><span className="font-semibold text-foreground">{filteredStudents.length}</span></div>
          </div>
        </div>
        </div>

        {/* Report Card Viewer */}
        <div className="lg:col-span-3 print:block print:w-full">
          {reportLoading ? (
            <div className="text-center py-12 text-muted">Loading report card...</div>
          ) : reportCardData && selectedStudent ? (
            <WaecReportCard
              assessmentId={id}
              pupilId={selectedStudent}
              data={reportCardData}
              onDownloadPDF={handleDownloadPDF}
              showDownload={false}
              onPrint={() => window.print()}
            />
          ) : (
            <div className="rounded-lg border border-border bg-surface p-8 text-center">
              <FileText className="w-12 h-12 text-muted mx-auto mb-3 opacity-50" />
              <p className="text-muted">No report card available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
