"use client";

import {
  FormEvent,
  KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AdvancedTools } from "./advanced-tools";

type ChatRole = "user" | "assistant";
type ChatMode = "chat" | "gambar";

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
};

type Settings = {
  persona: string;
  tone: string;
  language: "id" | "en";
  responseLength: "short" | "medium" | "long";
  temperature: number;
  businessScale: "mikro" | "kecil" | "menengah";
  sector: string;
};

const MESSAGE_STORAGE = "umkm-growth-copilot-messages";
const SETTINGS_STORAGE = "umkm-growth-copilot-settings";

const baseWelcome: ChatMessage = {
  id: "welcome-message",
  role: "assistant",
  content:
    "Halo, saya UMKM Growth Copilot. Pilih mode Chat untuk konsultasi strategi bisnis atau mode Gambar untuk membuat materi promosi visual produk UMKM.",
  createdAt: new Date().toISOString(),
};

const defaultSettings: Settings = {
  persona: "Konsultan Pertumbuhan UMKM",
  tone: "Aplikatif dan profesional",
  language: "id",
  responseLength: "long",
  temperature: 0.6,
  businessScale: "mikro",
  sector: "Kuliner",
};

const promptTemplates = [
  "Buatkan strategi promosi IG 14 hari untuk usaha saya",
  "Hitungkan ide paket bundling produk agar margin naik",
  "Buat SOP sederhana untuk kurangi komplain pelanggan",
  "Rancang program loyalti pelanggan dengan budget minim",
  "Buatkan skrip chat WhatsApp untuk closing pelanggan baru",
  "Susun checklist kesiapan bisnis untuk pengajuan pinjaman",
];

const personaOptions = [
  "Konsultan Pertumbuhan UMKM",
  "Spesialis Marketing Digital",
  "Mentor Operasional Toko",
  "Advisor Keuangan Mikro",
];

const toneOptions = [
  "Aplikatif dan profesional",
  "Santai dan memotivasi",
  "Data-driven dan tegas",
  "Formal untuk presentasi investor",
];

const businessScaleOptions: Array<{
  value: Settings["businessScale"];
  label: string;
}> = [
  { value: "mikro", label: "Mikro" },
  { value: "kecil", label: "Kecil" },
  { value: "menengah", label: "Menengah" },
];

const responseLengthOptions: Array<{
  value: Settings["responseLength"];
  label: string;
}> = [
  { value: "short", label: "Ringkas" },
  { value: "medium", label: "Sedang" },
  { value: "long", label: "Panjang" },
];

type SelectOption<TValue extends string> = {
  value: TValue;
  label: string;
};

const modeOptions: Array<SelectOption<ChatMode>> = [
  { value: "chat", label: "Konsultasi Chat" },
  { value: "gambar", label: "Generator Gambar" },
];

type AnimatedSelectProps<TValue extends string> = {
  value: TValue;
  options: Array<SelectOption<TValue>>;
  onChange: (value: TValue) => void;
  className?: string;
};

