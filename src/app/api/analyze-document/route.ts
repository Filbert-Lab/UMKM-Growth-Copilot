import { NextResponse } from "next/server";

// ── Types ──────────────────────────────────────────────────────────────────

export type DocumentAnalysisResult = {
  fileName: string;
  fileType: "pdf" | "docx" | "txt";
  summary: string;
  keyPoints: string[];
  businessInsights: string[];
  actionItems: string[];
  wordCount: number;
};

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
    finishReason?: string;
  }>;
  error?: { message?: string; code?: number; status?: string };
};

// ── Constants ──────────────────────────────────────────────────────────────

// gemini-2.5-flash-lite: 15 RPM / 250K TPM / 500 RPD on free tier — best choice
// Falls back to gemini-2.5-flash (10 RPM / 250K TPM / 500 RPD) if lite unavailable
const GEMINI_MODELS = [
  "gemini-2.5-flash-lite",
  "gemini-2.5-flash",
  "gemini-2.0-flash",
];
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

const ALLOWED_MIME_TYPES: Record<string, DocumentAnalysisResult["fileType"]> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "text/plain": "txt",
};

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

// ── Prompt ─────────────────────────────────────────────────────────────────

function buildPrompt(fileName: string): string {
  return `Kamu adalah konsultan bisnis AI untuk UMKM Indonesia yang ahli menganalisis dokumen bisnis.
Baca dokumen berikut (nama file: ${fileName}) dan hasilkan analisis bisnis yang praktis.

PENTING: Kembalikan HANYA JSON valid, tanpa teks apapun di luar JSON, tanpa markdown code fence.

Format JSON yang harus dikembalikan:
{"summary":"Ringkasan dokumen dalam 2-3 kalimat","keyPoints":["poin 1","poin 2","poin 3"],"businessInsights":["insight 1","insight 2","insight 3"],"actionItems":["aksi 1","aksi 2","aksi 3"]}

Aturan:
- summary: 2-3 kalimat ringkas dan padat
- keyPoints: 3-6 fakta/informasi utama dari dokumen
- businessInsights: 3-5 insight relevan untuk UMKM
- actionItems: 3-5 langkah konkret yang bisa langsung dilakukan
- Semua teks dalam Bahasa Indonesia
- Jika dokumen bukan berbahasa Indonesia, tetap jawab dalam Bahasa Indonesia`;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function extractJsonFromText(text: string): string {
  // Try to find JSON object in the response, even if surrounded by other text
  const trimmed = text.trim();

  // Remove markdown code fences
  const stripped = trimmed
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  // If it starts with {, try as-is
  if (stripped.startsWith("{")) {
    return stripped;
  }

  // Try to find a JSON object anywhere in the text
  const jsonMatch = stripped.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return jsonMatch[0];
  }

  return stripped;
}

function validateAndNormalizeResult(parsed: unknown): {
  summary: string;
  keyPoints: string[];
  businessInsights: string[];
  actionItems: string[];
} {
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Hasil analisis bukan objek JSON yang valid.");
  }

  const obj = parsed as Record<string, unknown>;

  const summary =
    typeof obj.summary === "string" && obj.summary.trim()
      ? obj.summary.trim()
      : "Dokumen berhasil dianalisis.";

  const toStringArray = (val: unknown, fallback: string[]): string[] => {
    if (!Array.isArray(val)) return fallback;
    const filtered = val.filter((v): v is string => typeof v === "string" && v.trim().length > 0);
    return filtered.length > 0 ? filtered : fallback;
  };

  return {
    summary,
    keyPoints: toStringArray(obj.keyPoints, ["Dokumen telah dibaca oleh AI."]),
    businessInsights: toStringArray(obj.businessInsights, ["Analisis bisnis tersedia."]),
    actionItems: toStringArray(obj.actionItems, ["Tinjau dokumen lebih lanjut."]),
  };
}

function estimateWordCount(buffer: Buffer, mimeType: string): number {
  if (mimeType === "text/plain") {
    const text = buffer.toString("utf-8");
    return text.split(/\s+/).filter(Boolean).length;
  }
  // For PDF/DOCX, rough estimate from file size
  return Math.round(buffer.length / 6);
}

