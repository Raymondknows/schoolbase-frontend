"use client";

import { useState } from "react";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function LoginForm({ redirectTo }: { redirectTo: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPending(true);
    setError(null);
    setNotice(null);

    try {
      // ✅ FIX: Reliable value extraction
      const form = e.currentTarget;
      const email = (form.elements.namedItem("email") as HTMLInputElement).value;
      const password = (form.elements.namedItem("password") as HTMLInputElement).value;

      console.log('=== LOGIN FORM SUBMIT ===');
      console.log('Email:', email);
      console.log('Password length:', password.length);

      // ✅ Call the canonical auth proxy route
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // ✅ CRITICAL: Allow cookies to be set
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      console.log('=== LOGIN RESPONSE ===');
      console.log('Status:', res.status);
      console.log('Data:', data);

      if (!res.ok) {
        const errorData = data as any;
        const needsVerification = Boolean(errorData.needsVerification);
        const pendingEmailFromResponse = errorData.email || email;

        if (needsVerification) {
          const verificationUrl = `/signup/verify?email=${encodeURIComponent(
            pendingEmailFromResponse
          )}&needsVerification=true`;

          console.log('Account needs verification, redirecting to verify page:', verificationUrl);
          window.location.href = verificationUrl;
          return;
        }

        setError(errorData.error || "Login failed");
        setNotice(null);
        setPending(false);
        return;
      }

      setNotice("Login successful. Redirecting...");

      // ✅ Token is set in cookie by /api/auth/login (httpOnly cookie can't be accessed from JS)
      // Wait a moment to ensure cookie is set
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // ✅ INTELLIGENT REDIRECT: Route based on user role
      let redirectUrl = redirectTo; // fallback to provided prop
      
      if (data.session?.role === "TEACHER") {
        redirectUrl = "/teacher";
        console.log('Teacher login detected, redirecting to /teacher');
      } else if (data.session?.role === "PLATFORM_ADMIN") {
        redirectUrl = "/schoolbase-admin";
        console.log('Platform admin login detected, redirecting to /schoolbase-admin');
      } else if (data.session?.role === "SCHOOL_ADMIN") {
        redirectUrl = "/admin?onboarding=1";
        console.log('School admin login detected, redirecting to /admin?onboarding=1');
      } else if (data.session?.role === "BURSAR") {
        redirectUrl = "/accounting";
        console.log('Bursar login detected, redirecting to /accounting');
      }
      
      console.log('Performing full page redirect to:', redirectUrl);
      
      // ✅ CRITICAL: Use window.location instead of router.push()
      // This ensures the cookie is sent with the request to the server
      // Client-side routing won't send httpOnly cookies to middleware!
      window.location.href = redirectUrl;
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error("Login error:", err);
    } finally {
      setPending(false);
    }
  };

  return (
    <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
      {error && (
        <div className="rounded-lg bg-error/10 px-3 py-2 text-sm text-error">
          <p className="mb-2">{error}</p>
          {pendingEmail && (
            <button
              type="button"
              onClick={() => router.push(`/signup/verify?email=${encodeURIComponent(pendingEmail)}&needsVerification=true`)}
              className="inline-flex items-center text-xs font-medium text-error underline hover:no-underline"
            >
              Enter verification code →
            </button>
          )}
        </div>
      )}

      {notice && (
        <p className="rounded-lg bg-success/10 px-3 py-2 text-sm text-success">
          {notice}
        </p>
      )}

      <div className="relative">
        <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
          <Mail className="h-4 w-4" />
        </div>
        <input
          name="email"
          type="email"
          required
          placeholder=" "
          aria-label="Email"
          className="peer mt-1 w-full rounded-xl border border-border bg-background px-3 pl-10 py-3 text-sm text-foreground placeholder-transparent transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
        />
        <label className="absolute left-10 top-3 text-sm text-muted transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-sm peer-focus:-top-2 peer-focus:text-xs">
          Email
        </label>
      </div>

      <div className="relative">
        <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
          <Lock className="h-4 w-4" />
        </div>
        <input
          name="password"
          type={showPassword ? "text" : "password"}
          required
          placeholder=" "
          aria-label="Password"
          className="peer mt-1 w-full rounded-xl border border-border bg-background px-3 pl-10 py-3 text-sm text-foreground placeholder-transparent transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
        />

        <label className="absolute left-10 top-3 text-sm text-muted transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-sm peer-focus:-top-2 peer-focus:text-xs">
          Password
        </label>

        <button
          type="button"
          onClick={() => setShowPassword((value) => !value)}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 transition hover:text-foreground"
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>

      <div className="flex items-center justify-between text-sm">
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" className="h-4 w-4 rounded border-border text-brand" />
          <span className="text-muted">Remember me</span>
        </label>
        <div>
          <a href="/forgot-password" className="text-brand hover:underline">
            Forgot password?
          </a>
        </div>
      </div>

      <Button
        type="submit"
        className="w-full rounded-xl bg-brand text-white px-4 py-3 font-medium shadow-md hover:bg-brand-hover transition disabled:opacity-50"
        disabled={pending}
      >
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}