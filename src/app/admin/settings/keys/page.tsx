import { getCurrentSchool } from "@/lib/school";
// Avoid reading local config files from frontend; query backend for per-school config instead.

export default async function KeysDebugPage() {
  const school = await getCurrentSchool();
  const schoolId = school.id;

  let parsed: any = null;
  try {
    const backend = process.env.BACKEND_URL || process.env.API_URL || "http://127.0.0.1:3006";
    const res = await fetch(`${backend.replace(/\/$/, '')}/api/admin/settings/data?schoolId=${encodeURIComponent(schoolId)}`);
    if (res.ok) {
      const json = await res.json();
      parsed = json?.config ?? null;
    }
  } catch (err) {
    parsed = null;
  }

  const env = {
    paystackPublic: Boolean(process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY),
    paystackSecret: Boolean(process.env.PAYSTACK_SECRET_KEY),
    twilioSid: Boolean(process.env.TWILIO_ACCOUNT_SID),
    twilioToken: Boolean(process.env.TWILIO_AUTH_TOKEN),
    whatsappFrom: Boolean(process.env.WHATSAPP_FROM),
  };

  const perSchool = {
    paystackPublic: Boolean(parsed?.paystackPublic),
    paystackSecret: Boolean(parsed?.paystackSecret),
    twilioSid: Boolean(parsed?.twilioSid),
    twilioToken: Boolean(parsed?.twilioToken),
    whatsappFrom: Boolean(parsed?.whatsappFrom),
  };

  const effectivePaystack = perSchool.paystackSecret || perSchool.paystackPublic ? "per-school" : env.paystackSecret && env.paystackPublic ? "env" : "none";
  const effectiveTwilio = perSchool.twilioSid || perSchool.twilioToken || perSchool.whatsappFrom ? "per-school" : env.twilioSid && env.twilioToken && env.whatsappFrom ? "env" : "none";

  return (
    <main className="min-h-screen pb-12">
    <div className="mx-auto max-w-7xl space-y-6 px-0 py-4 sm:px-8 sm:py-8 lg:px-12">
      <header className="relative overflow-hidden border border-border bg-surface px-6 pb-7 pt-8 sm:px-8 sm:pb-8 sm:pt-10">
        <div className="absolute right-0 top-0 h-full w-1/3 bg-brand-light/40 [clip-path:polygon(35%_0,100%_0,100%_100%,0_100%)]" />
        <div className="relative">
          <div className="text-xs font-bold uppercase tracking-[.16em] text-brand">System diagnostics</div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Integration keys</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Review whether integrations are configured per school or through the environment. No secrets are shown.</p>
        </div>
      </header>

      <section className="border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold">Paystack</h2>
        <p className="mt-2 text-sm">Effective source: <strong>{effectivePaystack}</strong></p>
        <dl className="mt-4 grid grid-cols-1 gap-2 text-sm">
          <div className="flex justify-between text-muted">
            <dt>Per-school public key</dt>
            <dd className="font-medium">{perSchool.paystackPublic ? "present" : "missing"}</dd>
          </div>
          <div className="flex justify-between text-muted">
            <dt>Per-school secret key</dt>
            <dd className="font-medium">{perSchool.paystackSecret ? "present (masked)" : "missing"}</dd>
          </div>
          <div className="flex justify-between text-muted">
            <dt>Env public key</dt>
            <dd className="font-medium">{env.paystackPublic ? "present" : "missing"}</dd>
          </div>
          <div className="flex justify-between text-muted">
            <dt>Env secret key</dt>
            <dd className="font-medium">{env.paystackSecret ? "present" : "missing"}</dd>
          </div>
        </dl>
        <p className="mt-4 text-xs text-muted">Config source: {parsed ? "backend (per-school)" : "none"}</p>
      </section>

      <section className="border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold">Twilio / WhatsApp</h2>
        <p className="mt-2 text-sm">Effective source: <strong>{effectiveTwilio}</strong></p>
        <dl className="mt-4 grid grid-cols-1 gap-2 text-sm">
          <div className="flex justify-between text-muted">
            <dt>Per-school Twilio SID</dt>
            <dd className="font-medium">{perSchool.twilioSid ? "present" : "missing"}</dd>
          </div>
          <div className="flex justify-between text-muted">
            <dt>Per-school Twilio token</dt>
            <dd className="font-medium">{perSchool.twilioToken ? "present (masked)" : "missing"}</dd>
          </div>
          <div className="flex justify-between text-muted">
            <dt>Per-school WhatsApp from</dt>
            <dd className="font-medium">{perSchool.whatsappFrom ? "present" : "missing"}</dd>
          </div>
          <div className="flex justify-between text-muted">
            <dt>Env Twilio SID</dt>
            <dd className="font-medium">{env.twilioSid ? "present" : "missing"}</dd>
          </div>
          <div className="flex justify-between text-muted">
            <dt>Env Twilio token</dt>
            <dd className="font-medium">{env.twilioToken ? "present" : "missing"}</dd>
          </div>
          <div className="flex justify-between text-muted">
            <dt>Env WhatsApp from</dt>
            <dd className="font-medium">{env.whatsappFrom ? "present" : "missing"}</dd>
          </div>
        </dl>
        <p className="mt-4 text-xs text-muted">Config source: {parsed ? "backend (per-school)" : "none"}</p>
      </section>
    </div>
    </main>
  );
}
