"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { HelpCircle, MailPlus, MessageCircle, PlusCircle, X } from "lucide-react";
import { getBackendUrl } from "@/lib/backend-url";
import SupportRequestsClient from "./support-requests-client";
import PlatformSupportChatClient from "./platform-support-chat-client";

type SchoolOption = { id: string; name: string; email?: string | null; country?: string | null };

export default function SupportPage() {
  const [view, setView] = useState<"chat" | "tickets">("chat");
  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState("");
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [newTicketTitle, setNewTicketTitle] = useState("");
  const [newTicketDescription, setNewTicketDescription] = useState("");
  const [newTicketPriority, setNewTicketPriority] = useState("MEDIUM");
  const [newTicketBusy, setNewTicketBusy] = useState(false);
  const [newTicketError, setNewTicketError] = useState("");

  useEffect(() => {
    async function loadSchools() {
      try {
        const response = await fetch(`${getBackendUrl()}/schoolbase-admin/api/schools?limit=200`, { credentials: "include" });
        if (!response.ok) return;
        const data = (await response.json()) as { schools?: Array<{ id: string; name: string; email?: string | null; country?: string | null }> };
        const nextSchools = Array.isArray(data?.schools) ? data.schools : [];
        setSchools(nextSchools.map((school) => ({ id: school.id, name: school.name, email: school.email, country: school.country })));
        if (nextSchools.length > 0 && !selectedSchoolId) {
          setSelectedSchoolId(nextSchools[0].id);
        }
      } catch (error) {
        console.error("Unable to load schools for ticket creation:", error);
      }
    }

    void loadSchools();
  }, [selectedSchoolId]);

  const handleCreateTicket = async () => {
    if (!selectedSchoolId) {
      setNewTicketError("Please pick the school this ticket belongs to.");
      return;
    }

    if (!newTicketTitle.trim()) {
      setNewTicketError("Please add a ticket title first.");
      return;
    }

    if (!newTicketDescription.trim()) {
      setNewTicketError("Please add ticket details so the school support team knows what to do.");
      return;
    }

    setNewTicketBusy(true);
    setNewTicketError("");

    try {
      const response = await fetch(`${getBackendUrl()}/schoolbase-admin/api/support/requests`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schoolId: selectedSchoolId,
          subject: newTicketTitle.trim(),
          message: newTicketDescription.trim(),
          priority: newTicketPriority,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.message || "Unable to create school ticket.");
      }

      setShowNewTicketModal(false);
      setView("tickets");
      setNewTicketTitle("");
      setNewTicketDescription("");
      setNewTicketPriority("MEDIUM");
    } catch (error) {
      setNewTicketError(error instanceof Error ? error.message : "Unable to create school ticket.");
    } finally {
      setNewTicketBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-2 py-6 sm:px-8 sm:py-8 lg:px-12 [&_button:not(:disabled)]:cursor-pointer [&_a]:cursor-pointer">
      <style>{`@keyframes support-page-pulse { 0%,100% { opacity: 1; box-shadow: 0 0 0 0 rgb(10 102 194 / .4) } 50% { opacity: .55; box-shadow: 0 0 0 7px rgb(10 102 194 / 0) } } @keyframes support-page-scan { from { transform: translateX(-100%) } to { transform: translateX(100%) } } .support-page-hero { position: relative; overflow: hidden; } .support-page-scan { position: absolute; inset: 0 auto 0 0; width: 33%; background: linear-gradient(to right, transparent, rgb(10 102 194 / .10), transparent); animation: support-page-scan 3.2s linear infinite; pointer-events: none; } .support-page-pulse { animation: support-page-pulse 0.9s ease-in-out infinite; }`}</style>

      <header className="support-page-hero relative overflow-hidden border border-border bg-surface px-6 pb-8 pt-8 sm:px-8 sm:pb-10 sm:pt-10">
        <div className="support-page-scan" />
        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-brand">
              <span className="support-page-pulse h-2.5 w-2.5 rounded-full bg-brand" />
              Support operations
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Support</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Manage in-app school conversations and existing support tickets.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/schoolbase-admin/email-center" className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-brand transition hover:bg-brand-light"><MailPlus className="h-4 w-4" /> Email center</Link>
            <button type="button" onClick={() => setShowNewTicketModal(true)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover"><PlusCircle className="h-4 w-4" /> Create school ticket</button>
          </div>
        </div>
      </header>

      <div className="flex gap-2 border-b border-border">
        <button type="button" onClick={() => setView("chat")} className={`inline-flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-semibold ${view === "chat" ? "border-brand text-brand" : "border-transparent text-muted hover:text-foreground"}`}><MessageCircle className="h-4 w-4" /> Chat</button>
        <button type="button" onClick={() => setView("tickets")} className={`inline-flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-semibold ${view === "tickets" ? "border-brand text-brand" : "border-transparent text-muted hover:text-foreground"}`}><HelpCircle className="h-4 w-4" /> Tickets</button>
      </div>

      {showNewTicketModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4" onClick={() => setShowNewTicketModal(false)}>
          <div className="w-full max-w-xl overflow-hidden border border-border bg-surface shadow-[0_16px_50px_rgba(10,102,194,0.16)]" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4 border-b border-border/70 bg-brand/10 px-4 py-4 sm:px-6 sm:py-5">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.12em] text-brand"><PlusCircle className="h-4 w-4" /> School ticket</div>
                <h2 className="mt-2 text-2xl font-bold text-foreground">Create a school support ticket</h2>
                <p className="mt-1 text-sm text-muted">This creates a real support case for the selected school in the current support system.</p>
              </div>
              <button type="button" onClick={() => setShowNewTicketModal(false)} className="flex h-8 w-8 items-center justify-center rounded-md border border-border transition-colors hover:bg-background" aria-label="Close ticket dialog"><X className="h-4 w-4" /></button>
            </div>

            <div className="space-y-4 p-4 sm:p-6">
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">School</label>
                <select value={selectedSchoolId} onChange={(event) => setSelectedSchoolId(event.target.value)} className="w-full border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-brand">
                  <option value="">Select a school</option>
                  {schools.map((school) => (
                    <option key={school.id} value={school.id}>{school.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Title</label>
                <input value={newTicketTitle} onChange={(event) => setNewTicketTitle(event.target.value)} placeholder="e.g. SMS gateway failing on new admissions" className="w-full border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-brand" />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Description</label>
                <textarea value={newTicketDescription} onChange={(event) => setNewTicketDescription(event.target.value)} placeholder="Add context, impact, owner, and next step..." className="min-h-[120px] w-full border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-brand" />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Priority</label>
                <select value={newTicketPriority} onChange={(event) => setNewTicketPriority(event.target.value)} className="w-full border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-brand">
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>

              {newTicketError ? <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{newTicketError}</div> : null}

              <div className="flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => setShowNewTicketModal(false)} className="rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-foreground">Cancel</button>
                <button type="button" disabled={newTicketBusy || !selectedSchoolId || !newTicketTitle.trim() || !newTicketDescription.trim()} onClick={() => void handleCreateTicket()} className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{newTicketBusy ? "Creating..." : "Create ticket"}</button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {view === "chat" ? <PlatformSupportChatClient /> : <SupportRequestsClient initialRequests={[]} />}
    </div>
  );
}
