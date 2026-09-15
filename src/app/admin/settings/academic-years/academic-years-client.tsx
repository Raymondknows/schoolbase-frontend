"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  createAcademicYear,
  createTerm,
  setCurrentAcademicYear,
  updateTerm,
} from "@/app/admin/actions";

type TermItem = {
  id: string;
  name: string;
  startsOn?: string | Date | null;
  endsOn?: string | Date | null;
  sortOrder: number;
};

type AcademicYearItem = {
  id: string;
  name: string;
  isCurrent: boolean;
  terms: TermItem[];
};

type Props = {
  academicYears: AcademicYearItem[];
};

function formatDate(value?: string | Date | null) {
  if (!value) return "Not set";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";
  return date.toLocaleDateString();
}

export default function AcademicYearSettingsPageClient({
  academicYears,
}: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewYearModal, setShowNewYearModal] = useState(false);
  const [showNewTermModal, setShowNewTermModal] = useState(false);
  const [newTermYearId, setNewTermYearId] = useState(
    academicYears[0]?.id ?? "",
  );
  const [editingTermId, setEditingTermId] = useState<string | null>(null);

  const filteredAcademicYears = useMemo(() => {
    if (!searchQuery.trim()) return academicYears;

    const query = searchQuery.toLowerCase();
    return academicYears
      .map((year) => ({
        ...year,
        terms: year.terms.filter((term) =>
          [year.name, term.name]
            .join(" ")
            .toLowerCase()
            .includes(query),
        ),
      }))
      .filter(
        (year) =>
          year.name.toLowerCase().includes(query) || year.terms.length > 0,
      );
  }, [academicYears, searchQuery]);

  const editingTerm = useMemo(() => {
    if (!editingTermId) return null;

    for (const year of academicYears) {
      const match = year.terms.find((term) => term.id === editingTermId);
      if (match) {
        return {
          ...match,
          academicYear: {
            id: year.id,
            name: year.name,
            isCurrent: year.isCurrent,
          },
        };
      }
    }

    return null;
  }, [academicYears, editingTermId]);

  const totalTerms = academicYears.reduce(
    (count, year) => count + year.terms.length,
    0,
  );

  return (
    <main className="min-h-screen pb-12">
    <div className="mx-auto max-w-7xl space-y-6 px-0 py-4 sm:px-8 sm:py-8 lg:px-12">
      <header className="relative overflow-hidden border border-border bg-surface px-6 pb-7 pt-8 sm:px-8 sm:pb-8 sm:pt-10">
        <div className="absolute right-0 top-0 h-full w-1/3 bg-brand-light/40 [clip-path:polygon(35%_0,100%_0,100%_100%,0_100%)]" />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[.16em] text-brand">
            Academic operations
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Academic years & terms
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Manage academic years and term periods for the whole school. Edit terms using table actions and update details in a modal.
          </p>
        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
          <Button type="button" className="w-full sm:w-auto" onClick={() => setShowNewTermModal(true)} disabled={academicYears.length === 0}>
            Add term
          </Button>
          <Button type="button" className="w-full sm:w-auto" variant="secondary" onClick={() => setShowNewYearModal(true)}>
            Add academic year
          </Button>
        </div>
      </div>
      </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="border border-border bg-surface p-5">
          <p className="text-sm text-muted">Academic years</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">{academicYears.length}</p>
        </div>
        <div className="border border-border bg-surface p-5">
          <p className="text-sm text-muted">Total terms</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">{totalTerms}</p>
        </div>
        <div className="border border-border bg-surface p-5">
          <p className="text-sm text-muted">Search</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">{searchQuery ? "Filtered" : "All"}</p>
        </div>
      </div>

      <section className="border border-border bg-surface p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Term table</h2>
            <p className="mt-1 text-sm text-muted">
              View terms per academic year, update start/end dates, and mark the active year for the school.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button type="button" onClick={() => setShowNewTermModal(true)} disabled={academicYears.length === 0}>
              New term
            </Button>
            <Button type="button" variant="secondary" onClick={() => setShowNewYearModal(true)}>
              New year
            </Button>
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-foreground">
            Search academic years or terms
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by year or term name"
              className="mt-3 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
          </label>
        </div>
      </section>

      {filteredAcademicYears.length === 0 ? (
        <div className="border border-dashed border-border bg-background p-8 text-center text-sm text-muted">
          No academic years or terms match your search. Add a new academic year to begin.
        </div>
      ) : (
        <div className="space-y-6">
          {filteredAcademicYears.map((year) => (
            <div key={year.id} className="space-y-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xl font-semibold text-foreground">{year.name}</p>
                    {year.isCurrent ? <Badge>Current</Badge> : null}
                  </div>
                  <p className="mt-2 text-sm text-muted">
                    {year.terms.length} term{year.terms.length === 1 ? "" : "s"} defined.
                  </p>
                </div>

                {!year.isCurrent ? (
                  <form action={setCurrentAcademicYear} className="w-full sm:w-auto">
                    <input type="hidden" name="id" value={year.id} />
                    <Button type="submit" variant="secondary" className="w-full sm:w-auto">
                      Set as current year
                    </Button>
                  </form>
                ) : null}
              </div>

              {year.terms.length > 0 ? (
                <div className="overflow-x-auto rounded-lg border border-border bg-surface">
                    <table className="min-w-full text-left text-sm">
                      <thead className="border-b border-border bg-background text-muted">
                        <tr>
                          <th className="px-3 py-2">Term name</th>
                          <th className="px-3 py-2">Starts on</th>
                          <th className="px-3 py-2">Ends on</th>
                          <th className="hidden px-3 py-2 sm:table-cell">Order</th>
                          <th className="px-3 py-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {year.terms.map((term) => (
                          <tr key={term.id} className="border-t border-border hover:bg-background/60 transition-colors">
                            <td className="px-3 py-2 font-medium text-foreground">{term.name}</td>
                            <td className="px-3 py-2 text-sm text-muted">{formatDate(term.startsOn)}</td>
                            <td className="px-3 py-2 text-sm text-muted">{formatDate(term.endsOn)}</td>
                            <td className="hidden px-3 py-2 text-sm text-muted sm:table-cell">{term.sortOrder}</td>
                            <td className="px-3 py-2">
                              <Button
                                type="button"
                                variant="secondary"
                                onClick={() => setEditingTermId(term.id)}
                                className="w-full sm:w-auto text-xs sm:text-sm px-2 py-2 sm:px-3 sm:py-2"
                              >
                                Edit
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
              ) : (
                <p className="mt-5 text-sm text-muted">No terms are currently defined for this academic year.</p>
              )}
            </div>
          ))}
        </div>
      )}

      {showNewYearModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-2xl overflow-hidden rounded-md border border-border bg-surface shadow-[0_16px_50px_rgba(10,102,194,0.16)]">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Create academic year</h2>
                <p className="mt-2 text-sm text-muted">
                  Add a new school year and seed the standard three-term structure automatically.
                </p>
              </div>
              <Button variant="outline" onClick={() => setShowNewYearModal(false)}>
                Close
              </Button>
            </div>

            <form action={createAcademicYear} className="space-y-5">
              <label className="block text-sm font-medium text-foreground">
                Academic year name
                <input
                  name="name"
                  required
                  placeholder="2025/2026"
                  className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                />
              </label>

              <label className="flex items-center gap-3 text-sm font-medium text-foreground">
                <input type="checkbox" name="isCurrent" value="true" className="h-4 w-4 rounded border-border text-brand focus:ring-brand" />
                Set as current academic year
              </label>

              <p className="text-sm text-muted">
                The created year will include the standard three terms. You can edit term details after creation.
              </p>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
                <Button type="submit">Save academic year</Button>
                <Button type="button" variant="outline" onClick={() => setShowNewYearModal(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showNewTermModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-2xl overflow-hidden rounded-md border border-border bg-surface shadow-[0_16px_50px_rgba(10,102,194,0.16)]">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Add term</h2>
                <p className="mt-2 text-sm text-muted">
                  Create a custom term and assign it to an academic year.
                </p>
              </div>
              <Button variant="outline" onClick={() => setShowNewTermModal(false)}>
                Close
              </Button>
            </div>

            <form action={createTerm} className="space-y-5">
              <label className="block text-sm font-medium text-foreground">
                Academic year
                <select
                  name="academicYearId"
                  value={newTermYearId}
                  onChange={(event) => setNewTermYearId(event.target.value)}
                  required
                  className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                >
                  <option value="">Select year</option>
                  {academicYears.map((year) => (
                    <option key={year.id} value={year.id}>
                      {year.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-medium text-foreground">
                Term name
                <input
                  name="name"
                  required
                  placeholder="Term 4"
                  className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                />
              </label>

              <p className="text-sm text-muted">Sort order is assigned automatically.</p>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
                <Button type="submit">Save term</Button>
                <Button type="button" variant="outline" onClick={() => setShowNewTermModal(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingTerm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-2xl overflow-hidden rounded-md border border-border bg-surface shadow-[0_16px_50px_rgba(10,102,194,0.16)]">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Edit term</h2>
                <p className="mt-2 text-sm text-muted">
                  Update term details for {editingTerm.name} in {editingTerm.academicYear.name}.
                </p>
              </div>
              <Button variant="outline" onClick={() => setEditingTermId(null)}>
                Close
              </Button>
            </div>

            <form action={updateTerm} className="space-y-5">
              <input type="hidden" name="id" value={editingTerm.id} />

              <label className="block text-sm font-medium text-foreground">
                Term name
                <input
                  name="name"
                  defaultValue={editingTerm.name}
                  required
                  className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium text-foreground">
                  Starts on
                  <input
                    name="startsOn"
                    type="date"
                    defaultValue={
                      editingTerm.startsOn instanceof Date
                        ? editingTerm.startsOn.toISOString().slice(0, 10)
                        : editingTerm.startsOn ?? ""
                    }
                    className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                  />
                </label>
                <label className="block text-sm font-medium text-foreground">
                  Ends on
                  <input
                    name="endsOn"
                    type="date"
                    defaultValue={
                      editingTerm.endsOn instanceof Date
                        ? editingTerm.endsOn.toISOString().slice(0, 10)
                        : editingTerm.endsOn ?? ""
                    }
                    className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                  />
                </label>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
                <Button type="submit">Save changes</Button>
                <Button type="button" variant="outline" onClick={() => setEditingTermId(null)}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </main>
  );
}
