import { NextResponse } from "next/server";

type RequestMessage = {
  role: "user" | "assistant";
  content: string;
};

type GroqRole = "system" | "user" | "assistant";

type GroqMessage = {
  role: GroqRole;
  content: string;
};

type ChatSettings = {
  persona?: string;
  tone?: string;
  language?: "id" | "en";
  responseLength?: "short" | "medium" | "long";
  temperature?: number;
  businessScale?: "mikro" | "kecil" | "menengah";
  sector?: string;
};

type ChatRequestBody = {
  message?: string;
  history?: RequestMessage[];
  settings?: ChatSettings;
};

type GroqErrorPayload = {
  error?: {
    message?: string;
    type?: string;
    code?: string;
  };
};

type GroqCompletionPayload = GroqErrorPayload & {
  choices?: Array<{
    message?: {
      role?: "assistant";
      content?: string;
    };
  }>;
};

class GroqApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const FALLBACK_MODELS = [
  "llama-3.1-8b-instant",
  "llama-3.3-70b-versatile",
  "mixtral-8x7b-32768",
];

const GROQ_CHAT_COMPLETIONS_URL =
  "https://api.groq.com/openai/v1/chat/completions";

const HISTORY_LIMIT = 6;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function maxOutputTokens(length: ChatSettings["responseLength"]) {
  switch (length) {
    case "short":
      return 450;
    case "long":
      return 1400;
    case "medium":
    default:
      return 900;
  }
}

function responseLengthGuidance(length: ChatSettings["responseLength"]) {
  switch (length) {
    case "short":
      return "Targetkan jawaban 80-140 kata dengan poin yang tetap konkret.";
    case "long":
      return "Targetkan jawaban 380-600 kata dengan penjabaran taktis per langkah.";
    case "medium":
    default:
      return "Targetkan jawaban 220-350 kata dengan kedalaman yang aplikatif.";
  }
}

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function sanitizeHistory(
  history: RequestMessage[] = [],
  currentMessage?: string,
) {
  if (!Array.isArray(history)) {
    return [] as RequestMessage[];
  }

  const cleaned = history
    .filter((item) => item && item.content && item.content.trim().length > 0)
    .filter((item) => {
      const text = item.content.toLowerCase();
      return !(
        item.role === "assistant" &&
        text.includes("halo, saya umkm growth copilot")
      );
    });

  const deduped: RequestMessage[] = [];
  for (const item of cleaned) {
    const normalized = item.content.trim();
    const prev = deduped[deduped.length - 1];
    if (
      prev &&
      prev.role === item.role &&
      prev.content.trim().toLowerCase() === normalized.toLowerCase()
    ) {
      continue;
    }

    if (currentMessage && item.role === "user") {
      const current = currentMessage.trim().toLowerCase();
      if (normalized.toLowerCase() === current && deduped.length > 0) {
        const last = deduped[deduped.length - 1];
        if (
          last.role === "user" &&
          last.content.trim().toLowerCase() === current
        ) {
          continue;
        }
      }
    }

    deduped.push({
      role: item.role,
      content: normalized,
    });
  }

  return deduped.slice(-HISTORY_LIMIT);
}

function dropCurrentPromptFromHistory(
  history: RequestMessage[],
  currentMessage: string,
) {
  const normalizedCurrent = normalizeText(currentMessage);
  if (!normalizedCurrent) {
    return history;
  }

  const cloned = [...history];
  while (cloned.length > 0) {
    const last = cloned[cloned.length - 1];
    if (last.role === "user" && normalizeText(last.content) === normalizedCurrent) {
      cloned.pop();
      continue;
    }

    break;
  }

  return cloned;
}

function isModelUnavailableError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const text = error.message.toLowerCase();
  return (
    text.includes("not found") ||
    text.includes("unsupported") ||
    text.includes("model")
  );
}

function isRetryableModelError(error: unknown) {
  if (error instanceof GroqApiError) {
    return error.status === 429 || error.status >= 500;
  }

  if (!(error instanceof Error)) {
    return false;
  }

  const text = error.message.toLowerCase();
  return (
    text.includes("429") ||
    text.includes("resource exhausted") ||
    text.includes("quota")
  );
}

function isQuotaExceededError(error: unknown) {
  if (error instanceof GroqApiError) {
    return error.status === 429;
  }

  if (!(error instanceof Error)) {
    return false;
  }

  const text = error.message.toLowerCase();
  return (
    text.includes("429") ||
    text.includes("quota exceeded") ||
    text.includes("resource exhausted")
  );
}

function extractRetryDelaySeconds(error: unknown) {
  if (!(error instanceof Error)) {
    return null;
  }

  const message = error.message;
  const patterns = [
    /retry in\s+([0-9]+(?:\.[0-9]+)?)s/i,
    /try again in\s+([0-9]+(?:\.[0-9]+)?)s/i,
    /"retryDelay"\s*:\s*"([0-9]+(?:\.[0-9]+)?)s"/i,
    /retrydelay":"([0-9]+(?:\.[0-9]+)?)s"/i,
    /retry-after[^0-9]*([0-9]+)/i,
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match?.[1]) {
      const value = Number(match[1]);
      if (!Number.isNaN(value) && value > 0) {
        return Math.ceil(value);
      }
    }
  }

  return null;
}

