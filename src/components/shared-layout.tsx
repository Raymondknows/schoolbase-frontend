"use client";

import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import Sidebar from "@/components/sidebar";
import { usePathname } from "next/navigation";
import { Menu, X, FileText, Music, Play, Pause, ChevronDown, ChevronLeft, ChevronRight, Volume2, Calculator, Bell, Clock, Sparkles, Loader2, MoonStar, SunMedium, Equal, Delete, RefreshCcw, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "@/components/platform-admin/theme-switcher";
import { playCloseTone, playOpenTone } from "@/lib/sounds";
import { applyTheme, detectSystemTheme, resolveStoredTheme, ThemeMode } from "@/lib/theme";
import TeacherClassAlert from "@/components/teacher-class-alert";
import BellScheduler from "@/components/bell-scheduler";

export type NavItem = {
  href: string;
  label: string;
  icon: string;
  section?: string;
};

export default function SharedLayout({
  children,
  navItems,
  school,
  session,
  setupProgress,
  logoHref = "/",
  logoutRedirectUrl = "/login",
}: {
  children: ReactNode;
  navItems: NavItem[];
  school?: { name?: string | null; city?: string | null; country?: string | null } | null;
  session?: { name?: string } | null;
  setupProgress?: number | null;
  logoHref?: string;
  logoutRedirectUrl?: string;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [noteModalPosition, setNoteModalPosition] = useState({ top: 120, left: 80 });
  const [isDraggingNotes, setIsDraggingNotes] = useState(false);
  const [adminSessionNotes, setAdminSessionNotes] = useState("");
  const [audioFileUrl, setAudioFileUrl] = useState<string | null>(null);
  const [audioFileName, setAudioFileName] = useState<string | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [pendingAutoPlay, setPendingAutoPlay] = useState(false);
  const [playerCollapsed, setPlayerCollapsed] = useState(false);
  const [audioQueue, setAudioQueue] = useState<Array<{ name: string; src: string }>>([]);
  const [currentAudioIndex, setCurrentAudioIndex] = useState<number | null>(null);
  const [audioProgress, setAudioProgress] = useState(0);
  const [playerVolume, setPlayerVolume] = useState(0.75);
  const [noteModalWidth, setNoteModalWidth] = useState(720);
  const [noteModalHeight, setNoteModalHeight] = useState(480);
  const [isResizingNotes, setIsResizingNotes] = useState(false);
  const [isVolumePopoverOpen, setIsVolumePopoverOpen] = useState(false);
  const [isAudioPlayerOpen, setIsAudioPlayerOpen] = useState(false);
  const [isAudioBuffering, setIsAudioBuffering] = useState(false);
  const [themeMode, setThemeMode] = useState<ThemeMode>("system");
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [toolsPosition, setToolsPosition] = useState({ x: 24, y: 120 });
  const [isDraggingTools, setIsDraggingTools] = useState(false);
  const [toolPanelPosition, setToolPanelPosition] = useState({ x: 680, y: 120 });
  const [audioPanelPosition, setAudioPanelPosition] = useState({ x: 24, y: 200 });
  const [isDraggingToolPanel, setIsDraggingToolPanel] = useState(false);
  const [isDraggingAudioPanel, setIsDraggingAudioPanel] = useState(false);
  const [activeTool, setActiveTool] = useState<"notes" | "calculator" | "reminders" | "timer">("notes");
  const [isToolPanelOpen, setIsToolPanelOpen] = useState(false);
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [themePanelPosition, setThemePanelPosition] = useState({ x: 680, y: 120 });
  const [isDraggingThemePanel, setIsDraggingThemePanel] = useState(false);
  const themePanelRef = useRef<HTMLDivElement | null>(null);
  const themePanelDragOffsetRef = useRef({ x: 0, y: 0 });
  const [calculatorExpression, setCalculatorExpression] = useState("12+34");
  const [calculatorResult, setCalculatorResult] = useState("0");
  const [calculatorHistory, setCalculatorHistory] = useState<string[]>([]);
  const [reminderInput, setReminderInput] = useState("");
  const [reminders, setReminders] = useState<string[]>([]);
  const [timerInput, setTimerInput] = useState("05:00");
  const [timerRemaining, setTimerRemaining] = useState(300);
  const [timerRunning, setTimerRunning] = useState(false);
  const timerIntervalRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const resizeStartRef = useRef<any>({ startX: 0, width: 720, startLeft: 0, startY: 0, height: 480, side: "right" });
  const volumeButtonRef = useRef<HTMLButtonElement | null>(null);
  const volumePopoverRef = useRef<HTMLDivElement | null>(null);
  const toolPanelRef = useRef<HTMLDivElement | null>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const toolPanelDragOffsetRef = useRef({ x: 0, y: 0 });
  const audioPanelDragOffsetRef = useRef({ x: 0, y: 0 });
  const toolsDragOffsetRef = useRef({ x: 0, y: 0 });
  const toolsTouchMovedRef = useRef(false);
  const audioTouchMovedRef = useRef(false);

  const DEFAULT_JINGLES = [
    { name: "SchoolBase Jingle 1", src: "/audio-jingles/SchoolBase%20_%20Simple%20On%20Your%20Screen.mp3" },
    { name: "SchoolBase Jingle 2", src: "/audio-jingles/SchoolBase%20_%20Simple%20On%20Your%20Screen%202.mp3" },
  ];

  const pathname = usePathname();
  const hideSidebar = pathname?.startsWith("/login");

  useEffect(() => {
    setAdminSessionNotes(window.sessionStorage.getItem("schoolbase-admin-session-notes") || "");
    setPlayerCollapsed(window.localStorage.getItem("admin-notes-player-collapsed") === "true");

    const stored = resolveStoredTheme();
    setThemeMode(stored);
    applyTheme(stored);
  }, []);

  useEffect(() => {
    if (themeMode !== "system") return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemChange = () => applyTheme("system");

    media.addEventListener("change", handleSystemChange);
    return () => media.removeEventListener("change", handleSystemChange);
  }, [themeMode]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (themePanelRef.current?.contains(event.target as Node)) {
        return;
      }
      setIsThemeOpen(false);
    };

    if (!isThemeOpen) return;
    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, [isThemeOpen]);

  useEffect(() => {
    window.sessionStorage.setItem("schoolbase-admin-session-notes", adminSessionNotes);
  }, [adminSessionNotes]);

  useEffect(() => {
    window.localStorage.setItem("admin-notes-player-collapsed", playerCollapsed ? "true" : "false");
  }, [playerCollapsed]);

  useEffect(() => {
    if (!isDraggingNotes) return;

    const handleMouseMove = (event: MouseEvent) => {
      setNoteModalPosition((current) => ({
        top: Math.max(16, event.clientY - dragOffsetRef.current.y),
        left: Math.max(16, event.clientX - dragOffsetRef.current.x),
      }));
    };

    const handleMouseUp = () => {
      setIsDraggingNotes(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDraggingNotes]);

  useEffect(() => {
    if (!isDraggingThemePanel) return;

    const handleMouseMove = (event: MouseEvent) => {
      setThemePanelPosition((current) => clampToViewport(
        {
          x: event.clientX - themePanelDragOffsetRef.current.x,
          y: event.clientY - themePanelDragOffsetRef.current.y,
        },
        320,
        260
      ));
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (event.touches.length !== 1) return;
      const touch = event.touches[0];
      setThemePanelPosition((current) => clampToViewport(
        {
          x: touch.clientX - themePanelDragOffsetRef.current.x,
          y: touch.clientY - themePanelDragOffsetRef.current.y,
        },
        320,
        260
      ));
      event.preventDefault();
    };

    const handleMouseUp = () => setIsDraggingThemePanel(false);
    const handleTouchEnd = () => setIsDraggingThemePanel(false);

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd);
    window.addEventListener("touchcancel", handleTouchEnd);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, [isDraggingThemePanel]);

  useEffect(() => {
    if (!isResizingNotes) return;

    const handleResizeMove = (event: MouseEvent) => {
      const side = resizeStartRef.current.side || "right";
      const minWidth = 480;
      const maxWidth = 1024;

      if (side === "right") {
        const deltaX = event.clientX - resizeStartRef.current.startX;
        const newWidth = Math.min(Math.max(resizeStartRef.current.width + deltaX, minWidth), maxWidth);
        setNoteModalWidth(newWidth);
      } else if (side === "left") {
        const deltaX = event.clientX - resizeStartRef.current.startX;
        let proposedLeft = Math.max(16, resizeStartRef.current.startLeft + deltaX);
        // width should shrink/grow opposite the left movement
        let newWidth = resizeStartRef.current.width - (proposedLeft - resizeStartRef.current.startLeft);
        if (newWidth < minWidth) {
          newWidth = minWidth;
          proposedLeft = resizeStartRef.current.startLeft + (resizeStartRef.current.width - minWidth);
        } else if (newWidth > maxWidth) {
          newWidth = maxWidth;
          proposedLeft = resizeStartRef.current.startLeft + (resizeStartRef.current.width - maxWidth);
        }
        setNoteModalWidth(newWidth);
        setNoteModalPosition((current) => ({ ...current, left: Math.max(16, proposedLeft) }));
      } else if (side === "bottom") {
        const deltaY = event.clientY - resizeStartRef.current.startY;
        const minH = 240;
        const maxH = 1200;
        const newHeight = Math.min(Math.max(resizeStartRef.current.height + deltaY, minH), maxH);
        setNoteModalHeight(newHeight);
      } else if (side === "top") {
        const deltaY = event.clientY - resizeStartRef.current.startY;
        let proposedTop = Math.max(16, resizeStartRef.current.startTop + deltaY);
        let newHeight = resizeStartRef.current.height - (proposedTop - resizeStartRef.current.startTop);
        const minH = 240;
        const maxH = 1200;
        if (newHeight < minH) {
          newHeight = minH;
          proposedTop = resizeStartRef.current.startTop + (resizeStartRef.current.height - minH);
        } else if (newHeight > maxH) {
          newHeight = maxH;
          proposedTop = resizeStartRef.current.startTop + (resizeStartRef.current.height - maxH);
        }
        setNoteModalHeight(newHeight);
        setNoteModalPosition((current) => ({ ...current, top: Math.max(16, proposedTop) }));
      }
    };

    const handleResizeUp = () => {
      setIsResizingNotes(false);
    };

    window.addEventListener("mousemove", handleResizeMove);
    window.addEventListener("mouseup", handleResizeUp);

    return () => {
      window.removeEventListener("mousemove", handleResizeMove);
      window.removeEventListener("mouseup", handleResizeUp);
    };
  }, [isResizingNotes]);

  useEffect(() => {
    if (!isVolumePopoverOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        volumeButtonRef.current?.contains(event.target as Node) ||
        volumePopoverRef.current?.contains(event.target as Node)
      ) {
        return;
      }
      setIsVolumePopoverOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isVolumePopoverOpen]);

  useEffect(() => {
    if (!isToolsOpen) return;

    const handleToolClickOutside = (event: MouseEvent) => {
      if (!toolPanelRef.current) return;
      if (toolPanelRef.current.contains(event.target as Node)) return;
      setIsToolsOpen(false);
    };

    window.addEventListener("mousedown", handleToolClickOutside);
    return () => window.removeEventListener("mousedown", handleToolClickOutside);
  }, [isToolsOpen]);

  useEffect(() => {
    if (!isToolPanelOpen) return;

    const panelWidth = activeTool === "reminders" ? 560 : 320;
    setToolPanelPosition((current) => clampToViewport(current, panelWidth, 520));
  }, [activeTool, isToolPanelOpen]);

  useEffect(() => {
    if (!isAudioPlayerOpen) return;

    setAudioPanelPosition((current) => clampPanelToViewport(current, 440, 520));
  }, [isAudioPlayerOpen]);

  useEffect(() => {
    const handleResize = () => {
      if (isToolPanelOpen) {
        const panelWidth = activeTool === "reminders" ? 560 : 320;
        setToolPanelPosition((current) => clampToViewport(current, panelWidth, 520));
      }
      if (isAudioPlayerOpen) {
        setAudioPanelPosition((current) => clampPanelToViewport(current, 440, 520));
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [activeTool, isAudioPlayerOpen, isToolPanelOpen]);

  useEffect(() => {
    if (!isDraggingToolPanel && !isDraggingAudioPanel) return;

    const handleMouseMove = (event: MouseEvent) => {
      if (isDraggingToolPanel) {
        setToolPanelPosition({
          x: Math.max(12, Math.min(window.innerWidth - 340, event.clientX - toolPanelDragOffsetRef.current.x)),
          y: Math.max(12, Math.min(window.innerHeight - 240, event.clientY - toolPanelDragOffsetRef.current.y)),
        });
      }
      if (isDraggingAudioPanel) {
        setAudioPanelPosition({
          x: Math.max(12, Math.min(window.innerWidth - 460, event.clientX - audioPanelDragOffsetRef.current.x)),
          y: Math.max(12, Math.min(window.innerHeight - 320, event.clientY - audioPanelDragOffsetRef.current.y)),
        });
      }
    };

    const handleTouchMovePanel = (event: TouchEvent) => {
      if (event.touches.length !== 1) return;
      const touch = event.touches[0];
      if (isDraggingToolPanel) {
        setToolPanelPosition({
          x: Math.max(12, Math.min(window.innerWidth - 340, touch.clientX - toolPanelDragOffsetRef.current.x)),
          y: Math.max(12, Math.min(window.innerHeight - 240, touch.clientY - toolPanelDragOffsetRef.current.y)),
        });
      }
      if (isDraggingAudioPanel) {
        audioTouchMovedRef.current = true;
        setAudioPanelPosition({
          x: Math.max(12, Math.min(window.innerWidth - 460, touch.clientX - audioPanelDragOffsetRef.current.x)),
          y: Math.max(12, Math.min(window.innerHeight - 320, touch.clientY - audioPanelDragOffsetRef.current.y)),
        });
      }
      event.preventDefault();
    };

    const handleMouseUp = () => {
      setIsDraggingToolPanel(false);
      setIsDraggingAudioPanel(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchmove", handleTouchMovePanel, { passive: false });
    window.addEventListener("touchend", handleMouseUp);
    window.addEventListener("touchcancel", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMovePanel);
      window.removeEventListener("touchend", handleMouseUp);
      window.removeEventListener("touchcancel", handleMouseUp);
    };
  }, [isDraggingToolPanel, isDraggingAudioPanel]);

  useEffect(() => {
    if (!isDraggingTools) return;

    const handleMouseMove = (event: MouseEvent) => {
      const nextX = Math.max(12, Math.min(window.innerWidth - 60, event.clientX - toolsDragOffsetRef.current.x));
      const nextY = Math.max(12, Math.min(window.innerHeight - 60, event.clientY - toolsDragOffsetRef.current.y));
      setToolsPosition({ x: nextX, y: nextY });
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (event.touches.length !== 1) return;
      toolsTouchMovedRef.current = true;
      const touch = event.touches[0];
      const nextX = Math.max(12, Math.min(window.innerWidth - 60, touch.clientX - toolsDragOffsetRef.current.x));
      const nextY = Math.max(12, Math.min(window.innerHeight - 60, touch.clientY - toolsDragOffsetRef.current.y));
      setToolsPosition({ x: nextX, y: nextY });
      event.preventDefault();
    };

    const handleMouseUp = () => setIsDraggingTools(false);
    const handleTouchEnd = () => setIsDraggingTools(false);

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd);
    window.addEventListener("touchcancel", handleTouchEnd);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, [isDraggingTools]);

  const sanitizeCalculatorInput = (expression: string) => {
    return expression.replace(/[^0-9+\-*/().% ]/g, "");
  };

  const calculateExpression = (expression: string) => {
    const sanitized = sanitizeCalculatorInput(expression);
    try {
      const result = Function(`"use strict"; return (${sanitized})`)();
      if (typeof result === "number" && Number.isFinite(result)) {
        return String(result);
      }
    } catch {
      // ignore invalid expressions
    }
    return "Error";
  };

  const clampToViewport = (position: { x: number; y: number }, panelWidth: number, panelHeight: number) => {
    if (typeof window === "undefined") return position;
    const minX = 16;
    const minY = 16;
    const maxX = Math.max(minX, window.innerWidth - panelWidth - 16);
    const maxY = Math.max(minY, window.innerHeight - panelHeight - 16);
    return {
      x: Math.min(Math.max(position.x, minX), maxX),
      y: Math.min(Math.max(position.y, minY), maxY),
    };
  };

  const openTool = (tool: "notes" | "calculator" | "reminders" | "timer") => {
    setActiveTool(tool);
    playCloseTone();
    setIsToolsOpen(false);
    if (tool === "notes") {
      openNotesModal();
    } else {
      const panelWidth = tool === "reminders" ? 560 : 320;
      const panelHeight = 520;
      setToolPanelPosition((current) => clampToViewport(current, panelWidth, panelHeight));
      setIsToolPanelOpen(true);
    }
  };

  const openThemePanel = () => {
    playOpenTone();
    setIsToolsOpen(false);
    setThemePanelPosition((current) => clampToViewport(current, 320, 260));
    setIsThemeOpen(true);
  };

  const toggleToolsOpen = () => {
    setIsToolsOpen((current) => {
      const next = !current;
      if (next) {
        playOpenTone();
      } else {
        playCloseTone();
      }
      return next;
    });
  };

  const handleCalculatorEvaluate = () => {
    const result = calculateExpression(calculatorExpression);
    setCalculatorResult(result);
    setCalculatorHistory((current) => [`${calculatorExpression} = ${result}`, ...current].slice(0, 6));
    setIsToolPanelOpen(true);
    playCloseTone();
    setIsToolsOpen(false);
  };

  const appendCalculatorExpression = (value: string) => {
    setCalculatorExpression((current) => current + value);
  };

  const clearCalculator = () => {
    setCalculatorExpression("");
    setCalculatorResult("0");
  };

  const backspaceCalculator = () => {
    setCalculatorExpression((current) => current.slice(0, -1));
  };

  const addReminder = () => {
    const trimmed = reminderInput.trim();
    if (!trimmed) return;
    setReminders((current) => [trimmed, ...current]);
    setReminderInput("");
    setActiveTool("reminders");
    setIsToolPanelOpen(true);
    setIsToolsOpen(false);
  };

  const parseTimerInput = (value: string) => {
    const parts = value.split(":").map((part) => Number(part.trim()));
    if (parts.length === 2 && Number.isFinite(parts[0]) && Number.isFinite(parts[1])) {
      return parts[0] * 60 + parts[1];
    }
    if (parts.length === 1 && Number.isFinite(parts[0])) {
      return parts[0];
    }
    return 0;
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const startTimer = () => {
    const seconds = parseTimerInput(timerInput);
    if (seconds <= 0) return;
    setTimerRemaining(seconds);
    setTimerRunning(true);
    if (timerIntervalRef.current) {
      window.clearInterval(timerIntervalRef.current);
    }
    timerIntervalRef.current = window.setInterval(() => {
      setTimerRemaining((current) => {
        if (current <= 1) {
          if (timerIntervalRef.current) {
            window.clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
          }
          setTimerRunning(false);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
  };

  const pauseTimer = () => {
    if (timerIntervalRef.current) {
      window.clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setTimerRunning(false);
  };

  const resetTimer = () => {
    pauseTimer();
    setTimerRemaining(parseTimerInput(timerInput));
  };

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        window.clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  const handleNotesMouseDown = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    setIsDraggingNotes(true);
    dragOffsetRef.current = {
      x: event.clientX - noteModalPosition.left,
      y: event.clientY - noteModalPosition.top,
    };
  };

  const handleToolPanelMouseDown = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if ((event.target as HTMLElement).closest("button")) return;
    event.preventDefault();
    setIsDraggingToolPanel(true);
    toolPanelDragOffsetRef.current = {
      x: event.clientX - toolPanelPosition.x,
      y: event.clientY - toolPanelPosition.y,
    };
  };

  const handleThemePanelMouseDown = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if ((event.target as HTMLElement).closest("button")) return;
    event.preventDefault();
    setIsDraggingThemePanel(true);
    themePanelDragOffsetRef.current = {
      x: event.clientX - themePanelPosition.x,
      y: event.clientY - themePanelPosition.y,
    };
  };

  const handleThemePanelTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    if (event.touches.length !== 1) return;
    const touch = event.touches[0];
    setIsDraggingThemePanel(true);
    themePanelDragOffsetRef.current = {
      x: touch.clientX - themePanelPosition.x,
      y: touch.clientY - themePanelPosition.y,
    };
  };

  const handleToolsMouseDown = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    event.preventDefault();
    toolsTouchMovedRef.current = false;
    setIsDraggingTools(true);
    toolsDragOffsetRef.current = {
      x: event.clientX - toolsPosition.x,
      y: event.clientY - toolsPosition.y,
    };
  };

  const handleToolsTouchStart = (event: React.TouchEvent<HTMLButtonElement>) => {
    if (event.touches.length !== 1) return;
    const touch = event.touches[0];
    toolsTouchMovedRef.current = false;
    setIsDraggingTools(true);
    toolsDragOffsetRef.current = {
      x: touch.clientX - toolsPosition.x,
      y: touch.clientY - toolsPosition.y,
    };
  };

  const handleAudioPanelTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    if (event.touches.length !== 1) return;
    const touch = event.touches[0];
    audioTouchMovedRef.current = false;
    setIsDraggingAudioPanel(true);
    audioPanelDragOffsetRef.current = {
      x: touch.clientX - audioPanelPosition.x,
      y: touch.clientY - audioPanelPosition.y,
    };
  };

  const handleAudioPanelMouseDown = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if ((event.target as HTMLElement).closest("button")) return;
    event.preventDefault();
    setIsDraggingAudioPanel(true);
    audioPanelDragOffsetRef.current = {
      x: event.clientX - audioPanelPosition.x,
      y: event.clientY - audioPanelPosition.y,
    };
  };

  const openNotesModal = () => {
    playOpenTone();
    // Ensure modal is visible on small viewports by clamping position
    const modalW = Math.min(noteModalWidth, (typeof window !== 'undefined' ? window.innerWidth - 32 : noteModalWidth));
    const modalH = Math.min(noteModalHeight, (typeof window !== 'undefined' ? window.innerHeight - 32 : noteModalHeight));
    const maxLeft = (typeof window !== 'undefined') ? Math.max(16, window.innerWidth - modalW - 16) : noteModalPosition.left;
    const maxTop = (typeof window !== 'undefined') ? Math.max(16, window.innerHeight - modalH - 16) : noteModalPosition.top;
    setNoteModalPosition((current) => ({
      top: Math.min(current.top, maxTop),
      left: Math.min(current.left, maxLeft),
    }));
    setIsNotesOpen(true);
  };

  const clampPanelToViewport = (position: { x: number; y: number }, panelWidth: number, panelHeight: number) => {
    if (typeof window === "undefined") return position;
    const minX = 16;
    const minY = 16;
    const maxX = Math.max(minX, window.innerWidth - panelWidth - 16);
    const maxY = Math.max(minY, window.innerHeight - panelHeight - 16);
    return {
      x: Math.min(Math.max(position.x, minX), maxX),
      y: Math.min(Math.max(position.y, minY), maxY),
    };
  };

  const closeNotesModal = () => {
    playCloseTone();
    setIsNotesOpen(false);
  };

  const toggleAudioPlayer = () => {
    setAudioPanelPosition((current) => clampPanelToViewport(current, 440, 520));
    setIsAudioPlayerOpen((current) => {
      const next = !current;
      if (next) {
        playOpenTone();
      } else {
        playCloseTone();
      }
      return next;
    });
  };

  const clearNotes = () => {
    setAdminSessionNotes("");
  };

  const handleAudioFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const items = files.map((file) => ({ name: file.name, src: URL.createObjectURL(file) }));

    setAudioQueue((q) => {
      const next = [...q, ...items];
      // If nothing is currently playing, start the first of the newly added items
      if (currentAudioIndex === null && next.length > 0) {
        const idx = q.length; // index of first newly added
        setCurrentAudioIndex(idx);
        setAudioFileUrl(next[idx].src);
        setAudioFileName(next[idx].name);
        setPendingAutoPlay(true);
        setIsAudioPlaying(true);
        setAudioProgress(0);
      }
      return next;
    });
  };

  const playDefaultJingle = (index: number) => {
    const jingle = DEFAULT_JINGLES[index];
    if (!jingle) return;
    // replace queue with single jingle and play immediately
    setAudioQueue([{ name: jingle.name, src: jingle.src }]);
    setCurrentAudioIndex(0);
    setAudioFileUrl(jingle.src);
    setAudioFileName(jingle.name);
    setPendingAutoPlay(true);
    setIsAudioPlaying(true);
    setAudioProgress(0);
  };

  const toggleAudioPlayback = () => {
    if (!audioRef.current) return;

    if (isAudioPlaying) {
      audioRef.current.pause();
      setIsAudioPlaying(false);
      setIsAudioBuffering(false);
    } else {
      setIsAudioBuffering(true);
      audioRef.current.play().catch(() => {
        setIsAudioPlaying(false);
        setIsAudioBuffering(false);
      });
      setIsAudioPlaying(true);
    }
  };

  const stopAudioPlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsAudioPlaying(false);
    setIsAudioBuffering(false);
    setAudioProgress(0);
  };

  const playTrackAtIndex = (index: number) => {
    if (index < 0 || index >= audioQueue.length) return;
    const item = audioQueue[index];
    if (!item) return;

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    setCurrentAudioIndex(index);
    setAudioFileUrl(item.src);
    setAudioFileName(item.name);
    setPendingAutoPlay(true);
    setIsAudioPlaying(true);
    setAudioProgress(0);
  };

  const playPreviousTrack = () => {
    if (audioQueue.length === 0 || currentAudioIndex === null) return;
    const prevIndex = currentAudioIndex - 1;
    if (prevIndex >= 0) {
      playTrackAtIndex(prevIndex);
    }
  };

  const playNextTrack = () => {
    if (audioQueue.length === 0 || currentAudioIndex === null) return;
    const nextIndex = currentAudioIndex + 1;
    if (nextIndex < audioQueue.length) {
      playTrackAtIndex(nextIndex);
    }
  };

  const seekAudioBySeconds = (seconds: number) => {
    if (!audioRef.current) return;
    const nextTime = Math.max(0, Math.min(audioRef.current.duration || 0, audioRef.current.currentTime + seconds));
    audioRef.current.currentTime = nextTime;
    setAudioProgress(nextTime / (audioRef.current.duration || 1));
  };

  const actualTheme = themeMode === "system" ? (typeof window !== "undefined" ? detectSystemTheme() : "light") : themeMode;

  const handleThemeChange = (nextTheme: ThemeMode) => {
    setThemeMode(nextTheme);
    applyTheme(nextTheme);
  };

  const themeStatusText = useMemo(() => {
    if (themeMode === "system") return "Auto following your OS preference.";
    if (themeMode === "dark") return "Dark mode stays active regardless of system setting.";
    return "Light mode stays active regardless of system setting.";
  }, [themeMode]);

  const toggleThemeMode = () => {
    const nextTheme = actualTheme === "dark" ? "light" : "dark";
    handleThemeChange(nextTheme);
  };

  const handleAudioTimeUpdate = () => {
    if (!audioRef.current) return;
    const current = audioRef.current.currentTime;
    const duration = audioRef.current.duration || 1;
    setAudioProgress(current / duration);
  };

  const handleAudioVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const volume = Number(event.target.value);
    setPlayerVolume(volume);
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  };

  const handlePlayerCollapseToggle = () => {
    setPlayerCollapsed((current) => !current);
  };

  useEffect(() => {
    if (!audioRef.current) return;

    const handleEnded = () => {
      // play next track in queue if available
      if (audioQueue.length > 0 && currentAudioIndex != null && currentAudioIndex + 1 < audioQueue.length) {
        const nextIndex = currentAudioIndex + 1;
        const nextItem = audioQueue[nextIndex];
        setCurrentAudioIndex(nextIndex);
        setAudioFileUrl(nextItem.src);
        setAudioFileName(nextItem.name);
        setPendingAutoPlay(true);
        setIsAudioPlaying(true);
        setAudioProgress(0);
        return;
      }
      setIsAudioPlaying(false);
      setIsAudioBuffering(false);
      setCurrentAudioIndex(null);
    };
    const handleWaiting = () => setIsAudioBuffering(true);
    const handleCanPlay = () => setIsAudioBuffering(false);
    const handlePlaying = () => setIsAudioBuffering(false);

    audioRef.current.addEventListener("ended", handleEnded);
    audioRef.current.addEventListener("waiting", handleWaiting);
    audioRef.current.addEventListener("canplay", handleCanPlay);
    audioRef.current.addEventListener("playing", handlePlaying);

    return () => {
      audioRef.current?.removeEventListener("ended", handleEnded);
      audioRef.current?.removeEventListener("waiting", handleWaiting);
      audioRef.current?.removeEventListener("canplay", handleCanPlay);
      audioRef.current?.removeEventListener("playing", handlePlaying);
    };
  }, [audioFileUrl, audioQueue, currentAudioIndex]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = playerVolume;
    }
  }, [playerVolume]);

  useEffect(() => {
    if (!audioRef.current || !pendingAutoPlay) return;

    audioRef.current.play().catch(() => {
      setIsAudioPlaying(false);
    });
    setPendingAutoPlay(false);
  }, [audioFileUrl, pendingAutoPlay]);

  if (hideSidebar) {
    return (
      <div className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden p-6 md:p-8 print:overflow-visible print:p-0">
        {children}
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {logoHref === "/teacher" ? <TeacherClassAlert /> : null}
      {logoHref === "/admin" ? <BellScheduler /> : null}
      {/* Desktop Sidebar */}
      <Sidebar
        navItems={navItems}
        school={school}
        session={session}
        setupProgress={setupProgress}
        logoHref={logoHref}
        logoutRedirectUrl={logoutRedirectUrl}
      />

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden print:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div
        className={`fixed left-0 top-0 z-40 h-screen w-56 transform bg-surface md:hidden print:hidden transition-transform duration-300 ease-in-out overflow-hidden ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar
          navItems={navItems}
          school={school}
          session={session}
          setupProgress={setupProgress}
          logoHref={logoHref}
          logoutRedirectUrl={logoutRedirectUrl}
          isMobile
          onClose={() => setMobileMenuOpen(false)}
        />
      </div>

      <div className="flex flex-1 flex-col min-w-0">
        {/* Mobile Header */}
        <div className="border-b border-border bg-surface px-4 py-3 md:hidden flex items-center gap-2 print:hidden">
          <Button
            variant="ghost"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1 h-auto w-auto"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
          <h1 className="text-sm font-semibold text-foreground">{school?.name}</h1>
        </div>

        <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden p-6 md:p-8 print:overflow-visible print:p-0">{children}</main>


        <div
          className="fixed z-50 flex flex-col items-end gap-2 print:hidden"
          style={{ left: toolsPosition.x, top: toolsPosition.y }}
        >
          <div className="relative" ref={toolPanelRef}>
            <button
              type="button"
              data-tools-button
              onMouseDown={handleToolsMouseDown}
              onTouchStart={handleToolsTouchStart}
              onClick={(event) => {
                if (toolsTouchMovedRef.current) {
                  event.preventDefault();
                  return;
                }
                toggleToolsOpen();
              }}
              className="inline-flex touch-none select-none h-12 w-12 items-center justify-center rounded-full bg-[#0A66C2] text-white shadow-lg shadow-slate-900/20 transition hover:bg-[#0952a4] hover:scale-105"
              title="Open tools"
              aria-label="Open tools"
            >
              <Sparkles className="h-5 w-5" />
            </button>
            {isToolsOpen ? (
              <div className="absolute right-0 top-full mt-2 flex flex-col items-end gap-2 rounded-full bg-transparent p-1 shadow-none">
                <button
                  type="button"
                  onClick={() => openTool("notes")}
                  className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#0A66C2] text-white shadow-lg shadow-slate-900/10 transition hover:scale-105"
                  title="Notes"
                  aria-label="Open Notes tool"
                >
                  <FileText className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => openTool("calculator")}
                  className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#0A66C2] text-white shadow-lg shadow-slate-900/10 transition hover:scale-105"
                  title="Calculator"
                  aria-label="Open Calculator tool"
                >
                  <Calculator className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => openTool("reminders")}
                  className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#0A66C2] text-white shadow-lg shadow-slate-900/10 transition hover:scale-105"
                  title="Reminders"
                  aria-label="Open Reminders tool"
                >
                  <Bell className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => openTool("timer")}
                  className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#0A66C2] text-white shadow-lg shadow-slate-900/10 transition hover:scale-105"
                  title="Timer"
                  aria-label="Open Timer tool"
                >
                  <Clock className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={openThemePanel}
                  className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#0A66C2] text-white shadow-lg shadow-slate-900/10 transition hover:scale-105"
                  title="Theme"
                  aria-label="Open Theme settings"
                >
                  <SunMedium className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    toggleAudioPlayer();
                    setIsToolsOpen(false);
                  }}
                  className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#0A66C2] text-white shadow-lg shadow-slate-900/10 transition hover:scale-105"
                  title="Audio player"
                  aria-label="Open Audio player"
                >
                  <Music className="h-5 w-5" />
                </button>
              </div>
            ) : null}

          </div>

        </div>

        <div className="fixed z-50 flex flex-col items-end gap-2" style={{ left: audioPanelPosition.x, top: audioPanelPosition.y }}>
          {isAudioPlayerOpen ? (
            <div
                  className={`w-[340px] max-w-[calc(100vw-32px)] rounded-[20px] border p-3 shadow-sm transition ${themeMode === "dark" ? "border-slate-700 bg-slate-900 text-slate-100" : "border-border bg-surface text-foreground"}`}
                >
                <div className={`flex cursor-grab items-start justify-between gap-3 rounded-t-lg px-4 py-3 ${themeMode === "dark" ? "bg-slate-800" : "bg-gradient-to-r from-[#dbeafe] via-[#bfdbfe] to-[#f8fafc]"}`} onMouseDown={handleAudioPanelMouseDown} onTouchStart={handleAudioPanelTouchStart}>
                <div className="flex items-center gap-3">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-2xl ${themeMode === "dark" ? "bg-slate-800 text-slate-100" : "bg-muted text-brand"}`}>
                    {isAudioPlaying ? <Loader2 className="h-5 w-5 animate-spin" /> : <Music className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className={`text-sm font-semibold text-foreground`}>Music player</p>
                    <p className={`text-xs text-muted`}>{audioFileName || "SchoolBase jingle"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleThemeMode}
                    className={`rounded-full border px-2.5 py-1.5 text-xs font-semibold transition ${themeMode === "dark" ? "border-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-700" : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"}`}
                    title={themeMode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                    aria-label={themeMode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                  >
                    {themeMode === "dark" ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setPlayerCollapsed(true); setIsAudioPlayerOpen(false); }}
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition ${themeMode === "dark" ? "border-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-700" : "border-slate-200 bg-background text-foreground hover:bg-surface"}`}
                    title="Minimize player"
                    aria-label="Minimize player"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>
              </div>

                <div className={`mt-3 rounded-lg border p-3 ${themeMode === "dark" ? "border-slate-800 bg-slate-800/70" : "border-border bg-background"}`}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className={`text-xs uppercase tracking-[0.25em] ${themeMode === "dark" ? "text-slate-400" : "text-slate-400"}`}>Now playing</p>
                    <p className={`text-sm font-semibold ${themeMode === "dark" ? "text-slate-100" : "text-slate-900"}`}>{audioFileName || "SchoolBase jingle"}</p>
                  </div>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full border ${themeMode === "dark" ? "border-slate-700 bg-slate-900" : "border-border bg-surface"}`}>
                    {isAudioPlaying ? <Loader2 className="h-5 w-5 animate-spin text-brand" /> : <Music className="h-5 w-5 text-brand" />}
                  </div>
                </div>

                <div className={`mt-4 flex items-center justify-center gap-3 rounded-lg border p-4 ${themeMode === "dark" ? "border-slate-700 bg-slate-900/80" : "border-border bg-background"}`}>
                  <button
                    type="button"
                    onClick={playPreviousTrack}
                    disabled={currentAudioIndex === null || currentAudioIndex <= 0}
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition ${currentAudioIndex === null || currentAudioIndex <= 0 ? "border-slate-700 bg-slate-800 text-slate-500" : "border-border bg-background text-foreground hover:bg-surface"}`}
                    title="Previous track"
                    aria-label="Previous track"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <div className={`relative flex h-20 w-20 items-center justify-center rounded-full border-4 ${themeMode === "dark" ? "border-slate-700" : "border-border"}`}>
                    <div className={`absolute inset-0 rounded-full border-4 border-t-brand ${isAudioPlaying ? "animate-spin" : ""}`} />
                    <button
                      type="button"
                      onClick={toggleAudioPlayback}
                      className="relative z-10 inline-flex h-12 w-12 items-center justify-center rounded-full bg-brand text-white shadow transition hover:bg-brand/90"
                      title={isAudioPlaying ? "Pause music" : "Play music"}
                      aria-label={isAudioPlaying ? "Pause music" : "Play music"}
                    >
                      {isAudioPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={playNextTrack}
                    disabled={currentAudioIndex === null || currentAudioIndex + 1 >= audioQueue.length}
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition ${currentAudioIndex === null || currentAudioIndex + 1 >= audioQueue.length ? "border-slate-700 bg-slate-800 text-slate-500" : "border-border bg-background text-foreground hover:bg-surface"}`}
                    title="Next track"
                    aria-label="Next track"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className={`mt-4 rounded-[20px] border p-3 shadow-sm ${themeMode === "dark" ? "border-slate-700 bg-slate-800/80" : "border-slate-200 bg-white"}`}>
                <div className={`flex items-center justify-between gap-2 text-[11px] uppercase tracking-[0.25em] ${themeMode === "dark" ? "text-slate-400" : "text-slate-400"}`}>
                  <span>Progress</span>
                  <span>{Math.round(audioProgress * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={audioProgress}
                  onChange={(event) => {
                    const nextProgress = Number(event.target.value);
                    setAudioProgress(nextProgress);
                    if (audioRef.current) {
                      const nextTime = (audioRef.current.duration || 1) * nextProgress;
                      audioRef.current.currentTime = nextTime;
                    }
                  }}
                  className="mt-2 h-2 w-full cursor-pointer accent-[#0A66C2]"
                />
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => seekAudioBySeconds(-10)}
                    className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${themeMode === "dark" ? "border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-700" : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"}`}
                  >
                    -10s
                  </button>
                  <button
                    type="button"
                    onClick={stopAudioPlayback}
                    className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${themeMode === "dark" ? "border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-700" : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"}`}
                  >
                    Stop
                  </button>
                  <button
                    type="button"
                    onClick={() => seekAudioBySeconds(10)}
                    className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${themeMode === "dark" ? "border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-700" : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"}`}
                  >
                    +10s
                  </button>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {DEFAULT_JINGLES.map((jingle, index) => (
                  <button
                    key={jingle.name}
                    type="button"
                    onClick={() => playDefaultJingle(index)}
                    className={`rounded-full border px-3 py-2 text-[11px] font-semibold transition ${themeMode === "dark" ? "border-slate-700 bg-slate-800 text-slate-100 hover:border-[#0A66C2] hover:text-[#0A66C2]" : "border-slate-200 bg-slate-50 text-slate-700 hover:border-[#0A66C2] hover:text-[#0A66C2]"}`}
                    title={`Play ${jingle.name}`}
                    aria-label={`Play ${jingle.name}`}
                  >
                    {jingle.name}
                  </button>
                ))}
              </div>

              <div className="mt-4 flex items-center gap-2">
                <button
                  type="button"
                  ref={volumeButtonRef}
                  onClick={() => setIsVolumePopoverOpen((open) => !open)}
                  className={`relative inline-flex h-10 w-10 items-center justify-center rounded-full border transition ${themeMode === "dark" ? "border-slate-700 bg-slate-800 text-slate-100 hover:border-[#0A66C2] hover:text-[#0A66C2]" : "border-slate-200 bg-slate-50 text-slate-700 hover:border-[#0A66C2] hover:text-[#0A66C2]"}`}
                  title="Volume"
                  aria-label="Volume"
                >
                  <Volume2 className="h-4 w-4" />
                </button>
                {isVolumePopoverOpen ? (
                  <div
                    ref={volumePopoverRef}
                    className={`absolute bottom-24 right-4 z-50 w-52 rounded-2xl border p-4 shadow-lg ${themeMode === "dark" ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"}`}
                  >
                    <div className={`flex items-center justify-between gap-3 text-sm font-semibold ${themeMode === "dark" ? "text-slate-100" : "text-slate-900"}`}>
                      <span>Volume</span>
                      <span>{Math.round(playerVolume * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={playerVolume}
                      onChange={handleAudioVolumeChange}
                      className="mt-3 h-2 w-full cursor-pointer accent-[#0A66C2]"
                    />
                  </div>
                ) : null}
                <label className={`flex flex-1 cursor-pointer items-center justify-center rounded-full border px-3 py-2 text-sm font-medium transition ${themeMode === "dark" ? "border-slate-700 bg-slate-800 text-slate-100 hover:border-[#0A66C2] hover:text-[#0A66C2]" : "border-slate-200 bg-slate-50 text-slate-700 hover:border-[#0A66C2] hover:text-[#0A66C2]"}`}>
                  <span>Choose track</span>
                  <input type="file" accept="audio/*" multiple className="hidden" onChange={handleAudioFileChange} />
                </label>
              </div>
            </div>
          ) : null}
        </div>

          {/* Mini player when collapsed */}
          {(playerCollapsed && (audioFileUrl || audioQueue.length > 0)) ? (
            <div
              className="fixed z-50 rounded-xl border border-border bg-surface px-3 py-2 shadow-sm flex cursor-grab items-center gap-2"
              style={{ left: audioPanelPosition.x, top: audioPanelPosition.y }}
              onMouseDown={handleAudioPanelMouseDown}
              onTouchStart={handleAudioPanelTouchStart}
            >
              <button
                type="button"
                onClick={toggleAudioPlayback}
                className="relative inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand text-white"
                title={isAudioBuffering ? "Loading..." : isAudioPlaying ? "Pause music" : "Play music"}
                aria-label={isAudioBuffering ? "Loading audio" : isAudioPlaying ? "Pause music" : "Play music"}
              >
                {isAudioPlaying && !isAudioBuffering ? (
                  <span className="absolute inset-0 rounded-full border-2 border-white/70 border-t-white animate-spin" />
                ) : null}
                {isAudioBuffering ? (
                  <Loader2 className="relative h-4 w-4 text-white animate-spin" />
                ) : isAudioPlaying ? (
                  <Pause className="relative h-4 w-4" />
                ) : (
                  <Play className="relative h-4 w-4" />
                )}
              </button>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate" style={{ maxWidth: 160 }}>{audioFileName || "Playing"}</p>
                <p className="text-xs text-muted">{audioQueue.length > 0 && currentAudioIndex != null ? `${currentAudioIndex + 1}/${audioQueue.length}` : ""}</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => { setPlayerCollapsed(false); setIsAudioPlayerOpen(true); }} className="text-xs text-muted">Open</button>
                <button onClick={() => { setPlayerCollapsed(false); setIsAudioPlayerOpen(false); setIsAudioPlaying(false); }} className="text-xs text-muted">Close</button>
              </div>
            </div>
          ) : null}

        {isThemeOpen ? (
          <div
            ref={themePanelRef}
            className={`fixed z-50 w-[320px] max-w-[calc(100vw-32px)] rounded-[28px] border p-4 shadow-[0_20px_80px_rgba(0,0,0,0.16)] transition ${themeMode === "dark" ? "border-slate-700 bg-slate-900 text-slate-100" : "border-slate-200 bg-white text-slate-900"}`}
            style={{ left: themePanelPosition.x, top: themePanelPosition.y }}
          >
            <div
              className={`flex cursor-grab items-center justify-between gap-3 rounded-t-3xl px-5 py-4 ${themeMode === "dark" ? "bg-slate-800" : "bg-gradient-to-r from-[#dbeafe] via-[#bfdbfe] to-[#f8fafc]"}`}
              onMouseDown={handleThemePanelMouseDown}
              onTouchStart={handleThemePanelTouchStart}
            >
              <div>
                <p className={`text-sm font-semibold ${themeMode === "dark" ? "text-slate-100" : "text-slate-900"}`}>Theme settings</p>
                <p className={`text-xs ${themeMode === "dark" ? "text-slate-400" : "text-slate-600"}`}>Drag to reposition</p>
              </div>
              <button
                type="button"
                onClick={() => setIsThemeOpen(false)}
                className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${themeMode === "dark" ? "border-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-700" : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"}`}
              >
                Close
              </button>
            </div>
            <div className="mt-4">
              <ThemeSwitcher theme={themeMode} onChange={handleThemeChange} />
            </div>
          </div>
        ) : null}

        {isNotesOpen ? (
          <div className="fixed inset-0 z-50 pointer-events-none">
            <div
              className="absolute z-50 rounded-2xl border border-slate-200 bg-white shadow-[0_16px_50px_rgba(10,102,194,0.16)] pointer-events-auto flex flex-col"
              style={{
                  animation: `notes_modal_enter 320ms cubic-bezier(.2,.9,.2,1)`,
                  top: noteModalPosition.top,
                  left: noteModalPosition.left,
                  position: "fixed",
                  width: noteModalWidth,
                  height: noteModalHeight,
                  maxWidth: "calc(100vw - 32px)",
                  maxHeight: "calc(100vh - 32px)",
                }}
            >
              <style>{`
                @keyframes notes_modal_enter { from { transform: translateX(36px) scale(.98); opacity: 0 } to { transform: translateX(0) scale(1); opacity: 1 } }
                @keyframes spin { to { transform: rotate(360deg); } }
              `}</style>
              <div
                className="relative flex cursor-grab items-center justify-between gap-3 rounded-t-2xl border-b border-slate-200 bg-gradient-to-r from-[#dbeafe] via-[#bfdbfe] to-[#eff6ff] px-6 py-5"
                onMouseDown={handleNotesMouseDown}
              >
                <div>
                  <p className="text-2xl font-bold text-foreground">Notes</p>
              
                  <p className="mt-1 text-sm text-slate-600">Keep notes and reminders visible while you work.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={closeNotesModal}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-border hover:bg-background transition-colors"
                    title="Close notes"
                    aria-label="Close notes"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div className="relative flex-1 flex flex-col space-y-4 px-5 py-5 overflow-auto">
                {/* audio element moved out of modal so playback persists when modal closes */}
                <textarea
                  value={adminSessionNotes}
                  onChange={(event) => setAdminSessionNotes(event.target.value)}
                  rows={10}
                  placeholder="Write your current tasks, reminders, or follow-up notes here..."
                  className="w-full rounded-2xl border border-border bg-slate-50 px-4 py-4 text-sm text-foreground outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10 flex-1 min-h-0"
                />
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
                  <span>{adminSessionNotes.length} character{adminSessionNotes.length === 1 ? "" : "s"}</span>
                  <button
                    type="button"
                    onClick={clearNotes}
                    className="rounded-lg border border-border bg-slate-100 px-4 py-2 text-xs font-medium text-foreground hover:bg-slate-200 transition"
                  >
                    Clear notes
                  </button>
                </div>
                <div
                  className="absolute left-0 top-14 bottom-14 w-3 -ml-1 cursor-ew-resize z-50"
                  onMouseDown={(event) => {
                    event.stopPropagation();
                    setIsResizingNotes(true);
                    resizeStartRef.current = {
                      startX: event.clientX,
                      width: noteModalWidth,
                      startLeft: noteModalPosition.left,
                      startY: noteModalPosition.top,
                      height: noteModalHeight,
                      side: "left",
                    };
                  }}
                  title="Resize notes modal (left)"
                  aria-label="Resize notes modal (left)"
                />
                <div
                  className="absolute right-0 top-14 bottom-14 w-3 -mr-1 cursor-ew-resize z-50"
                  onMouseDown={(event) => {
                    event.stopPropagation();
                    setIsResizingNotes(true);
                    resizeStartRef.current = {
                      startX: event.clientX,
                      width: noteModalWidth,
                      startLeft: noteModalPosition.left,
                      startY: noteModalPosition.top,
                      height: noteModalHeight,
                      side: "right",
                    };
                  }}
                  title="Resize notes modal (right)"
                  aria-label="Resize notes modal (right)"
                />
                <div
                  className="absolute left-14 right-14 top-0 h-3 -mt-1 cursor-row-resize z-50"
                  onMouseDown={(event) => {
                    event.stopPropagation();
                    setIsResizingNotes(true);
                    resizeStartRef.current = {
                      startY: event.clientY,
                      height: noteModalHeight,
                      startTop: noteModalPosition.top,
                      startLeft: noteModalPosition.left,
                      side: "top",
                    };
                  }}
                  title="Resize notes modal (top)"
                  aria-label="Resize notes modal (top)"
                />
                <div
                  className="absolute left-14 right-14 bottom-0 h-3 -mb-1 cursor-row-resize z-50"
                  onMouseDown={(event) => {
                    event.stopPropagation();
                    setIsResizingNotes(true);
                    resizeStartRef.current = {
                      startY: event.clientY,
                      height: noteModalHeight,
                      startTop: noteModalPosition.top,
                      startLeft: noteModalPosition.left,
                      side: "bottom",
                    };
                  }}
                  title="Resize notes modal (bottom)"
                  aria-label="Resize notes modal (bottom)"
                />
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {isToolPanelOpen && activeTool !== "notes" ? (
        <div className={`fixed z-50 ${activeTool === "reminders" ? "w-[560px]" : "w-[320px]"} max-w-[calc(100vw-32px)] rounded-3xl border shadow-[0_20px_80px_rgba(0,0,0,0.12)] ${themeMode === "dark" ? "border-slate-700 bg-slate-900 text-slate-100" : "border-slate-200 bg-white text-slate-900"}`} style={{ left: toolPanelPosition.x, top: toolPanelPosition.y }}>
          <div
            className={`flex cursor-grab items-center justify-between gap-3 rounded-t-3xl px-5 py-4 ${themeMode === "dark" ? "bg-slate-800" : "bg-gradient-to-r from-[#dbeafe] via-[#bfdbfe] to-[#f8fafc]"}`}
            onMouseDown={handleToolPanelMouseDown}
          >
            <div>
              <p className={`text-sm font-semibold ${themeMode === "dark" ? "text-slate-100" : "text-slate-900"}`}>
                {activeTool === "calculator"
                  ? "Calculator"
                  : activeTool === "reminders"
                  ? "Reminders"
                  : "Timer"}
              </p>
              <p className={`text-xs ${themeMode === "dark" ? "text-slate-400" : "text-slate-600"}`}>
                {activeTool === "calculator"
                  ? "Quick sums in a pocket tool."
                  : activeTool === "reminders"
                  ? "Jot short reminders for follow-up tasks."
                  : "Countdown focus sessions for priority work."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsToolPanelOpen(false)}
              className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${themeMode === "dark" ? "border-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-700" : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"}`}
            >
              Close
            </button>
          </div>
          <div className="space-y-4 p-5">
            {activeTool === "calculator" ? (
              <>
                <div className={themeMode === "dark" ? "rounded-3xl border border-slate-700 bg-slate-950/90 p-4 shadow-sm transition" : "rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition"}>
                  <div className="mb-4">
                    <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Expression
                    </label>
                    <input
                      type="text"
                      value={calculatorExpression}
                      onChange={(event) => setCalculatorExpression(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          handleCalculatorEvaluate();
                        }
                      }}
                      className={themeMode === "dark" ? "w-full rounded-3xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-medium text-slate-100 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-500/20" : "w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10"}
                      placeholder="e.g. 12 + 24 / 3"
                    />
                  </div>

                  <div className="mb-4 grid grid-cols-4 gap-2">
                    {[
                      { label: "7", value: "7" },
                      { label: "8", value: "8" },
                      { label: "9", value: "9" },
                      { label: "/", value: "/" },
                      { label: "4", value: "4" },
                      { label: "5", value: "5" },
                      { label: "6", value: "6" },
                      { label: "*", value: "*" },
                      { label: "1", value: "1" },
                      { label: "2", value: "2" },
                      { label: "3", value: "3" },
                      { label: "-", value: "-" },
                      { label: "0", value: "0" },
                      { label: ".", value: "." },
                      { label: "%", value: "%" },
                      { label: "+", value: "+" },
                    ].map((button) => (
                      <button
                        key={button.label}
                        type="button"
                        onClick={() => appendCalculatorExpression(button.value)}
                        className={themeMode === "dark" ? "rounded-3xl border border-slate-700 bg-slate-900 px-3 py-3 text-sm font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-800" : "rounded-3xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-300 hover:bg-slate-100"}
                      >
                        {button.label}
                      </button>
                    ))}
                  </div>

                  <div className={themeMode === "dark" ? "mb-4 rounded-3xl border border-slate-700 bg-slate-950 p-4" : "mb-4 rounded-3xl border border-slate-200 bg-slate-50 p-4"}>
                    <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Result</div>
                    <div className={themeMode === "dark" ? "mt-2 text-3xl font-semibold text-white" : "mt-2 text-3xl font-semibold text-slate-900"}>{calculatorResult}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCalculatorEvaluate}
                      title="Evaluate expression"
                      aria-label="Evaluate expression"
                      className={themeMode === "dark" ? "inline-flex h-9 w-9 items-center justify-center text-white transition hover:text-white hover:bg-brand/90" : "inline-flex h-9 w-9 items-center justify-center text-brand transition hover:text-white hover:bg-brand/90"}
                    >
                      <Equal className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={backspaceCalculator}
                      title="Backspace"
                      aria-label="Backspace"
                      className={themeMode === "dark" ? "inline-flex h-9 w-9 items-center justify-center text-slate-100 transition hover:text-white hover:bg-slate-800/80" : "inline-flex h-9 w-9 items-center justify-center text-slate-900 transition hover:text-white hover:bg-slate-200"}
                    >
                      <Delete className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={clearCalculator}
                      title="Clear expression"
                      aria-label="Clear expression"
                      className={themeMode === "dark" ? "inline-flex h-9 w-9 items-center justify-center text-slate-100 transition hover:text-white hover:bg-slate-800/80" : "inline-flex h-9 w-9 items-center justify-center text-slate-900 transition hover:text-white hover:bg-slate-200"}
                    >
                      <RefreshCcw className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {calculatorHistory.length > 0 ? (
                  <div className={themeMode === "dark" ? "rounded-3xl border border-slate-700 bg-slate-950/90 p-4 shadow-sm transition" : "rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition"}>
                    <div className="mb-3 text-xs uppercase tracking-[0.24em] text-slate-400">Recent calculations</div>
                    <div className={themeMode === "dark" ? "space-y-2 text-sm text-slate-200" : "space-y-2 text-sm text-slate-800"}>
                      {calculatorHistory.map((entry, index) => (
                        <div key={`${entry}-${index}`} className={themeMode === "dark" ? "rounded-2xl border border-slate-800 bg-slate-900 px-3 py-2" : "rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2"}>
                          {entry}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </>
            ) : activeTool === "reminders" ? (
              <>
                <div className={`rounded-[28px] border p-4 shadow-[0_24px_80px_rgba(15,23,42,0.08)] transition ${themeMode === "dark" ? "border-slate-700 bg-slate-950/95 text-slate-100 shadow-[0_24px_80px_rgba(0,0,0,0.35)]" : "border-slate-200 bg-white text-slate-900"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Reminders</p>
                      <p className="mt-1 text-sm font-semibold">Keep follow-up tasks in view.</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${themeMode === "dark" ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-700"}`}>
                      {reminders.length} {reminders.length === 1 ? "item" : "items"}
                    </span>
                  </div>

                  <div className={`mt-4 rounded-[24px] border p-4 shadow-sm transition ${themeMode === "dark" ? "border-slate-800 bg-slate-900/80" : "border-slate-200 bg-slate-50"}`}>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <input
                        type="text"
                        value={reminderInput}
                        onChange={(event) => setReminderInput(event.target.value)}
                        className={`w-full min-w-0 rounded-3xl border px-4 py-3 text-sm outline-none transition ${themeMode === "dark" ? "border-slate-700 bg-slate-950 text-slate-100 focus:border-brand focus:ring-2 focus:ring-brand/20" : "border-slate-200 bg-white text-slate-900 focus:border-brand focus:ring-2 focus:ring-brand/10"}`}
                        placeholder="Follow up with admissions team"
                      />
                      <button
                        type="button"
                        onClick={addReminder}
                        className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition ${themeMode === "dark" ? "bg-brand text-white hover:bg-[#0952a4]" : "bg-[#0A66C2] text-white hover:bg-[#0952a4]"}`}
                        title="Add reminder"
                        aria-label="Add reminder"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 space-y-3 max-h-64 overflow-auto">
                    {reminders.length > 0 ? (
                      reminders.map((reminder, index) => (
                        <div key={`${reminder}-${index}`} className={`rounded-3xl border p-4 text-sm transition ${themeMode === "dark" ? "border-slate-800 bg-slate-900 text-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.14)]" : "border-slate-200 bg-white text-slate-900 shadow-sm"}`}>
                          {reminder}
                        </div>
                      ))
                    ) : (
                      <div className={`rounded-3xl border p-4 text-sm ${themeMode === "dark" ? "border-slate-800 bg-slate-900 text-slate-400" : "border-slate-200 bg-slate-50 text-slate-500"}`}>
                        No reminders yet. Add one to keep it handy.
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <>
                <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Countdown
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={timerInput}
                    onChange={(event) => setTimerInput(event.target.value)}
                    className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10"
                    placeholder="MM:SS"
                  />
                  <button
                    type="button"
                    onClick={resetTimer}
                    className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    Reset
                  </button>
                </div>
                <div className="flex items-center justify-between rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900">
                  <span>Time left</span>
                  <span>{formatTimer(timerRemaining)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={timerRunning ? pauseTimer : startTimer}
                    className="inline-flex flex-1 items-center justify-center rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    {timerRunning ? "Pause" : "Start"}
                  </button>
                  <button
                    type="button"
                    onClick={resetTimer}
                    className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    Clear
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}

      <audio
        ref={audioRef}
        src={audioFileUrl ?? undefined}
        className="hidden"
        preload="metadata"
        onTimeUpdate={handleAudioTimeUpdate}
        onEnded={() => setIsAudioPlaying(false)}
        onLoadedMetadata={() => {
          if (audioRef.current) {
            audioRef.current.volume = playerVolume;
            setAudioProgress(0);
          }
        }}
      />
    </div>
  );
}
