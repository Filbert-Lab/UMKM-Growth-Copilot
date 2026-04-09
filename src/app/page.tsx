"use client";

import {
  FormEvent,
  KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type ChatRole = "user" | "assistant";

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
    "Halo, saya UMKM Growth Copilot. Ceritakan kondisi bisnismu, lalu saya bantu strategi marketing, operasional, dan keuangan yang bisa langsung dieksekusi.",
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

function createId() {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function toExportMarkdown(messages: ChatMessage[]) {
  return messages
    .map((message) => {
      const speaker = message.role === "assistant" ? "AI" : "Pengguna";
      return `## ${speaker}\n${message.content}`;
    })
    .join("\n\n");
}

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([baseWelcome]);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [draft, setDraft] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [exported, setExported] = useState(false);
  const [highlightTemplate, setHighlightTemplate] = useState<string | null>(
    null,
  );
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
          setMessages(parsed);
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
    window.localStorage.setItem(MESSAGE_STORAGE, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    window.localStorage.setItem(SETTINGS_STORAGE, JSON.stringify(settings));
  }, [settings]);

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
    const totalChars = messages.reduce(
      (total, item) => total + item.content.length,
      0,
    );
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

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: trimmed,
          settings,
          history: nextHistory.slice(-10),
        }),
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
      textareaRef.current?.focus();
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
      .find((item) => item.role === "assistant");
    if (!latestAnswer) {
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

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-8 sm:px-6">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-14 h-56 w-56 rounded-full bg-[#f7c59f]/45 blur-3xl" />
        <div className="absolute right-0 top-28 h-72 w-72 rounded-full bg-[#df8470]/35 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-[#f4d8a8]/40 blur-3xl" />
      </div>

      <main className="reveal relative mx-auto grid max-w-7xl gap-5 lg:h-[calc(100vh-4rem)] lg:grid-cols-[320px_minmax(0,1fr)_320px]">
        <aside className="card-surface interactive-surface panel-scroll flex flex-col overflow-y-auto rounded-2xl p-5">
          <h1 className="text-2xl font-semibold leading-tight text-[#3a1f1a]">
            UMKM Growth Copilot AI
          </h1>
          <p className="mt-2 text-sm text-[color:var(--muted)]">
            AI tool untuk bantu usaha mikro hingga menengah bertumbuh lebih
            cepat.
          </p>

          <div className="mt-6 space-y-4">
            <label className="block text-sm font-medium text-[#5c342d]">
              Persona AI
              <select
                className="control-field mt-1"
                value={settings.persona}
                onChange={(event) =>
                  setSettings((prev) => ({
                    ...prev,
                    persona: event.target.value,
                  }))
                }
              >
                {personaOptions.map((persona) => (
                  <option key={persona} value={persona}>
                    {persona}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-medium text-[#5c342d]">
              Gaya Jawaban
              <select
                className="control-field mt-1"
                value={settings.tone}
                onChange={(event) =>
                  setSettings((prev) => ({ ...prev, tone: event.target.value }))
                }
              >
                {toneOptions.map((tone) => (
                  <option key={tone} value={tone}>
                    {tone}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-medium text-[#5c342d]">
              Skala Bisnis
              <select
                className="control-field mt-1"
                value={settings.businessScale}
                onChange={(event) =>
                  setSettings((prev) => ({
                    ...prev,
                    businessScale: event.target
                      .value as Settings["businessScale"],
                  }))
                }
              >
                <option value="mikro">Mikro</option>
                <option value="kecil">Kecil</option>
                <option value="menengah">Menengah</option>
              </select>
            </label>

            <label className="block text-sm font-medium text-[#5c342d]">
              Sektor Usaha
              <input
                className="control-field mt-1"
                value={settings.sector}
                onChange={(event) =>
                  setSettings((prev) => ({
                    ...prev,
                    sector: event.target.value,
                  }))
                }
                placeholder="Contoh: Fashion, Kuliner, Jasa"
              />
            </label>

            <label className="block text-sm font-medium text-[#5c342d]">
              Panjang Respon
              <select
                className="control-field mt-1"
                value={settings.responseLength}
                onChange={(event) =>
                  setSettings((prev) => ({
                    ...prev,
                    responseLength: event.target
                      .value as Settings["responseLength"],
                  }))
                }
              >
                <option value="short">Ringkas</option>
                <option value="medium">Sedang</option>
                <option value="long">Panjang</option>
              </select>
            </label>

            <label className="block text-sm font-medium text-[#5c342d]">
              Bahasa Output
              <div className="mt-1 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className={`ui-btn ${
                    settings.language === "id" ? "ui-btn-active" : "ui-btn-soft"
                  }`}
                  onClick={() =>
                    setSettings((prev) => ({ ...prev, language: "id" }))
                  }
                >
                  Indonesia
                </button>
                <button
                  type="button"
                  className={`ui-btn ${
                    settings.language === "en" ? "ui-btn-active" : "ui-btn-soft"
                  }`}
                  onClick={() =>
                    setSettings((prev) => ({ ...prev, language: "en" }))
                  }
                >
                  English
                </button>
              </div>
            </label>

            <label className="block text-sm font-medium text-[#5c342d]">
              Kreativitas ({settings.temperature.toFixed(1)})
              <input
                type="range"
                min={0}
                max={1}
                step={0.1}
                value={settings.temperature}
                onChange={(event) =>
                  setSettings((prev) => ({
                    ...prev,
                    temperature: Number(event.target.value),
                  }))
                }
                className="mt-2 w-full accent-[#c46746]"
              />
            </label>
          </div>
        </aside>

        <section className="card-surface interactive-surface flex min-h-[70vh] flex-col overflow-hidden rounded-2xl p-4 lg:min-h-0 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-[#9d5b49]">
                Live AI Session
              </p>
              <h2 className="text-xl font-semibold text-[#2c1714]">
                Konsultasi Bisnis Berbasis Gemini
              </h2>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={copyLatestAnswer}
                className={`ui-btn ui-btn-soft text-xs ${copied ? "ui-btn-active" : ""}`}
              >
                {copied ? "Tersalin" : "Copy Jawaban"}
              </button>
              <button
                type="button"
                onClick={exportConversation}
                className={`ui-btn ui-btn-soft text-xs ${exported ? "ui-btn-active" : ""}`}
              >
                {exported ? "Berhasil" : "Export MD"}
              </button>
              <button
                type="button"
                onClick={clearConversation}
                className="ui-btn ui-btn-soft text-xs"
              >
                Reset
              </button>
            </div>
          </div>

          <div className="mono mb-4 flex flex-wrap gap-2 text-xs">
            <span className="ui-chip bg-[#f4d8cb] text-[#68342c]">
              messages: {stats.totalMessages}
            </span>
            <span className="ui-chip bg-[#f6e6c2] text-[#684a25]">
              replies: {stats.assistantReplies}
            </span>
            <span className="ui-chip bg-[#eadfef] text-[#4d3564]">
              est. tokens: {stats.estimatedTokens}
            </span>
          </div>

          <div
            ref={chatScrollRef}
            className="panel-scroll flex-1 space-y-3 overflow-y-auto rounded-xl bg-white/55 p-3"
          >
            {messages.map((message, index) => (
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
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#2e1815]">
                  {message.content}
                </p>
              </article>
            ))}

            {isLoading ? (
              <div className="inline-flex items-center gap-2 rounded-full bg-[#fff0df] px-4 py-2 text-sm text-[#7f4a3f] shadow-sm">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#cf704f]" />
                AI sedang menyusun rekomendasi...
              </div>
            ) : null}
          </div>

          <form onSubmit={sendPrompt} className="mt-4 space-y-3">
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleHotkey}
              rows={5}
              placeholder="Contoh: Toko saya omzet stagnan 6 bulan terakhir. Tolong beri langkah perbaikan 30 hari yang realistis."
              className="control-field min-h-[148px] resize-none p-3 text-sm leading-relaxed"
            />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-[#7f5a55]">
                {draft.length} karakter | tekan Ctrl/Cmd + Enter untuk kirim
                cepat
              </p>
              <button
                type="submit"
                disabled={!draft.trim() || isLoading}
                className="ui-btn ui-btn-primary px-5 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-55"
              >
                {isLoading ? "Memproses..." : "Kirim ke Gemini"}
              </button>
            </div>

            {error ? (
              <p className="rounded-xl border border-[#e17a5f] bg-[#ffe9e1] px-3 py-2 text-sm text-[#8f2f16]">
                {error}
              </p>
            ) : null}
          </form>
        </section>

        <aside className="card-surface interactive-surface panel-scroll flex flex-col overflow-y-auto rounded-2xl p-5">
          <h3 className="text-lg font-semibold text-[#2f1a17]">
            Template Prompt Cepat
          </h3>
          <p className="mt-1 text-sm text-[#6f4f4a]">
            Pilih contoh prompt untuk mempercepat konsultasi harian.
          </p>

          <div className="mt-4 space-y-2">
            {promptTemplates.map((template) => (
              <button
                key={template}
                type="button"
                onClick={() => addTemplate(template)}
                className={`template-chip w-full rounded-xl border p-3 text-left text-sm text-[#412624] ${
                  highlightTemplate === template ? "is-active" : ""
                }`}
              >
                {template}
              </button>
            ))}
          </div>

          <h3 className="mt-6 text-lg font-semibold text-[#2f1a17]">
            Fitur Aktif MVP
          </h3>
          <ul className="mt-3 space-y-2 text-sm text-[#5a3f3b]">
            <li>- Chat AI realtime dengan Gemini API</li>
            <li>- Konteks persona, tone, bahasa, sektor, dan skala usaha</li>
            <li>- Penyimpanan lokal riwayat konsultasi otomatis</li>
            <li>- Export konsultasi ke file Markdown</li>
            <li>- Prompt template siap pakai</li>
            <li>- Statistik sesi dan estimasi token</li>
          </ul>

          <p className="mt-6 rounded-xl border border-[#e0b8aa] bg-[#fff6ef] p-3 text-xs leading-relaxed text-[#6e3d35]">
            Catatan: aplikasi ini dirancang sebagai fondasi AI Tool UMKM yang
            dapat dimonetisasi melalui model langganan, white-label, dan
            konsultasi premium.
          </p>
        </aside>
      </main>
    </div>
  );
}
