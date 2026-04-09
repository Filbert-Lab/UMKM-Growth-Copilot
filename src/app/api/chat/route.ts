import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

type RequestMessage = {
  role: "user" | "assistant";
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

const FALLBACK_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
];

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function maxOutputTokens(length: ChatSettings["responseLength"]) {
  switch (length) {
    case "short":
      return 450;
    case "long":
      return 1300;
    case "medium":
    default:
      return 900;
  }
}

function serializeHistory(history: RequestMessage[] = []) {
  if (!Array.isArray(history) || history.length === 0) {
    return "Belum ada riwayat percakapan sebelumnya.";
  }

  return history
    .slice(-8)
    .map(
      (item) => `${item.role === "assistant" ? "AI" : "User"}: ${item.content}`,
    )
    .join("\n");
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

function buildModelCandidates(preferredModel?: string) {
  const all = [preferredModel?.trim(), ...FALLBACK_MODELS].filter(
    (value): value is string => Boolean(value),
  );

  return [...new Set(all)];
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

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "GEMINI_API_KEY belum diset. Tambahkan environment variable pada .env.local atau Vercel.",
        },
        { status: 500 },
      );
    }

    const modelCandidates = buildModelCandidates(process.env.GEMINI_MODEL);
    const settings = body.settings || {};

    const persona = settings.persona || "Konsultan pertumbuhan UMKM";
    const tone = settings.tone || "Aplikatif dan profesional";
    const language = settings.language || "id";
    const responseLength = settings.responseLength || "medium";
    const businessScale = settings.businessScale || "mikro";
    const sector = settings.sector || "umum";

    const systemInstruction = `
Kamu adalah ${persona} untuk pelaku UMKM Indonesia.
Gaya jawaban: ${tone}.
Bahasa output: ${language === "id" ? "Bahasa Indonesia" : "English"}.
Skala bisnis pengguna: ${businessScale}.
Sektor bisnis pengguna: ${sector}.

Aturan jawaban:
1. Jawaban harus konkret, bisa dieksekusi, dan berdampak pada peningkatan omzet atau efisiensi.
2. Gunakan struktur: Analisis Singkat, Aksi Prioritas, KPI, Risiko, dan Estimasi Dampak.
3. Jika pengguna meminta strategi, berikan urutan langkah dengan nomor.
4. Hindari jawaban terlalu umum.
`.trim();

    const fullPrompt = `${systemInstruction}

Riwayat percakapan:
${serializeHistory(body.history)}

Pertanyaan pengguna:
${message}`;

    const client = new GoogleGenerativeAI(apiKey);

    let result: Awaited<
      ReturnType<
        ReturnType<typeof client.getGenerativeModel>["generateContent"]
      >
    > | null = null;
    let lastError: unknown = null;

    for (const modelName of modelCandidates) {
      try {
        const model = client.getGenerativeModel({ model: modelName });
        result = await model.generateContent({
          contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
          generationConfig: {
            temperature: clamp(settings.temperature ?? 0.6, 0, 1),
            topP: 0.9,
            maxOutputTokens: maxOutputTokens(responseLength),
          },
        });
        break;
      } catch (error) {
        lastError = error;
        if (!isModelUnavailableError(error) && !isRetryableModelError(error)) {
          throw error;
        }
      }
    }

    if (!result) {
      const detail =
        lastError instanceof Error
          ? lastError.message
          : "Tidak ada detail error.";
      return NextResponse.json(
        {
          error:
            "Model Gemini tidak tersedia. Set GEMINI_MODEL ke gemini-2.5-flash di Vercel Environment Variables, lalu redeploy. Detail: " +
            detail,
        },
        { status: 502 },
      );
    }

    const reply = result.response.text()?.trim();
    if (!reply) {
      return NextResponse.json(
        { error: "Model tidak mengembalikan jawaban. Coba lagi." },
        { status: 502 },
      );
    }

    return NextResponse.json({ reply });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Terjadi kesalahan internal.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
