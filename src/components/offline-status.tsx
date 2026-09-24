"use client";

import { CheckCircle2, X } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

const subscribeToConnection = (onChange: () => void) => {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);

  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
};

const getConnectionState = () => navigator.onLine;
const getServerConnectionState = () => true;

export default function OfflineStatus() {
  const isOnline = useSyncExternalStore(
    subscribeToConnection,
    getConnectionState,
    getServerConnectionState,
  );
  const wasOffline = useRef(false);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      wasOffline.current = true;
      return;
    }

    if (wasOffline.current) {
      setShowReconnected(true);
      wasOffline.current = false;
    }
  }, [isOnline]);

  useEffect(() => {
    if (!showReconnected) return;

    const timeoutId = window.setTimeout(() => setShowReconnected(false), 5000);
    return () => window.clearTimeout(timeoutId);
  }, [showReconnected]);

  if (isOnline && !showReconnected) return null;

  const isOffline = !isOnline;

  return (
    <div
      className="fixed inset-x-3 top-3 z-[100] sm:left-auto sm:right-4 sm:max-w-md"
      role="status"
      aria-live="polite"
    >
      <div
        className={`overflow-hidden border border-border border-l-4 bg-surface shadow-[0_14px_36px_rgba(10,102,194,0.14)] ${isOffline ? "border-l-brand" : "border-l-success"}`}
      >
        <div className="flex items-start gap-4 border-b border-border bg-background px-5 py-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand">SchoolBase</p>
              <span className={`text-[9px] font-semibold uppercase tracking-[0.12em] ${isOffline ? "text-brand" : "text-success"}`}>
                {isOffline ? "Offline" : "Connected"}
              </span>
            </div>
            <p className="mt-1 text-lg font-semibold tracking-tight text-foreground">
              {isOffline ? "You are offline" : "Back online"}
            </p>
          </div>
          {!isOffline && <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-success" aria-hidden="true" />}
        </div>
        <div className="flex items-start gap-3 px-5 py-4">
          <p className="min-w-0 flex-1 text-sm leading-6 text-muted">
            {isOffline
              ? "Your current page remains open. Your changes will sync automatically when the connection returns."
              : "Your connection has been restored and syncing can continue normally."}
          </p>
          {!isOffline && (
            <button
              type="button"
              onClick={() => setShowReconnected(false)}
              aria-label="Dismiss connection restored message"
              className="p-1 text-muted transition hover:bg-background hover:text-foreground"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
