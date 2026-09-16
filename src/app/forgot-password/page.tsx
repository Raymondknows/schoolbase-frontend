"use client";

import { useState } from "react";
import { AppLogo } from "@/components/app-logo";
import { Button } from "@/components/ui/button";
import { Building2, MailCheck, ShieldCheck } from "lucide-react";
import { getBackendUrl } from "@/lib/backend-url";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${getBackendUrl()}/api/admin/request-password-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data?.error || "Failed to send reset link");
        return;
      }
      setSent(true);
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-8 sm:py-10">
      <div className="mx-auto grid max-w-6xl overflow-hidden border border-border bg-surface lg:grid-cols-[.8fr_1.2fr]">
        <section className="relative hidden overflow-hidden border-r border-border bg-brand/5 p-10 lg:flex lg:flex-col lg:justify-between">
          <div className="absolute right-0 top-0 h-2/3 w-2/3 bg-brand-light/50 [clip-path:polygon(35%_0,100%_0,100%_100%,0_60%)]" />
          <div className="relative">
            <AppLogo href="/" size="lg" />
            <p className="mt-16 text-xs font-bold uppercase tracking-[.18em] text-brand">SchoolBase account access</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight text-foreground">Get back to your school workspace.</h2>
            <p className="mt-4 max-w-sm text-sm leading-7 text-muted">Request a secure reset link and return to the tools your school uses every day.</p>
          </div>
          <div className="relative grid gap-3 text-sm text-muted">
            <div className="flex items-center gap-3 border border-border bg-surface px-4 py-3"><Building2 className="h-4 w-4 text-brand" /> Built for school teams</div>
            <div className="flex items-center gap-3 border border-border bg-surface px-4 py-3"><ShieldCheck className="h-4 w-4 text-brand" /> Reset links are time-limited</div>
          </div>
        </section>

        <section className="p-6 sm:p-10">
          <div className="mb-8 flex justify-center lg:hidden"><AppLogo href="/" size="lg" /></div>
          <p className="text-sm font-semibold uppercase tracking-[.18em] text-brand">Account recovery</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">Forgot your password?</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Enter the email for your SchoolBase account and we&apos;ll send a secure reset link.</p>

          {sent ? (
            <div className="mt-8 border border-brand/20 bg-brand-light p-5 text-sm text-foreground">
              <div className="flex items-center gap-3"><MailCheck className="h-5 w-5 text-brand" /><p className="font-semibold">Check your email</p></div>
              <p className="mt-3 leading-6 text-muted">We sent a password reset link. It expires in 1 hour.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8">
              {error ? <div className="mb-5 border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800">{error}</div> : null}
              <label className="block text-sm font-medium text-foreground">
                Email
                <input name="email" type="email" required placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 w-full border border-border bg-background px-3 py-3 text-sm text-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" />
              </label>
              <div className="mt-8 border-t border-border pt-5">
                <Button type="submit" className="w-full bg-brand font-semibold hover:bg-brand-hover" disabled={loading}>{loading ? "Sending..." : "Send reset link"}</Button>
              </div>
              <p className="mt-6 border-t border-border pt-5 text-center text-sm text-muted">Remember your password? <a href="/login" className="font-semibold text-brand hover:underline">Sign in</a></p>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
