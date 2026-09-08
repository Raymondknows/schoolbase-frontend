import {
  Bell,
  Globe,
  GraduationCap,
  MessageCircle,
  Receipt,
  Sparkles,
} from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AppLogo } from "@/components/app-logo";
import { CountrySelectModal } from "@/components/country-select-modal";
import { OfferPopup } from "@/components/offer-popup";
import countriesJson from "../../config/countries.json";
import { getCountryFromHeaders } from "@/lib/country";
import { getParentSession, getStaffSession } from "@/lib/auth";
import { getBackendUrl } from "@/lib/backend-url";

const features = [
  {
    icon: Receipt,
    title: "Track every fee",
    text: "Send bills, record cash and bank payments, print receipts, and show parents their balance.",
  },
  {
    icon: MessageCircle,
    title: "Reach parents instantly",
    text: "Fee reminders and alerts on WhatsApp and SMS — the way parents actually read messages.",
  },
  {
    icon: GraduationCap,
    title: "Publish results in minutes",
    text: "Enter marks, approve, and release to parents with one click. No more leaks or confusion.",
  },
  {
    icon: Globe,
    title: "Your school website included",
    text: "News, admissions, and contact — modern and mobile-friendly. No separate Wix bill.",
  },
  {
    icon: Bell,
    title: "Attendance parents notice",
    text: "When a child is absent, parents know right away.",
  },
  {
    icon: Sparkles,
    title: "Live in in a few minutes",
    text: "We help you set up fast. No six-month IT project.",
  },
];

async function getCountryConfig() {
  const headersList = await headers();
  const cookieHeader = headersList.get("cookie");
  const acceptLanguage = headersList.get("accept-language");
  const geoCountry =
    headersList.get("x-vercel-ip-country") ||
    headersList.get("cf-ipcountry") ||
    headersList.get("x-appengine-country") ||
    headersList.get("x-country") ||
    headersList.get("x-country-code") ||
    headersList.get("x-forwarded-country") ||
    headersList.get("x-real-country") ||
    headersList.get("x-geo-country") ||
    headersList.get("x-edge-country") ||
    headersList.get("x-geoip-country");
  const country = await getCountryFromHeaders(cookieHeader, acceptLanguage, geoCountry);
  const defaultCountry = (countriesJson as any).default;
  const countries = (countriesJson as any).countries;
  const countryKey = country || defaultCountry;
  const config = countries[countryKey] || countries[defaultCountry];
  return { country: countryKey, config };
}

