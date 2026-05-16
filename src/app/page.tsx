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
type DrawerTab = "templates" | "tools";

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  imageUrl?: string; // Cloudinary URL gambar yang dikirim user
  createdAt: string;
};

type Settings = {
  persona: string;
  tone: string;
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
        <span className="dropdown-caret" aria-hidden="true">
          &#8964;
        </span>
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

function formatRecordingTime(totalSeconds: number) {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
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
  const [drawerTab, setDrawerTab] = useState<DrawerTab>(
    "templates",
  );
  const [zoomedImage, setZoomedImage] = useState<{
    url: string;
    id: string;
  } | null>(null);
  const requestLockRef = useRef(false);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const [attachedImage, setAttachedImage] = useState<{
    file: File;
    previewUrl: string;
  } | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

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

  // Cleanup recording resources on unmount.
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current !== null) {
        window.clearInterval(recordingTimerRef.current);
      }
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
      if (mediaRecorderRef.current?.state === "recording") {
        try {
          mediaRecorderRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, []);

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
    // Boleh kirim tanpa teks jika ada gambar terlampir
    if ((!trimmed && !attachedImage) || isLoading || requestLockRef.current) {
      return;
    }

    const lastUserMessage = [...messages]
      .reverse()
      .find((item) => item.role === "user");

    if (lastUserMessage && trimmed) {
      const sameContent =
        lastUserMessage.content.trim().toLowerCase() ===
        trimmed.trim().toLowerCase();
      const ageMs = Date.now() - new Date(lastUserMessage.createdAt).getTime();
      if (sameContent && ageMs < 2500 && !attachedImage) {
        setError("Prompt yang sama baru saja terkirim. Tunggu sebentar.");
        return;
      }
    }

    requestLockRef.current = true;

    const userMessage: ChatMessage = {
      id: createId(),
      role: "user",
      content: trimmed || "Analisis gambar ini.",
      imageUrl: attachedImage ? attachedImage.previewUrl : undefined,
      createdAt: new Date().toISOString(),
    };

    const nextHistory = [...messages, userMessage];
    setMessages(nextHistory);
    setDraft("");
    const imageToSend = attachedImage;
    setAttachedImage(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
    setIsLoading(true);
    setError(null);

    // ── Mode gambar (generate image) ──────────────────────────────────────
    if (mode === "gambar" && !imageToSend) {
      try {
        const response = await fetch("/api/generate-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: trimmed }),
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as {
            error?: string;
          } | null;
          throw new Error(payload?.error || "Gagal memproses permintaan.");
        }

        const payload = (await response.json()) as { reply: string };
        setMessages((prev) => [
          ...prev,
          {
            id: createId(),
            role: "assistant",
            content: payload.reply,
            createdAt: new Date().toISOString(),
          },
        ]);
      } catch (caughtError) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Terjadi kendala koneksi ke layanan AI.",
        );
      } finally {
        setIsLoading(false);
        requestLockRef.current = false;
      }
      return;
    }

    // ── Mode chat dengan gambar ───────────────────────────────────────────
    if (imageToSend) {
      try {
        const formData = new FormData();
        formData.append("file", imageToSend.file);
        formData.append("message", trimmed);

        const response = await fetch("/api/chat-with-image", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as {
            error?: string;
          } | null;
          throw new Error(payload?.error || "Gagal menganalisis gambar.");
        }

        const payload = (await response.json()) as {
          reply: string;
          imageUrl: string;
        };

        // Update pesan user dengan Cloudinary URL (ganti preview lokal)
        setMessages((prev) =>
          prev.map((m) =>
            m.id === userMessage.id
              ? { ...m, imageUrl: payload.imageUrl }
              : m,
          ),
        );

        setMessages((prev) => [
          ...prev,
          {
            id: createId(),
            role: "assistant",
            content: payload.reply,
            createdAt: new Date().toISOString(),
          },
        ]);
      } catch (caughtError) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Terjadi kendala saat menganalisis gambar.",
        );
      } finally {
        setIsLoading(false);
        requestLockRef.current = false;
      }
      return;
    }

    // ── Mode chat teks biasa ──────────────────────────────────────────────
    const chatHistory = nextHistory.map((msg) => {
      if (isImageDataUrl(msg.content) || msg.imageUrl) {
        return {
          ...msg,
          content:
            "[Sistem: Pengguna sebelumnya mengirim gambar dan AI sudah merespons. Lanjutkan percakapan sesuai konteks.]",
        };
      }
      return msg;
    });

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          settings,
          history: chatHistory.slice(-10),
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(payload?.error || "Gagal memproses permintaan.");
      }

      const payload = (await response.json()) as { reply: string };
      setMessages((prev) => [
        ...prev,
        {
          id: createId(),
          role: "assistant",
          content: payload.reply,
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Terjadi kendala koneksi ke layanan AI.",
      );
    } finally {
      setIsLoading(false);
      requestLockRef.current = false;
    }
  }

  function handleImageAttach(file: File) {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) {
      setError("Format tidak didukung. Gunakan JPG, PNG, atau WebP.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Ukuran file terlalu besar. Maksimal 10 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setAttachedImage({ file, previewUrl: e.target?.result as string });
    };
    reader.readAsDataURL(file);
    // Focus textarea so user can type their question
    window.requestAnimationFrame(() => textareaRef.current?.focus());
  }

  function removeAttachedImage() {
    setAttachedImage(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
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
    if (event.key !== "Enter") {
      return;
    }

    // Enter untuk kirim. Kombinasi dengan modifier tetap menambah baris baru.
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
      return;
    }

    event.preventDefault();
    void sendPrompt();
  }

  function autoResize(el: HTMLTextAreaElement) {
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }

  function stopAudioMonitoring() {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setAudioLevel(0);
  }

  function startAudioMonitoring(stream: MediaStream) {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const audioCtx = new AudioCtx();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;

      const buffer = new Uint8Array(analyser.frequencyBinCount);

      const tick = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(buffer);
        let sum = 0;
        for (let i = 0; i < buffer.length; i++) sum += buffer[i];
        const avg = sum / buffer.length / 255; // 0..1
        setAudioLevel(avg);
        animationFrameRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      // Audio monitoring is optional; ignore errors.
    }
  }

  function pickRecordingMimeType(): string | undefined {
    const candidates = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/mp4;codecs=mp4a.40.2",
      "audio/mp4",
      "audio/ogg;codecs=opus",
    ];
    for (const candidate of candidates) {
      if (
        typeof MediaRecorder !== "undefined" &&
        MediaRecorder.isTypeSupported &&
        MediaRecorder.isTypeSupported(candidate)
      ) {
        return candidate;
      }
    }
    return undefined;
  }

  async function toggleRecording() {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      if (recordingTimerRef.current !== null) {
        window.clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      stopAudioMonitoring();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
          sampleRate: 16000,
        },
      });

      const mimeType = pickRecordingMimeType();
      const mediaRecorder = mimeType
        ? new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 64000 })
        : new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      setRecordingDuration(0);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        stopAudioMonitoring();

        const finalMime = mediaRecorder.mimeType || mimeType || "audio/webm";
        const audioBlob = new Blob(audioChunksRef.current, { type: finalMime });

        // Reject very short recordings (< 0.5s of data) — usually accidental taps
        if (audioBlob.size < 2048) {
          setError(
            "Rekaman terlalu pendek. Tekan tombol mic, bicara, lalu tekan lagi untuk berhenti.",
          );
          return;
        }

        const ext = finalMime.includes("mp4")
          ? "m4a"
          : finalMime.includes("ogg")
            ? "ogg"
            : "webm";
        await processAudio(audioBlob, ext);
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      startAudioMonitoring(stream);

      recordingTimerRef.current = window.setInterval(() => {
        setRecordingDuration((prev) => {
          const next = prev + 1;
          // Auto-stop at 60 seconds to keep transcription quality high
          if (next >= 60 && mediaRecorderRef.current?.state === "recording") {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (recordingTimerRef.current !== null) {
              window.clearInterval(recordingTimerRef.current);
              recordingTimerRef.current = null;
            }
          }
          return next;
        });
      }, 1000);
    } catch {
      setError(
        "Tidak bisa akses mikrofon. Pastikan izin mic sudah diberikan ke browser.",
      );
    }
  }

  async function processAudio(audioBlob: Blob, ext: string = "webm") {
    setIsTranscribing(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", audioBlob, `audio.${ext}`);

      const res = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error || "Gagal melakukan transkripsi audio.");
      }

      const { text } = (await res.json()) as { text: string };
      const cleaned = (text || "").trim();
      if (cleaned) {
        setDraft((prev) => (prev ? `${prev} ${cleaned}` : cleaned));
        window.requestAnimationFrame(() => {
          if (textareaRef.current) {
            textareaRef.current.focus();
            autoResize(textareaRef.current);
          }
        });
      } else {
        setError(
          "Suara tidak terdengar jelas. Coba bicara lebih dekat ke mic dan ulangi.",
        );
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Terjadi kesalahan saat memproses audio.",
      );
    } finally {
      setIsTranscribing(false);
    }
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

      {/* ── LEFT SIDEBAR: Settings ────────────────────── */}
      <aside className={`sidebar panel-scroll ${sidebarOpen ? "is-open" : ""}`}>
        <div className="sidebar-header">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h1 className="text-lg font-semibold leading-tight text-[#3a1f1a]">
                UMKM Growth Copilot
              </h1>
              <p className="mt-1 text-xs text-[color:var(--muted)]">
                AI tool untuk bantu UMKM bertumbuh lebih cepat.
              </p>
            </div>
            <button
              type="button"
              className="sidebar-close md:hidden"
              onClick={() => setSidebarOpen(false)}
              aria-label="Tutup sidebar"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
        <div className="sidebar-content space-y-3">
          <p className="category-title">Konfigurasi AI</p>

          <label className="block text-xs font-semibold text-[#5c342d]">
            Persona AI
            <AnimatedSelect
              className="mt-1"
              value={settings.persona}
              options={personaOptions.map((p) => ({ value: p, label: p }))}
              onChange={(persona) =>
                setSettings((prev) => ({ ...prev, persona }))
              }
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
              onChange={(businessScale) =>
                setSettings((prev) => ({ ...prev, businessScale }))
              }
            />
          </label>

          <label className="block text-xs font-semibold text-[#5c342d]">
            Sektor Usaha
            <input
              className="control-field mt-1"
              value={settings.sector}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, sector: e.target.value }))
              }
              placeholder="Contoh: Kuliner, Fashion, Jasa"
            />
          </label>

          <label className="block text-xs font-semibold text-[#5c342d]">
            Panjang Respon
            <AnimatedSelect
              className="mt-1"
              value={settings.responseLength}
              options={responseLengthOptions}
              onChange={(responseLength) =>
                setSettings((prev) => ({ ...prev, responseLength }))
              }
            />
          </label>

          <label className="block text-xs font-semibold text-[#5c342d]">
            Kreativitas ({settings.temperature.toFixed(1)})
            <input
              type="range"
              min={0}
              max={1}
              step={0.1}
              value={settings.temperature}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  temperature: Number(e.target.value),
                }))
              }
              className="mt-2 w-full accent-[#c46746]"
            />
          </label>

          <div className="mt-4 rounded-xl border border-[#e0b8aa] bg-[#fff6ef] p-3 text-xs leading-relaxed text-[#6e3d35]">
            Aplikasi ini adalah fondasi AI Tool UMKM yang dapat dimonetisasi
            melalui langganan, white-label, dan konsultasi premium.
          </div>
        </div>
      </aside>

      {/* ── MAIN AREA ──────────────────────────────────── */}
      <div className="main-area">
        {/* Chat Header */}
        <header className="chat-header">
          <div className="chat-header-left">
            <button
              type="button"
              className="sidebar-toggle"
              onClick={() => setSidebarOpen((v) => !v)}
              aria-label="Buka pengaturan"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <div className="min-w-0">
              <p className="hidden sm:block text-[10px] sm:text-xs uppercase tracking-[0.18em] text-[#9d5b49]">
                Live AI Session
              </p>
              <h2 className="text-sm sm:text-base font-semibold text-[#2c1714] leading-tight truncate">
                {mode === "gambar"
                  ? "Generator Visual UMKM"
                  : "Konsultasi Bisnis AI"}
              </h2>
            </div>
          </div>
          <div className="chat-header-right">
            <div className="mode-switcher">
              <button
                type="button"
                className={mode === "chat" ? "is-active" : ""}
                title="Mode Chat Berbasis Teks"
                onClick={() => setMode("chat")}
              >
                Chat
              </button>
              <button
                type="button"
                className={mode === "gambar" ? "is-active" : ""}
                title="Mode Generator Visual"
                onClick={() => setMode("gambar")}
              >
                Gambar
              </button>
            </div>
            <button
              type="button"
              onClick={copyLatestAnswer}
              title="Salin jawaban AI yang terakhir"
              className={`ui-btn ui-btn-soft hidden sm:inline-flex ${copied ? "ui-btn-active" : ""}`}
            >
              {copied ? "✓ Tersalin" : "Copy"}
            </button>
            <button
              type="button"
              onClick={exportConversation}
              title="Unduh log percakapan dalam format Markdown"
              className={`ui-btn ui-btn-soft hidden md:inline-flex ${exported ? "ui-btn-active" : ""}`}
            >
              {exported ? "✓" : "Export MD"}
            </button>
            <button
              type="button"
              onClick={clearConversation}
              title="Bersihkan riwayat obrolan"
              className="ui-btn ui-btn-soft hidden md:inline-flex"
            >
              Reset
            </button>
            <button
              type="button"
              className="ui-btn ui-btn-primary ui-btn-lg shadow-sm hover:shadow-md transition-shadow"
              title="Buka panel template dan alat analitik"
              onClick={() => {
                setDrawerOpen(true);
              }}
            >
              <span className="hidden sm:inline">Fitur &amp; Tools</span>
              <span className="sm:hidden">Tools</span>
              <span className="feature-badge ml-1">24</span>
            </button>
          </div>
        </header>

        {/* Stats Bar */}
        <div className="stats-bar mono">
          <span className="ui-chip bg-[#f4d8cb] text-[#68342c]">
            pesan: {stats.totalMessages}
          </span>
          <span className="ui-chip bg-[#f6e6c2] text-[#684a25]">
            balasan: {stats.assistantReplies}
          </span>
          <span className="ui-chip bg-[#eadfef] text-[#4d3564]">
            ~token: {stats.estimatedTokens}
          </span>
        </div>

        {/* Chat Messages */}
        <div ref={chatScrollRef} className="chat-body panel-scroll">
          <div className="space-y-3 max-w-3xl mx-auto">
            {messages.map((message, index) => {
              const messageIsImage = isImageDataUrl(message.content);

              if (message.id === "welcome-message") {
                return (
                  <div
                    key={message.id}
                    className="welcome-hero reveal"
                    style={{ animationDelay: `${Math.min(index * 40, 240)}ms` }}
                  >
                    <div className="welcome-icon" aria-hidden="true">
                      <svg
                        width="36"
                        height="36"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
                      </svg>
                    </div>
                    <h3 className="welcome-title">
                      Halo, siap bantu UMKM Anda tumbuh
                    </h3>
                    <p className="welcome-desc">
                      Pilih mode <strong>Chat</strong> untuk konsultasi
                      strategi, atau <strong>Gambar</strong> untuk membuat
                      visual promosi. Bisa juga rekam suara dengan tombol mic
                      untuk pertanyaan cepat.
                    </p>
                    <div className="welcome-quick-grid">
                      {promptTemplates.slice(0, 4).map((template) => (
                        <button
                          key={template}
                          type="button"
                          className="welcome-quick-card"
                          onClick={() => addTemplate(template)}
                        >
                          <span className="welcome-quick-icon">
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="9 18 15 12 9 6" />
                            </svg>
                          </span>
                          <span className="welcome-quick-text">
                            {template}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              }

              return (
                <article
                  key={message.id}
                  className={`reveal message-card rounded-2xl p-3 sm:p-4 shadow-sm backdrop-blur-md transition-all duration-300 hover:shadow-md ${
                    message.role === "assistant"
                      ? "mr-3 sm:mr-8 border border-[#dcb0a2]/50 bg-gradient-to-br from-[#fff9f3]/95 to-[#fdf2ea]/95"
                      : "ml-3 sm:ml-8 border border-[#c7a190]/60 bg-gradient-to-bl from-[#ffe7d7]/95 to-[#ffdacc]/95"
                  }`}
                  style={{ animationDelay: `${Math.min(index * 40, 240)}ms` }}
                >
                  <p className="mb-1.5 text-[10px] sm:text-xs uppercase tracking-[0.1em] text-[#7c5046] flex items-center gap-1.5">
                    <span
                      className={`inline-block w-1.5 h-1.5 rounded-full ${message.role === "assistant" ? "bg-[#be5d3d]" : "bg-[#7d4533]"}`}
                    />
                    {message.role === "assistant" ? "AI Advisor" : "Anda"}
                  </p>
                  {messageIsImage ? (
                    <button
                      onClick={() =>
                        setZoomedImage({ url: message.content, id: message.id })
                      }
                      className="relative block mt-2 w-full max-w-sm group overflow-hidden rounded-lg shadow-md border border-[#e4c9c1] cursor-pointer"
                      title="Klik untuk memperbesar gambar"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={message.content}
                        alt="AI Generated"
                        className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-[#2f1a17]/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                        <div className="bg-white/95 text-[#be5d3d] rounded-full p-3 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 shadow-xl flex items-center gap-2">
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            <line x1="11" y1="8" x2="11" y2="14"></line>
                            <line x1="8" y1="11" x2="14" y2="11"></line>
                          </svg>
                          <span className="text-xs font-bold pr-1">Zoom</span>
                        </div>
                      </div>
                    </button>
                  ) : (
                    <>
                      {/* Gambar yang dilampirkan user */}
                      {message.imageUrl && (
                        <button
                          onClick={() =>
                            setZoomedImage({ url: message.imageUrl!, id: message.id })
                          }
                          className="relative block mb-2 w-full max-w-xs group overflow-hidden rounded-xl shadow-sm border border-[#d6a698] cursor-zoom-in"
                          title="Klik untuk memperbesar"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={message.imageUrl}
                            alt="Gambar terlampir"
                            className="w-full max-h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                            <span className="bg-white/90 text-[#be5d3d] text-xs font-semibold px-2 py-1 rounded-full">
                              Zoom
                            </span>
                          </div>
                        </button>
                      )}
                    <div className="text-sm text-[#2e1815]">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: (props) => (
                            <p
                              className="mb-2 leading-relaxed whitespace-pre-wrap last:mb-0 break-words"
                              {...props}
                            />
                          ),
                          strong: (props) => (
                            <strong
                              className="font-bold text-[#4a2b28]"
                              {...props}
                            />
                          ),
                          ul: (props) => (
                            <ul
                              className="list-disc pl-5 mb-3 space-y-1"
                              {...props}
                            />
                          ),
                          ol: (props) => (
                            <ol
                              className="list-decimal pl-5 mb-3 space-y-1"
                              {...props}
                            />
                          ),
                          li: (props) => (
                            <li className="leading-relaxed" {...props} />
                          ),
                          table: (props) => (
                            <div className="overflow-x-auto my-3 border border-[#dcb0a2] rounded-xl shadow-sm -mx-1 sm:mx-0">
                              <table
                                className="min-w-full divide-y divide-[#dcb0a2] text-xs sm:text-sm text-left"
                                {...props}
                              />
                            </div>
                          ),
                          thead: (props) => (
                            <thead
                              className="bg-[#f4dcd4] text-[#4a2b28]"
                              {...props}
                            />
                          ),
                          tbody: (props) => (
                            <tbody
                              className="divide-y divide-[#e4c9c1] bg-white/40"
                              {...props}
                            />
                          ),
                          tr: (props) => (
                            <tr
                              className="hover:bg-[#fff9f3]/60 transition-colors"
                              {...props}
                            />
                          ),
                          th: (props) => (
                            <th
                              className="px-2 sm:px-3 py-2 font-semibold whitespace-nowrap"
                              {...props}
                            />
                          ),
                          td: (props) => (
                            <td
                              className="px-2 sm:px-3 py-2 text-[#3a1f1a]"
                              {...props}
                            />
                          ),
                          h1: (props) => (
                            <h1
                              className="text-base sm:text-lg font-bold mt-3 mb-2 text-[#3a1f1a]"
                              {...props}
                            />
                          ),
                          h2: (props) => (
                            <h2
                              className="text-[15px] sm:text-base font-bold mt-3 mb-1.5 text-[#3a1f1a]"
                              {...props}
                            />
                          ),
                          h3: (props) => (
                            <h3
                              className="text-sm font-bold mt-2 mb-1 text-[#3a1f1a]"
                              {...props}
                            />
                          ),
                          code: (props) => (
                            <code
                              className="bg-[#ffe8db] text-[#be5d3d] px-1.5 py-0.5 rounded text-[0.78em]"
                              {...props}
                            />
                          ),
                          pre: (props) => (
                            <pre
                              className="bg-[#2e1815] text-[#fff0e4] p-3 rounded-xl overflow-x-auto my-3 text-xs"
                              {...props}
                            />
                          ),
                          blockquote: (props) => (
                            <blockquote
                              className="border-l-3 border-[#be5d3d] bg-[#fff4ec] pl-3 py-1 my-2 text-[#5a3530] italic rounded-r-md"
                              {...props}
                            />
                          ),
                          a: (props) => (
                            <a
                              className="text-[#be5d3d] underline underline-offset-2 hover:text-[#9d4a30] break-words"
                              target="_blank"
                              rel="noopener noreferrer"
                              {...props}
                            />
                          ),
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                    </>
                  )}
                </article>
              );
            })}
            {isLoading && (
              <div className="inline-flex items-center gap-2 rounded-full bg-[#fff0df] px-4 py-2 text-sm text-[#7f4a3f] shadow-sm">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#cf704f]" />
                {mode === "gambar"
                  ? "AI sedang membuat visual promosi..."
                  : attachedImage
                  ? "Groq AI sedang menganalisis gambar..."
                  : "AI sedang menyusun rekomendasi..."}
              </div>
            )}
          </div>
        </div>

        {/* Compact Chat Input */}
        <div className="chat-input-bar">
          {/* Hidden file input */}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImageAttach(file);
            }}
          />

          <form onSubmit={sendPrompt}>
            {/* Image preview strip */}
            {attachedImage && (
              <div className="flex items-center gap-2 mb-2 px-1">
                <div className="relative flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={attachedImage.previewUrl}
                    alt="Gambar terlampir"
                    className="h-14 w-14 rounded-xl object-cover border border-[#d6a698] shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={removeAttachedImage}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#be5d3d] text-white flex items-center justify-center shadow-sm hover:bg-[#9d4a30] transition-colors"
                    aria-label="Hapus gambar"
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
                <p className="text-xs text-[#7c5046] leading-tight">
                  <span className="font-semibold text-[#3a1f1a]">Gambar terlampir</span><br />
                  Ketik pertanyaanmu atau langsung kirim
                </p>
              </div>
            )}

            {isRecording && (
              <div className="recording-indicator" aria-live="polite">
                <div className="recording-dot" />
                <span className="recording-text">
                  Merekam... {formatRecordingTime(recordingDuration)}
                </span>
                <div className="recording-bars" aria-hidden="true">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <span
                      key={i}
                      className="recording-bar"
                      style={{
                        transform: `scaleY(${0.3 + Math.min(1, audioLevel * 2 + Math.random() * 0.15) * (1 - Math.abs(i - 2) * 0.18)})`,
                      }}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={toggleRecording}
                  className="recording-stop"
                  aria-label="Hentikan rekaman"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <rect x="6" y="6" width="12" height="12" rx="2" />
                  </svg>
                </button>
              </div>
            )}
            {isTranscribing && !isRecording && (
              <div className="transcribing-indicator" aria-live="polite">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#cf704f]" />
                <span>Mengubah suara jadi teks...</span>
              </div>
            )}
            <div
              className={`chat-input-row ${isRecording ? "is-recording" : ""}`}
            >
              <button
                type="button"
                onClick={toggleRecording}
                disabled={isTranscribing}
                className={`mic-btn ${isRecording ? "is-recording" : ""}`}
                title={
                  isRecording
                    ? "Hentikan & transkripsi"
                    : "Bicara untuk menulis pesan"
                }
                aria-label={
                  isRecording ? "Hentikan rekaman" : "Mulai rekaman suara"
                }
              >
                {isRecording ? (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <rect x="6" y="6" width="12" height="12" rx="2" />
                  </svg>
                ) : (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="22" />
                  </svg>
                )}
              </button>
              {/* Image attach button — only in chat mode */}
              {mode === "chat" && (
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={isLoading || isRecording || !!attachedImage}
                  className="mic-btn flex-shrink-0"
                  title="Lampirkan gambar untuk dianalisis AI"
                  aria-label="Lampirkan gambar"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </button>
              )}
              <textarea
                ref={textareaRef}
                value={draft}
                rows={1}
                onChange={(e) => {
                  setDraft(e.target.value);
                  autoResize(e.target);
                }}
                onKeyDown={handleHotkey}
                placeholder={
                  isRecording
                    ? "Sedang mendengarkan suara Anda..."
                    : isTranscribing
                      ? "Memproses suara..."
                      : attachedImage
                      ? "Tanya apa saja tentang gambar ini... (opsional)"
                      : mode === "gambar"
                        ? "Deskripsikan visual promosi produk Anda..."
                        : "Tanya strategi bisnis, pemasaran, keuangan..."
                }
                className="chat-input-textarea"
                disabled={isRecording}
              />
              <button
                type="submit"
                disabled={(!draft.trim() && !attachedImage) || isLoading || isRecording}
                className="chat-send-btn"
                aria-label="Kirim"
              >
                {isLoading ? (
                  <span className="h-3 w-3 rounded-full border-2 border-white/40 border-t-white animate-spin inline-block" />
                ) : (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                )}
              </button>
            </div>
            <div className="chat-input-meta">
              <span className="hidden sm:inline">
                {draft.length} karakter · Enter kirim, Shift+Enter baris baru
              </span>
              <span className="sm:hidden">{draft.length} kar.</span>
              {error && (
                <span className="text-[#8f2f16] truncate ml-2">{error}</span>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* ——— DRAWER: Templates & Advanced Tools ——————— */}
      <div
        className={`drawer-overlay ${drawerOpen ? "is-open" : ""}`}
        onClick={() => setDrawerOpen(false)}
      />
      <div className={`drawer-panel ${drawerOpen ? "is-open" : ""}`}>
        <div className="drawer-header">
          <h3 className="text-base font-semibold text-[#2f1a17]">
            Fitur &amp; Tools
          </h3>
          <button
            type="button"
            className="drawer-close"
            onClick={() => setDrawerOpen(false)}
            aria-label="Tutup"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="tab-nav">
          <button
            type="button"
            className={`tab-btn ${drawerTab === "templates" ? "is-active" : ""}`}
            onClick={() => setDrawerTab("templates")}
          >
            Template Prompt
          </button>
          <button
            type="button"
            className={`tab-btn ${drawerTab === "tools" ? "is-active" : ""}`}
            onClick={() => setDrawerTab("tools")}
          >
            Alat Analitik
          </button>
        </div>

        <div className="drawer-body panel-scroll">
          {drawerTab === "templates" && (
            <div>
              <p className="category-title">Template Prompt Cepat</p>
              <p className="text-xs text-[#6f4f4a] mb-3">
                Klik template untuk menyisipkan ke kolom chat.
              </p>
              <div className="grid grid-cols-1 gap-3">
                {promptTemplates.map((template, index) => (
                  <button
                    key={template}
                    type="button"
                    onClick={() => {
                      addTemplate(template);
                      setDrawerOpen(false);
                    }}
                    className={`template-chip w-full text-left text-sm text-[#412624] p-3.5 flex items-start gap-3.5 group ${
                      highlightTemplate === template ? "is-active" : ""
                    }`}
                    style={{
                      animationDelay: `${index * 50}ms`,
                      animationFillMode: "both",
                    }}
                  >
                    <div className="flex-shrink-0 mt-0.5 w-7 h-7 rounded-full bg-gradient-to-br from-[#f8d4c7] to-[#e4a896] flex items-center justify-center text-[#9a4224] group-hover:scale-110 transition-transform shadow-inner">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                      </svg>
                    </div>
                    <span className="leading-relaxed font-medium">
                      {template}
                    </span>
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
                      <span className="text-[#be5d3d] font-bold mr-0.5">-</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {drawerTab === "tools" && (
            <AdvancedTools
              settings={settings}
              onInjectPrompt={(text) => {
                injectPromptFromTools(text);
                setDrawerOpen(false);
              }}
            />
          )}
        </div>
      </div>
      {zoomedImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1a1110]/80 backdrop-blur-sm p-4 transition-opacity duration-300"
          onClick={() => setZoomedImage(null)}
        >
          <div
            className="relative max-w-4xl w-full flex flex-col items-center transform transition-transform duration-300 scale-100"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setZoomedImage(null)}
              className="absolute -top-12 right-0 text-white hover:text-[#f4dcd4] bg-[#3a1f1a]/50 hover:bg-[#3a1f1a] rounded-full p-2 transition-colors shadow-sm"
              title="Tutup (Esc)"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            <img
              src={zoomedImage.url}
              alt="Zoomed AI Generated"
              className="w-full h-auto max-h-[75vh] object-contain rounded-lg shadow-2xl"
            />
            <a
              href={zoomedImage.url}
              download={`umkm-promosi-${zoomedImage.id}.png`}
              className="mt-6 flex items-center gap-2 bg-gradient-to-r from-[#be5d3d] to-[#d57852] hover:from-[#a74f33] hover:to-[#c66b49] text-white px-6 py-3 rounded-full font-semibold shadow-lg transition-all transform hover:scale-105"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Unduh Gambar
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
