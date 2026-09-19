"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, BadgeCheck, Megaphone, ShieldCheck } from "lucide-react";

const placementOptions = [
  { value: "LOGIN_PAGE_BANNER", label: "Staff login banner" },
  { value: "PUBLIC_PARTNER_STRIP", label: "Public partner strip" },
  { value: "RESOURCE_SPONSOR", label: "Blog and resource sponsor" },
  { value: "PARENT_LOGIN_BANNER", label: "Parent login banner" },
  { value: "RESULTS_CHECKER_SPONSOR", label: "Results checker sponsor" },
  { value: "SIGNUP_PARTNER_STRIP", label: "School signup partner strip" },
];

export default function AdvertisePage() {
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const formData = new FormData(event.currentTarget);
    const placementTypes = formData.getAll("placementTypes");
    const payload = Object.fromEntries(formData.entries());
    try {
      const response = await fetch("/api/ads/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, placementTypes }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to submit application.");
      setSubmitted(true);
      event.currentTarget.reset();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to submit application.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-8 sm:py-12">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[.8fr_1.2fr]">
        <section className="border border-border bg-surface p-6 sm:p-10">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-brand"><Megaphone className="h-4 w-4" /> SchoolBase partners</div>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight">Reach the people building better schools.</h1>
          <p className="mt-5 text-sm leading-7 text-muted">Apply for a carefully reviewed placement across SchoolBase. We work with education brands, school suppliers, learning providers, event organisers, and scholarship partners.</p>
          <div className="mt-8 space-y-3 text-sm text-muted"><div className="flex gap-3 border border-border bg-background p-4"><ShieldCheck className="h-5 w-5 shrink-0 text-brand" /><span>Every campaign is reviewed before it appears.</span></div><div className="flex gap-3 border border-border bg-background p-4"><BadgeCheck className="h-5 w-5 shrink-0 text-brand" /><span>Placement and pricing are agreed with our team before launch.</span></div></div>
        </section>

        <section className="border border-border bg-surface p-6 sm:p-10">
          {submitted ? <div className="py-10 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"><BadgeCheck className="h-6 w-6" /></div><h2 className="mt-5 text-2xl font-semibold">Application received</h2><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted">Our team will review your details and contact you about suitability, placement, pricing, and next steps.</p><button type="button" onClick={() => setSubmitted(false)} className="mt-6 text-sm font-semibold text-brand hover:underline">Submit another application</button></div> : <><div><p className="text-xs font-bold uppercase tracking-[.14em] text-brand">Advertise with SchoolBase</p><h2 className="mt-2 text-2xl font-semibold">Tell us about your campaign</h2><p className="mt-2 text-sm leading-6 text-muted">This is an application for review, not an automatic publication or payment.</p></div><form onSubmit={handleSubmit} className="mt-7 space-y-5"><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium">Company name<input required name="companyName" className="mt-2 w-full border border-border bg-background px-3 py-3 text-sm" placeholder="BrightPath Learning" /></label><label className="text-sm font-medium">Contact name<input required name="contactName" className="mt-2 w-full border border-border bg-background px-3 py-3 text-sm" placeholder="Amina Yusuf" /></label></div><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium">Email<input required type="email" name="email" className="mt-2 w-full border border-border bg-background px-3 py-3 text-sm" placeholder="hello@company.com" /></label><label className="text-sm font-medium">Phone<input name="phone" className="mt-2 w-full border border-border bg-background px-3 py-3 text-sm" placeholder="+234 800 000 0000" /></label></div><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium">Website<input name="website" type="url" className="mt-2 w-full border border-border bg-background px-3 py-3 text-sm" placeholder="https://company.com" /></label><label className="text-sm font-medium">Category<input name="category" className="mt-2 w-full border border-border bg-background px-3 py-3 text-sm" placeholder="Digital education" /></label></div><label className="block text-sm font-medium">Campaign title<input required name="campaignTitle" className="mt-2 w-full border border-border bg-background px-3 py-3 text-sm" placeholder="Learning resources for every term" /></label><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium">Landing page URL<input required type="url" name="landingUrl" className="mt-2 w-full border border-border bg-background px-3 py-3 text-sm" placeholder="https://company.com/schoolbase" /></label><label className="text-sm font-medium">Budget range<input name="budget" type="number" min="0" className="mt-2 w-full border border-border bg-background px-3 py-3 text-sm" placeholder="Discuss with us" /></label></div><label className="block text-sm font-medium">Short description<textarea name="summary" className="mt-2 min-h-24 w-full border border-border bg-background px-3 py-3 text-sm" placeholder="What should schools or families know?" /></label><fieldset><legend className="text-sm font-medium">Preferred placements</legend><div className="mt-3 grid gap-3 sm:grid-cols-2">{placementOptions.map((option) => <label key={option.value} className="flex items-center gap-2 text-sm text-muted"><input type="checkbox" name="placementTypes" value={option.value} />{option.label}</label>)}</div></fieldset>{error && <p className="border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800">{error}</p>}<button disabled={saving} type="submit" className="inline-flex w-full items-center justify-center gap-2 bg-brand px-4 py-3 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-50">{saving ? "Sending application..." : "Submit for review"}<ArrowRight className="h-4 w-4" /></button></form></>}
        </section>
      </div>

      <section className="mx-auto mt-10 max-w-6xl border-t border-border pt-10">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[.16em] text-brand">Education advertising partnerships</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">A trusted way to reach schools, educators, and families</h2>
          <p className="mt-3 text-sm leading-7 text-muted">SchoolBase connects school leaders, teachers, parents, and education communities across West Africa. Our partner placements are designed for useful, relevant messages rather than interruptive advertising.</p>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <article className="border border-border bg-surface p-5"><h3 className="font-semibold">School suppliers</h3><p className="mt-2 text-sm leading-6 text-muted">Promote uniforms, books, furniture, transport, facilities, and services built for school communities.</p></article>
          <article className="border border-border bg-surface p-5"><h3 className="font-semibold">Learning providers</h3><p className="mt-2 text-sm leading-6 text-muted">Reach schools and families looking for tutoring, digital learning, assessment, teacher training, and academic support.</p></article>
          <article className="border border-border bg-surface p-5"><h3 className="font-semibold">Events and scholarships</h3><p className="mt-2 text-sm leading-6 text-muted">Share carefully reviewed education events, scholarship opportunities, and school-focused programmes.</p></article>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <article className="border border-border bg-background p-5"><h3 className="font-semibold">Who can apply?</h3><p className="mt-2 text-sm leading-6 text-muted">Education-relevant organisations with a clear offer for schools, parents, educators, or students.</p></article>
          <article className="border border-border bg-background p-5"><h3 className="font-semibold">How does approval work?</h3><p className="mt-2 text-sm leading-6 text-muted">We verify the advertiser, review the creative and landing page, agree placement and pricing, then schedule the campaign.</p></article>
          <article className="border border-border bg-background p-5"><h3 className="font-semibold">How is pricing set?</h3><p className="mt-2 text-sm leading-6 text-muted">Pricing depends on placement, audience, duration, creative requirements, and campaign scope. Our team confirms it before launch.</p></article>
        </div>
      </section>
    </main>
  );
}
