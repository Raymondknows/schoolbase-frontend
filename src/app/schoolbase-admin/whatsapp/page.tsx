"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/ui/icons";
import { AlertTriangle, CheckCircle2, Send, Wifi } from "lucide-react";

interface SessionStatus {
  connected?: boolean;
  status?: string;
  statusMessage?: string;
  qr?: string;
  phoneNumber?: string;
  pairingCode?: string;
  pairingMethod?: string;
  lastError?: string;
  debugInfo?: Record<string, unknown>;
}

const buildDefaultPlatformMessage = (adminName = "SchoolBase") =>
  `Hello {{schoolName}},\n\nThis is ${adminName} from SchoolBase, and we are reaching out to keep your school informed, supported, and aligned with the latest platform developments. We know how important it is for schools to have reliable systems, timely communication, and a trusted partner supporting day-to-day operations.\n\nWe are sharing this update to ensure your team has the information needed to stay ahead, act confidently, and continue delivering a stronger experience for staff, parents, and students. Please review the details in your SchoolBase workspace and complete any next steps that may be relevant to your school.\n\nYour partnership matters to us, and we are committed to helping your school operate more smoothly, communicate more effectively, and grow with confidence. If you need support or guidance, our team is ready to assist.\n\nWarm regards,\n${adminName}\nSchoolBase — Everything your school needs in one simple platform.
Website: https://schoolbase.live\nNeed help? Reply to this message or contact the SchoolBase support team.`;