function AnimatedSelect<TValue extends string>({
  value,
  options,
  onChange,
  className,
}: AnimatedSelectProps<TValue>) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handlePointerDown = (event: globalThis.MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const selected =
    options.find((option) => option.value === value) || options[0];

  return (
    <div ref={rootRef} className={`dropdown ${className || ""}`.trim()}>
      <button
        type="button"
        className={`dropdown-trigger ${open ? "is-open" : ""}`}
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
      >
        <span>{selected?.label || "Pilih"}</span>
        <span className="dropdown-caret" aria-hidden="true">&#8964;</span>
      </button>

      <div className={`dropdown-menu ${open ? "open" : ""}`}>
        {options.map((option, index) => (
          <button
            key={option.value}
            type="button"
            onClick={() => {
              onChange(option.value);
              setOpen(false);
            }}
            className={`dropdown-option ${option.value === value ? "is-active" : ""}`}
            style={{
              transitionDelay: open ? `${Math.min(index * 18, 90)}ms` : "0ms",
            }}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function createId() {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function isImageDataUrl(content: string) {
  return content.startsWith("data:image/");
}

function toExportMarkdown(messages: ChatMessage[]) {
  return messages
    .map((message) => {
      const speaker = message.role === "assistant" ? "AI" : "Pengguna";
      const exportedContent = isImageDataUrl(message.content)
        ? "[Gambar AI tidak disertakan pada export markdown untuk menjaga ukuran file.]"
        : message.content;
      return `## ${speaker}\n${exportedContent}`;
    })
    .join("\n\n");
}

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([baseWelcome]);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [draft, setDraft] = useState("");
  const [mode, setMode] = useState<ChatMode>("chat");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [exported, setExported] = useState(false);
  const [highlightTemplate, setHighlightTemplate] = useState<string | null>(
    null,
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<"templates" | "tools">("templates");
  const requestLockRef = useRef(false);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const storedMessages = window.localStorage.getItem(MESSAGE_STORAGE);
    const storedSettings = window.localStorage.getItem(SETTINGS_STORAGE);

    if (storedMessages) {
      try {
        const parsed = JSON.parse(storedMessages) as ChatMessage[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          const sanitized = parsed.filter(
            (item): item is ChatMessage =>
              Boolean(item) &&
              (item.role === "assistant" || item.role === "user") &&
              typeof item.id === "string" &&
              typeof item.content === "string" &&
              typeof item.createdAt === "string" &&
              !isImageDataUrl(item.content),
          );

          setMessages(sanitized.length > 0 ? sanitized : [baseWelcome]);
        }
      } catch {
        setMessages([baseWelcome]);
      }
    }

    if (storedSettings) {
      try {
        const parsed = JSON.parse(storedSettings) as Settings;
        setSettings((prev) => ({ ...prev, ...parsed }));
      } catch {
        setSettings(defaultSettings);
      }
    }
  }, []);

  useEffect(() => {
    const persistableMessages = messages.filter(
      (item) => !isImageDataUrl(item.content),
    );
    window.localStorage.setItem(
      MESSAGE_STORAGE,
      JSON.stringify(persistableMessages),
    );
  }, [messages]);

  useEffect(() => {
    window.localStorage.setItem(SETTINGS_STORAGE, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    if (textareaRef.current) {
      autoResize(textareaRef.current);
    }
  }, [draft]);

  useEffect(() => {
    const container = chatScrollRef.current;
    if (!container) {
      return;
    }

    container.scrollTo({
      top: container.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isLoading]);

  const stats = useMemo(() => {
    const totalChars = messages.reduce((total, item) => {
      if (isImageDataUrl(item.content)) {
        return total;
      }

      return total + item.content.length;
    }, 0);
    const assistantReplies = messages.filter(
      (item) => item.role === "assistant",
    ).length;
    return {
      totalMessages: messages.length,
      assistantReplies,
      estimatedTokens: Math.ceil(totalChars / 4),
    };
  }, [messages]);

  async function sendPrompt(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    const trimmed = draft.trim();
    if (!trimmed || isLoading || requestLockRef.current) {
      return;
    }

    const lastUserMessage = [...messages]
      .reverse()
      .find((item) => item.role === "user");

    if (lastUserMessage) {
      const sameContent =
        lastUserMessage.content.trim().toLowerCase() ===
        trimmed.trim().toLowerCase();
      const ageMs = Date.now() - new Date(lastUserMessage.createdAt).getTime();
      if (sameContent && ageMs < 2500) {
        setError("Prompt yang sama baru saja terkirim. Tunggu sebentar.");
        return;
      }
    }

    requestLockRef.current = true;

    const userMessage: ChatMessage = {
      id: createId(),
      role: "user",
      content: trimmed,
      createdAt: new Date().toISOString(),
    };

    const nextHistory = [...messages, userMessage];
    setMessages(nextHistory);
    setDraft("");
    setIsLoading(true);
    setError(null);

    const isImageMode = mode === "gambar";
    const endpoint = isImageMode ? "/api/generate-image" : "/api/chat";
    const chatHistory = nextHistory.map(msg => {
      if (isImageDataUrl(msg.content)) {
        return { ...msg, content: "[Sistem: Gambar telah berhasil dibuat dan ditampilkan kepada pengguna berdasarkan instruksi pengguna sebelumnya. Jika pengguna bertanya tentang gambar ini, jelaskan asumsi visual dari konsep gambar yang dibuat berdasarkan prompt pengguna.]" };
      }
      return msg;
    });
    const requestPayload = isImageMode
      ? JSON.stringify({
          prompt: trimmed,
        })
      : JSON.stringify({
          message: trimmed,
          settings,
          history: chatHistory.slice(-10),
        });

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: requestPayload,
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(payload?.error || "Gagal memproses permintaan.");
      }

      const payload = (await response.json()) as { reply: string };
      const assistantMessage: ChatMessage = {
        id: createId(),
        role: "assistant",
        content: payload.reply,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (caughtError) {
      const errorMessage =
        caughtError instanceof Error
          ? caughtError.message
          : "Terjadi kendala koneksi ke layanan AI.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      requestLockRef.current = false;
    }
  }

  function addTemplate(text: string) {
    setHighlightTemplate(text);
    setDraft((current) => {
      if (!current) {
        return text;
      }
      return `${current}\n${text}`;
    });

    window.setTimeout(() => {
      setHighlightTemplate((current) => (current === text ? null : current));
    }, 650);

    window.requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        autoResize(textareaRef.current);
      }
    });
  }

  function injectPromptFromTools(text: string) {
    setDraft((current) => {
      if (!current) {
        return text;
      }

      return `${current}\n${text}`;
    });

    window.requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        autoResize(textareaRef.current);
      }
    });
  }

  function clearConversation() {
    setMessages([baseWelcome]);
    setError(null);
  }

  function exportConversation() {
    const markdown = toExportMarkdown(messages);
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `umkm-growth-copilot-${Date.now()}.md`;
    anchor.click();
    URL.revokeObjectURL(url);
    setExported(true);
    window.setTimeout(() => setExported(false), 1200);
  }

  async function copyLatestAnswer() {
    const latestAnswer = [...messages]
      .reverse()
      .find(
        (item) => item.role === "assistant" && !isImageDataUrl(item.content),
      );
    if (!latestAnswer) {
      setError("Belum ada jawaban teks AI untuk disalin.");
      return;
    }
    await navigator.clipboard.writeText(latestAnswer.content);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  function handleHotkey(event: KeyboardEvent<HTMLTextAreaElement>) {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      void sendPrompt();
    }
  }

  function autoResize(el: HTMLTextAreaElement) {
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }

  return (
    <div className="app-layout">
      {/* Sidebar overlay on mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-[#1a1110]/30 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* â”€â”€ LEFT SIDEBAR: Settings â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <aside className={`sidebar panel-scroll ${sidebarOpen ? "is-open" : ""}`}>
        <div className="sidebar-header">
          <h1 className="text-lg font-semibold leading-tight text-[#3a1f1a]">UMKM Growth Copilot AI</h1>
          <p className="mt-1 text-xs text-[color:var(--muted)]">AI tool untuk bantu UMKM bertumbuh lebih cepat.</p>
        </div>
        <div className="sidebar-content space-y-3">
          <p className="category-title">Konfigurasi AI</p>

          <label className="block text-xs font-semibold text-[#5c342d]">
            Persona AI
            <AnimatedSelect
              className="mt-1"
              value={settings.persona}
              options={personaOptions.map((p) => ({ value: p, label: p }))}
              onChange={(persona) => setSettings((prev) => ({ ...prev, persona }))}
            />
          </label>

          <label className="block text-xs font-semibold text-[#5c342d]">
            Gaya Jawaban
            <AnimatedSelect
              className="mt-1"
              value={settings.tone}
              options={toneOptions.map((t) => ({ value: t, label: t }))}
              onChange={(tone) => setSettings((prev) => ({ ...prev, tone }))}
            />
          </label>

          <label className="block text-xs font-semibold text-[#5c342d]">
            Skala Bisnis
            <AnimatedSelect
              className="mt-1"
              value={settings.businessScale}
              options={businessScaleOptions}
              onChange={(businessScale) => setSettings((prev) => ({ ...prev, businessScale }))}
            />
          </label>

          <label className="block text-xs font-semibold text-[#5c342d]">
            Sektor Usaha
            <input
              className="control-field mt-1"
              value={settings.sector}
              onChange={(e) => setSettings((prev) => ({ ...prev, sector: e.target.value }))}
              placeholder="Contoh: Kuliner, Fashion, Jasa"
            />
          </label>

          <label className="block text-xs font-semibold text-[#5c342d]">
            Panjang Respon
            <AnimatedSelect
              className="mt-1"
              value={settings.responseLength}
              options={responseLengthOptions}
              onChange={(responseLength) => setSettings((prev) => ({ ...prev, responseLength }))}
            />
          </label>

          <label className="block text-xs font-semibold text-[#5c342d]">
            Bahasa Output
            <div className="mt-1 grid grid-cols-2 gap-2">
              <button type="button" className={`ui-btn ${settings.language === "id" ? "ui-btn-active" : "ui-btn-soft"}`}
                onClick={() => setSettings((prev) => ({ ...prev, language: "id" }))}>
                Indonesia
              </button>
              <button type="button" className={`ui-btn ${settings.language === "en" ? "ui-btn-active" : "ui-btn-soft"}`}
                onClick={() => setSettings((prev) => ({ ...prev, language: "en" }))}>
                English
              </button>
            </div>
          </label>

          <label className="block text-xs font-semibold text-[#5c342d]">
            Kreativitas ({settings.temperature.toFixed(1)})
            <input type="range" min={0} max={1} step={0.1} value={settings.temperature}
              onChange={(e) => setSettings((prev) => ({ ...prev, temperature: Number(e.target.value) }))}
              className="mt-2 w-full accent-[#c46746]"
            />
          </label>

          <div className="mt-4 rounded-xl border border-[#e0b8aa] bg-[#fff6ef] p-3 text-xs leading-relaxed text-[#6e3d35]">
            Aplikasi ini adalah fondasi AI Tool UMKM yang dapat dimonetisasi melalui langganan, white-label, dan konsultasi premium.
          </div>
        </div>
      </aside>

      {/* â”€â”€ MAIN AREA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="main-area">
        {/* Chat Header */}
        <header className="chat-header">
          <div className="chat-header-left">
            <button
              type="button"
              className="sidebar-toggle"
              onClick={() => setSidebarOpen((v) => !v)}
              aria-label="Toggle sidebar"
            >
              â˜°
            </button>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-[#9d5b49]">Live AI Session</p>
              <h2 className="text-base font-semibold text-[#2c1714] leading-tight">
                {mode === "gambar" ? "Generator Visual Produk UMKM" : "Konsultasi Bisnis Berbasis Groq"}
              </h2>
            </div>
          </div>
          <div className="chat-header-right">
            <div className="mode-switcher">
              <button type="button" className={mode === "chat" ? "is-active" : ""}
                onClick={() => setMode("chat")}>Chat</button>
              <button type="button" className={mode === "gambar" ? "is-active" : ""}
                onClick={() => setMode("gambar")}>Gambar</button>
            </div>
            <button type="button" onClick={copyLatestAnswer}
              className={`ui-btn ui-btn-soft ${copied ? "ui-btn-active" : ""}`}>
              {copied ? "✓ Tersalin" : "Copy"}
            </button>
            <button type="button" onClick={exportConversation}
              className={`ui-btn ui-btn-soft ${exported ? "ui-btn-active" : ""}`}>
              {exported ? "✓" : "Export MD"}
            </button>
            <button type="button" onClick={clearConversation} className="ui-btn ui-btn-soft">
              Reset
            </button>
            <button
              type="button"
              className="ui-btn ui-btn-primary ui-btn-lg"
              onClick={() => { setDrawerOpen(true); }}
            >
              Fitur &amp; Tools <span className="feature-badge ml-1">24</span>
            </button>
          </div>
        </header>

        {/* Stats Bar */}
        <div className="stats-bar mono">
          <span className="ui-chip bg-[#f4d8cb] text-[#68342c]">pesan: {stats.totalMessages}</span>
          <span className="ui-chip bg-[#f6e6c2] text-[#684a25]">balasan: {stats.assistantReplies}</span>
          <span className="ui-chip bg-[#eadfef] text-[#4d3564]">~token: {stats.estimatedTokens}</span>
        </div>

        {/* Chat Messages */}
        <div ref={chatScrollRef} className="chat-body panel-scroll">
          <div className="space-y-3 max-w-3xl mx-auto">
            {messages.map((message, index) => {
              const messageIsImage = isImageDataUrl(message.content);
              return (
                <article
                  key={message.id}
                  className={`reveal message-card rounded-2xl p-3 ${
                    message.role === "assistant"
                      ? "mr-8 border border-[#dcb0a2] bg-[#fff9f3]"
                      : "ml-8 border border-[#c7a190] bg-[#ffe7d7]"
                  }`}
                  style={{ animationDelay: `${Math.min(index * 40, 240)}ms` }}
                >
                  <p className="mb-1 text-xs uppercase tracking-[0.1em] text-[#7c5046]">
                    {message.role === "assistant" ? "AI Advisor" : "Anda"}
                  </p>
                  {messageIsImage ? (
                    <a
                      href={message.content}
                      download={`umkm-promosi-${message.id}.png`}
                      className="relative block mt-2 w-full max-w-sm group overflow-hidden rounded-lg shadow-md border border-[#e4c9c1]"
                      title="Klik untuk mengunduh gambar"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={message.content} alt="AI Generated"
                        className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-[#2f1a17]/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                        <div className="bg-white/95 text-[#be5d3d] rounded-full p-3 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 shadow-xl flex items-center gap-2">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                          </svg>
                          <span className="text-xs font-bold pr-1">Unduh</span>
                        </div>
                      </div>
                    </a>
                  ) : (
                    <div className="text-sm text-[#2e1815]">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({ node, ...props }) => <p className="mb-2 leading-relaxed whitespace-pre-wrap last:mb-0" {...props} />,
                          strong: ({ node, ...props }) => <strong className="font-bold text-[#4a2b28]" {...props} />,
                          ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-3 space-y-1" {...props} />,
                          ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-3 space-y-1" {...props} />,
                          li: ({ node, ...props }) => <li className="" {...props} />,
                          table: ({ node, ...props }) => (
                            <div className="overflow-x-auto my-3 border border-[#dcb0a2] rounded-xl shadow-sm">
                              <table className="min-w-full divide-y divide-[#dcb0a2] text-sm text-left" {...props} />
                            </div>
                          ),
                          thead: ({ node, ...props }) => <thead className="bg-[#f4dcd4] text-[#4a2b28]" {...props} />,
                          tbody: ({ node, ...props }) => <tbody className="divide-y divide-[#e4c9c1] bg-white/40" {...props} />,
                          tr: ({ node, ...props }) => <tr className="hover:bg-[#fff9f3]/60 transition-colors" {...props} />,
                          th: ({ node, ...props }) => <th className="px-3 py-2.5 font-semibold whitespace-nowrap" {...props} />,
                          td: ({ node, ...props }) => <td className="px-3 py-2 text-[#3a1f1a]" {...props} />,
                          h1: ({ node, ...props }) => <h1 className="text-xl font-bold mt-4 mb-2 text-[#3a1f1a]" {...props} />,
                          h2: ({ node, ...props }) => <h2 className="text-lg font-bold mt-3 mb-2 text-[#3a1f1a]" {...props} />,
                          h3: ({ node, ...props }) => <h3 className="text-base font-bold mt-2 mb-1 text-[#3a1f1a]" {...props} />,
                          code: ({ node, ...props }) => <code className="bg-[#ffe8db] text-[#be5d3d] px-1.5 py-0.5 rounded text-xs" {...props} />,
                          pre: ({ node, ...props }) => <pre className="bg-[#2e1815] text-[#fff0e4] p-3 rounded-xl overflow-x-auto my-3 text-xs" {...props} />,
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  )}
                </article>
              );
            })}
            {isLoading && (
              <div className="inline-flex items-center gap-2 rounded-full bg-[#fff0df] px-4 py-2 text-sm text-[#7f4a3f] shadow-sm">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#cf704f]" />
                {mode === "gambar" ? "AI sedang membuat visual promosi..." : "AI sedang menyusun rekomendasi..."}
              </div>
            )}
          </div>
        </div>

        {/* Compact Chat Input */}
        <div className="chat-input-bar">
          <form onSubmit={sendPrompt}>
            <div className="chat-input-row">
              <textarea
                ref={textareaRef}
                value={draft}
                rows={1}
                onChange={(e) => { setDraft(e.target.value); autoResize(e.target); }}
                onKeyDown={handleHotkey}
                placeholder={
                  mode === "gambar"
                    ? "Deskripsikan visual promosi produk UMKM Anda..."
                    : "Tanya strategi bisnis, pemasaran, keuangan..."
                }
                className="chat-input-textarea"
              />
              <button type="submit" disabled={!draft.trim() || isLoading} className="chat-send-btn" aria-label="Kirim">
                {isLoading ? (
                  <span className="h-3 w-3 rounded-full border-2 border-white/40 border-t-white animate-spin inline-block" />
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                )}
              </button>
            </div>
            <div className="chat-input-meta">
              <span>{draft.length} karakter · Ctrl+Enter untuk kirim</span>
              {error && <span className="text-[#8f2f16]">{error}</span>}
            </div>
          </form>
        </div>
      </div>

      {/* ——— DRAWER: Templates & Advanced Tools ——————— */}
      <div className={`drawer-overlay ${drawerOpen ? "is-open" : ""}`} onClick={() => setDrawerOpen(false)} />
      <div className={`drawer-panel ${drawerOpen ? "is-open" : ""}`}>
        <div className="drawer-header">
          <h3 className="text-base font-semibold text-[#2f1a17]">Fitur &amp; Tools</h3>
          <button type="button" className="drawer-close" onClick={() => setDrawerOpen(false)} aria-label="Tutup">✕</button>
        </div>

        {/* Tab Navigation */}
        <div className="tab-nav">
          <button type="button" className={`tab-btn ${drawerTab === "templates" ? "is-active" : ""}`}
            onClick={() => setDrawerTab("templates")}>
            Template Prompt
          </button>
          <button type="button" className={`tab-btn ${drawerTab === "tools" ? "is-active" : ""}`}
            onClick={() => setDrawerTab("tools")}>
            Alat Analitik
          </button>
        </div>

        <div className="drawer-body panel-scroll">
          {drawerTab === "templates" && (
            <div>
              <p className="category-title">Template Prompt Cepat</p>
              <p className="text-xs text-[#6f4f4a] mb-3">Klik template untuk menyisipkan ke kolom chat.</p>
              <div className="grid grid-cols-1 gap-3">
                {promptTemplates.map((template, index) => (
                  <button
                    key={template}
                    type="button"
                    onClick={() => { addTemplate(template); setDrawerOpen(false); }}
                    className={`template-chip w-full text-left text-sm text-[#412624] p-3.5 flex items-start gap-3.5 group ${
                      highlightTemplate === template ? "is-active" : ""
                    }`}
                    style={{ animationDelay: `${index * 50}ms`, animationFillMode: "both" }}
                  >
                    <div className="flex-shrink-0 mt-0.5 w-7 h-7 rounded-full bg-gradient-to-br from-[#f8d4c7] to-[#e4a896] flex items-center justify-center text-[#9a4224] group-hover:scale-110 transition-transform shadow-inner">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                      </svg>
                    </div>
                    <span className="leading-relaxed font-medium">{template}</span>
                  </button>
                ))}
              </div>

              <div className="mt-6">
                <p className="category-title">Fitur yang Tersedia</p>
                <ul className="mt-2 space-y-1.5 text-xs text-[#5a3f3b]">
                  {[
                    "Chat AI realtime + mode generator gambar promosi",
                    "Konteks persona, tone, bahasa, sektor & skala usaha",
                    "Penyimpanan lokal riwayat konsultasi otomatis",
                    "Export konsultasi ke file Markdown",
                    "6 template prompt siap pakai",
                    "Statistik sesi & estimasi token",
                    "KPI Generator & Campaign Planner",
                    "Content Calendar AI",
                    "Break-Even Analyzer & Cashflow Alert",
                    "Product Bundling Recommender",
                    "Customer Persona Builder",
                    "Loan Readiness Score",
                    "Team Collaboration Workspace",
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-1.5">
                      <span className="text-[#be5d3d] font-bold mr-0.5">-</span><span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {drawerTab === "tools" && (
            <AdvancedTools
              settings={settings}
              onInjectPrompt={(text) => { injectPromptFromTools(text); setDrawerOpen(false); }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
