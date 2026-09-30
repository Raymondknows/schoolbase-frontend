"use client";

import { useEffect, useState } from "react";
import { Archive, CalendarDays, Plus, RotateCcw, Sparkles } from "lucide-react";
import AdminSkeleton from "@/components/ui/skeleton";
import TeacherPageHeader from "@/components/teacher-page-header";

type Activity = {
  id: string;
  name: string;
  category: string;
  description: string | null;
  isActive: boolean;
  _count?: { scheduledActivities: number };
};

const categories = ["GENERAL", "ASSEMBLY", "SPORTS", "CLUB", "EVENT", "BREAK"];

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("GENERAL");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/activities", { credentials: "include", cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load activities.");
      setActivities(data.activities || []);
      setError("");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load activities.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void Promise.resolve().then(load);
  }, []);

  async function createActivity(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/activities", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, category, description }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to create activity.");
      setName("");
      setCategory("GENERAL");
      setDescription("");
      setNotice("Activity added. It is now available to schedule on a timetable.");
      await load();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to create activity.");
    } finally {
      setSaving(false);
    }
  }

  async function setActivityActive(activity: Activity, isActive: boolean) {
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/api/admin/activities/${activity.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to update activity.");
      setNotice(isActive ? "Activity restored." : "Activity archived. Existing timetable placements are preserved.");
      await load();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to update activity.");
    }
  }

  return (
    <main className="min-h-screen px-2 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl space-y-6">
        <TeacherPageHeader
          icon={Sparkles}
          eyebrow="School operations"
          title="Activities"
          description="Create reusable school activities, then place them into timetable periods for the whole school or selected classes."
          actionLabel="Timetable"
          actionHref="/admin/timetable"
        />

        {error ? <div role="alert" className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">{error}</div> : null}
        {notice ? <div role="status" className="border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{notice}</div> : null}

        <section className="border border-border bg-surface p-5 sm:p-6">
          <div className="mb-5">
            <p className="text-[11px] font-bold uppercase tracking-[.14em] text-brand">Activity library</p>
            <h2 className="mt-1 text-lg font-semibold text-foreground">Create an activity</h2>
            <p className="mt-1 text-sm text-muted">Examples: assembly, club, sports, chapel, examination, or school event.</p>
          </div>
          <form onSubmit={createActivity} className="grid gap-4 md:grid-cols-2">
            <label className="text-xs font-bold uppercase tracking-wide text-muted">
              Activity name
              <input required maxLength={191} value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Morning assembly" className="mt-2 w-full border border-border bg-background px-3 py-2.5 text-sm font-medium normal-case tracking-normal text-foreground outline-none focus:border-brand" />
            </label>
            <label className="text-xs font-bold uppercase tracking-wide text-muted">
              Category
              <select value={category} onChange={(event) => setCategory(event.target.value)} className="mt-2 w-full border border-border bg-background px-3 py-2.5 text-sm font-medium normal-case tracking-normal text-foreground outline-none focus:border-brand">
                {categories.map((item) => <option key={item} value={item}>{item[0] + item.slice(1).toLowerCase()}</option>)}
              </select>
            </label>
            <label className="text-xs font-bold uppercase tracking-wide text-muted md:col-span-2">
              Description <span className="font-normal normal-case">(optional)</span>
              <textarea maxLength={2000} rows={2} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Add a short note for staff." className="mt-2 w-full resize-y border border-border bg-background px-3 py-2.5 text-sm font-medium normal-case tracking-normal text-foreground outline-none focus:border-brand" />
            </label>
            <div className="md:col-span-2">
              <button type="submit" disabled={saving || !name.trim()} className="inline-flex items-center gap-2 bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50">
                <Plus className="h-4 w-4" /> {saving ? "Adding activity…" : "Add activity"}
              </button>
            </div>
          </form>
        </section>

        <section className="border border-border bg-surface">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[.14em] text-muted">School activity library</p>
              <h2 className="mt-1 text-lg font-semibold text-foreground">Activities available to schedule</h2>
            </div>
            <span className="border border-border bg-background px-2.5 py-1 text-xs font-bold text-muted">{activities.filter((item) => item.isActive).length} active</span>
          </div>
          {loading ? <AdminSkeleton /> : activities.length ? (
            <div className="divide-y divide-border">
              {activities.map((activity) => (
                <article key={activity.id} className={`flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between ${activity.isActive ? "" : "bg-background/70"}`}>
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center bg-brand/10 text-brand"><CalendarDays className="h-4 w-4" /></div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-foreground">{activity.name}</h3>
                        <span className="border border-border bg-background px-2 py-0.5 text-[10px] font-bold uppercase text-muted">{activity.category}</span>
                        {!activity.isActive ? <span className="text-[10px] font-bold uppercase text-muted">Archived</span> : null}
                      </div>
                      {activity.description ? <p className="mt-1 text-sm text-muted">{activity.description}</p> : null}
                      <p className="mt-1 text-xs text-muted">Scheduled {activity._count?.scheduledActivities || 0} times</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => void setActivityActive(activity, !activity.isActive)} className="inline-flex shrink-0 items-center gap-2 border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground hover:border-brand hover:text-brand">
                    {activity.isActive ? <Archive className="h-3.5 w-3.5" /> : <RotateCcw className="h-3.5 w-3.5" />}
                    {activity.isActive ? "Archive" : "Restore"}
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <div className="px-5 py-12 text-center">
              <Sparkles className="mx-auto h-7 w-7 text-brand" />
              <p className="mt-3 text-sm font-semibold text-foreground">No activities created yet</p>
              <p className="mt-1 text-xs text-muted">Add an activity above, then schedule it from the timetable board.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
