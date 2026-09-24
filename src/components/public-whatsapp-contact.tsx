"use client";

import { WhatsAppIcon } from "@/components/ui/icons";

const WHATSAPP_URL = "https://wa.me/2349032250338?text=Hello%20SchoolBase%2C%20I%27d%20like%20to%20learn%20more%20about%20using%20SchoolBase%20for%20my%20school.";

export default function PublicWhatsAppContact() {
  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with SchoolBase on WhatsApp"
      title="Chat with SchoolBase on WhatsApp"
      className="group fixed bottom-20 right-4 z-50 inline-flex h-16 w-16 items-center justify-center text-[#128C7E] drop-shadow-[0_5px_10px_rgba(18,140,126,0.24)] transition hover:text-[#075E54] hover:drop-shadow-[0_7px_14px_rgba(18,140,126,0.3)] focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:ring-offset-2 sm:bottom-20 sm:right-5"
    >
      <span className="pointer-events-none absolute right-full mr-3 flex translate-x-2 flex-col whitespace-nowrap text-left opacity-0 drop-shadow-[0_1px_2px_rgba(255,255,255,0.9)] transition duration-200 group-hover:translate-x-0 group-hover:opacity-100 group-focus:translate-x-0 group-focus:opacity-100">
        <strong className="text-xs font-semibold text-foreground">Chat with SchoolBase</strong>
        <em className="mt-0.5 text-[11px] font-normal not-italic text-muted">We&apos;re happy to help</em>
      </span>
      <WhatsAppIcon
        className="!h-14 !w-14"
        style={{ height: "56px", width: "56px" }}
        aria-hidden="true"
      />
      <span className="sr-only">Open WhatsApp chat</span>
    </a>
  );
}
