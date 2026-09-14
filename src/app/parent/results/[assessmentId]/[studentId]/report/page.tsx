import Link from "next/link";
import { ArrowLeft, FileText, LockKeyhole } from "lucide-react";

export default async function Page() {
  return (
    <div className="min-h-screen bg-background px-4 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-3xl">
        <Link href="/parent/results" className="inline-flex items-center gap-2 text-sm font-semibold text-brand hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to results
        </Link>
        <section className="relative mt-6 overflow-hidden border border-border bg-surface px-6 pb-8 pt-12 sm:px-10 sm:pb-10 sm:pt-14">
          <div className="absolute right-0 top-0 h-full w-1/3 bg-brand-light/40 [clip-path:polygon(35%_0,100%_0,100%_100%,0_100%)]" />
          <div className="relative">
            <div className="flex h-11 w-11 items-center justify-center rounded-md bg-brand text-white"><FileText className="h-5 w-5" /></div>
            <p className="mt-6 text-xs font-bold uppercase tracking-[.16em] text-brand">Academic report</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">Your academic report is being prepared</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted">Published results are available in the results workspace. We are preparing a dedicated report experience for this route.</p>
            <div className="mt-6 flex items-center gap-2 border border-border bg-background px-3 py-2 text-xs font-semibold text-muted"><LockKeyhole className="h-4 w-4 text-brand" /> Secure student records</div>
            <Link href="/parent/results" className="mt-6 inline-flex items-center gap-2 rounded-md bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover">View results <ArrowLeft className="h-4 w-4 rotate-180" /></Link>
          </div>
        </section>
      </div>
    </div>
  );
}
