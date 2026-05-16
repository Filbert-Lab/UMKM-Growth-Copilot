import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

// ── Types ──────────────────────────────────────────────────────────────────

export type AnalysisResult = {
  type: "nota" | "produk" | "umum";
  summary: string;
  items?: NotaItem[];
  productInfo?: ProductInfo;
  rawText?: string;
};

export type NotaItem = {
  nama: string;
  qty: number | null;
  harga_satuan: number | null;
  subtotal: number | null;
};

export type ProductInfo = {
  nama_produk: string;
  kategori: string;
  deskripsi: string;
  estimasi_harga: string;
  saran_marketing: string[];
};

type CloudinaryUploadResult = {
  secure_url: string;
  public_id: string;
};

// Groq vision model — supports image_url content parts
const GROQ_VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";
const GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions";

// ── Cloudinary config ──────────────────────────────────────────────────────

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// ── Helpers ────────────────────────────────────────────────────────────────

async function uploadBase64ToCloudinary(
  base64Data: string,
  mimeType: string,
): Promise<CloudinaryUploadResult> {
  const dataUri = `data:${mimeType};base64,${base64Data}`;
  const result = await cloudinary.uploader.upload(dataUri, {
    folder: "umkm-growth-copilot",
    resource_type: "image",
    transformation: [{ quality: "auto:good", fetch_format: "auto" }],
  });
  return result as CloudinaryUploadResult;
}

function buildSystemPrompt(analysisType: string): string {
  const base =
    "Kamu adalah asisten AI untuk UMKM Indonesia. " +
    "Selalu kembalikan HANYA JSON valid — tanpa markdown, tanpa penjelasan, tanpa teks di luar JSON.";

  if (analysisType === "nota") {
    return (
      base +
      "\n\nTugasmu: analisis gambar nota/struk/invoice dan ekstrak datanya." +
      "\n\nStruktur JSON yang WAJIB dikembalikan:\n" +
      JSON.stringify(
        {
          type: "nota",
          summary: "Ringkasan singkat nota ini (1-2 kalimat)",
          rawText: "Teks lengkap yang terbaca dari nota",
          items: [
            {
              nama: "nama item/produk",
              qty: "angka atau null",
              harga_satuan: "angka integer atau null",
              subtotal: "angka integer atau null",
            },
          ],
        },
        null,
        2,
      ) +
      "\n\nAturan: semua harga sebagai integer (tanpa Rp/titik/koma). Jika tidak terbaca, gunakan null."
    );
  }

  if (analysisType === "produk") {
    return (
      base +
      "\n\nTugasmu: analisis gambar produk dan berikan insight bisnis." +
      "\n\nStruktur JSON yang WAJIB dikembalikan:\n" +
      JSON.stringify(
        {
          type: "produk",
          summary: "Deskripsi singkat produk yang terlihat (1-2 kalimat)",
          productInfo: {
            nama_produk: "nama produk yang teridentifikasi",
            kategori: "kategori produk (Kuliner/Fashion/Elektronik/dll)",
            deskripsi: "deskripsi produk menarik untuk listing marketplace",
            estimasi_harga: "estimasi range harga jual wajar di pasar Indonesia",
            saran_marketing: [
              "saran marketing 1 yang spesifik dan actionable",
              "saran marketing 2",
              "saran marketing 3",
            ],
          },
        },
        null,
        2,
      )
    );
  }

  // umum
  return (
    base +
    "\n\nTugasmu: analisis gambar ini dan berikan insight bisnis yang relevan untuk UMKM." +
    "\n\nStruktur JSON yang WAJIB dikembalikan:\n" +
    JSON.stringify(
      {
        type: "umum",
        summary:
          "Deskripsi lengkap tentang apa yang terlihat dan relevansinya untuk UMKM (2-3 kalimat)",
        rawText: "Teks apapun yang terbaca dari gambar, atau string kosong jika tidak ada",
      },
      null,
      2,
    )
  );
}

async function analyzeWithGroq(
  imageUrl: string,
  analysisType: string,
): Promise<AnalysisResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GROQ_API_KEY belum diset. Tambahkan di .env.local atau Vercel.",
    );
  }

  const systemPrompt = buildSystemPrompt(analysisType);

  const response = await fetch(GROQ_CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_VISION_MODEL,
      temperature: 0.1, // low temp for structured extraction
      max_tokens: 1024,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: imageUrl },
            },
            {
              type: "text",
              text: "Analisis gambar ini sesuai instruksi sistem dan kembalikan JSON.",
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errBody = (await response.json().catch(() => null)) as {
      error?: { message?: string };
    } | null;
    const msg =
      errBody?.error?.message ??
      `Groq Vision API gagal dengan status ${response.status}.`;
    throw new Error(msg);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const raw = payload.choices?.[0]?.message?.content?.trim() ?? "";

  // Strip markdown code fences if the model wraps the JSON
  const cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const parsed = JSON.parse(cleaned) as AnalysisResult;
  return parsed;
}

// ── Route Handler ──────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    // Validate Cloudinary env vars early
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      return NextResponse.json(
        {
          error:
            "Konfigurasi Cloudinary belum lengkap. Periksa CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, dan CLOUDINARY_API_SECRET.",
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
    const analysisType = (formData.get("analysisType") as string | null) ?? "umum";

    if (!file) {
      return NextResponse.json(
        { error: "File gambar tidak ditemukan dalam request." },
        { status: 400 },
      );
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Format file tidak didukung. Gunakan JPG, PNG, atau WebP." },
        { status: 400 },
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Ukuran file terlalu besar. Maksimal 10 MB." },
        { status: 400 },
      );
    }

    // Step 1: Upload to Cloudinary
    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString("base64");
    const cloudinaryResult = await uploadBase64ToCloudinary(base64Data, file.type);
    const imageUrl = cloudinaryResult.secure_url;

    // Step 2: Analyze with Groq Vision (Llama 4 Scout)
    const analysisResult = await analyzeWithGroq(imageUrl, analysisType);

    return NextResponse.json({
      success: true,
      imageUrl,
      analysis: analysisResult,
    });
  } catch (error) {
    console.error("[analyze-image] Error:", error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          error:
            "AI tidak dapat menghasilkan format JSON yang valid. Coba lagi atau gunakan gambar yang lebih jelas.",
        },
        { status: 502 },
      );
    }

    const message =
      error instanceof Error ? error.message : "Terjadi kesalahan internal.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
