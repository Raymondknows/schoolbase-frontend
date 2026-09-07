'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Grid3X3,
  List,
  Search,
  Users,
  X,
} from 'lucide-react';
import { getBackendUrl } from '@/lib/backend-url';

interface Subject {
  id: string;
  name: string;
  code?: string;
}

type ViewMode = 'grid' | 'list';

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;
const DEFAULT_ITEMS_PER_PAGE = 20;

const getSubjectMetaLabel = (subject: Subject) =>
  subject.code ? `Code ${subject.code}` : '';

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_ITEMS_PER_PAGE);
  const [viewMode, setViewMode] = useState<ViewMode>('list');

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
      const code = (subject.code || '').toLowerCase();
      return name.includes(query) || code.includes(query);
    });
  }, [subjects, searchQuery]);

  const stats = useMemo(
    () => ({
      total: subjects.length,
    }),
    [subjects.length],
  );

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
      <div className="px-3 py-4 sm:px-4 lg:px-6 lg:py-6">
        <div className="mx-auto max-w-7xl space-y-6 px-5 py-8 sm:px-8 lg:px-12">
          <div className="space-y-2">
            <div className="h-7 w-32 animate-pulse rounded-lg bg-surface" />
            <div className="h-4 w-72 animate-pulse rounded bg-surface" />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-24 animate-pulse border border-border bg-surface"
              />
            ))}
          </div>

          <div className="h-96 animate-pulse border border-border bg-surface" />
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen pb-12">
      <div className="mx-auto max-w-7xl space-y-6 px-5 py-8 sm:px-8 lg:px-12">
        <header className="flex flex-col justify-between gap-4 border-b border-border pb-6 sm:flex-row sm:items-end">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-brand">
              <BookOpen className="h-[17px] w-[17px]" /> Teacher workspace
            </div>
            <h1 className="mt-2 text-3xl font-bold text-foreground sm:text-4xl">Your Subjects</h1>
            <p className="mt-1 text-muted">View and manage the subjects assigned to you.</p>
          </div>
        </header>

        {error && (
          <div className="flex items-start gap-3 border border-[#f5c2c7] bg-[#fff5f5] px-4 py-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-red-800">Unable to load subjects</p>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2">
          <article className="border border-border bg-surface p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                <BookOpen className="h-5 w-5 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">Total Subjects</p>
                <p className="mt-1 text-2xl font-semibold text-foreground">{stats.total}</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-muted">Subjects currently assigned to you.</p>
          </article>

          <article className="border border-border bg-surface p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                <BookOpen className="h-5 w-5 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">Subject codes</p>
                <p className="mt-1 text-2xl font-semibold text-foreground">{subjects.filter((subject) => subject.code).length}</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-muted">Assigned subjects with a code.</p>
          </article>
        </section>

        <section className="border-b border-border pb-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Subjects</h2>
              <p className="mt-1 text-sm text-muted">View and search subjects assigned to you.</p>
            </div>

            <div className="text-sm text-muted">
              <span className="font-semibold text-foreground">{subjects.length}</span>{' '}
              {subjects.length === 1 ? 'subject' : 'subjects'}
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.18em] text-muted">Search & filters</p>
              <div className="relative w-full sm:w-[420px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => {
                    setSearchQuery(event.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search by subject name or code..."
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
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-lg border border-border bg-background p-1">
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  aria-label="List view"
                    className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                    viewMode === 'list'
                      ? 'bg-brand text-white'
                      : 'text-muted hover:text-foreground'
                  }`}
                >
                  <List className="h-3.5 w-3.5" />
                  List
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  aria-label="Grid view"
                    className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                    viewMode === 'grid'
                      ? 'bg-brand text-white'
                      : 'text-muted hover:text-foreground'
                  }`}
                >
                  <Grid3X3 className="h-3.5 w-3.5" />
                  Grid
                </button>
              </div>

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

          <div className="mt-4 flex flex-col gap-1 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
            <p>
              Showing {startItem}–{endItem} of {filteredSubjects.length} subject{filteredSubjects.length !== 1 ? 's' : ''}
              {searchQuery ? ` matching "${searchQuery}"` : ''}
            </p>
          </div>
        </section>

        {paginatedSubjects.length > 0 && viewMode === 'grid' && (
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
                    <p className="text-sm font-semibold text-foreground truncate">{subject.name}</p>
                    {getSubjectMetaLabel(subject) ? (
                      <p className="mt-1 text-xs text-muted">{getSubjectMetaLabel(subject)}</p>
                    ) : null}
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <Link
                    href={`/teacher/results?subject=${encodeURIComponent(subject.name)}`}
                    className="inline-flex items-center justify-center rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-brand transition hover:bg-background"
                  >
                    View results
                  </Link>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-surface"
                  >
                    Manage
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {paginatedSubjects.length > 0 && viewMode === 'list' && (
          <>
            <div className="hidden overflow-hidden rounded-lg border border-border bg-surface sm:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-background text-muted">
                  <tr>
                    <th className="px-4 py-3 font-medium">Subject</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedSubjects.map((subject) => (
                    <tr key={subject.id} className="border-t border-border hover:bg-background/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground">{subject.name}</p>
                          {getSubjectMetaLabel(subject) ? (
                            <p className="mt-1 text-xs text-muted">{getSubjectMetaLabel(subject)}</p>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <Link
                            href={`/teacher/results?subject=${encodeURIComponent(subject.name)}`}
                            className="rounded-lg border border-border bg-surface px-3 py-1 text-xs font-semibold text-brand transition hover:bg-background"
                          >
                            View results
                          </Link>
                          <button
                            type="button"
                            className="rounded-lg border border-border bg-background px-3 py-1 text-xs font-semibold text-foreground transition hover:bg-surface"
                          >
                            Manage
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="sm:hidden space-y-2">
              {paginatedSubjects.map((subject) => (
                <div key={subject.id} className="border border-border bg-background p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{subject.name}</p>
                      <p className="mt-1 text-xs text-muted">{getSubjectMetaLabel(subject)}</p>
                    </div>
                    {/* Removed status badge for teacher subjects list */}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link
                      href={`/teacher/results?subject=${encodeURIComponent(subject.name)}`}
                      className="rounded-lg border border-border bg-surface px-3 py-1 text-xs font-semibold text-brand transition hover:bg-background"
                    >
                      View results
                    </Link>
                    <button
                      type="button"
                      className="rounded-lg border border-border bg-background px-3 py-1 text-xs font-semibold text-foreground transition hover:bg-surface"
                    >
                      Manage
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {paginatedSubjects.length === 0 && !error && (
          <div className="rounded-lg border border-dashed border-[#9ac7ea] bg-[#f3f9fe] px-6 py-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-brand/10 text-brand">
              <Users className="h-6 w-6" />
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