function toUserFriendlyError(error: unknown) {
  if (error instanceof GroqApiError && (error.status === 401 || error.status === 403)) {
    return "GROQ_API_KEY tidak valid atau tidak punya akses. Periksa kembali API key Groq pada .env.local atau Vercel.";
  }

  if (!(error instanceof Error)) {
    return "Terjadi kesalahan internal saat memproses permintaan.";
  }

  if (isQuotaExceededError(error)) {
    const retryIn = extractRetryDelaySeconds(error);
    const waitHint = retryIn
      ? ` Coba lagi dalam sekitar ${retryIn} detik.`
      : " Coba lagi dalam 1-2 menit.";

    return (
      "Kuota Groq sedang penuh (rate limit)." +
      waitHint +
      " Jika sering terjadi, gunakan model lebih hemat seperti GROQ_MODEL=llama-3.1-8b-instant."
    );
  }

  if (isModelUnavailableError(error)) {
    return "Model Groq tidak tersedia. Gunakan GROQ_MODEL=llama-3.1-8b-instant lalu redeploy.";
  }

  return "Terjadi kendala pada layanan AI Groq. Silakan coba lagi sebentar lagi.";
}

function buildModelCandidates(preferredModel?: string) {
  const all = [preferredModel?.trim(), ...FALLBACK_MODELS].filter(
    (value): value is string => Boolean(value),
  );

  return [...new Set(all)];
}

function toGroqMessages(
  systemInstruction: string,
  history: RequestMessage[],
  currentMessage: string,
): GroqMessage[] {
  const base: GroqMessage[] = [{ role: "system", content: systemInstruction }];

  for (const item of history) {
    base.push({
      role: item.role,
      content: item.content,
    });
  }

  base.push({
    role: "user",
    content: currentMessage,
  });

  return base;
}

async function createGroqCompletion(
  apiKey: string,
  model: string,
  messages: GroqMessage[],
  temperature: number,
  maxTokens: number,
) {
  const response = await fetch(GROQ_CHAT_COMPLETIONS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      top_p: 0.9,
      max_tokens: maxTokens,
    }),
  });

  const payload = (await response
    .json()
    .catch(() => null)) as GroqCompletionPayload | null;

  if (!response.ok) {
    const message =
      payload?.error?.message ||
      `Groq request gagal dengan status ${response.status}.`;
    throw new GroqApiError(response.status, message);
  }

  const reply = payload?.choices?.[0]?.message?.content?.trim();
  if (!reply) {
    throw new GroqApiError(502, "Model tidak mengembalikan jawaban.");
  }

  return reply;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ChatRequestBody;
    const message = body?.message?.trim();

    if (!message) {
      return NextResponse.json(
        { error: "Pesan tidak boleh kosong." },
        { status: 400 },
      );
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "GROQ_API_KEY belum diset. Tambahkan environment variable pada .env.local atau Vercel.",
        },
        { status: 500 },
      );
    }

    const modelCandidates = buildModelCandidates(process.env.GROQ_MODEL);
    const settings = body.settings || {};

    const persona = settings.persona || "Konsultan pertumbuhan UMKM";
    const tone = settings.tone || "Aplikatif dan profesional";
    const language = settings.language || "id";
    const responseLength = settings.responseLength || "medium";
    const businessScale = settings.businessScale || "mikro";
    const sector = settings.sector || "umum";
    const cleanedHistory = sanitizeHistory(body.history, message);
    const historyForMessages = dropCurrentPromptFromHistory(
      cleanedHistory,
      message,
    );

    const systemInstruction = `
Kamu adalah ${persona} untuk pelaku UMKM Indonesia.
Gaya jawaban: ${tone}.
Bahasa output: ${language === "id" ? "Bahasa Indonesia" : "English"}.
Skala bisnis pengguna: ${businessScale}.
Sektor bisnis pengguna: ${sector}.

Aturan jawaban:
1. Jawaban harus konkret, bisa dieksekusi, dan berdampak pada peningkatan omzet atau efisiensi.
  2. Jangan ulangi salam/perkenalan jika percakapan sudah berjalan.
  3. Jangan gunakan markdown seperti **, #, atau tabel markdown.
  4. Gunakan format teks biasa dengan bagian: Analisis Singkat, Aksi Prioritas, KPI, Risiko dan Mitigasi, Estimasi Dampak.
  5. Jika pengguna meminta strategi dengan periode waktu (contoh: 14 hari), berikan rencana terjadwal sesuai periode tersebut.
  6. Hindari jawaban terlalu umum.
  7. ${responseLengthGuidance(responseLength)}
`.trim();

    const groqMessages = toGroqMessages(
      systemInstruction,
      historyForMessages,
      message,
    );

    let reply: string | null = null;
    let lastError: unknown = null;

    for (const modelName of modelCandidates) {
      try {
        reply = await createGroqCompletion(
          apiKey,
          modelName,
          groqMessages,
          clamp(settings.temperature ?? 0.6, 0, 1),
          maxOutputTokens(responseLength),
        );
        break;
      } catch (error) {
        lastError = error;

        if (error instanceof GroqApiError && (error.status === 401 || error.status === 403)) {
          throw error;
        }

        if (!isModelUnavailableError(error) && !isRetryableModelError(error)) {
          throw error;
        }
      }
    }

    if (!reply) {
      const status = isQuotaExceededError(lastError) ? 429 : 502;
      return NextResponse.json(
        {
          error: toUserFriendlyError(lastError),
        },
        { status },
      );
    }

    return NextResponse.json({ reply });
  } catch (error) {
    const message = toUserFriendlyError(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
