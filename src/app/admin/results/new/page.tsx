"use client";

import { getBackendUrl } from "@/lib/backend-url";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { UserGuide } from "@/components/ui/user-guide";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

const PHASE_OPTIONS = [
  { value: "EARLY_YEARS", label: "Early Years" },
  { value: "PRIMARY", label: "Primary" },
  { value: "SECONDARY", label: "Secondary" },
];

const CREATE_ASSESSMENT_GUIDE = {
  title: "Create Assessment",
  overview:
    "Create a new assessment to collect and manage student results. Follow the workflow: create → configure components → enter scores → approve → publish.",
  steps: [
    "Enter a clear assessment name (e.g., 'Q1 Exam 2026', 'Mid-Term Test')",
    "Select the academic term for this assessment",
    "Choose the phase (Early Years, Primary, or Secondary)",
    "After creation, configure scoring components (CA, Test, Exam, etc.)",
    "Enter student marks for each component",
    "Review and approve the assessment before publishing",
    "Publish to notify parents instantly",
  ],
  commonTasks: [
    {
      title: "Use clear naming conventions",
      description:
        "Include the term and year in the assessment name for easy tracking. Example: 'Q1 Exam 2026' or 'Mid-Term Test January 2026'",
    },
    {
      title: "Select the correct phase",
      description:
        "Ensure you select the phase that matches the classes where this assessment will be used. Each phase may have different student groups.",
    },
    {
      title: "Understand the workflow",
      description:
        "Assessments start in Draft status. You must configure components and enter scores before approval. Once published, results cannot be edited.",
    },
    {
      title: "Configure components after creation",
      description:
        "After creating the assessment, you'll be guided to configure scoring components like CA (Continuous Assessment), Test, and Exam with their weights.",
    },
  ],
  faqs: [
    {
      question: "Can I edit the assessment name after creation?",
      answer:
        "Assessment names can be edited while in Draft status. Once approved or published, the name is locked for audit purposes.",
    },
    {
      question: "What happens after I create the assessment?",
      answer:
        "You'll be taken to the assessment details page where you configure the scoring components before entering student marks.",
    },
    {
      question: "Can I change the phase after creation?",
      answer:
        "Phase cannot be changed after creation. Create a new assessment if you selected the wrong phase.",
    },
    {
      question: "What's the difference between phases?",
      answer:
        "Phases organize assessments by student groups: Early Years (Nursery/Reception), Primary (Classes 1-6), and Secondary (Forms 1-6).",
    },
  ],
  videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
};

