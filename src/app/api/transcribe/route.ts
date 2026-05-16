import { NextResponse } from "next/server";

// UMKM domain prompt to bias the model toward Indonesian business vocabulary.
// This dramatically improves recognition accuracy for typical user phrases.
const UMKM_CONTEXT_PROMPT =
  "Transkrip percakapan konsultasi bisnis UMKM Indonesia. Topik: strategi pemasaran, " +
  "promosi WhatsApp, Instagram, TikTok, Tokopedia, Shopee, omzet, margin, modal, " +
  "kasir, supplier, pelanggan, produk, harga jual, HPP, BEP, cashflow, SOP, KPI, " +
  "campaign, bundling, content calendar, customer persona, target pasar.";

// Common Whisper hallucinations on silence/noise input.
// Whisper often outputs these when there's no real speech.
const HALLUCINATION_PATTERNS = [
  /^terima ?kasih( banyak)?\.?$/i,
  /^silakan (subscribe|like|share)/i,
  /^thank ?you( so much)?\.?$/i,
  /^thanks( for watching)?\.?$/i,
  /^subscribe( ya)?\.?$/i,
  /^(uh|um|ehm|mm|hmm|aa|ee|oh)\.?$/i,
  /^\.+$/,
  /^\s*$/,
  /^you\.?$/i,
  /^bye\.?$/i,
];

function isHallucination(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return true;
  // Very short outputs are almost always hallucination on silence
  if (trimmed.replace(/[^\w]/g, "").length < 2) return true;
  return HALLUCINATION_PATTERNS.some((pattern) => pattern.test(trimmed));
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "Tidak ada audio yang dikirim." },
        { status: 400 },
      );
    }

    // Reject very small files (likely empty recordings)
    if (file.size < 1024) {
      return NextResponse.json({ text: "" });
    }

    const { GROQ_API_KEY, GROQ_WHISPER_MODEL, WHISPER_LANGUAGE } = process.env;

    if (!GROQ_API_KEY) {
      return NextResponse.json(
        { error: "GROQ_API_KEY belum diset di environment." },
        { status: 500 },
      );
    }

    const groqFormData = new FormData();
    groqFormData.append("file", file);
    // whisper-large-v3-turbo: lebih cepat dan akurat untuk mobile use case.
    groqFormData.append(
      "model",
      GROQ_WHISPER_MODEL || "whisper-large-v3-turbo",
    );
    // Bahasa Indonesia secara eksplisit agar model tidak salah deteksi.
    groqFormData.append("language", WHISPER_LANGUAGE || "id");
    // Prompt domain UMKM untuk bias kosakata bisnis Indonesia.
    groqFormData.append("prompt", UMKM_CONTEXT_PROMPT);
    // Temperature 0 = deterministik, mengurangi halusinasi.
    groqFormData.append("temperature", "0");
    // verbose_json untuk dapat segments + no_speech_prob untuk filter halusinasi.
    groqFormData.append("response_format", "verbose_json");

    const response = await fetch(
      "https://api.groq.com/openai/v1/audio/transcriptions",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${GROQ_API_KEY}` },
        body: groqFormData,
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Groq Transcription Error:", response.status, errorData);
      return NextResponse.json(
        {
          error:
            "Gagal melakukan transkripsi. Coba rekam ulang dengan suara lebih jelas.",
        },
        { status: response.status },
      );
    }

    type Segment = {
      text?: string;
      no_speech_prob?: number;
      avg_logprob?: number;
    };
    type VerboseResponse = {
      text?: string;
      duration?: number;
      segments?: Segment[];
    };

    const data = (await response.json()) as VerboseResponse;
    let text = (data.text || "").trim();

    // Filter berdasarkan no_speech_prob & avg_logprob jika ada segments
    if (Array.isArray(data.segments) && data.segments.length > 0) {
      // Buang segment dengan probabilitas tidak ada bicara > 0.6
      // atau confidence sangat rendah (avg_logprob < -1.0)
      const validSegments = data.segments.filter((seg) => {
        const noSpeech = seg.no_speech_prob ?? 0;
        const avgLogProb = seg.avg_logprob ?? 0;
        return noSpeech < 0.6 && avgLogProb > -1.0;
      });

      if (validSegments.length === 0) {
        return NextResponse.json({ text: "" });
      }

      // Rebuild text dari segment yang valid saja.
      const cleanText = validSegments
        .map((seg) => (seg.text || "").trim())
        .filter(Boolean)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();

      if (cleanText) {
        text = cleanText;
      }
    }

    // Filter halusinasi umum
    if (isHallucination(text)) {
      return NextResponse.json({ text: "" });
    }

    // Audio sangat pendek tapi output panjang = kemungkinan halusinasi
    if (
      typeof data.duration === "number" &&
      data.duration < 0.7 &&
      text.length > 20
    ) {
      return NextResponse.json({ text: "" });
    }

    return NextResponse.json({ text });
  } catch (error: unknown) {
    console.error("Transcribe route error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Internal server error: " + message },
      { status: 500 },
    );
  }
}
