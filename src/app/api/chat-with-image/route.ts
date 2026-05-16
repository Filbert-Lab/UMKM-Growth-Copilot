import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

// ── Types ──────────────────────────────────────────────────────────────────

type CloudinaryUploadResult = {
  secure_url: string;
  public_id: string;
};

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

// ── Route Handler ──────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      return NextResponse.json(
        { error: "Konfigurasi Cloudinary belum lengkap." },
        { status: 500 },
      );
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GROQ_API_KEY belum diset." },
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
    const userMessage = (formData.get("message") as string | null)?.trim() ?? "";

    if (!file) {
      return NextResponse.json(
        { error: "File gambar tidak ditemukan." },
        { status: 400 },
      );
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Format tidak didukung. Gunakan JPG, PNG, atau WebP." },
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

    // Step 2: Call Groq Vision — free-form chat about the image
    const systemPrompt =
      "Kamu adalah konsultan bisnis AI untuk UMKM Indonesia. " +
      "Pengguna mengirimkan sebuah gambar dan mungkin disertai pertanyaan atau instruksi. " +
      "Analisis gambar tersebut dan jawab pertanyaan pengguna secara langsung, praktis, dan berorientasi bisnis. " +
      "Gunakan Bahasa Indonesia yang mudah dipahami. " +
      "Jika tidak ada pertanyaan spesifik, berikan insight bisnis yang relevan dari gambar tersebut.";

    const userContent: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
      { type: "image_url", image_url: { url: imageUrl } },
    ];

    if (userMessage) {
      userContent.push({ type: "text", text: userMessage });
    } else {
      userContent.push({
        type: "text",
        text: "Analisis gambar ini dan berikan insight bisnis yang relevan untuk UMKM.",
      });
    }

    const response = await fetch(GROQ_CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_VISION_MODEL,
        temperature: 0.5,
        max_tokens: 1024,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
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

    const reply = payload.choices?.[0]?.message?.content?.trim() ?? "";
    if (!reply) {
      throw new Error("AI tidak mengembalikan jawaban.");
    }

    return NextResponse.json({ reply, imageUrl });
  } catch (error) {
    console.error("[chat-with-image] Error:", error);
    const message =
      error instanceof Error ? error.message : "Terjadi kesalahan internal.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