export default function NewAssessmentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [terms, setTerms] = useState<any[]>([]);
  const [currentAcademicYear, setCurrentAcademicYear] = useState<any>(null);
  const [termsLoading, setTermsLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    termId: "",
    phase: "",
  });

  // Fetch academic years and terms on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const backendUrl = getBackendUrl();
        const res = await fetch(`${backendUrl}/api/admin/academic-years`, {
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) throw new Error("Failed to fetch academic years");
        const data = await res.json();
        
        // Find current academic year
        const current = data.academicYears?.find((ay: any) => ay.isCurrent);
        setCurrentAcademicYear(current);
        
        // Set terms from current academic year
        if (current && current.terms) {
          setTerms(current.terms);
        }
      } catch (err) {
        console.error("Error fetching academic data:", err);
        setTerms([]);
      } finally {
        setTermsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const backendUrl = getBackendUrl();
      const res = await fetch(`${backendUrl}/api/admin/assessments`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to create assessment");
      }

      const assessment = await res.json();
      router.push(`/admin/results/${assessment.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const isFormValid = formData.name && formData.termId && formData.phase;

  return (
    <main className="min-h-screen pb-12">
      <div className="mx-auto max-w-7xl space-y-6 px-0 py-4 sm:px-8 sm:py-8 lg:px-12">
      {/* Sticky Header */}
      <header className="relative overflow-hidden border border-border bg-surface px-6 pb-7 pt-8 sm:px-8 sm:pb-8 sm:pt-10">
        <div className="absolute right-0 top-0 h-full w-1/3 bg-brand-light/40 [clip-path:polygon(35%_0,100%_0,100%_100%,0_100%)]" />
        <div className="relative mx-auto flex max-w-7xl items-end justify-between gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-[.16em] text-brand">Academic operations</div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Create assessment</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Set up a new assessment to collect and manage student results.</p>
          </div>
          <Link href="/admin/results">
            <Button variant="secondary" className="rounded-md border border-border bg-background text-brand">Back to Results</Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Form Column */}
        <div className="lg:col-span-2">
          <div className="border border-border bg-surface p-6">
            {termsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="mr-2 h-5 w-5 animate-spin text-brand" />
                <p className="text-muted">Loading academic year and terms...</p>
              </div>
            ) : !currentAcademicYear ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-amber-900">No Active Academic Year</h3>
                    <p className="text-sm text-amber-800 mt-1">
                      You need to set up an academic year first, then create terms (Q1, Q2, Q3, etc.) before you can create assessments.
                    </p>
                    <p className="text-xs text-amber-700 mt-2">
                      Academic years organize your school calendar into terms. Each assessment must belong to a specific term.
                    </p>
                    <Link href="/admin/settings">
                      <Button className="mt-3" type="button">
                        Set Up Academic Year
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ) : terms.length === 0 ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-amber-900">No Terms in Current Academic Year</h3>
                    <p className="text-sm text-amber-800 mt-1">
                      Academic Year: <span className="font-medium">{currentAcademicYear?.name}</span>
                    </p>
                    <p className="text-sm text-amber-800 mt-2">
                      Create terms (Q1, Q2, Q3, etc.) before creating assessments.
                    </p>
                    <Link href="/admin/settings">
                      <Button className="mt-3" type="button">
                        Create Terms for {currentAcademicYear?.name}
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Academic Year Info */}
                  <div className="border border-brand/20 bg-brand/5 p-4">
                  <p className="text-xs font-medium text-brand uppercase tracking-wide">Active Academic Year</p>
                  <p className="text-lg font-semibold text-brand mt-1">{currentAcademicYear?.name}</p>
                  <p className="text-xs text-brand mt-2">
                    All assessments created here will be for this academic year. 
                    {currentAcademicYear?.isCurrent && " This is your current active year."}
                  </p>
                </div>

                {/* Error Alert */}
                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                    <div className="flex gap-3">
                      <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                )}

                {/* Assessment Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-foreground">
                    Assessment Name *
                  </label>
                  <p className="mt-1 text-xs text-muted">
                    Use a clear naming convention including the term and year.
                  </p>
                  <input
                    id="name"
                    type="text"
                    name="name"
                    placeholder="e.g., Q1 Exam 2026, Mid-Term Test"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-brand transition"
                  />
                </div>

                {/* Term Selection */}
                <div>
                  <label htmlFor="termId" className="block text-sm font-medium text-foreground">
                    Academic Term *
                  </label>
                  <p className="mt-1 text-xs text-muted">
                    Select the term this assessment belongs to.
                  </p>
                  <select
                    id="termId"
                    name="termId"
                    value={formData.termId}
                    onChange={handleInputChange}
                    required
                    className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand transition"
                  >
                    <option value="">Select a term...</option>
                    {terms.map((term) => (
                      <option key={term.id} value={term.id}>
                        {term.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Phase Selection */}
                <div>
                  <label htmlFor="phase" className="block text-sm font-medium text-foreground">
                    Phase *
                  </label>
                  <p className="mt-1 text-xs text-muted">
                    Choose the phase level for this assessment.
                  </p>
                  <select
                    id="phase"
                    name="phase"
                    value={formData.phase}
                    onChange={handleInputChange}
                    required
                    className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand transition"
                  >
                    <option value="">Select a phase...</option>
                    {PHASE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Form Actions */}
                <div className="flex gap-3 pt-4 border-t border-border">
                  <Button
                    type="submit"
                    disabled={loading || !isFormValid}
                    className="flex-1"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Create Assessment
                      </>
                    )}
                  </Button>
                  <Link href="/admin/results" className="flex-1">
                    <Button type="button" variant="secondary" className="w-full">
                      Cancel
                    </Button>
                  </Link>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Sidebar - Help & Guide */}
        <div className="lg:col-span-1">
          <div className="border border-border bg-surface p-6">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-brand" />
              How It Works
            </h3>
            <div className="mt-4 space-y-4 text-xs text-muted">
                  <div className="border border-brand/20 bg-background p-3">
                <p className="font-medium text-foreground mb-2">System Structure</p>
                <div className="space-y-2 text-xs">
                  <div className="flex gap-2">
                    <span className="text-brand font-bold">1.</span>
                    <span><strong>Academic Year</strong><br/><span className="text-muted">{currentAcademicYear?.name || 'Not set'}</span></span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-brand font-bold">2.</span>
                    <span><strong>Terms</strong><br/><span className="text-muted">Q1, Q2, Q3 (select below)</span></span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-brand font-bold">3.</span>
                    <span><strong>Assessments</strong><br/><span className="text-muted">Creating now (this form)</span></span>
                  </div>
                </div>
              </div>

              <div>
                <p className="font-medium text-foreground mb-1">After Creation</p>
                <p>
                  You'll configure scoring components (CA, Test, Exam) and enter student marks.
                </p>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">Status Workflow</p>
                <p>
                  Draft → Configure → Enter Scores → Approve → Publish to parents
                </p>
              </div>
              <div className="pt-2 border-t border-border/50">
                <p className="font-medium text-foreground mb-2">Best Practices</p>
                <ul className="space-y-1">
                  <li>• Use consistent naming (include year)</li>
                  <li>• Select the correct phase</li>
                  <li>• Configure before entering scores</li>
                  <li>• Review before publishing</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Learning Guide */}
          <div className="mt-6">
            <UserGuide guide={CREATE_ASSESSMENT_GUIDE} />
          </div>
        </div>
      </div>
      </div>
    </main>
  );
}
