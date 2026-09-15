"use client";

import { useEffect, useState, useMemo } from "react";
import AdminSkeleton from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { Users, Search, ChevronLeft, ChevronRight, Download } from "lucide-react";

interface Class {
  id: string;
  name: string;
  phase: string; 
}

interface AnalyticsData {
  classes: Class[];
}

const PHASE_CONFIG = {
  EARLY_YEARS: { label: "Early Years", color: "bg-purple-100 text-purple-800" },
  PRIMARY: { label: "Primary", color: "bg-blue-100 text-blue-800" },
  SECONDARY: { label: "Secondary", color: "bg-green-100 text-green-800" },
  ALL: { label: "All Phases", color: "bg-gray-100 text-gray-800" },
};

const PHASE_ORDER = ["ALL", "EARLY_YEARS", "PRIMARY", "SECONDARY"];
const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

export default function ClassesPage() {
  const router = useRouter();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscriptionBlocked, setSubscriptionBlocked] = useState<{ reason: string } | null>(null);
  const [activePhase, setActivePhase] = useState("ALL");
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

  const filteredClasses = useMemo(() => {
    if (!analytics) return [];
    let filtered = analytics.classes;

    if (activePhase !== "ALL") {
      filtered = filtered.filter(c => c.phase === activePhase);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c => c.name.toLowerCase().includes(query));
    }

    return filtered;
  }, [analytics, activePhase, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredClasses.length / itemsPerPage));
  const paginatedClasses = filteredClasses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePhaseChange = (phase: string) => {
    setActivePhase(phase);
    setCurrentPage(1);
  };

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

  const phaseStats = PHASE_ORDER.map(phase => {
    const classCount = phase === "ALL" 
      ? analytics.classes.length 
      : analytics.classes.filter(c => c.phase === phase).length;
    return { phase, count: classCount };
  });

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
          <div className="text-xs font-bold uppercase tracking-[.16em] text-brand">Academic analytics</div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">All classes</h1>
          <p className="mt-2 text-sm leading-6 text-muted">Complete list of classes across all phases.</p>
        </div>
      </div>
      </header>

      {/* Phase Tabs */}
      <div className="border-b border-slate-200 bg-white rounded-t-lg overflow-hidden">
        <div className="flex overflow-x-auto">
          {PHASE_ORDER.map((phase) => {
            const phaseLabel = PHASE_CONFIG[phase as keyof typeof PHASE_CONFIG].label;
            const count = phaseStats.find(p => p.phase === phase)?.count || 0;
            return (
              <button
                key={phase}
                onClick={() => handlePhaseChange(phase)}
                className={`px-6 py-4 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${
                  activePhase === phase
                    ? 'border-transparent text-white bg-white'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
                style={activePhase === phase ? { backgroundColor: '#0A66C2', color: 'white', borderColor: '#0A66C2' } : {}}
              >
                {phaseLabel}
                <span className="ml-2 inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-xs font-semibold">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search and Controls */}
      <div className="border border-border bg-surface p-6">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-900 mb-2">Search Classes</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by class name..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': '#0A66C2' } as React.CSSProperties}
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
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': '#0A66C2' } as React.CSSProperties}
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

      {/* Classes Table */}
      <div className="overflow-hidden border border-border bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-6 py-3 text-left font-semibold text-slate-900">Class Name</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-900">Phase</th>
                <th className="px-6 py-3 text-right font-semibold text-slate-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedClasses.length > 0 ? (
                paginatedClasses.map((cls, idx) => (
                  <tr key={idx} className="border-b border-slate-200 hover:bg-slate-50 transition">
                    <td className="px-6 py-3 font-medium text-slate-900">{cls.name}</td>
                    <td className="px-6 py-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${PHASE_CONFIG[cls.phase as keyof typeof PHASE_CONFIG]?.color || 'bg-gray-100 text-gray-800'}`}>
                        {PHASE_CONFIG[cls.phase as keyof typeof PHASE_CONFIG]?.label || cls.phase}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <button className="font-medium text-sm" style={{ color: '#0A66C2' }}>
                        View Details →
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-slate-600">
                    No classes found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
            <p className="text-sm text-slate-600">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredClasses.length)} of {filteredClasses.length}
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
                          ? 'text-white'
                          : 'border border-slate-200 text-slate-600 hover:text-slate-900'
                      }`}
                      style={currentPage === pageNum ? { backgroundColor: '#0A66C2', color: 'white' } : {}}
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