async function callGemini(
  apiKey: string,
  model: string,
  fileBuffer: Buffer,
  mimeType: string,
  fileName: string,
): Promise<{ summary: string; keyPoints: string[]; businessInsights: string[]; actionItems: string[] }> {
  const base64Data = fileBuffer.toString("base64");
  const prompt = buildPrompt(fileName);

  const requestBody = {
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inline_data: {
              mime_type: mimeType,
              data: base64Data,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 2048,
      // NOTE: Do NOT set responseMimeType for thinking models (2.5 series)
      // as it conflicts with the thinking budget and causes empty responses.
    },
  };

  const url = `${GEMINI_API_BASE}/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });

  const payload = (await response.json().catch(() => null)) as GeminiResponse | null;

  if (!response.ok) {
    const msg =
      payload?.error?.message ??
      `Gemini API (${model}) gagal dengan status ${response.status}.`;
    const err = new Error(msg);
    (err as Error & { status?: number }).status = response.status;
    throw err;
  }

  const rawText = payload?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";

  if (!rawText) {
    const finishReason = payload?.candidates?.[0]?.finishReason;
    throw new Error(
      `Model ${model} tidak mengembalikan teks. Finish reason: ${finishReason ?? "unknown"}.`,
    );
  }

  const jsonStr = extractJsonFromText(rawText);
  const parsed = JSON.parse(jsonStr) as unknown;
  return validateAndNormalizeResult(parsed);
}

// ── Route Handler ──────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
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

    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { error: "Content-Type harus multipart/form-data." },
        { status: 400 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "File dokumen tidak ditemukan dalam request." },
        { status: 400 },
      );
    }

    const fileType = ALLOWED_MIME_TYPES[file.type];
    if (!fileType) {
      return NextResponse.json(
        { error: "Format file tidak didukung. Gunakan PDF, DOCX, atau TXT." },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Ukuran file terlalu besar. Maksimal 20 MB." },
        { status: 400 },
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        { error: "File kosong. Pastikan dokumen memiliki konten." },
        { status: 400 },
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);
    const wordCount = estimateWordCount(fileBuffer, file.type);

    // Try models in order, falling back on rate-limit or model errors
    let analysisData: { summary: string; keyPoints: string[]; businessInsights: string[]; actionItems: string[] } | null = null;
    let lastError: unknown = null;

    for (const model of GEMINI_MODELS) {
      try {
        analysisData = await callGemini(apiKey, model, fileBuffer, file.type, file.name);
        break;
      } catch (err) {
        lastError = err;
        const status = (err as Error & { status?: number }).status;
        // Only fall through to next model on rate-limit (429) or model-not-found (404)
        if (status === 429 || status === 404 || status === 503) {
          continue;
        }
        // For other errors (auth, bad request, parse errors), throw immediately
        throw err;
      }
    }

    if (!analysisData) {
      throw lastError ?? new Error("Semua model Gemini tidak tersedia saat ini.");
    }

    const result: DocumentAnalysisResult = {
      fileName: file.name,
      fileType,
      wordCount,
      ...analysisData,
    };

    return NextResponse.json({ success: true, analysis: result });
  } catch (error) {
    console.error("[analyze-document] Error:", error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          error:
            "AI mengembalikan format yang tidak valid. Coba lagi — biasanya berhasil pada percobaan kedua.",
        },
        { status: 502 },
      );
    }

    const message =
      error instanceof Error ? error.message : "Terjadi kesalahan internal.";

    if (message.includes("API_KEY_INVALID") || message.includes("401")) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY tidak valid. Periksa kembali API key di pengaturan." },
        { status: 401 },
      );
    }

    if (message.includes("RESOURCE_EXHAUSTED") || message.includes("429")) {
      return NextResponse.json(
        { error: "Kuota Gemini sedang penuh. Coba lagi dalam beberapa menit." },
        { status: 429 },
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
