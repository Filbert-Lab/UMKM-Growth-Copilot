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

    const modelName = process.env.GEMINI_MODEL || "gemini-1.5-flash";
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
    const model = client.getGenerativeModel({ model: modelName });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
      generationConfig: {
        temperature: clamp(settings.temperature ?? 0.6, 0, 1),
        topP: 0.9,
        maxOutputTokens: maxOutputTokens(responseLength),
      },
    });

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
