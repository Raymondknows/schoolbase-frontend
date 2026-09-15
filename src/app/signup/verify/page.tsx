import { Suspense } from "react";
import { VerifySignupClient } from "@/components/signup/verify-client";
import { AppLogo } from "@/components/app-logo";

function VerifyLoadingFallback() {
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

export default function VerifySignupPage() {
  return (
    <Suspense fallback={<VerifyLoadingFallback />}>
      <VerifySignupClient />
    </Suspense>
  );
}
