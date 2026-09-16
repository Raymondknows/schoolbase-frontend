"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Sparkles, X } from "lucide-react";

type ModalType = "error" | "success";

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  details?: string;
  type?: ModalType;
  action?: {
    label: string;
    onClick: () => void;
  };
  onConfirm?: () => Promise<boolean | void> | boolean | void;
  onSuccessAction?: () => void; // For success modal primary button
  confirmDisabled?: boolean;
  confirmLabel?: string;
  children?: React.ReactNode;
}

export function ErrorModal({
  isOpen,
  onClose,
  title,
  message,
  details,
  type = "error",
  action,
  onConfirm,
  onSuccessAction,
  confirmDisabled,
  confirmLabel,
  children,
}: ErrorModalProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [animateState, setAnimateState] = useState<"enter" | "exit">("enter");

  const ANIMATION_MS = 320;

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setAnimateState("enter");
      setShowDetails(false);
      playOpenTone();
    } else if (shouldRender) {
      setAnimateState("exit");
      playCloseTone();
      const t = setTimeout(() => setShouldRender(false), ANIMATION_MS);
      return () => clearTimeout(t);
    }

    if (!isOpen) {
      setShowDetails(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !shouldRender) return;

    return () => {
      // No automatic dismissal; the modal remains visible until the user explicitly closes it.
    };
  }, [isOpen, shouldRender]);

  if (!shouldRender) return null;

  const isSuccess = type === "success";
  const defaultTitle = isSuccess ? "All set" : "Something went wrong";
  const Icon = isSuccess ? CheckCircle2 : AlertCircle;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-[2px]">
      <style>{`
        @keyframes sb_modal_enter { from { transform: translateX(36px) scale(.98); opacity: 0 } to { transform: translateX(0) scale(1); opacity: 1 } }
        @keyframes sb_modal_exit  { from { transform: translateX(0) scale(1); opacity: 1 } to { transform: translateX(36px) scale(.98); opacity: 0 } }
      `}</style>

      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-lg overflow-hidden rounded-xl border border-border bg-surface shadow-2xl"
        style={{
          animation: `${animateState === "enter" ? "sb_modal_enter" : "sb_modal_exit"} ${ANIMATION_MS}ms cubic-bezier(.2,.9,.2,1)`,
        }}
      >
        <div className="border-b border-border bg-[#f6faff] px-6 py-5 sm:px-7">
          <div className="flex items-start gap-4">
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border ${isSuccess ? 'border-emerald-200 bg-emerald-50' : 'border-brand/20 bg-brand-light'}`}>
              {isSuccess ? (
                <Sparkles className="h-6 w-6 text-success" />
              ) : (
                <Icon className="h-5 w-5 text-brand" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand">SchoolBase</p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-foreground">{title || defaultTitle}</h2>
              <p className="mt-1 text-sm text-muted">{isSuccess ? "The action was completed successfully." : "Review the message below and try again."}</p>
            </div>
            <button type="button" onClick={onClose} aria-label="Close dialog" className="rounded-md p-1.5 text-muted transition hover:bg-white hover:text-foreground"><X className="h-4 w-4" /></button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 sm:px-7">
          {/** If children provided, render that (allows custom modal content). Otherwise fall back to message/details. */}
          {children ? (
            <div>{children}</div>
          ) : (
            <>
              <p className="text-sm leading-6 text-foreground">{message}</p>

              {details && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
                      {isSuccess ? "Next steps" : "Details"}
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowDetails(!showDetails)}
                      className="text-xs font-medium text-brand"
                    >
                      {showDetails ? "Hide" : "View"}
                    </button>
                  </div>
                  {showDetails && (
                    <div className="rounded-lg border border-border bg-background p-3">
                      <p className="whitespace-pre-line text-sm text-foreground">{details}</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse gap-3 border-t border-border bg-background px-6 py-4 sm:flex-row sm:justify-end sm:px-7">
          {action && (
            <button
              type="button"
              onClick={() => {
                action.onClick();
                onClose();
              }}
              className="flex-1 rounded-lg border border-border bg-white px-4 py-2.5 text-sm font-semibold text-foreground hover:border-brand hover:text-brand sm:flex-none"
            >
              {action.label}
            </button>
          )}
          <button
            type="button"
            onClick={async () => {
              if (onConfirm) {
                const result = await onConfirm();
                if (result === false) {
                  return;
                }
              }
              if (isSuccess && onSuccessAction) {
                onSuccessAction();
              }
              onClose();
            }}
            disabled={confirmDisabled}
            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold text-white bg-brand transition-colors sm:flex-none sm:min-w-32 ${confirmDisabled ? 'cursor-not-allowed opacity-60' : 'hover:bg-brand-hover'}`}
          >
            {confirmLabel ?? (isSuccess ? "Understood" : "Try again")}
          </button>
        </div>
      </div>
    </div>
  );
}

// Play short open/close tones using Web Audio API to avoid external assets
function playOpenTone() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = ctx.currentTime;

    const playTone = (freq: number, duration: number, gain: number, delay = 0) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + delay);
      gainNode.gain.setValueAtTime(0.0001, now + delay);
      gainNode.gain.exponentialRampToValueAtTime(gain, now + delay + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + delay + duration);
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start(now + delay);
      osc.stop(now + delay + duration);
    };

    playTone(880, 0.16, 0.05, 0);
    playTone(1174, 0.16, 0.05, 0.08);

    setTimeout(() => ctx.close(), 700);
  } catch (e) {
    // ignore
  }
}

function playCloseTone() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = 420;
    g.gain.value = 0.0001;
    o.connect(g);
    g.connect(ctx.destination);
    const now = ctx.currentTime;
    g.gain.linearRampToValueAtTime(0.045, now + 0.01);
    o.start(now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
    o.stop(now + 0.24);
    setTimeout(() => ctx.close(), 500);
  } catch (e) {
    // ignore
  }
}
