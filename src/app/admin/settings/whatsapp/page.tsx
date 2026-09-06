"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { UserGuide, type PageHelpGuide } from "@/components/ui/user-guide";
import { Badge } from "@/components/ui/badge";
import { ErrorModal } from "@/components/ui/error-modal";
import { ArrowLeft, CheckCircle2, QrCode, Send, Wifi, WifiOff } from "lucide-react";
import Link from "next/link";

function WhatsAppIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M12 2.04c-5.47 0-9.94 4.47-9.94 9.94 0 1.75.47 3.42 1.36 4.87L2 22l5.3-1.39a9.9 9.9 0 0 0 4.7 1.16c5.47 0 9.94-4.47 9.94-9.94S17.47 2.04 12 2.04Zm5.61 13.72c-.2.58-1.22 1.14-1.68 1.23-.44.09-1.02.13-1.82-.05-.44-.11-1.44-.42-2.1-.66-1.14-.39-1.89-.87-2.12-1.32-.23-.45-.58-.88-.42-1.42.16-.54.72-.95 1.03-1.35.27-.35.37-.62.56-.93.18-.31.08-.58-.04-.82-.11-.23-1.02-2.47-1.4-3.4-.37-.8-.75-.7-1.02-.71-.26-.01-.56-.01-.86-.01-.29 0-.76.11-1.16.54-.4.43-1.5 1.46-1.5 3.56 0 2.11 1.54 4.15 1.75 4.44.2.28 3.03 4.64 7.35 6.6 1.03.45 1.83.72 2.46.92.74.23 1.42.2 1.95.12.6-.09 1.85-.76 2.11-1.5.27-.74.27-1.39.19-1.52-.09-.13-.35-.2-.74-.35Z" />
      <path d="M15.9 12.92c-.24-.12-1.44-.7-1.66-.78-.22-.08-.38-.12-.54.12-.16.24-.62.78-.76.94-.14.16-.28.18-.52.06-.24-.12-1.02-.37-1.94-1.2-.72-.64-1.2-1.44-1.34-1.68-.14-.24-.02-.37.1-.49.1-.1.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.48-.4-.42-.54-.43-.14-.01-.3-.01-.46-.01-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2 0 1.18.86 2.32.98 2.48.12.16 1.68 2.56 4.06 3.6 2.37 1.04 2.37.7 2.8.66.43-.04 1.4-.56 1.6-1.1.2-.54.2-1.01.14-1.1-.06-.09-.22-.14-.46-.26Z" fill="white" />
    </svg>
  );
}

interface SessionStatus {
  status?: string;
  statusMessage?: string;
  qr?: string;
  phoneNumber?: string;
  pairingCode?: string;
  pairingMethod?: string;
  lastError?: string;
  debugLog?: string[];
  debugInfo?: Record<string, unknown>;
}

