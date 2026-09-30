"use client";

import { useState } from "react";
import Link from "next/link";
import { HelpCircle, MailPlus, MessageCircle, PlusCircle } from "lucide-react";
import SupportRequestsClient from "./support-requests-client";
import PlatformSupportChatClient from "./platform-support-chat-client";

export default function SupportPage() {
  const [view, setView] = useState<"chat" | "tickets">("chat");

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-2 py-6 sm:px-8 sm:py-8 lg:px-12">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-brand"><HelpCircle size={17} /> Support operations</div>
          <h1 className="mt-2 text-3xl font-bold text-foreground">Support</h1>
          <p className="mt-1 text-muted">Manage in-app school conversations and existing support tickets.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/schoolbase-admin/email-center" className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-brand transition hover:bg-brand-light"><MailPlus className="h-4 w-4" /> Email center</Link>
          <button type="button" className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover"><PlusCircle className="h-4 w-4" /> New ticket</button>
        </div>
      </div>
      <div className="flex gap-2 border-b border-border">
        <button type="button" onClick={() => setView("chat")} className={`inline-flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-semibold ${view === "chat" ? "border-brand text-brand" : "border-transparent text-muted hover:text-foreground"}`}><MessageCircle className="h-4 w-4" /> Chat</button>
        <button type="button" onClick={() => setView("tickets")} className={`inline-flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-semibold ${view === "tickets" ? "border-brand text-brand" : "border-transparent text-muted hover:text-foreground"}`}><HelpCircle className="h-4 w-4" /> Tickets</button>
      </div>
      {view === "chat" ? <PlatformSupportChatClient /> : <SupportRequestsClient initialRequests={[]} />}
    </div>
  );
}
