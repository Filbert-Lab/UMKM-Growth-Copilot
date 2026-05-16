import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { GoogleGenerativeAI } from "@google/generative-ai";

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

// ── Cloudinary config ──────────────────────────────────────────────────────

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// ── Helpers ────────────────────────────────────────────────────────────────

async function uploadToCloudinary(
  fileBuffer: Buffer,
  mimeType: string,
): Promise<CloudinaryUploadResult> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "umkm-growth-copilot",
        resource_type: "image",
        format: "jpg",
        transformation: [{ quality: "auto:good", fetch_format: "auto" }],
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload gagal tanpa error."));
          return;
        }
        resolve(result as CloudinaryUploadResult);
      },
    );

    // Convert buffer to base64 data URI and pipe it
    const base64 = fileBuffer.toString("base64");
    const dataUri = `data:${mimeType};base64,${base64}`;

    // Use upload with data URI instead of stream for reliability
    uploadStream.end(Buffer.from(dataUri));
  });
}

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

function buildGeminiPrompt(analysisType: string): string {
  if (analysisType === "nota") {
    return `Kamu adalah asisten AI untuk UMKM Indonesia. Analisis gambar nota/struk/invoice ini dan ekstrak datanya ke format JSON.

Kembalikan HANYA JSON valid (tanpa markdown, tanpa penjelasan) dengan struktur:
{
  "type": "nota",
  "summary": "Ringkasan singkat nota ini (1-2 kalimat)",
  "rawText": "Teks lengkap yang terbaca dari nota",
  "items": [
    {
      "nama": "nama item/produk",
      "qty": angka_atau_null,
      "harga_satuan": angka_atau_null,
      "subtotal": angka_atau_null
    }
  ]
}

Aturan:
- Semua nilai harga dalam angka integer (tanpa Rp, titik, atau koma)
- Jika nilai tidak terbaca, gunakan null
- Ekstrak semua item yang terlihat di nota`;
  }

  if (analysisType === "produk") {
    return `Kamu adalah konsultan marketing UMKM Indonesia. Analisis gambar produk ini dan berikan insight bisnis dalam format JSON.

Kembalikan HANYA JSON valid (tanpa markdown, tanpa penjelasan) dengan struktur:
{
  "type": "produk",
  "summary": "Deskripsi singkat produk yang terlihat (1-2 kalimat)",
  "productInfo": {
    "nama_produk": "nama produk yang teridentifikasi",
    "kategori": "kategori produk (Kuliner/Fashion/Elektronik/dll)",
    "deskripsi": "deskripsi produk yang menarik untuk listing marketplace",
    "estimasi_harga": "estimasi range harga jual yang wajar di pasar Indonesia",
    "saran_marketing": [
      "saran marketing 1 yang spesifik dan actionable",
      "saran marketing 2",
      "saran marketing 3"
    ]
  }
}`;
  }

  // Default / umum
  return `Kamu adalah asisten AI untuk UMKM Indonesia. Analisis gambar ini dan berikan insight bisnis yang relevan dalam format JSON.

Kembalikan HANYA JSON valid (tanpa markdown, tanpa penjelasan) dengan struktur:
{
  "type": "umum",
  "summary": "Deskripsi lengkap tentang apa yang terlihat di gambar dan relevansinya untuk UMKM (2-3 kalimat)",
  "rawText": "Teks apapun yang terbaca dari gambar (kosongkan jika tidak ada teks)"
}`;
}

async function analyzeWithGemini(
  imageUrl: string,
  analysisType: string,
): Promise<AnalysisResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY belum diset. Tambahkan di .env.local atau Vercel.",
    );
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  // Fetch image from Cloudinary URL and convert to base64 for Gemini
  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    throw new Error("Gagal mengambil gambar dari Cloudinary untuk analisis.");
  }
  const imageBuffer = await imageResponse.arrayBuffer();
  const base64Image = Buffer.from(imageBuffer).toString("base64");
  const mimeType = imageResponse.headers.get("content-type") || "image/jpeg";

  const prompt = buildGeminiPrompt(analysisType);

  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        data: base64Image,
        mimeType: mimeType as "image/jpeg" | "image/png" | "image/webp",
      },
    },
  ]);

  const responseText = result.response.text().trim();

  // Strip markdown code fences if present
  const cleaned = responseText
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
    // Validate env vars early
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      return NextResponse.json(
        {
          error:
            "Konfigurasi Cloudinary belum lengkap. Periksa CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, dan CLOUDINARY_API_SECRET di .env.local.",
        },
        { status: 500 },
      );
    }

    const contentType = request.headers.get("content-type") ?? "";
    let fileBuffer: Buffer;
    let mimeType: string;
    let analysisType = "umum";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      const type = formData.get("analysisType") as string | null;

      if (!file) {
        return NextResponse.json(
          { error: "File gambar tidak ditemukan dalam request." },
          { status: 400 },
        );
      }

      const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          {
            error:
              "Format file tidak didukung. Gunakan JPG, PNG, atau WebP.",
          },
          { status: 400 },
        );
      }

      // 10 MB limit
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          { error: "Ukuran file terlalu besar. Maksimal 10 MB." },
          { status: 400 },
        );
      }

      const arrayBuffer = await file.arrayBuffer();
      fileBuffer = Buffer.from(arrayBuffer);
      mimeType = file.type;
      analysisType = type ?? "umum";
    } else {
      return NextResponse.json(
        { error: "Content-Type harus multipart/form-data." },
        { status: 400 },
      );
    }

    // Step 1: Upload to Cloudinary
    const base64Data = fileBuffer.toString("base64");
    const cloudinaryResult = await uploadBase64ToCloudinary(base64Data, mimeType);
    const imageUrl = cloudinaryResult.secure_url;

    // Step 2: Analyze with Gemini Vision
    const analysisResult = await analyzeWithGemini(imageUrl, analysisType);

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