export default function WhatsAppSettingsPage() {
  const [session, setSession] = useState<SessionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isRunningDebug, setIsRunningDebug] = useState(false);
  const [message, setMessage] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [includeSignature, setIncludeSignature] = useState(true);
  const [schoolPreviewName, setSchoolPreviewName] = useState<string | null>(null);
  const [schoolPreviewPhone, setSchoolPreviewPhone] = useState<string | null>(null);
  const [schoolPreviewAddress, setSchoolPreviewAddress] = useState<string | null>(null);
  const [pairingPhoneNumber, setPairingPhoneNumber] = useState('');
  const [usePairingCode, setUsePairingCode] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [lastRequestedMode, setLastRequestedMode] = useState<'qr' | 'pairing' | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successModalMessage, setSuccessModalMessage] = useState<string | null>(null);
  const [debugLog, setDebugLog] = useState<string[]>([]);
  const [debugInfo, setDebugInfo] = useState<Record<string, unknown> | null>(null);
  const isStreamErrorRetrying = debugInfo?.streamErrorRetrying === true;
  const streamErrorReconnectAttempts = typeof debugInfo?.streamErrorReconnectAttempts === 'number' ? debugInfo.streamErrorReconnectAttempts : 0;
  const [isCodeCopied, setIsCodeCopied] = useState(false);

  useEffect(() => {
    void fetchStatus(true);
  }, []);

  useEffect(() => {
    const loadPreview = async () => {
      try {
        const url = `/api/admin/school`;
        const r = await fetch(url, { credentials: 'include' });
        if (!r.ok) return;
        const body = await r.json();
        const name = body?.name || (body?.config?.name ?? null);
        const phone = body?.phone || (body?.config?.phone ?? null);
        const address = body?.address || (body?.config?.address ?? null);

        setSchoolPreviewName(name);
        setSchoolPreviewPhone(phone);
        setSchoolPreviewAddress(address);

        if (!message) {
          const lines = [
            `Dear Parent/Guardian,`,
            ``,
            `This is ${name || 'your school'} with an important notification for your child.`,
            ``,
          ];

          if (phone) {
            lines.push(`For more information, please call us at ${phone}.`);
          }
          if (address) {
            lines.push(`Our campus is located at ${address}.`);
          }

          lines.push('', 'Kind regards,');
          setMessage(lines.join('\n'));
        }
      } catch (e) {
        // ignore
      }
    };

    void loadPreview();
  }, []);

  // Poll status while a QR is active or while connecting to keep the UI updated
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    if (session?.status === 'qr' || session?.status === 'connecting' || isConnecting || isRunningDebug) {
      timer = setInterval(() => {
        void fetchStatus(false);
      }, 1500);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [session?.status, isConnecting, isRunningDebug]);

  const syncSession = (nextSession: SessionStatus | null) => {
    setSession(nextSession);
    setDebugLog(nextSession?.debugLog || []);
    setDebugInfo(nextSession?.debugInfo || null);
  };

  const buildSessionActionMessage = (nextSession: SessionStatus | null, fallbackMessage: string | null = null) => {
    if (!nextSession) {
      return fallbackMessage || 'Waiting for the WhatsApp session to become ready.';
    }

    if (nextSession.status === 'qr') {
      return lastRequestedMode === 'pairing'
        ? 'The pairing flow is ready. Open WhatsApp and enter the pairing code shown below.'
        : 'Connection is ready. Scan the QR code or use the pairing code shown below.';
    }

    if (nextSession.status === 'connected') {
      return 'WhatsApp connected successfully.';
    }

    if (nextSession.status === 'error') {
      return nextSession.lastError || nextSession.statusMessage || 'The WhatsApp connection could not be completed.';
    }

    if (nextSession.status === 'connecting') {
      return nextSession.statusMessage || 'Connecting to WhatsApp. The pairing screen will appear soon.';
    }

    return nextSession.statusMessage || fallbackMessage || 'Waiting for the WhatsApp session to become ready.';
  };

  async function fetchStatus(showLoading = false) {
    if (showLoading) {
      setLoading(true);
    }
    try {
      const response = await fetch('/api/admin/whatsapp/status', { credentials: 'include' });
      if (!response.ok) {
        if (showLoading) {
          setActionMessage('Unable to load WhatsApp status.');
        }
        return;
      }
      const data = await response.json();
      syncSession(data.session || null);
      } catch (error) {
      console.error('Status fetch error:', error);
      if (showLoading) {
        setActionMessage('Unable to load WhatsApp status.');
      }
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  const handleConnect = async () => {
    setActionMessage(null);
    if (usePairingCode && !pairingPhoneNumber.trim()) {
      setActionMessage('Enter the WhatsApp phone number for pairing code mode.');
      return;
    }
    setIsConnecting(true);
    try {
      setLastRequestedMode(usePairingCode ? 'pairing' : 'qr');
      const response = await fetch('/api/admin/whatsapp/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ phoneNumber: pairingPhoneNumber.trim(), usePairingCode }),
      });
      const data = await response.json();
      if (response.ok) {
        const nextSession = data.session || null;
        syncSession(nextSession);
        setActionMessage(buildSessionActionMessage(nextSession, usePairingCode ? 'Connection requested. Enter the pairing code in WhatsApp.' : 'Connection requested. Scan the QR code if shown.'));
      } else {
        setActionMessage(data.error || 'Failed to start WhatsApp connection.');
      }
    } catch (error) {
    console.error('Connect error:', error);
    setActionMessage('Unable to connect WhatsApp.');
    } finally {
      setIsConnecting(false);
    }
  };


  const handleDisconnect = async () => {
    setActionMessage(null);
    setIsDisconnecting(true);
    try {
      const response = await fetch('/api/admin/whatsapp/disconnect', {
        method: 'POST',
        credentials: 'include',
      });
      const data = await response.json();
      if (response.ok) {
        syncSession(data.session || null);
        setActionMessage('WhatsApp session disconnected.');
      } else {
        setActionMessage(data.error || 'Failed to disconnect WhatsApp session.');
      }
    } catch (error) {
    console.error('Disconnect error:', error);
    setActionMessage('Unable to disconnect WhatsApp.');
    } finally {
      setIsDisconnecting(false);
    }
  };

  const sendMessageToRecipients = async (recipients: string[]) => {
    if (!recipients.length) {
      setActionMessage('Enter at least one phone number first.');
      return;
    }

    setIsSending(true);
    setActionMessage(null);
    try {
      const payloadMessage = `${message.trim()}\n\n— ${schoolPreviewName || ''}${schoolPreviewName && schoolPreviewPhone ? ' | ' : ''}${schoolPreviewPhone || ''}`;

      const response = await fetch('/api/admin/whatsapp/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ phoneNumbers: recipients, message: payloadMessage }),
      });
      const data = await response.json();
      if (response.ok) {
        const successMessage = `Test message sent successfully to ${recipients.join(', ')}.`;
        setSuccessModalMessage(successMessage);
        setShowSuccessModal(true);
      } else {
        setActionMessage(data.error || 'Failed to send test message.');
      }
    } catch (error) {
    console.error('Send test error:', error);
    setActionMessage('Unable to send test message.');
    } finally {
      setIsSending(false);
    }
  };

  const handleSendTest = async () => {
    if (!phoneNumber.trim()) {
      setActionMessage('Enter a phone number first.');
      return;
    }

    await sendMessageToRecipients([phoneNumber.trim()]);
  };

  const handleRunDebug = async () => {
    setActionMessage(null);
    setIsRunningDebug(true);
    try {
      const response = await fetch('/api/admin/whatsapp/debug', {
        method: 'POST',
        credentials: 'include',
      });
      const data = await response.json();
      if (response.ok) {
        setDebugLog(data.result?.events || []);
        setDebugInfo(data.result || null);
        setActionMessage(data.result?.summary || 'Debug probe completed.');
      } else {
        setActionMessage(data.error || 'Failed to run debug probe.');
      }
    } catch (error) {
    console.error('Debug probe error:', error);
    setActionMessage('Unable to run debug probe.');
    } finally {
      setIsRunningDebug(false);
    }
  };

  const isConnected = session?.status === 'connected';
  const isPendingPairing = session?.status === 'connecting' || session?.status === 'qr';
  const badgeLabel = isConnected
    ? 'Connected'
    : session?.status === 'qr'
      ? (lastRequestedMode === 'pairing' ? 'Pairing ready' : 'Waiting for scan')
      : session?.status === 'connecting'
        ? 'Connecting'
        : session?.status === 'error'
          ? 'Error'
          : 'Disconnected';
  const statusDescription = session?.statusMessage && !session.statusMessage.toLowerCase().includes(badgeLabel.toLowerCase())
    ? session.statusMessage
    : '';
  const connectionStatusCopy = (() => {
    if (!session) {
      return 'Start a connection to generate the WhatsApp pairing details.';
    }

    if (session.status === 'connected') {
      return 'WhatsApp is connected and ready to send test messages.';
    }

    if (session.status === 'qr') {
      return lastRequestedMode === 'pairing'
        ? 'The WhatsApp pairing flow is ready. Open WhatsApp and enter the pairing code shown below.'
        : 'A WhatsApp pairing QR is ready. Scan it with your phone to link the device.';
    }

    if (session.status === 'connecting') {
      return 'The connection is being established. The QR code or pairing code will appear here as soon as the session is ready.';
    }

    if (session.status === 'error') {
      return session.lastError || session.statusMessage || 'The connection could not be completed.';
    }

    return session.statusMessage || 'No active WhatsApp connection yet.';
  })();
  const showWaitingFallback = Boolean(
    (session?.status === 'qr' || session?.status === 'connecting') &&
    !session?.qr &&
    !session?.pairingCode &&
    !session?.lastError
  );

  const handleCopyPairingCode = async () => {
    if (!session?.pairingCode) return;
    try {
      await navigator.clipboard.writeText(session.pairingCode);
      setIsCodeCopied(true);
      setActionMessage('Pairing code copied. Paste it into WhatsApp on your phone.');
      window.setTimeout(() => setIsCodeCopied(false), 2000);
    } catch {
      setActionMessage('Unable to copy the pairing code automatically. Please copy it manually.');
    }
  };

  const pageTitle = schoolPreviewName ? `${schoolPreviewName} WhatsApp System` : 'WhatsApp System';

  const extractPhone = (raw?: string | null): string | null => {
    if (!raw) return null;
    let s = String(raw || '');
    const colon = s.indexOf(':');
    if (colon !== -1) s = s.slice(0, colon);
    const at = s.indexOf('@');
    if (at !== -1) s = s.slice(0, at);
    const digits = s.replace(/\D/g, '');
    return digits || s || null;
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-5 py-8 sm:px-8 lg:px-12">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="flex items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-brand"><WhatsAppIcon className="h-[18px] w-[18px] text-[#25D366]" /> Communication operations</div>
            <h1 className="mt-2 text-3xl font-bold leading-tight text-foreground">{pageTitle}</h1>
            <p className="mt-1 max-w-2xl text-muted">Manage the school WhatsApp connection, send test messages, and monitor pairing status</p>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 self-start rounded-lg border border-border bg-surface px-4 py-2.5 text-sm sm:self-auto">
          {isConnected ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-500 animate-pulse" />
          ) : isPendingPairing ? (
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-amber-500" />
          ) : (
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-slate-400" />
          )}
          <span className="font-semibold text-sm text-slate-900">{badgeLabel}</span>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(360px,1fr)_minmax(420px,1fr)]">
        <div className="border border-border bg-surface p-5">
          <div className="flex flex-col gap-4">
            {statusDescription && (
              <p className="text-sm text-muted">{statusDescription}</p>
            )}
            {isStreamErrorRetrying && (
              <p className="text-sm font-medium text-amber-600 mt-2">Retrying after stream error ({streamErrorReconnectAttempts})</p>
            )}
            {session?.phoneNumber && (
              <p className="mt-1 text-lg font-semibold">{extractPhone(session.phoneNumber)}</p>
            )}
            {session?.pairingCode && <p className="text-xs text-muted">Pairing code: {session.pairingCode}</p>}
          </div>

          <div className="mt-6 border border-border bg-background p-4">
            <p className="text-sm font-semibold">Connection status</p>
            <p className="mt-2 text-sm text-muted">{connectionStatusCopy}</p>
          </div>

          {session?.qr ? (
            <div className="mt-6">
              <p className="text-sm font-medium mb-2">Scan QR Code</p>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(session.qr)}`}
                alt="WhatsApp QR Code"
                className="rounded-lg border border-border"
              />
            </div>
          ) : showWaitingFallback ? (
            <div className="mt-6 rounded-lg border border-dashed border-brand/30 bg-brand/5 p-4">
              <p className="text-sm font-semibold">Waiting for the pairing screen</p>
              <p className="mt-2 text-sm text-muted">The WhatsApp session is active, but the QR code has not appeared yet. Refresh in a few seconds or try the connection again if it still does not appear.</p>
            </div>
          ) : null}

          {session?.pairingCode && (
            <div className="mt-6 rounded-lg border border-brand/30 bg-brand/5 p-4">
              <p className="text-sm font-semibold">Pairing code</p>
              <p className="mt-2 text-sm text-muted">
                Open WhatsApp on your phone, go to Linked devices, select Link a device, and enter this code.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <div className="rounded-lg border border-border bg-background px-4 py-3 text-2xl font-semibold tracking-[0.3em]">
                  {session.pairingCode}
                </div>
                <Button onClick={handleCopyPairingCode} variant="outline">
                  {isCodeCopied ? 'Copied' : 'Copy code'}
                </Button>
              </div>
              <p className="mt-3 text-sm text-muted">
                If WhatsApp says it could not link the device, wait a few seconds and try again; the pairing flow will retry automatically.
              </p>
            </div>
          )}

          <div className="mt-6 space-y-3">
            <div>
              <label className="block text-sm font-medium mb-2">Connection method</label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" checked={!usePairingCode} onChange={() => setUsePairingCode(false)} />
                  Use QR code
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" checked={usePairingCode} onChange={() => setUsePairingCode(true)} />
                  Use pairing code
                </label>
              </div>
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked disabled className="cursor-not-allowed" />
                School signature is always included in test messages
              </label>
              <p className="text-xs text-muted mt-2">Preview: {message}{schoolPreviewName || schoolPreviewPhone ? ` \n\n— ${schoolPreviewName || ''}${schoolPreviewName && schoolPreviewPhone ? ' | ' : ''}${schoolPreviewPhone || ''}` : ''}</p>
            </div>

            {usePairingCode && (
              <div>
                <label className="block text-sm font-medium mb-2">Phone number for pairing</label>
                <input
                  value={pairingPhoneNumber}
                  onChange={(e) => setPairingPhoneNumber(e.target.value)}
                  className="w-full rounded-lg border border-border px-3 py-2"
                  placeholder="2348012345678"
                />
              </div>
            )}
            <div className="flex flex-wrap gap-3">
              <Button onClick={handleConnect} disabled={isConnecting}>
                {isConnecting ? 'Connecting…' : 'Connect'}
              </Button>
              <Button onClick={handleDisconnect} disabled={isDisconnecting || !isConnected} variant="secondary">
                {isDisconnecting ? 'Disconnecting…' : 'Disconnect'}
              </Button>
              <Button onClick={() => void fetchStatus(true)} disabled={loading} variant="outline">
                Refresh
              </Button>
            </div>
          </div>
        </div>

        <div className="border border-border bg-surface p-5">
          <div className="mb-4 flex items-center gap-2 text-brand"><Send className="h-[18px] w-[18px]" /><h2 className="text-lg font-semibold text-foreground">Send Test Message</h2></div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Phone number</label>
              <input
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2"
                placeholder="+2348012345678"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                className="w-full rounded-lg border border-border px-3 py-2"
                placeholder="Enter a professional WhatsApp notification to send to parents."
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <Button onClick={handleSendTest} disabled={isSending || !isConnected}>
                {isSending ? 'Sending…' : 'Send Test Message'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/*
      <div className="rounded-xl border border-border p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Debug Trace</h2>
          <Button onClick={handleRunDebug} disabled={isRunningDebug} variant="outline">
            {isRunningDebug ? 'Running…' : 'Run Deep Debug Probe'}
          </Button>
        </div>
            <p className="mt-2 text-sm text-muted">This shows the latest WhatsApp connection events and failures so the QR issue can be diagnosed directly.</p>
        {debugLog.length > 0 ? (
          <div className="mt-4 max-h-72 overflow-auto rounded-lg border border-border bg-background p-3 text-xs font-mono">
            {debugLog.map((entry, index) => (
              <div key={`${entry}-${index}`} className="whitespace-pre-wrap break-all">
                {entry}
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted">No debug events yet. Click "Run Debug Probe" to capture them.</p>
        )}
        {debugInfo && (
          <pre className="mt-4 max-h-48 overflow-auto rounded-lg border border-border bg-background p-3 text-xs">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        )}
      </div>
      */}

      {actionMessage && (
        <div className="border border-border bg-surface p-4 text-sm text-foreground">
          {actionMessage}
        </div>
      )}

      <UserGuide guide={HELP_GUIDE} />

      <ErrorModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Test Message Sent"
        message={successModalMessage || "The test message was sent successfully."}
        type="success"
        confirmLabel="Okay"
      />
    </div>
  );
}

const HELP_GUIDE: PageHelpGuide = {
  title: 'WhatsApp Settings & Pairing',
  overview: 'Manage and monitor the WhatsApp connection for your school. Connect using QR or pairing code, send test messages, and view pairing details.',
  steps: [
    'Open this page to view current session status and QR code if available.',
    'Use "Connect" to start a WhatsApp session (scan QR or use pairing code).',
    'Send a test message to verify delivery to a guardian phone number.',
    'Use "Disconnect" to end the current session when rotating devices.',
  ],
  commonTasks: [
    {
      title: 'Start a Connection',
      description: 'Initiate a WhatsApp session using QR or pairing code.',
      tips: [
        'Choose QR code for standard pairing and scan from WhatsApp -> Linked devices.',
        'Use pairing code when linking from the same phone number across devices.',
        'Refresh status if QR does not appear immediately.',
      ],
    },
    {
      title: 'Send Test Message',
      description: 'Verify that messages are delivered through the connected session.',
      tips: [
        'Enter a recipient phone number in international format.',
        'Use the preview area to verify the message content and school signature.',
      ],
    },
  ],
  faqs: [
    {
      question: 'No QR appears — what now?',
      answer: 'Try refreshing the status, ensure the server is running, and that the session is not already paired to another device.',
    },
    {
      question: 'Pairing code not accepted?',
      answer: 'Wait a few seconds and retry; pairing codes are short-lived and the probe may need to be retriggered.',
    },
  ],
};
