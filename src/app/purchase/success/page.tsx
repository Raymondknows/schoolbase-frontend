import { AppLogo } from "@/components/app-logo";
import { Button } from "@/components/ui/button";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Purchase Confirmed | SchoolBase",
  description: "Your SchoolBase subscription purchase has been received.",
};

export default function PurchaseSuccessPage() {
  const bankAccountName = process.env.BANK_ACCOUNT_NAME ?? process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME;
  const bankAccountNumber = process.env.BANK_ACCOUNT_NUMBER ?? process.env.NEXT_PUBLIC_BANK_ACCOUNT_NUMBER;
  const bankName = process.env.BANK_NAME ?? process.env.NEXT_PUBLIC_BANK_NAME;
  return (
    <div className="min-h-screen bg-[#f6faff]">
      <header className="sticky top-0 z-50 border-b border-border bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <AppLogo />
          <nav className="hidden items-center gap-6 text-sm font-medium text-muted md:flex">
            <a href="/" className="hover:text-brand">
              Home
            </a>
            <a href="/demo" className="hover:text-brand">
              Demo
            </a>
            <a href="/purchase" className="hover:text-brand">
              Buy subscription
            </a>
            <a href="/login" className="hover:text-brand">
              Sign in
            </a>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-20">
        <div className="border border-border bg-white p-8 shadow-sm sm:p-12">
          <div className="space-y-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-light text-brand">
              <span className="text-2xl text-brand">✓</span>
            </div>
            <h1 className="text-3xl font-bold text-foreground">Payment successful</h1>
            <p className="mx-auto max-w-2xl text-sm leading-6 text-muted">
              Your subscription purchase is confirmed. Payment was made to ClickBase Technologies Ltd. We’ve sent a confirmation email to the address you provided, and our onboarding team will contact you shortly.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Button href="/">Return to home</Button>
              <Button variant="secondary" href="/login">
                Sign in to admin dashboard
              </Button>
            </div>
            {bankAccountNumber ? (
              <div className="mx-auto mt-6 max-w-2xl rounded-lg border border-border bg-background p-4 text-sm">
                <p className="font-semibold">Alternative payment option</p>
                <p className="mt-2 text-sm text-muted">
                  If you prefer to pay by bank transfer, use the account details below and write your school name as the payment description. After sending your payment, please email your receipt to <a className="text-brand" href="mailto:sales@schoolbase.live">sales@schoolbase.live</a> so we can confirm receipt and continue onboarding.
                </p>
                <div className="mt-3 text-xs">
                  <div><strong>Account name:</strong> {bankAccountName}</div>
                  <div><strong>Account number:</strong> {bankAccountNumber}</div>
                  <div><strong>Bank:</strong> {bankName}</div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
}
