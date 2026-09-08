"use client";

import { Download, X } from "lucide-react";
import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

declare global {
  interface Window {
    deferredInstallPrompt?: BeforeInstallPromptEvent;
    MSStream?: unknown;
  }
}

function isInstalled() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    ("standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
  );
}

export default function PwaInstallPrompt() {
  const [mounted, setMounted] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installUnavailable, setInstallUnavailable] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isInstalled()) {
      setInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      const prompt = event as BeforeInstallPromptEvent;
      window.deferredInstallPrompt = prompt;
      setInstallPrompt(prompt);
    };

    const handleAppInstalled = () => {
      window.deferredInstallPrompt = undefined;
      setInstallPrompt(null);
      setInstalled(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) {
      setInstallUnavailable(true);
      return;
    }

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setInstallPrompt(null);
    }
  };

  if (!mounted || installed) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[60] print:hidden">
      {installUnavailable && (
        <p
          className="absolute bottom-full right-0 mb-2 w-64 rounded-lg border border-border bg-white px-3 py-2 text-xs leading-5 text-muted shadow-md"
          role="status"
        >
          Native installation is unavailable in this browser. Open SchoolBase in Chrome or Edge to install it from this button.
        </p>
      )}
      <div className="flex items-center gap-1 rounded-lg border border-brand/20 bg-white/95 p-1 shadow-md backdrop-blur">
      <button
        type="button"
        onClick={handleInstall}
        aria-label="Install SchoolBase"
        className="inline-flex items-center gap-1.5 rounded-md bg-brand px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-hover"
      >
        <Download className="h-3.5 w-3.5" aria-hidden="true" />
        Install SchoolBase
      </button>
      <button
        type="button"
        onClick={() => setInstallPrompt(null)}
        aria-label="Dismiss install prompt"
        className="rounded-md p-1.5 text-muted transition-colors hover:bg-brand-light hover:text-foreground"
      >
        <X className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
      </div>
    </div>
  );
}