"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, Users } from "lucide-react";
import { pupilName } from "@/lib/format";
import { saveAttendance } from "@/app/admin/actions";

export default function TeacherAttendancePageClient({
  classes,
  selectedClass,
  pupils,
  today,
  existingRecords,
  success,
}: {
  classes: any[];
  selectedClass: string | undefined;
  pupils: any[];
  today: string;
  existingRecords: { pupilId: string; status: string }[];
  success?: boolean;
}) {
  const [showSuccess, setShowSuccess] = useState(success ?? false);
  const [classId, setClassId] = useState(selectedClass ?? classes[0]?.id);
  const [date, setDate] = useState(today);
  const statusMap = useMemo(
    () => new Map(existingRecords.map((record) => [record.pupilId, record.status])),
    [existingRecords],
  );

  return (
    <div className="px-2 py-4 sm:px-4 lg:px-6 lg:py-6">
      <div className="mx-auto max-w-6xl space-y-4 sm:space-y-5">
        <header>
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand/10 text-brand">
              <Users className="h-5 w-5" />
            </div>

            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">Attendance</h1>
              <p className="mt-1 text-sm text-muted">Mark today&apos;s register — parents can be alerted later.</p>
            </div>
          </div>
        </header>

        {showSuccess ? (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 px-4 py-8">
            <div className="w-full max-w-xl rounded-3xl border border-border bg-surface p-8 shadow-2xl">
              <div className="flex items-start gap-4">
                <div className="mt-1 rounded-2xl bg-success/10 p-3 text-success">✓</div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground">Attendance saved successfully</h3>
                  <p className="mt-2 text-sm text-muted">The register for the selected class and date has been updated.</p>
                </div>
              </div>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Link
                  href={`/teacher/attendance?classId=${classId ?? ""}&date=${date}`}
                  className="w-full rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brand/90 sm:w-auto"
                >
                  Close
                </Link>
              </div>
            </div>
          </div>
        ) : null}

        <section className="rounded-[24px] border border-border/70 bg-surface/80 p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Register details</h2>
              <p className="mt-1 text-sm text-muted">Select class and date before marking attendance.</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={`/teacher/attendance/summary?classId=${classId}&date=${date}`}
                className="inline-flex items-center justify-center rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition hover:border-brand"
              >
                View summary
              </Link>
            </div>
          </div>

          <form method="get" className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-[1fr_auto]">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-foreground">
                Class
                <select
                  name="classId"
                  value={classId}
                  onChange={(event) => setClassId(event.target.value)}
                  className="mt-2 w-full rounded-[20px] border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-brand/10"
                >
                  {classes.map((teacherClass) => (
                    <option key={teacherClass.id} value={teacherClass.id}>
                      {teacherClass.name}{teacherClass.arm ? ` ${teacherClass.arm}` : ""}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-medium text-foreground">
                Date
                <input
                  type="date"
                  name="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  className="mt-2 w-full rounded-[20px] border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-brand/10"
                />
              </label>
            </div>

            <div className="flex items-end gap-3">
              <Button type="submit" className="w-full whitespace-nowrap bg-brand text-white hover:bg-brand-hover">
                Load class
              </Button>
            </div>
          </form>
        </section>

        {pupils.length > 0 ? (
          <section className="rounded-[24px] border border-border/70 bg-surface/80 p-4 shadow-sm sm:p-5">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Attendance list</h2>
                <p className="mt-1 text-sm text-muted">Mark attendance for each student below.</p>
              </div>
              <div className="text-sm text-muted">
                {pupils.length} student{pupils.length !== 1 ? "s" : ""}
              </div>
            </div>

            <form action={saveAttendance} className="space-y-3">
              <input type="hidden" name="classId" value={classId} />
              <input type="hidden" name="date" value={date} />

              <div className="grid gap-3">
                {pupils.map((pupil) => (
                  <div
                    key={pupil.id}
                    className="grid gap-3 rounded-2xl border border-border bg-background p-4 md:grid-cols-[1fr_auto] md:items-center"
                  >
                    <div>
                      <p className="font-semibold text-foreground">{pupilName(pupil.firstName, pupil.lastName)}</p>
                      <p className="mt-1 text-sm text-muted">{pupil.admissionNo ?? "No admission number"}</p>
                    </div>
                    <select
                      name={`status_${pupil.id}`}
                      defaultValue={statusMap.get(pupil.id) ?? "PRESENT"}
                      className="rounded-[20px] border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-brand/10"
                    >
                      <option value="PRESENT">Present</option>
                      <option value="ABSENT">Absent</option>
                      <option value="LATE">Late</option>
                    </select>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Button type="submit" className="w-full rounded-[20px] bg-brand px-4 py-3 text-sm font-semibold text-white hover:bg-brand-hover sm:w-auto">
                  Save attendance
                </Button>
              </div>
            </form>
          </section>
        ) : (
          <div className="rounded-[24px] border border-border/70 bg-background px-6 py-12 text-center text-sm text-muted">
            No students were found for the selected class.
          </div>
        )}
      </div>
    </div>
  );
}
