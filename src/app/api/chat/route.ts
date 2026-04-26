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
      // Dinaikkan agar model bisa menyelesaikan kalimat terakhir;
      // singkatnya dikontrol via prompt, bukan hard-cut token.
      return 600;
    case "long":
      return 1600;
    case "medium":
    default:
      return 950;
  }
}

function responseLengthGuidance(length: ChatSettings["responseLength"]) {
  switch (length) {
    case "short":
      return (
        "WAJIB singkat: jawab maksimal 100-130 kata. " +
        "Langsung ke inti, tanpa basa-basi, tanpa daftar panjang. " +
        "Berhenti setelah poin utama selesai, jangan tambahkan penjelasan tambahan."
      );
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
    if (
      last.role === "user" &&
      normalizeText(last.content) === normalizedCurrent
    ) {
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
  if (
    error instanceof GroqApiError &&
    (error.status === 401 || error.status === 403)
  ) {
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

function isSopRequest(message: string) {
  return /\bsop\b|standar\s+operasional/i.test(message);
}

function asksForAnalyticalSections(message: string) {
  return /\banalisis\b|\bkpi\b|risiko|mitigasi|estimasi\s+dampak/i.test(
    message,
  );
}

function normalizeReplyStyle(reply: string) {
  return reply.trim();
}

function normalizeHeadingCandidate(line: string) {
  return line.trim().replace(/^[\-–•*\d.)\s]+/, "");
}

function isAnalyticalHeading(line: string) {
  const heading = normalizeHeadingCandidate(line).toLowerCase();
  return (
    heading.startsWith("analisis") ||
    heading.startsWith("kpi") ||
    heading.startsWith("risiko") ||
    heading.startsWith("mitigasi") ||
    heading.startsWith("estimasi dampak")
  );
}

function isLikelyHeading(line: string) {
  const heading = normalizeHeadingCandidate(line);
  return /^[A-Za-z][A-Za-z\s()\-/]{1,50}:?$/.test(heading);
}

function stripUnrequestedAnalyticalSections(reply: string) {
  const lines = reply.split("\n");
  const kept: string[] = [];
  let skippingAnalytical = false;

  for (const line of lines) {
    const trimmed = line.trim();
    const heading = normalizeHeadingCandidate(trimmed);

    if (isAnalyticalHeading(trimmed)) {
      skippingAnalytical = true;
      continue;
    }

    if (/^aksi\s+prioritas\s*:?$/i.test(heading)) {
      skippingAnalytical = false;
      kept.push("Langkah SOP:");
      continue;
    }

    if (skippingAnalytical && isLikelyHeading(trimmed)) {
      skippingAnalytical = false;
    }

    if (!skippingAnalytical) {
      kept.push(line);
    }
  }

  return kept
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function cleanStepText(step: string) {
  return step
    .replace(/^\d+[.)]\s*/, "")
    .replace(/^[\-–•*]\s*/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function inferSopTopic(message: string) {
  const compact = message
    .replace(/buat(kan)?\s*/gi, "")
    .replace(/\bsop\b/gi, "")
    .replace(/\b(sederhana|tolong|please|dong|ya|mohon)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  const cleaned = (compact || "menangani komplain pelanggan").replace(
    /\buntuk\s+untuk\b/gi,
    "untuk",
  );

  return cleaned;
}

function isComplaintSopRequest(message: string) {
  return /komplain|keluhan|complaint/i.test(message);
}

function hasOperationalDetail(reply: string) {
  const hasPic = /\bPIC\b/i.test(reply);
  const hasSla = /\bSLA\b|\b[0-9]+\s*(menit|jam|hari)\b/i.test(reply);
  return hasPic && hasSla;
}

function getDetailedNumberedSteps(reply: string) {
  return reply
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^\d+[.)]\s+/.test(line))
    .map(cleanStepText)
    .filter((step) => step.length >= 25)
    .slice(0, 8);
}

function buildComplaintSopReply(topic: string, language: "id" | "en") {
  if (language === "en") {
    return [
      `Here is a practical SOP for ${topic}.`,
      "",
      "SOP Steps (detailed actions + PIC + SLA):",
      "1. Receive the complaint with empathy, validate the issue, and collect core data (name, order number, proof photo). PIC: Customer Service. SLA: initial response within 5 minutes.",
      "2. Classify the issue type (product, delivery, service, payment) and urgency level. PIC: Customer Service. SLA: within 10 minutes.",
      "3. Verify the root cause with relevant teams (warehouse/cashier/courier) based on transaction data. PIC: Operations Admin. SLA: within 30 minutes.",
      "4. Offer a clear solution (refund, replacement, resend, voucher) with a clear completion deadline. PIC: Customer Service + Supervisor. SLA: within 15 minutes after verification.",
      "5. Execute the solution and confirm to the customer until they acknowledge resolution. PIC: Operations Team. SLA: as committed, typically < 24 hours.",
      "6. Close the case by documenting root cause, compensation cost, and preventive action to avoid recurrence. PIC: Supervisor. SLA: report completed on the same day.",
      "",
      "Quick customer reply template:",
      "Hi Kak, thank you for contacting us. We are sorry for the issue. Could you share your order number and product photo so we can process this right away? We will send the first update within 15 minutes.",
      "",
      "Complaint log template:",
      "- Date/Time received:",
      "- Customer name:",
      "- Order number:",
      "- Complaint channel (WA/IG/Marketplace):",
      "- Issue type:",
      "- Root cause:",
      "- Selected solution:",
      "- PIC:",
      "- SLA commitment:",
      "- Final status (resolved/pending):",
    ].join("\n");
  }

  return [
    `Berikut SOP praktis untuk ${topic}.`,
    "",
    "Langkah SOP (detail tindakan + PIC + SLA):",
    "1. Terima komplain dengan empati, validasi keluhan, lalu minta data inti (nama, nomor order, foto bukti). PIC: CS. SLA: respon awal maksimal 5 menit.",
    "2. Klasifikasikan jenis masalah (produk, pengiriman, pelayanan, pembayaran) dan tingkat urgensi. PIC: CS. SLA: maksimal 10 menit.",
    "3. Verifikasi akar masalah ke tim terkait (gudang/kasir/kurir) berdasarkan data transaksi. PIC: Admin Operasional. SLA: maksimal 30 menit.",
    "4. Berikan solusi yang jelas ke pelanggan (refund, tukar barang, kirim ulang, voucher) beserta batas waktu penyelesaian. PIC: CS + Supervisor. SLA: maksimal 15 menit setelah verifikasi.",
    "5. Eksekusi solusi dan konfirmasi hasil ke pelanggan sampai pelanggan menyatakan masalah selesai. PIC: Tim Operasional. SLA: sesuai komitmen, umumnya < 24 jam.",
    "6. Tutup kasus dengan mencatat penyebab, biaya kompensasi, dan tindakan pencegahan agar komplain serupa tidak berulang. PIC: Supervisor. SLA: laporan selesai di hari yang sama.",
    "",
    "Template respon cepat ke pelanggan:",
    "Halo Kak, terima kasih sudah menghubungi kami. Mohon maaf atas kendalanya. Boleh kirim nomor order dan foto produk agar kami proses sekarang? Kami targetkan update pertama dalam 15 menit.",
    "",
    "Template log komplain:",
    "- Tanggal/Jam masuk:",
    "- Nama pelanggan:",
    "- Nomor order:",
    "- Kanal komplain (WA/IG/Marketplace):",
    "- Jenis masalah:",
    "- Akar masalah:",
    "- Solusi yang dipilih:",
    "- PIC penanganan:",
    "- SLA komitmen:",
    "- Status akhir (selesai/belum):",
  ].join("\n");
}

function buildGenericSopReply(topic: string, language: "id" | "en") {
  if (language === "en") {
    return [
      `Here is a simple SOP for ${topic}.`,
      "",
      "SOP Steps (detailed actions + PIC + SLA):",
      "1. Define SOP goals and measurable success indicators. PIC: Owner/Manager. SLA: 1 day.",
      "2. Map the full workflow and identify error-prone points. PIC: Operations Supervisor. SLA: 1 day.",
      "3. Define detailed step-by-step actions per role, including each step's input/output. PIC: Supervisor + Related Teams. SLA: 1 day.",
      "4. Set service time standards (SLA), quality standards, and escalation rules for issues. PIC: Operations Manager. SLA: 1 day.",
      "5. Pilot the SOP for 3-7 days, collect feedback, then revise ineffective parts. PIC: QA/Internal Control. SLA: 7 days.",
      "6. Finalize SOP, train the team, and run a periodic review at least monthly. PIC: Owner/Manager. SLA: ongoing.",
      "",
      "SOP document template:",
      "- SOP objective:",
      "- Scope:",
      "- PIC per step:",
      "- SLA per step:",
      "- Forms/checklists used:",
      "- Escalation mechanism:",
      "- Evaluation schedule:",
    ].join("\n");
  }

  return [
    `Berikut SOP sederhana untuk ${topic}.`,
    "",
    "Langkah SOP (detail tindakan + PIC + SLA):",
    "1. Tetapkan tujuan SOP dan indikator keberhasilan yang terukur. PIC: Owner/Manager. SLA: 1 hari.",
    "2. Petakan alur kerja dari awal sampai selesai dan titik rawan error. PIC: Supervisor Operasional. SLA: 1 hari.",
    "3. Definisikan langkah kerja rinci per peran, termasuk input/output tiap langkah. PIC: Supervisor + Tim terkait. SLA: 1 hari.",
    "4. Buat standar waktu layanan (SLA), standar kualitas, dan eskalasi bila terjadi kendala. PIC: Manager Operasional. SLA: 1 hari.",
    "5. Uji coba SOP selama 3-7 hari, kumpulkan feedback, lalu revisi bagian yang tidak efektif. PIC: QA/Internal Control. SLA: 7 hari.",
    "6. Finalisasi SOP, sosialisasi ke tim, dan review berkala minimal bulanan. PIC: Owner/Manager. SLA: berkelanjutan.",
    "",
    "Template dokumen SOP:",
    "- Tujuan SOP:",
    "- Ruang lingkup:",
    "- PIC per langkah:",
    "- SLA per langkah:",
    "- Form/checklist yang digunakan:",
    "- Mekanisme eskalasi:",
    "- Jadwal evaluasi:",
  ].join("\n");
}

function buildSopFocusedReply(
  reply: string,
  userMessage: string,
  language: "id" | "en",
) {
  const topic = inferSopTopic(userMessage);
  const detailedSteps = getDetailedNumberedSteps(reply);
  const hasEnoughSteps = detailedSteps.length >= 5;
  const hasOpsDetails = hasOperationalDetail(reply);

  if (hasEnoughSteps && hasOpsDetails) {
    return reply;
  }

  return isComplaintSopRequest(userMessage)
    ? buildComplaintSopReply(topic, language)
    : buildGenericSopReply(topic, language);
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
    const sopRequest = isSopRequest(message);
    const analyticalSectionsRequested = asksForAnalyticalSections(message);

    const responseModeInstruction = sopRequest
      ? "Untuk permintaan SOP, berikan jawaban SOP siap pakai dan sangat spesifik. Setiap langkah wajib memuat tindakan detail, PIC, dan SLA waktu. Tambahkan contoh template atau skrip komunikasi yang bisa langsung dipakai tim. Hindari langkah yang terlalu umum atau hanya berupa judul singkat."
      : "Jawab langsung ke inti permintaan pengguna dengan langkah praktis yang bisa langsung dijalankan.";

    const optionalSectionInstruction = analyticalSectionsRequested
      ? "Karena pengguna menyinggung analisis/KPI/risiko, kamu boleh menambah bagian tersebut secara ringkas."
      : "Jangan tambahkan bagian Analisis, KPI, Risiko, Mitigasi, atau Estimasi Dampak jika pengguna tidak memintanya secara eksplisit.";

    const languageInstruction =
      language === "en"
        ? "WAJIB gunakan English untuk seluruh jawaban. Jangan gunakan Bahasa Indonesia kecuali nama brand/istilah lokal."
        : "WAJIB gunakan Bahasa Indonesia yang sederhana dan mudah dipahami pelaku UMKM.";

    const systemInstruction = `
Kamu adalah ${persona} untuk pelaku UMKM Indonesia.
Gaya jawaban: ${tone}.
Bahasa output: ${language === "id" ? "Bahasa Indonesia" : "English"}.
Skala bisnis pengguna: ${businessScale}.
Sektor bisnis pengguna: ${sector}.

Aturan jawaban:
1. Jawaban harus konkret, bisa dieksekusi, dan berdampak pada peningkatan omzet atau efisiensi.
2. ${languageInstruction}
3. Jangan ulangi salam/perkenalan jika percakapan sudah berjalan.
4. Gunakan markdown untuk memformat jawaban secara profesional (misal: tabel jika relevan, *bold* untuk poin penting).
5. ${responseModeInstruction}
6. ${optionalSectionInstruction}
7. Jika pengguna meminta strategi dengan periode waktu (contoh: 14 hari), berikan rencana terjadwal sesuai periode tersebut.
8. Hindari jawaban terlalu umum dan hindari pengantar panjang yang tidak diminta.
9. ${responseLengthGuidance(responseLength)}
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

        if (
          error instanceof GroqApiError &&
          (error.status === 401 || error.status === 403)
        ) {
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

    const cleanedReply = normalizeReplyStyle(reply);
    const strippedReply = analyticalSectionsRequested
      ? cleanedReply
      : stripUnrequestedAnalyticalSections(cleanedReply);
    const finalReply =
      sopRequest && !analyticalSectionsRequested
        ? buildSopFocusedReply(strippedReply, message, language)
        : strippedReply;

    return NextResponse.json({ reply: finalReply });
  } catch (error) {
    const message = toUserFriendlyError(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
