"use client";

import { useEffect, useState, useMemo } from "react";
import AdminSkeleton from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { AlertCircle, Search, ChevronLeft, ChevronRight, Download } from "lucide-react";

interface StrugglingStudent {
  name: string;
  score: number;
}

interface AnalyticsData {
  schoolAnalytics: {
    strugglingStudents: StrugglingStudent[];
  };
}

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

export default function StrugglingStudentsPage() {
  const router = useRouter();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscriptionBlocked, setSubscriptionBlocked] = useState<{ reason: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/admin/analytics/data", { credentials: "include" });
        if (!response.ok) {
          // Check for subscription blocking
          if (response.status === 403) {
            const errorData = await response.json().catch(() => null);
            if (errorData?.code === 'SUBSCRIPTION_INACTIVE') {
              setSubscriptionBlocked({ reason: errorData.reason || 'Your school subscription is not active' });
              setLoading(false);
              return;
            }
          }
          throw new Error(`Failed to fetch analytics: ${response.status}`);
        }
        const data = await response.json();
        setAnalytics(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching analytics:", err);
        setError(err instanceof Error ? err.message : "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const filteredStudents = useMemo(() => {
    if (!analytics?.schoolAnalytics?.strugglingStudents) return [];
    let filtered = [...analytics.schoolAnalytics.strugglingStudents];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s => s.name.toLowerCase().includes(query));
    }

    return filtered.sort((a, b) => (a.score || 0) - (b.score || 0));
  }, [analytics, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / itemsPerPage));
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AdminSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-300 bg-red-50 p-4 flex gap-3">
        <div>
          <h3 className="font-semibold text-red-900">Error</h3>
          <p className="text-sm text-red-700 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-12 text-center">
        <p className="text-slate-600">No analytics data available</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen pb-12">
    <div className="mx-auto max-w-7xl space-y-6 px-0 py-4 sm:px-8 sm:py-8 lg:px-12">
      {/* Header */}
      <header className="relative overflow-hidden border border-border bg-surface px-6 pb-7 pt-8 sm:px-8 sm:pb-8 sm:pt-10">
      <div className="absolute right-0 top-0 h-full w-1/3 bg-brand-light/40 [clip-path:polygon(35%_0,100%_0,100%_100%,0_100%)]" />
      <div className="relative flex items-end justify-between">
        <div>
          <button onClick={() => router.back()} className="flex items-center gap-2 font-medium text-sm mb-2" style={{ color: '#0A66C2' }}>
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
          <div className="text-xs font-bold uppercase tracking-[.16em] text-brand">Student support analytics</div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Students needing support</h1>
          <p className="mt-2 text-sm leading-6 text-muted">Students who may benefit from targeted support and intervention.</p>
        </div>
      </div>
      </header>

      {/* Alert Banner */}
      <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 flex gap-3">
        <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-orange-900">Early Intervention</h3>
          <p className="text-sm text-orange-700 mt-1">These students have shown lower academic performance and may benefit from targeted support and personalized attention.</p>
        </div>
      </div>

      {/* Search and Controls */}
      <div className="border border-border bg-surface p-6">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-900 mb-2">Search Students</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by student name..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">Rows per page</label>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value) as typeof PAGE_SIZE_OPTIONS[number]);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              {PAGE_SIZE_OPTIONS.map(size => (
                <option key={size} value={size}>{size} per page</option>
              ))}
            </select>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Struggling Students List */}
      <div className="border border-border bg-surface p-6">
        <div className="space-y-3">
          {paginatedStudents.length > 0 ? (
            paginatedStudents.map((student, idx) => {
              const actualIndex = (currentPage - 1) * itemsPerPage + idx + 1;
              const severity = student.score ? 
                (student.score < 40 ? 'Critical' : student.score < 50 ? 'High' : 'Medium') : 
                'Unknown';
              const severityColor = student.score ? 
                (student.score < 40 ? 'bg-red-100 text-red-800' : student.score < 50 ? 'bg-orange-100 text-orange-800' : 'bg-yellow-100 text-yellow-800') : 
                'bg-slate-100 text-slate-800';

              return (
                <div
                  key={idx}
                  className="flex items-center justify-between p-4 border border-orange-100 rounded-lg bg-gradient-to-r from-orange-50 to-transparent hover:bg-gradient-to-r hover:from-orange-100 hover:to-transparent transition"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-orange-200 flex items-center justify-center text-lg font-bold text-orange-700 flex-shrink-0">
                      ⚠
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{student.name}</p>
                      <p className="text-xs text-slate-600 mt-1">Needs academic intervention</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${severityColor}`}>
                      {severity}
                    </span>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-orange-600">{student.score?.toFixed(1) || '—'}</p>
                      <p className="text-xs text-slate-600">Score</p>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600">No struggling students found</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 pt-6 border-t border-slate-200 flex items-center justify-between">
            <p className="text-sm text-slate-600">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredStudents.length)} of {filteredStudents.length}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <div className="flex items-center gap-2">
                {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === pageNum
                          ? 'bg-orange-600 text-white'
                          : 'border border-slate-200 text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                {totalPages > 5 && (
                  <>
                    <span className="text-slate-600">...</span>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors border border-slate-200 text-slate-600 hover:text-slate-900`}
                    >
                      {totalPages}
                    </button>
                  </>
                )}
              </div>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
    </main>
  );
}
