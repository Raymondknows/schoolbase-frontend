"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Globe2, Phone, UserRound } from "lucide-react";

export function ParentLoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPending(true);
    setError(null);

    try {
      const formData = new FormData(e.currentTarget);
      const phone = formData.get("phone") as string;
      const admissionNo = formData.get("admissionNo") as string;
      const schoolSlug = formData.get("schoolSlug") as string;

      const res = await fetch("/api/auth/parent-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // ✅ CRITICAL: Allow cookies to be set
        body: JSON.stringify({ phone, admissionNo, schoolSlug }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        setPending(false);
        return;
      }

      // Wait for cookie to be set
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // ✅ CRITICAL: Use window.location instead of router.push()
      // This ensures the cookie is sent with the request to the server
      // Client-side routing won't send httpOnly cookies to middleware!
      window.location.href = "/parent";
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error("Login error:", err);
    } finally {
      setPending(false);
    }
  };

  return (
    <form
      className="mt-8 space-y-4"
      onSubmit={handleSubmit}
    >
      {error && (
        <p className="border border-error/20 bg-error/10 px-4 py-3 text-sm text-error">
          {error}
        </p>
      )}
      <label className="block text-sm font-medium text-foreground">
        <span className="flex items-center gap-2"><Globe2 className="h-4 w-4 text-brand" /> School slug <span className="text-xs font-normal text-muted">optional</span></span>
        <input
          name="schoolSlug"
          type="text"
          placeholder="greenfield"
          className="mt-2 w-full border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
        />
      </label>
      <label className="block text-sm font-medium text-foreground">
        <span className="flex items-center gap-2"><Phone className="h-4 w-4 text-brand" /> Phone (WhatsApp)</span>
        <input
          name="phone"
          type="tel"
          required
          placeholder="+2348098765432"
          className="mt-2 w-full border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
        />
      </label>
      <label className="block text-sm font-medium text-foreground">
          <span className="flex items-center gap-2"><UserRound className="h-4 w-4 text-brand" /> Child admission no. <span className="text-xs font-normal text-muted">optional</span></span>
        <input
          name="admissionNo"
          placeholder="GFA-2041"
          className="mt-2 w-full border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
        />
      </label>
      <Button type="submit" className="mt-6 w-full bg-brand py-3 font-semibold hover:bg-brand-hover" disabled={pending}>
        {pending ? "Signing in…" : "View my children"}
      </Button>
    </form>
  );
}