async function getPublicPricing() {
  try {
    const response = await fetch(`${getBackendUrl()}/api/pricing`, { cache: "no-store" });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

export default async function HomePage() {
  const staffSession = await getStaffSession();
  if (staffSession) {
    if (staffSession.role === "PLATFORM_ADMIN") {
      redirect("/schoolbase-admin");
    }
    if (staffSession.role === "TEACHER") {
      redirect("/teacher");
    }
    redirect("/admin");
  }

  const parentSession = await getParentSession();
  if (parentSession) {
    redirect("/parent");
  }
  const [{ country, config }, pricingData] = await Promise.all([getCountryConfig(), getPublicPricing()]);
  const configuredPlans = pricingData?.plans;
  const starterPlan = configuredPlans?.starter || config.plans.starter;
  const standardPlan = configuredPlans?.standard || config.plans.standard;
  const groupPlan = configuredPlans?.group || config.plans.group;
  const plans = [
    { name: starterPlan.label || "Starter", pupils: starterPlan.studentLimit ? `Up to ${starterPlan.studentLimit.toLocaleString()} pupils` : "Unlimited pupils", price: starterPlan.priceLabel },
    { name: standardPlan.label || "Standard", pupils: standardPlan.studentLimit ? `Up to ${standardPlan.studentLimit.toLocaleString()} pupils` : "Unlimited pupils", price: standardPlan.priceLabel },
    { name: groupPlan.label || "Group", pupils: groupPlan.studentLimit ? `Up to ${groupPlan.studentLimit.toLocaleString()} pupils` : "Multiple campuses", price: groupPlan.priceLabel },
  ];
  const starterPriceLabel = starterPlan.priceLabel;
  const standardPriceLabel = standardPlan.priceLabel;
  const countryLabel = config.name || country;

  return (
    <div className="bg-background">
      <section className="border-b border-border bg-surface">
        <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
          <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight text-foreground md:text-5xl md:leading-tight">
            Everything your school needs in one simple platform
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
            Manage fees, engage parents on WhatsApp, publish results, and deliver
            a professional digital experience for your school, all in one place.
            Start with a <strong className="text-foreground">7-day free trial</strong> and
            move your school forward with confidence.
          </p>
          <div className="mt-10 flex flex-wrap gap-4" id="start">
            <Button href="/login">School login</Button>
            <Button variant="secondary" href="/parent/login">
              Parent login
            </Button>
          </div>
        </div>
      </section>

      <section id="features" className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-2xl font-bold text-foreground md:text-3xl">
            Built for school owners, not IT departments
          </h2>
          <p className="mt-3 max-w-xl text-muted">
            Smart behind the scenes. Simple on your screen.
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, text }) => (
              <article
                key={title}
                className="rounded-xl border border-border bg-surface p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-light text-brand">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-foreground">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        id="pricing"
        className="border-y border-border bg-surface py-20"
      >
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-2xl font-bold text-foreground md:text-3xl">
            One plan. Everything included.
          </h2>
          <p className="mt-3 text-muted">
            SchoolBase All-In — no hidden modules. Pricing shown for {countryLabel}. Pay per term for a premium operating system for your school, with annual billing available for schools that want continuity and savings.
          </p>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-xl border p-8 ${
                  plan.name === "Standard"
                    ? "border-brand bg-brand-light shadow-md"
                    : "border-border bg-background"
                }`}
              >
                <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                <p className="mt-1 text-sm text-muted">{plan.pupils}</p>
                <p className="mt-6 text-2xl font-bold text-brand">{plan.price}</p>
                <ul className="mt-6 space-y-2 text-sm text-muted">
                  <li>✓ Fees & receipts</li>
                  <li>✓ WhatsApp & SMS</li>
                  <li>✓ Results & reports</li>
                  <li>✓ School website</li>
                  <li>✓ Parent app</li>
                </ul>
                <Button
                  href={plan.name === "Standard" ? "#buy" : `/purchase?plan=${plan.name.toLowerCase()}`}
                  variant={plan.name === "Standard" ? "primary" : "secondary"}
                  className="mt-8 w-full"
                >
                  {plan.name === "Standard" ? "Buy now" : "Choose plan"}
                </Button>
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-muted">
            Premium school operations start here: 48-hour setup guarantee · onboarding support included · no hidden add-ons
          </p>
        </div>
      </section>

      <section id="buy" className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="rounded-3xl border border-border bg-surface shadow-sm">
            <div className="grid gap-0 lg:grid-cols-2">
              {/* Left column: copy */}
              <div className="p-6 sm:p-8 lg:p-10">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">
                  Buy subscription now
                </p>
                <h2 className="mt-4 text-3xl font-bold leading-tight text-foreground sm:text-4xl">
                  Secure your subscription and begin onboarding today.
                </h2>
                <p className="mt-5 text-base leading-7 text-muted">
                  Choose your plan and complete the checkout with Paystack. Our team will confirm your school setup immediately and help you go live with confidence.
                </p>
                <ul className="mt-8 space-y-3 text-sm text-muted">
                  <li>✓ Instant Paystack checkout</li>
                  <li>✓ {starterPriceLabel} starter plan</li>
                  <li>✓ ClickBase Technologies Ltd payment collection</li>
                </ul>
                <div className="mt-10">
                  <Button href="/signup" className="w-full sm:w-auto">
                      Get started
                    </Button>
                </div>
              </div>

              {/* Right column: visual */}
              <div className="flex items-center justify-center bg-brand-light p-6 sm:p-8 lg:p-10">
                <div className="text-center">
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-brand text-white">
                    <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="mt-4 text-lg font-semibold text-foreground">Ready to launch?</p>
                  <p className="mt-2 text-sm text-muted">Click Get Started to complete your subscription.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-brand py-16 text-white">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <h2 className="text-2xl font-bold md:text-3xl">
            Ready before the new term?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-brand-light">
            Stop fee leakage. Give parents WhatsApp reminders and professional
            receipts. Publish results without the end-of-term chaos.
          </p>
          <Button
            href="/login"
            className="mt-8 !bg-white !text-brand hover:!bg-brand-light"
          >
            Book a 15-minute demo
          </Button>
        </div>
      </section>
      <CountrySelectModal />
    </div>
  );
}