export default function PlatformWhatsAppPage() {
  const [session, setSession] = useState<SessionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [pairingPhoneNumber, setPairingPhoneNumber] = useState("");
  const [usePairingCode, setUsePairingCode] = useState(false);
  const [templates, setTemplates] = useState<Array<{ id: string; name: string; category: string; status: string; lastUpdated: string; message?: string }>>([]);
  const [campaigns, setCampaigns] = useState<Array<{ id: string; name: string; audience: string; status: string; recipients: number; scheduled: string }>>([]);
  const [logs, setLogs] = useState<Array<{ id: string; title: string; status: string; time: string; details: string }>>([]);
  const [schools, setSchools] = useState<Array<{ id: string; name: string; phone?: string | null; email?: string | null; status?: string | null }>>([]);
  const [selectedSchoolIds, setSelectedSchoolIds] = useState<string[]>([]);
  const [campaignName, setCampaignName] = useState('SchoolBase platform outreach');
  const [campaignAudience, setCampaignAudience] = useState('All schools');
  const [audienceCounts, setAudienceCounts] = useState<Record<string, number>>({});
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [platformAdminName, setPlatformAdminName] = useState('SchoolBase');
  const [campaignMessage, setCampaignMessage] = useState(buildDefaultPlatformMessage('SchoolBase'));
  const [campaignScheduled, setCampaignScheduled] = useState('Tomorrow');
  const [campaignPreview, setCampaignPreview] = useState<{ audience: string; estimatedRecipients: number; templateName?: string; summary: string } | null>(null);
  const [isPreviewingCampaign, setIsPreviewingCampaign] = useState(false);
  const [isCreatingCampaign, setIsCreatingCampaign] = useState(false);
  const [testPhoneNumber, setTestPhoneNumber] = useState("+2348012345678");
  const [directMessage, setDirectMessage] = useState(buildDefaultPlatformMessage('SchoolBase'));
  const [isSendingSchoolMessage, setIsSendingSchoolMessage] = useState(false);
  const [isSendingTestMessage, setIsSendingTestMessage] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'info' | 'warning' | 'success'; text: string } | null>(null);
  const [readiness, setReadiness] = useState<{ readyForStagedRollout: boolean; requiresManualApproval: boolean; blockedForMassBroadcast: boolean; warnings: string[]; lastValidatedAt: string; checks: Record<string, boolean> } | null>(null);
  const [successModal, setSuccessModal] = useState<{ open: boolean; type: 'success' | 'warning' | 'info'; title: string; message: string }>({
    open: false,
    type: 'success',
    title: "Success",
    message: "",
  });
  const [lastRequestedMode, setLastRequestedMode] = useState<"qr" | "pairing" | null>(null);
  const [isCodeCopied, setIsCodeCopied] = useState(false);

  const syncSession = (nextSession: SessionStatus | null) => {
    setSession(nextSession);
  };

  const fetchStatus = async (showLoading = false) => {
    if (showLoading) setLoading(true);

    try {
      const response = await fetch("/schoolbase-admin/api/whatsapp/status", {
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        if (showLoading) setNotice('warning', 'Unable to load platform WhatsApp status.');
        return;
      }

      const data = await response.json();
      syncSession(data.session || null);
    } catch (error) {
      console.error("Platform status fetch error:", error);
      if (showLoading) setNotice('warning', 'Unable to load platform WhatsApp status.');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const fetchReadiness = async () => {
    try {
      const response = await fetch('/schoolbase-admin/api/whatsapp/readiness', {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) return;
      const data = await response.json();
      setReadiness(data?.readiness || null);
    } catch (error) {
      console.error('Platform readiness fetch error:', error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/schoolbase-admin/api/whatsapp/templates', {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) return;
      const data = await response.json();
      setTemplates(data?.data?.items || data?.items || []);
    } catch (error) {
      console.error('Platform templates fetch error:', error);
    }
  };

  const fetchCampaigns = async () => {
    try {
      const response = await fetch('/schoolbase-admin/api/whatsapp/campaigns', {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) return;
      const data = await response.json();
      setCampaigns(data?.data?.items || data?.items || []);
    } catch (error) {
      console.error('Platform campaigns fetch error:', error);
    }
  };

  const updateCampaignStatus = async (campaignId: string, status: string) => {
    try {
      const response = await fetch(`/schoolbase-admin/api/whatsapp/campaigns/${campaignId}/status`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || 'Failed to update the campaign.');
      }

      await fetchCampaigns();
      await fetchLogs();
      setNotice('success', `Campaign status updated to ${status}.`);
    } catch (error) {
      console.error('Campaign status update error:', error);
      setNotice('warning', error instanceof Error ? error.message : 'Failed to update the campaign status.');
    }
  };

  const sendCampaignNow = async (campaignId: string) => {
    try {
      const response = await fetch(`/schoolbase-admin/api/whatsapp/campaigns/${campaignId}/send`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || 'Failed to send the campaign.');
      }

      await fetchCampaigns();
      await fetchLogs();
      setNotice('success', 'Campaign sent successfully.');
      openSuccessModal('Campaign sent', 'Campaign sent successfully.');
    } catch (error) {
      console.error('Campaign send error:', error);
      setNotice('warning', error instanceof Error ? error.message : 'Failed to send the campaign.');
    }
  };

  const fetchLogs = async () => {
    try {
      const response = await fetch('/schoolbase-admin/api/whatsapp/logs', {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) return;
      const data = await response.json();
      setLogs(data?.data?.items || data?.items || []);
    } catch (error) {
      console.error('Platform logs fetch error:', error);
    }
  };

  const fetchSchools = async () => {
    try {
      const allSchools: Array<{ id: string; name: string; phone?: string | null; email?: string | null; status?: string | null }> = [];
      let page = 1;
      let hasMorePages = true;

      while (hasMorePages) {
        const response = await fetch(`/schoolbase-admin/api/schools?page=${page}&limit=100`, {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
          hasMorePages = false;
          break;
        }

        const data = await response.json();
        const schoolList = Array.isArray(data?.schools) ? data.schools : [];
        allSchools.push(...schoolList);

        const totalPages = Number(data?.pagination?.pages || 0);
        hasMorePages = Boolean(totalPages > page && schoolList.length > 0);
        page += 1;
      }

      setSchools(allSchools);
      if (!selectedSchoolIds.length && allSchools.length) {
        setSelectedSchoolIds([allSchools[0].id]);
      }
    } catch (error) {
      console.error('Platform schools fetch error:', error);
    }
  };

  const fetchAudienceCounts = async () => {
    try {
      const response = await fetch('/schoolbase-admin/api/whatsapp/audience-counts', {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        setAudienceCounts({
          'All schools': 0,
          'Trial schools': 0,
          'Incomplete setups': 0,
          'Expiring schools': 0,
          'Renewal reminders': 0,
        });
        return;
      }

      const data = await response.json();
      const nextCounts = data?.counts || {};
      setAudienceCounts({
        'All schools': Number(nextCounts['All schools'] ?? 0),
        'Trial schools': Number(nextCounts['Trial schools'] ?? 0),
        'Incomplete setups': Number(nextCounts['Incomplete setups'] ?? 0),
        'Expiring schools': Number(nextCounts['Expiring schools'] ?? 0),
        'Renewal reminders': Number(nextCounts['Renewal reminders'] ?? 0),
      });
    } catch (error) {
      console.error('Platform audience counts fetch error:', error);
      setAudienceCounts({
        'All schools': 0,
        'Trial schools': 0,
        'Incomplete setups': 0,
        'Expiring schools': 0,
        'Renewal reminders': 0,
      });
    }
  };

  const fetchPlatformProfile = async () => {
    try {
      const response = await fetch('/schoolbase-admin/api/profile', {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) return;
      const data = await response.json();
      const fetchedName = String(data?.admin?.name || '').trim() || 'SchoolBase';
      setPlatformAdminName(fetchedName);

      const defaultMessage = buildDefaultPlatformMessage(fetchedName);
      if (campaignMessage === buildDefaultPlatformMessage('SchoolBase') || !campaignMessage.trim()) {
        setCampaignMessage(defaultMessage);
      }
      if (directMessage === buildDefaultPlatformMessage('SchoolBase') || !directMessage.trim()) {
        setDirectMessage(defaultMessage);
      }
    } catch (error) {
      console.error('Platform profile fetch error:', error);
    }
  };

  useEffect(() => {
    void fetchStatus(true);
    void fetchReadiness();
    void fetchTemplates();
    void fetchCampaigns();
    void fetchLogs();
    void fetchSchools();
    void fetchAudienceCounts();
    void fetchPlatformProfile();
  }, []);

  useEffect(() => {
    if (!templates.length) return;
    if (!selectedTemplateId) {
      const firstTemplate = templates[0];
      setSelectedTemplateId(firstTemplate.id);
      setCampaignMessage(firstTemplate.message || campaignMessage);
      return;
    }

    const activeTemplate = templates.find((template) => template.id === selectedTemplateId);
    if (activeTemplate?.message && !campaignMessage) {
      setCampaignMessage(activeTemplate.message);
    }
  }, [templates, selectedTemplateId]);

  useEffect(() => {
    if (!(session?.status === "qr" || session?.status === "connecting" || isConnecting)) return;

    const timer = setInterval(() => {
      void fetchStatus(false);
    }, 1500);

    return () => clearInterval(timer);
  }, [session?.status, isConnecting]);

  const buildSessionActionMessage = (nextSession: SessionStatus | null, fallbackMessage: string | null = null) => {
    if (!nextSession) return fallbackMessage || "Waiting for the WhatsApp session to become ready.";

    if (nextSession.status === "qr") {
      return lastRequestedMode === "pairing"
        ? "The pairing flow is ready. Open WhatsApp and enter the pairing code shown below."
        : "Connection is ready. Scan the QR code or use the pairing code shown below.";
    }

    if (nextSession.status === "connected") return "WhatsApp connected successfully.";
    if (nextSession.status === "error") return nextSession.lastError || nextSession.statusMessage || "The WhatsApp connection could not be completed.";
    if (nextSession.status === "connecting") return nextSession.statusMessage || "Connecting to WhatsApp. The pairing screen will appear soon.";

    return nextSession.statusMessage || fallbackMessage || "Waiting for the WhatsApp session to become ready.";
  };

  const setNotice = (type: 'info' | 'warning' | 'success', text: string) => {
    setActionMessage({ type, text });
  };

  const openSuccessModal = (title: string, message: string, type: 'success' | 'warning' | 'info' = 'success') => {
    setSuccessModal({ open: true, type, title, message });
    if (type === 'warning') {
      setNotice('warning', message);
    } else if (type === 'success') {
      setNotice('success', message);
    } else {
      setNotice('info', message);
    }
  };

  const handleConnect = async () => {
    setActionMessage(null);
    if (usePairingCode && !pairingPhoneNumber.trim()) {
      setNotice('warning', 'Enter the phone number for pairing code mode.');
      return;
    }

    setIsConnecting(true);
    try {
      setLastRequestedMode(usePairingCode ? "pairing" : "qr");
      const response = await fetch("/schoolbase-admin/api/whatsapp/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ phoneNumber: pairingPhoneNumber.trim() || phoneNumber.trim() || undefined, usePairingCode }),
      });

      const data = await response.json();
      if (response.ok) {
        const nextSession = data.session || null;
        syncSession(nextSession);
        const successMessage = buildSessionActionMessage(nextSession, usePairingCode ? "Connection requested. Enter the pairing code in WhatsApp." : "Connection requested. Scan the QR code if shown.");
        setNotice('info', successMessage);
        if (nextSession?.status === "connected") {
          openSuccessModal("WhatsApp connected", successMessage, 'success');
        } else if (nextSession?.status === "error") {
          openSuccessModal("Connection issue", nextSession.lastError || successMessage, 'warning');
        } else if (nextSession?.status === "qr" || nextSession?.status === "connecting") {
          openSuccessModal("Connection update", successMessage, 'info');
        }
      } else {
        const warningMessage = data.error || "Failed to start WhatsApp connection.";
        setNotice('warning', warningMessage);
        openSuccessModal("Connection failed", warningMessage, 'warning');
      }
    } catch (error) {
      console.error("Platform connect error:", error);
      setNotice('warning', 'Unable to connect WhatsApp.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setActionMessage(null);
    setIsDisconnecting(true);
    try {
      const response = await fetch("/schoolbase-admin/api/whatsapp/disconnect", {
        method: "POST",
        credentials: "include",
      });
      const data = await response.json();
      if (response.ok) {
        syncSession(data.session || null);
        const disconnectedMessage = "WhatsApp session disconnected.";
        setNotice('success', disconnectedMessage);
        openSuccessModal("Session disconnected", disconnectedMessage, 'success');
      } else {
        const warningMessage = data.error || "Failed to disconnect WhatsApp session.";
        setNotice('warning', warningMessage);
        openSuccessModal("Disconnect failed", warningMessage, 'warning');
      }
    } catch (error) {
      console.error("Platform disconnect error:", error);
      setNotice('warning', 'Unable to disconnect WhatsApp.');
    } finally {
      setIsDisconnecting(false);
    }
  };

  const isConnected = session?.status === "connected";
  const isPendingPairing = session?.status === "connecting" || session?.status === "qr";
  const badgeLabel = isConnected
    ? "Connected"
    : session?.status === "qr"
      ? lastRequestedMode === "pairing"
        ? "Pairing ready"
        : "Waiting for scan"
      : session?.status === "connecting"
        ? "Connecting"
        : session?.status === "error"
          ? "Error"
          : "Disconnected";

  const connectionStatusCopy = (() => {
    if (!session) return "Start a connection to generate the WhatsApp pairing details.";
    if (session.status === "connected") return "WhatsApp is connected and ready.";
    if (session.status === "qr") {
      return lastRequestedMode === "pairing"
        ? "The WhatsApp pairing flow is ready. Open WhatsApp and enter the pairing code shown below."
        : "A WhatsApp pairing QR is ready. Scan it with your phone to link the device.";
    }
    if (session.status === "connecting") return "The connection is being established. The QR code or pairing code will appear here as soon as the session is ready.";
    if (session.status === "error") return session.lastError || session.statusMessage || "The connection could not be completed.";
    return session.statusMessage || "No active WhatsApp connection yet.";
  })();

  const showWaitingFallback = Boolean(
    (session?.status === "qr" || session?.status === "connecting") &&
      !session?.qr &&
      !session?.pairingCode &&
      !session?.lastError
  );

  const handleCopyPairingCode = async () => {
    if (!session?.pairingCode) return;
    try {
      await navigator.clipboard.writeText(session.pairingCode);
      setIsCodeCopied(true);
      const copiedMessage = "Pairing code copied. Paste it into WhatsApp on your phone.";
      setNotice('success', copiedMessage);
      openSuccessModal("Code copied", copiedMessage, 'success');
      setTimeout(() => setIsCodeCopied(false), 2000);
    } catch {
      setNotice('warning', 'Unable to copy the pairing code automatically. Please copy it manually.');
    }
  };

  const toggleSchoolSelection = (schoolId: string) => {
    setSelectedSchoolIds((current) => {
      if (current.includes(schoolId)) {
        return current.filter((item) => item !== schoolId);
      }
      return [...current, schoolId];
    });
  };

  const handleSendToSelectedSchools = async () => {
    const targetSchoolIds = selectedSchoolIds.filter(Boolean);
    if (!targetSchoolIds.length) {
      setNotice('warning', 'Select at least one school before sending a message.');
      return;
    }
    if (!directMessage.trim()) {
      setNotice('warning', 'Write a message before sending it to the selected schools.');
      return;
    }

    setIsSendingSchoolMessage(true);
    setActionMessage(null);

    try {
      const response = await fetch('/schoolbase-admin/api/whatsapp/send-message', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolIds: targetSchoolIds,
          message: directMessage,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to send the WhatsApp message.');
      }

      const resultCount = Array.isArray(data?.results) ? data.results.length : targetSchoolIds.length;
      const successText = `WhatsApp message sent successfully to ${resultCount} selected school${resultCount === 1 ? '' : 's'}.`;
      setNotice('success', successText);
      openSuccessModal('School message sent', successText, 'success');
    } catch (error) {
      console.error('School direct send error:', error);
      const warningMessage = error instanceof Error ? error.message : 'Unable to send the school message.';
      setNotice('warning', warningMessage);
      openSuccessModal('School message failed', warningMessage, 'warning');
    } finally {
      setIsSendingSchoolMessage(false);
    }
  };

  const handleSendTestMessage = async () => {
    const trimmedPhone = testPhoneNumber.trim();
    if (!trimmedPhone) {
      setNotice('warning', 'Enter a phone number before sending the platform test message.');
      return;
    }

    setIsSendingTestMessage(true);
    setActionMessage(null);

    try {
      const response = await fetch('/schoolbase-admin/api/whatsapp/send-message', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: trimmedPhone,
          message: `Platform test message from SchoolBase admin on ${new Date().toISOString()}.`,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to send the platform test message.');
      }

      const sentCount = Array.isArray(data?.results) ? data.results.length : 1;
      const successText = `Platform test message sent successfully to ${sentCount} recipient${sentCount === 1 ? '' : 's'}.`;
      setNotice('success', successText);
      openSuccessModal('Test message sent', successText, 'success');
    } catch (error) {
      console.error('Platform test message error:', error);
      const warningMessage = error instanceof Error ? error.message : 'Unable to send the platform test message.';
      setNotice('warning', warningMessage);
      openSuccessModal('Test message failed', warningMessage, 'warning');
    } finally {
      setIsSendingTestMessage(false);
    }
  };

  const selectedAudienceCount = audienceCounts[campaignAudience] ?? 0;

  const handlePreviewCampaign = async () => {
    if (!campaignMessage.trim()) {
      setNotice('warning', 'Add a message before previewing the campaign.');
      return;
    }
    if (selectedAudienceCount === 0) {
      setNotice('warning', `No schools match the ${campaignAudience.toLowerCase()} audience. Choose another audience or add more school records.`);
      return;
    }

    setIsPreviewingCampaign(true);
    try {
      const response = await fetch('/schoolbase-admin/api/whatsapp/campaigns/preview', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: campaignName,
          audience: campaignAudience,
          templateId: selectedTemplateId,
          message: campaignMessage,
          scheduled: campaignScheduled,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || 'Failed to preview the campaign.');
      }

      setCampaignPreview(data.preview || null);
      setNotice('info', data.preview?.summary || 'Campaign preview generated successfully.');
    } catch (error) {
      console.error('Platform campaign preview error:', error);
      setNotice('warning', error instanceof Error ? error.message : 'Unable to preview the campaign.');
    } finally {
      setIsPreviewingCampaign(false);
    }
  };

  const handleCreateCampaign = async () => {
    if (!campaignMessage.trim()) {
      setNotice('warning', 'Add a message before creating the campaign.');
      return;
    }
    if (selectedAudienceCount === 0) {
      setNotice('warning', `No schools match the ${campaignAudience.toLowerCase()} audience. Choose a different audience before sending.`);
      return;
    }

    setIsCreatingCampaign(true);
    try {
      const response = await fetch('/schoolbase-admin/api/whatsapp/campaigns', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: campaignName,
          audience: campaignAudience,
          templateId: selectedTemplateId,
          message: campaignMessage,
          scheduled: campaignScheduled,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || 'Failed to create the campaign.');
      }

      const createdTitle = data?.campaign?.name || 'Campaign created';
      const createdNotice = `${createdTitle} has been queued for review.`;
      setNotice('success', createdNotice);
      openSuccessModal('Campaign queued', createdNotice, 'success');
      await fetchCampaigns();
      await fetchLogs();
    } catch (error) {
      console.error('Platform campaign create error:', error);
      const warningMessage = error instanceof Error ? error.message : 'Unable to create the platform campaign.';
      setNotice('warning', warningMessage);
      openSuccessModal('Campaign failed', warningMessage, 'warning');
    } finally {
      setIsCreatingCampaign(false);
    }
  };

  const extractPhone = (raw?: string | null): string | null => {
    if (!raw) return null;
    let s = String(raw || "");
    const colon = s.indexOf(":");
    if (colon !== -1) s = s.slice(0, colon);
    const at = s.indexOf("@");
    if (at !== -1) s = s.slice(0, at);
    const digits = s.replace(/\D/g, "");
    return digits || s || null;
  };

  return (
    <main className="min-h-screen pb-12">
      <div className="mx-auto max-w-7xl space-y-6 px-0 py-4 sm:px-8 sm:py-8 lg:px-12">
        <header className="relative overflow-hidden border border-border bg-surface px-6 pb-7 pt-8 sm:px-8 sm:pb-8 sm:pt-10">
          <div className="absolute right-0 top-0 h-full w-1/3 bg-brand-light/40 [clip-path:polygon(35%_0,100%_0,100%_100%,0_100%)]" />
          <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div className="flex items-center gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-brand">
                  <WhatsAppIcon className="h-4 w-4 text-[#25D366]" />
                  Communication operations
                </div>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                  Platform WhatsApp
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
                  Manage the platform-owned WhatsApp session, connect it once, and monitor the QR or pairing flow.
                </p>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 self-start sm:self-auto">
              {isConnected ? (
                <WhatsAppIcon className="h-7 w-7 text-[#25D366]" />
              ) : isPendingPairing ? (
                <span className="inline-flex h-2.5 w-2.5 rounded-full bg-amber-500" />
              ) : (
                <span className="inline-flex h-2.5 w-2.5 rounded-full bg-slate-400" />
              )}
              <span className={`text-base font-semibold ${isConnected ? "text-[#25D366]" : "text-slate-600"}`}>
                {isConnected ? "Connected" : badgeLabel}
              </span>
            </div>
          </div>
        </header>

        {successModal.open ? (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4">
            <style>{`@keyframes timetable_whatsapp_enter { from { transform: translateX(36px) scale(.98); opacity: 0 } to { transform: translateX(0) scale(1); opacity: 1 } }`}</style>
            <div className="w-full max-w-md overflow-hidden rounded-md border border-border bg-surface shadow-[0_16px_50px_rgba(10,102,194,0.16)]" style={{ animation: "timetable_whatsapp_enter 320ms cubic-bezier(.2,.9,.2,1)" }}>
              <div className={`border-b px-4 py-4 sm:px-6 sm:py-5 ${successModal.type === 'warning' ? 'border-error/20 bg-error/5' : successModal.type === 'info' ? 'border-brand/20 bg-brand/5' : 'border-brand/20 bg-brand/10'}`}>
                <div className="flex items-start gap-3">
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center border ${successModal.type === 'warning' ? 'border-error/20 bg-error/10 text-error' : 'border-brand/20 bg-brand/10 text-brand'}`}>
                    {successModal.type === 'warning' ? <AlertTriangle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">{successModal.title}</h2>
                    <p className="mt-1 text-sm text-muted">{successModal.type === 'warning' ? 'Please review and try again.' : successModal.type === 'info' ? 'Action update' : 'The action was completed successfully.'}</p>
                  </div>
                </div>
              </div>
              <div className="px-4 py-4 sm:px-6 sm:py-5">
                <p className="text-sm leading-6 text-foreground">{successModal.message}</p>
              </div>
              <div className="flex gap-3 border-t border-border bg-surface/80 px-6 py-4">
                <button
                  type="button"
                  onClick={() => setSuccessModal({ open: false, type: 'success', title: "Success", message: "" })}
                  className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-background"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[minmax(360px,1fr)_minmax(420px,1fr)]">
          <div
            className={`relative overflow-hidden p-5 transition-all duration-300 ${
              isConnected ? "border border-[#25D366]/35 bg-white shadow-[0_0_0_1px_rgba(37,211,102,0.08)]" : "border border-border bg-surface"
            }`}
          >
            <div className={`relative border p-4 ${isConnected ? "border-[#25D366]/20 bg-[#F5FFF8] text-slate-900" : "border-border bg-background text-foreground"}`}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`flex h-9 w-9 items-center justify-center ${isConnected ? "bg-[#25D366] text-white" : "bg-slate-200 text-slate-600"}`}>
                    {isConnected ? <CheckCircle2 className="h-4 w-4" /> : <Wifi className="h-4 w-4" />}
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.22em] text-[#25D366]">Connection status</p>
                    <p className={`mt-1 text-sm font-semibold ${isConnected ? "text-slate-900" : "text-foreground"}`}>
                      {isConnected ? "Connected and ready." : connectionStatusCopy}
                    </p>
                  </div>
                </div>
                {isConnected && (
                  <span className="rounded-full border border-[#25D366]/30 bg-[#25D366]/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#128C7E]">
                    Live
                  </span>
                )}
              </div>
              {session?.phoneNumber && (
                <p className="mt-3 text-xs text-slate-600">Device: {extractPhone(session.phoneNumber)}</p>
              )}
            </div>

            {session?.qr ? (
              <div className="mt-6">
                <p className="mb-2 text-sm font-medium">Scan QR Code</p>
                <div className="overflow-hidden rounded-lg border border-border bg-background">
                  <Image
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(session.qr)}`}
                    alt="Platform WhatsApp QR Code"
                    width={220}
                    height={220}
                    unoptimized
                    className="h-auto w-full max-w-[220px]"
                  />
                </div>
              </div>
            ) : showWaitingFallback ? (
              <div className="mt-6 rounded-lg border border-dashed border-brand/30 bg-brand/5 p-4">
                <p className="text-sm font-semibold">Waiting for the pairing screen</p>
                <p className="mt-2 text-sm text-muted">
                  The WhatsApp session is active, but the QR code has not appeared yet. Refresh in a few seconds or try the connection again if it still does not appear.
                </p>
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
                  <Button onClick={handleCopyPairingCode} variant="outline" className="h-9 px-3 py-2 text-xs">
                    {isCodeCopied ? "Copied" : "Copy code"}
                  </Button>
                </div>
              </div>
            )}

            <div className="mt-6 space-y-3">
              <div>
                <label className="mb-2 block text-sm font-medium">Connection method</label>
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

              {usePairingCode && (
                <div>
                  <label className="mb-2 block text-sm font-medium">Phone number for pairing</label>
                  <input
                    value={pairingPhoneNumber}
                    onChange={(event) => setPairingPhoneNumber(event.target.value)}
                    className="w-full rounded-lg border border-border px-3 py-2"
                    placeholder="2348012345678"
                  />
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium">Platform phone number</label>
                <input
                  value={phoneNumber}
                  onChange={(event) => setPhoneNumber(event.target.value)}
                  className="w-full rounded-lg border border-border px-3 py-2"
                  placeholder="Optional phone number"
                />
              </div>

              <div className="flex flex-wrap gap-2.5">
                <Button onClick={handleConnect} disabled={isConnecting || isConnected} className={`h-9 px-3 py-2 text-xs ${isConnected ? "cursor-not-allowed opacity-50" : ""}`}>
                  {isConnecting ? "Connecting…" : isConnected ? "Connected" : "Connect"}
                </Button>
                <Button onClick={handleDisconnect} disabled={isDisconnecting || !isConnected} variant="secondary" className="h-9 px-3 py-2 text-xs">
                  {isDisconnecting ? "Disconnecting…" : "Disconnect"}
                </Button>
                <Button onClick={() => void fetchStatus(true)} disabled={loading} variant="outline" className="h-9 px-3 py-2 text-xs">
                  Refresh
                </Button>
              </div>
            </div>
          </div>

          <div className="border border-border bg-surface p-5">
            <div className="mb-4 flex items-center gap-2 text-brand">
              <Send className="h-[18px] w-[18px]" />
              <h2 className="text-lg font-semibold text-foreground">Send Test Message</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">Phone number</label>
                <input
                  value={testPhoneNumber}
                  onChange={(event) => setTestPhoneNumber(event.target.value)}
                  className="w-full rounded-lg border border-border px-3 py-2"
                  placeholder="+2348012345678"
                />
              </div>

              <div className="rounded-lg border border-border bg-background p-3 text-sm text-muted">
                This sends a quick platform test message after the connection is live.
              </div>

              <Button type="button" variant="outline" disabled={!session?.connected || isSendingTestMessage} className={`h-9 px-3 py-2 text-xs ${!session?.connected ? "opacity-60" : ""}`} onClick={handleSendTestMessage}>
                {isSendingTestMessage ? 'Sending…' : 'Send test message'}
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <div className="border border-border bg-surface p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-foreground">Platform templates</h2>
              <span className="rounded-full border border-border bg-background px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-muted">
                {templates.length} templates
              </span>
            </div>
            {templates.length ? (
              (() => {
                const selectedTemplate = templates.find((template) => template.id === selectedTemplateId) || templates[0];
                return (
                  <div>
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <div>
                            <p className="text-base font-semibold text-foreground">{selectedTemplate?.name || 'Selected template'}</p>
                          </div>
                          <span className="rounded-full border border-brand/20 bg-brand/5 px-2 py-1 text-[10px] uppercase tracking-[0.15em] text-brand">
                            {selectedTemplate?.status || 'Approved'}
                          </span>
                        </div>

                        <select
                          value={selectedTemplateId}
                          onChange={(event) => {
                            const nextId = event.target.value;
                            setSelectedTemplateId(nextId);
                            const template = templates.find((item) => item.id === nextId);
                            if (template?.message) {
                              setDirectMessage(template.message);
                              setCampaignMessage(template.message);
                            }
                          }}
                          className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm"
                        >
                          {templates.map((template) => (
                            <option key={template.id} value={template.id}>
                              {template.name}
                            </option>
                          ))}
                        </select>

                        <div className="mt-3 rounded-lg bg-background p-3">
                          <p className="whitespace-pre-line text-sm leading-6 text-foreground">
                            {selectedTemplate?.message || 'Template content ready for outreach.'}
                          </p>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <Button type="button" variant="outline" className="h-9 px-3 py-2 text-xs" onClick={() => setDirectMessage(selectedTemplate?.message || directMessage)}>
                            Use for direct send
                          </Button>
                          <Button type="button" className="h-9 px-3 py-2 text-xs" onClick={() => setCampaignMessage(selectedTemplate?.message || campaignMessage)}>
                            Use for campaign
                          </Button>
                        </div>
                  </div>
                );
              })()
            ) : (
              <div className="rounded-lg border border-dashed border-border bg-background p-4 text-sm text-muted">
                No templates yet. The platform template library will appear here next.
              </div>
            )}
          </div>

          <div className="border border-border bg-surface p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-foreground">Direct school outreach</h2>
              <span className="rounded-full border border-border bg-background px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-muted">
                {selectedSchoolIds.length} selected
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">Message</label>
                <textarea
                  value={directMessage}
                  onChange={(event) => setDirectMessage(event.target.value)}
                  rows={12}
                  className="min-h-[350px] w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  placeholder="Type the WhatsApp message to send to the selected schools."
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Schools</label>
                <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-border bg-background p-3">
                  {schools.length ? schools.map((school) => (
                    <label key={school.id} className="flex cursor-pointer items-center justify-between gap-3 rounded-md border border-transparent px-2 py-2 hover:border-brand/20">
                      <span className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={selectedSchoolIds.includes(school.id)}
                          onChange={() => toggleSchoolSelection(school.id)}
                        />
                        <span>{school.name}</span>
                      </span>
                      <span className="text-[10px] uppercase tracking-[0.16em] text-muted">{school.phone ? 'Phone set' : 'No phone'}</span>
                    </label>
                  )) : (
                    <p className="text-sm text-muted">Loading schools…</p>
                  )}
                </div>
              </div>

              <Button type="button" onClick={handleSendToSelectedSchools} disabled={isSendingSchoolMessage || !selectedSchoolIds.length} className={`h-9 px-3 py-2 text-xs ${!selectedSchoolIds.length ? 'opacity-60' : ''}`}>
                {isSendingSchoolMessage ? 'Sending…' : 'Send to selected schools'}
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <div className="border border-border bg-surface p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-foreground">Campaign review</h2>
              <span className="rounded-full border border-border bg-background px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-muted">
                {campaigns.length} campaigns
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">Campaign name</label>
                <input
                  value={campaignName}
                  onChange={(event) => setCampaignName(event.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2"
                  placeholder="Platform outreach campaign"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Audience</label>
                <select
                  value={campaignAudience}
                  onChange={(event) => setCampaignAudience(event.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2"
                >
                  <option>All schools</option>
                  <option>Trial schools</option>
                  <option>Incomplete setups</option>
                  <option>Expiring schools</option>
                  <option>Renewal reminders</option>
                </select>
                <div className="mt-2 flex flex-wrap gap-2">
                  {Object.entries({
                    'All schools': audienceCounts['All schools'] ?? 0,
                    'Trial schools': audienceCounts['Trial schools'] ?? 0,
                    'Incomplete setups': audienceCounts['Incomplete setups'] ?? 0,
                    'Expiring schools': audienceCounts['Expiring schools'] ?? 0,
                    'Renewal reminders': audienceCounts['Renewal reminders'] ?? 0,
                  }).map(([label, count]) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setCampaignAudience(label)}
                      className={`rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] ${
                        campaignAudience === label
                          ? 'border-brand bg-brand/10 text-brand'
                          : 'border-border bg-background text-muted'
                      }`}
                    >
                      {label} · {count}
                    </button>
                  ))}
                </div>
                <div className="mt-3 rounded-lg border border-border bg-background px-3 py-2 text-sm text-muted">
                  Selected audience size: <span className="font-semibold text-foreground">{selectedAudienceCount}</span> schools
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Template</label>
                <select
                  value={selectedTemplateId}
                  onChange={(event) => {
                    const nextId = event.target.value;
                    setSelectedTemplateId(nextId);
                    const template = templates.find((item) => item.id === nextId);
                    if (template?.message) {
                      setCampaignMessage(template.message);
                    }
                  }}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2"
                >
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>{template.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Scheduled time</label>
                <input
                  value={campaignScheduled}
                  onChange={(event) => setCampaignScheduled(event.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2"
                  placeholder="Tomorrow"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Message</label>
                <textarea
                  value={campaignMessage}
                  onChange={(event) => setCampaignMessage(event.target.value)}
                  rows={5}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  placeholder="Type the campaign message."
                />
              </div>

              <div className="flex flex-wrap gap-2.5">
                <Button type="button" variant="outline" className="h-9 px-3 py-2 text-xs" onClick={handlePreviewCampaign} disabled={isPreviewingCampaign}>
                  {isPreviewingCampaign ? 'Previewing…' : 'Preview campaign'}
                </Button>
                <Button type="button" className="h-9 px-3 py-2 text-xs" onClick={handleCreateCampaign} disabled={isCreatingCampaign}>
                  {isCreatingCampaign ? 'Creating…' : 'Create campaign'}
                </Button>
              </div>

              {campaignPreview ? (
                <div className="rounded-lg border border-brand/20 bg-brand/5 p-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-brand">Preview</p>
                  <p className="mt-2 text-sm font-semibold text-foreground">{campaignPreview.templateName || 'Campaign template'}</p>
                  <p className="mt-2 text-sm text-muted">{campaignPreview.summary}</p>
                  <div className="mt-3 flex items-center justify-between text-xs uppercase tracking-[0.16em] text-muted">
                    <span>{campaignPreview.audience}</span>
                    <span>{campaignPreview.estimatedRecipients} recipients</span>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="border border-border bg-surface p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-foreground">Campaign queue</h2>
              <span className="rounded-full border border-border bg-background px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-muted">
                {campaigns.length} campaigns
              </span>
            </div>
            <div className="space-y-3">
              {campaigns.length ? campaigns.slice(0, 4).map((campaign) => (
                <div key={campaign.id} className="rounded-lg border border-border bg-background p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-foreground">{campaign.name}</p>
                    <span className="rounded-full border border-border bg-surface px-2 py-1 text-[10px] uppercase tracking-[0.15em] text-muted">
                      {campaign.status}
                    </span>
                  </div>
                  <p className="mt-2 text-xs uppercase tracking-[0.18em] text-muted">{campaign.audience}</p>
                  <div className="mt-2 flex items-center justify-between text-sm text-muted">
                    <span>{campaign.recipients} schools</span>
                    <span>{campaign.scheduled}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {campaign.status !== 'approved' && (
                      <Button type="button" variant="outline" className="h-8 px-2.5 py-1.5 text-[11px]" onClick={() => void updateCampaignStatus(campaign.id, 'approved')}>
                        Approve
                      </Button>
                    )}
                    {campaign.status !== 'queued' && (
                      <Button type="button" variant="outline" className="h-8 px-2.5 py-1.5 text-[11px]" onClick={() => void updateCampaignStatus(campaign.id, 'queued')}>
                        Queue
                      </Button>
                    )}
                    {campaign.status !== 'sent' && (
                      <Button type="button" className="h-8 px-2.5 py-1.5 text-[11px]" onClick={() => void sendCampaignNow(campaign.id)}>
                        Send now
                      </Button>
                    )}
                  </div>
                </div>
              )) : (
                <div className="rounded-lg border border-dashed border-border bg-background p-4 text-sm text-muted">
                  No campaign queue yet. Create your first platform outreach campaign to start the review flow.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="border border-border bg-surface p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-foreground">Delivery logs</h2>
            <span className="rounded-full border border-border bg-background px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-muted">
              {logs.length} updates
            </span>
          </div>
          <div className="space-y-3">
            {logs.length ? logs.map((log) => (
              <div key={log.id} className="flex items-start justify-between gap-3 rounded-lg border border-border bg-background p-3">
                <div>
                  <p className="font-medium text-foreground">{log.title}</p>
                  <p className="mt-1 text-sm text-muted">{log.details}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <span className="rounded-full border border-border bg-surface px-2 py-1 text-[10px] uppercase tracking-[0.15em] text-muted">
                    {log.status}
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.16em] text-muted">{log.time}</span>
                </div>
              </div>
            )) : (
              <div className="rounded-lg border border-dashed border-border bg-background p-4 text-sm text-muted">
                Delivery logs will appear here after campaign previews and sends are created.
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
