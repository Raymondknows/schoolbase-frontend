"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AppLogo } from "@/components/app-logo";
import { Button } from "@/components/ui/button";
import { ErrorModal } from "@/components/ui/error-modal";
import { verifySignupOtpAction } from "@/app/signup/actions";
import { getBackendUrl } from "@/lib/backend-url";
import Link from "next/link";

export function VerifySignupClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<{ message: string; details?: string } | null>(null);
  const [otp, setOtp] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [pendingLoaded, setPendingLoaded] = useState(false);
  const [signupData, setSignupData] = useState({
    schoolName: searchParams.get("schoolName") || "",
    slug: searchParams.get("slug") || "",
    tagline: searchParams.get("tagline") || "",
    address: searchParams.get("address") || "",
    phone: searchParams.get("phone") || "",
    country: searchParams.get("country") || "",
    adminName: searchParams.get("adminName") || "",
    password: searchParams.get("password") || "",
  });

  const adminEmail = searchParams.get("email") || "";
  const needsVerification = searchParams.get("needsVerification") === "true";
  const {
    schoolName,
    slug,
    tagline,
    address,
    phone,
    country,
    adminName,
    password,
  } = signupData;

  useEffect(() => {
    async function loadPendingSignup() {
      if (!adminEmail) {
        setPendingLoaded(true);
        return;
      }

      if (signupData.schoolName && signupData.slug && signupData.country && signupData.adminName) {
        setPendingLoaded(true);
        return;
      }

      try {
        const backendUrl = getBackendUrl();
        const response = await fetch(`${backendUrl}/api/trial/get-pending?email=${encodeURIComponent(adminEmail)}`);
        if (!response.ok) {
          setPendingLoaded(true);
          return;
        }

        const data = await response.json();
        if (data?.email) {
          setSignupData((current) => ({
            schoolName: current.schoolName || data.schoolName || "",
            slug: current.slug || data.slug || "",
            tagline: current.tagline || data.tagline || "",
            address: current.address || data.address || "",
            phone: current.phone || data.phone || "",
            country: current.country || data.country || "",
            adminName: current.adminName || data.adminName || "",
            password: current.password || "",
          }));
        }
      } catch (err) {
        console.error('Failed to load pending signup data', err);
      } finally {
        setPendingLoaded(true);
      }
    }

    loadPendingSignup();

    // Auto-focus the OTP input
    const input = document.querySelector('input[name="otp"]') as HTMLInputElement;
    if (input) input.focus();
  }, [adminEmail, signupData.schoolName, signupData.slug, signupData.country, signupData.adminName]);

  // Handle resend cooldown
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  async function handleResendOtp() {
    if (!adminEmail) return;
    
    setIsLoading(true);
    setError(null);
    setResendCooldown(60);

    try {
      const backendUrl = getBackendUrl();
      const response = await fetch(`${backendUrl}/api/trial/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminEmail }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to resend OTP");
      }

      setError({
        message: `✓ Verification code resent to ${adminEmail}`,
      });
    } catch (err) {
      setError({
        message: "Failed to resend verification code",
        details: err instanceof Error ? err.message : "Please try again",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const formDataObj = new FormData();
      formDataObj.append("schoolName", schoolName);
      formDataObj.append("slug", slug);
      formDataObj.append("tagline", tagline);
      formDataObj.append("address", address);
      formDataObj.append("phone", phone);
      formDataObj.append("country", country);
      formDataObj.append("adminName", adminName);
      formDataObj.append("adminEmail", adminEmail);
      formDataObj.append("password", password);
      formDataObj.append("otp", otp);

      await verifySignupOtpAction(formDataObj);
    } catch (err) {
      // Don't show error for redirect - let Next.js handle the navigation
      if (err instanceof Error && (err.message === 'NEXT_REDIRECT' || (err as any).digest?.includes('NEXT_REDIRECT'))) {
        return; // Let the redirect happen silently
      }

      const errorMessage = err instanceof Error ? err.message : String(err);
      setError({
        message: errorMessage,
        details: errorMessage.includes("invalid")
          ? "Please check the verification code and try again."
          : errorMessage.includes("expired")
          ? "Your verification code has expired. Please go back and request a new one."
          : errorMessage,
      });
      setIsLoading(false);
    }
  }

  if (!adminEmail) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
        <div className="w-full max-w-xl border border-border bg-surface p-8">
          <div className="mb-6 flex justify-center">
            <AppLogo href="/" size="lg" />
          </div>
          <div className="rounded-xl border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-900">
            No signup email was provided in the verification link. Please go back to the{" "}
            <Link href="/signup" className="font-medium text-brand hover:underline">
              signup page
            </Link>{" "}
            and try again.
          </div>
        </div>
      </div>
    );
  }

  if (!pendingLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
        <div className="w-full max-w-xl border border-border bg-surface p-8">
          <div className="mb-6 flex justify-center">
            <AppLogo href="/" size="lg" />
          </div>
          <div className="h-8 w-32 animate-pulse rounded bg-border" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-xl border border-border bg-surface p-8">
        <div className="mb-6 flex justify-center">
          <AppLogo href="/" size="lg" />
        </div>
        
        {needsVerification ? (
          <>
            <p className="text-center text-xs font-bold uppercase tracking-[.16em] text-brand">SchoolBase onboarding</p>
            <h1 className="mt-3 text-center text-3xl font-semibold tracking-tight">Verify your email</h1>
            <p className="mt-2 text-center text-sm text-muted">
              We sent a verification code to <strong>{adminEmail}</strong>. Enter it below to complete your signup.
            </p>
          </>
        ) : (
          <>
            <p className="text-center text-xs font-bold uppercase tracking-[.16em] text-brand">SchoolBase onboarding</p>
            <h1 className="mt-3 text-center text-3xl font-semibold tracking-tight">Verify your signup</h1>
            <p className="mt-2 text-center text-sm text-muted">
              Enter the 6-digit code we sent to <strong>{adminEmail}</strong>.
            </p>
          </>
        )}

        {error && (
          <div className={`mt-4 border px-4 py-3 text-sm ${
            error.message.startsWith('✓')
              ? 'border border-green-300 bg-green-50 text-green-900'
              : 'border border-red-300 bg-red-50 text-red-900'
          }`}>
            {error.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <input name="schoolName" type="hidden" value={schoolName} />
          <input name="slug" type="hidden" value={slug} />
          <input name="tagline" type="hidden" value={tagline} />
          <input name="address" type="hidden" value={address} />
          <input name="phone" type="hidden" value={phone} />
          <input name="country" type="hidden" value={country} />
          <input name="adminName" type="hidden" value={adminName} />
          <input name="adminEmail" type="hidden" value={adminEmail} />
          <input name="password" type="hidden" value={password} />

          <label className="block text-sm font-medium">
            Verification code
            <input
              name="otp"
              type="text"
              inputMode="numeric"
              minLength={6}
              maxLength={6}
              autoComplete="one-time-code"
              required
              placeholder="123456"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              disabled={isLoading}
              className="mt-2 w-full border border-border bg-background px-3 py-3 text-center font-mono text-lg tracking-[.35em] focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:bg-background disabled:text-muted"
            />
          </label>

          <Button type="submit" className="w-full bg-brand py-3 font-semibold hover:bg-brand-hover" disabled={isLoading || otp.length !== 6}>
            {isLoading ? "Verifying..." : "Confirm and create account"}
          </Button>
        </form>

        <div className="mt-6 space-y-3 border-t border-border pt-6">
          <button
            type="button"
            onClick={handleResendOtp}
            disabled={isLoading || resendCooldown > 0}
            className="w-full border border-brand bg-brand/5 px-4 py-2.5 text-sm font-semibold text-brand hover:bg-brand/10 disabled:bg-background disabled:text-muted"
          >
            {resendCooldown > 0
              ? `Resend code in ${resendCooldown}s`
              : "Didn't receive code? Resend"}
          </button>

          {!needsVerification && (
            <p className="text-center text-sm text-muted">
              Go back to{" "}
              <Link href="/signup" className="font-medium text-brand hover:underline">
                signup
              </Link>
            </p>
          )}
        </div>
      </div>

      <ErrorModal
        isOpen={!!(error && error.message && error.message.startsWith('Failed'))}
        onClose={() => setError(null)}
        title="Verification Error"
        message={error?.message || ""}
        details={error?.details}
        type="error"
      />
    </div>
  );
}
