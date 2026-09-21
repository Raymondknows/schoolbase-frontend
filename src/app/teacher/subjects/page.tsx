'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
} from 'lucide-react';
import { getBackendUrl } from '@/lib/backend-url';
import TeacherPageHeader from '@/components/teacher-page-header';

interface Subject {
  id: string;
  name: string;
  classes: Array<{ id: string; name: string; arm?: string | null; phase?: string | null }>;
}

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;
const DEFAULT_ITEMS_PER_PAGE = 20;

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_ITEMS_PER_PAGE);

  useEffect(() => {
    async function loadSubjects() {
      try {
        setLoading(true);
        setError(null);

        const backendUrl = getBackendUrl();
        const response = await fetch(`${backendUrl}/api/teacher/subjects`, {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to load subjects');
        }

        const data = await response.json();
        setSubjects(Array.isArray(data.subjects) ? data.subjects : []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load subjects');
        setSubjects([]);
      } finally {
        setLoading(false);
      }
    }

    loadSubjects();
  }, []);

  const filteredSubjects = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return subjects;

    return subjects.filter((subject) => {
      const name = subject.name.toLowerCase();
      return name.includes(query);
    });
  }, [subjects, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredSubjects.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedSubjects = filteredSubjects.slice(
    (safeCurrentPage - 1) * itemsPerPage,
    safeCurrentPage * itemsPerPage,
  );

  const startItem =
    filteredSubjects.length === 0 ? 0 : (safeCurrentPage - 1) * itemsPerPage + 1;

  const endItem = Math.min(safeCurrentPage * itemsPerPage, filteredSubjects.length);

  const clearSearch = () => {
    setSearchQuery('');
    setCurrentPage(1);
  };

  const handlePageSizeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setItemsPerPage(Number(event.target.value));
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="px-2 py-4 sm:px-4 lg:px-6 lg:py-6">
        <div className="mx-auto max-w-7xl space-y-6 px-2 py-8 sm:px-8 lg:px-12">
          <div className="space-y-2">
            <div className="h-7 w-32 animate-pulse rounded-lg bg-surface" />
            <div className="h-4 w-72 animate-pulse rounded bg-surface" />
          </div>

          <div className="h-24 animate-pulse border border-border bg-surface" />

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <div key={item} className="h-28 animate-pulse border border-border bg-surface" />
              ))}
            </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen pb-12">
      <div className="mx-auto max-w-7xl space-y-6 px-2 py-8 sm:px-8 lg:px-12">
        <TeacherPageHeader icon={BookOpen} title="Your Subjects" description="A clear view of the subjects assigned to you." count={`${subjects.length} subjects`} />

        {error && (
          <div className="flex items-start gap-3 border border-[#f5c2c7] bg-[#fff5f5] px-4 py-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-red-800">Unable to load subjects</p>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        <section className="border border-border bg-surface">
          <div className="border-b border-border px-5 py-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[.14em] text-brand">Subject directory</p>
                <h2 className="mt-1 text-lg font-semibold text-foreground">Find a subject</h2>
                <p className="mt-1 text-sm text-muted">Search your assigned subjects.</p>
              </div>
              <span className="text-xs font-semibold text-muted">{filteredSubjects.length} matching</span>
            </div>
          </div>

          <div className="flex flex-col gap-4 bg-background/50 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative min-w-0 flex-1 lg:max-w-2xl">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => {
                    setSearchQuery(event.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search subjects..."
                  className="w-full rounded-lg border border-border bg-surface py-2.5 pl-10 pr-10 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-brand"
                />

                {searchQuery ? (
                  <button
                    type="button"
                    onClick={clearSearch}
                    aria-label="Clear search"
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted transition hover:bg-surface hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-2 text-xs text-muted">
                Show
                <select
                  value={itemsPerPage}
                  onChange={handlePageSizeChange}
                  className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs font-medium text-foreground outline-none focus:border-brand focus:ring-1 focus:ring-brand/10"
                >
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="flex flex-col gap-1 border-t border-border px-5 py-3 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
            <p>
              Showing {startItem}–{endItem} of {filteredSubjects.length} subject{filteredSubjects.length !== 1 ? 's' : ''}
              {searchQuery ? ` matching "${searchQuery}"` : ''}
            </p>
          </div>
        </section>

        {paginatedSubjects.length > 0 && (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {paginatedSubjects.map((subject) => (
              <div
                key={subject.id}
                className="border border-border bg-surface p-5 transition hover:border-brand/40 hover:bg-brand-light"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand/10 text-brand">
                    <BookOpen className="h-5 w-5" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-base font-semibold text-foreground truncate">{subject.name}</p>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}

        {paginatedSubjects.length === 0 && !error && (
          <div className="rounded-lg border border-dashed border-[#9ac7ea] bg-[#f3f9fe] px-6 py-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-brand/10 text-brand">
              <BookOpen className="h-6 w-6" />
            </div>
            <p className="mt-3 text-sm font-semibold text-foreground">No subjects found</p>
            <p className="mt-1 text-sm text-muted">
              {searchQuery ? `No subjects matching "${searchQuery}".` : 'No subjects are currently assigned.'}
            </p>
          </div>
        )}

        {paginatedSubjects.length > 0 && (
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted">
              Page {safeCurrentPage} of {totalPages}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={safeCurrentPage === 1}
                className="inline-flex items-center gap-2 rounded px-3 py-1.5 border border-border text-sm font-medium text-foreground hover:bg-background disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Previous
              </button>

              {Array.from({ length: totalPages }, (_, index) => index + 1)
                .filter((page) => page === 1 || page === totalPages || (page >= safeCurrentPage - 1 && page <= safeCurrentPage + 1))
                .map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`rounded px-2.5 py-1.5 text-sm font-medium ${
                      page === safeCurrentPage
                        ? 'bg-brand text-white'
                        : 'border border-border text-foreground hover:bg-background'
                    }`}
                  >
                    {page}
                  </button>
                ))}

              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={safeCurrentPage === totalPages}
                className="inline-flex items-center gap-2 rounded px-3 py-1.5 border border-border text-sm font-medium text-foreground hover:bg-background disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
