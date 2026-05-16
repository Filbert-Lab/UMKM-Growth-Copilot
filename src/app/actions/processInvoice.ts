// app/actions/processInvoice.ts
"use server";

import { v2 as cloudinary } from "cloudinary";
import { GoogleGenAI, Type } from "@google/genai";
import { z } from "zod";

// ── Cloudinary config ──────────────────────────────────────────────────────

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// ── Zod schema ─────────────────────────────────────────────────────────────

const ItemSchema = z.object({
  nama_barang: z
    .string()
    .describe("Nama lengkap barang atau produk yang tertera pada nota"),
  jumlah: z
    .number()
    .describe("Kuantitas atau jumlah unit barang yang dibeli"),
  harga_satuan: z
    .number()
    .describe("Harga per satu unit barang dalam Rupiah (tanpa simbol mata uang)"),
  total_harga: z
    .number()
    .describe("Total harga untuk item ini: jumlah dikali harga_satuan, dalam Rupiah"),
});

const InvoiceSchema = z.object({
  nama_toko: z
    .string()
    .describe("Nama toko, warung, atau merchant yang menerbitkan nota ini"),
  tanggal_transaksi: z
    .string()
    .describe("Tanggal transaksi dalam format DD/MM/YYYY atau sesuai yang tertera pada nota"),
  total_pembayaran: z
    .number()
    .describe("Total keseluruhan pembayaran yang harus dibayar dalam Rupiah, termasuk pajak jika ada"),
  daftar_item: z
    .array(ItemSchema)
    .describe("Daftar semua item atau barang yang tercantum dalam nota"),
});

export type InvoiceData = z.infer<typeof InvoiceSchema>;

export type ProcessInvoiceResult =
  | { success: true; data: InvoiceData; imageUrl: string }
  | { success: false; error: string };

// ── Gemini response schema (mirrors Zod schema using Type enum) ────────────

const geminiResponseSchema = {
  type: Type.OBJECT,
  properties: {
    nama_toko: {
      type: Type.STRING,
      description: "Nama toko, warung, atau merchant yang menerbitkan nota ini",
    },
    tanggal_transaksi: {
      type: Type.STRING,
      description: "Tanggal transaksi dalam format DD/MM/YYYY atau sesuai yang tertera pada nota",
    },
    total_pembayaran: {
      type: Type.NUMBER,
      description: "Total keseluruhan pembayaran dalam Rupiah, termasuk pajak jika ada",
    },
    daftar_item: {
      type: Type.ARRAY,
      description: "Daftar semua item atau barang yang tercantum dalam nota",
      items: {
        type: Type.OBJECT,
        properties: {
          nama_barang: {
            type: Type.STRING,
            description: "Nama lengkap barang atau produk yang tertera pada nota",
          },
          jumlah: {
            type: Type.NUMBER,
            description: "Kuantitas atau jumlah unit barang yang dibeli",
          },
          harga_satuan: {
            type: Type.NUMBER,
            description: "Harga per satu unit barang dalam Rupiah",
          },
          total_harga: {
            type: Type.NUMBER,
            description: "Total harga untuk item ini dalam Rupiah",
          },
        },
        required: ["nama_barang", "jumlah", "harga_satuan", "total_harga"],
      },
    },
  },
  required: ["nama_toko", "tanggal_transaksi", "total_pembayaran", "daftar_item"],
};

// ── Helpers ────────────────────────────────────────────────────────────────

async function uploadToCloudinary(base64Data: string, mimeType: string): Promise<string> {
  const dataUri = `data:${mimeType};base64,${base64Data}`;
  const result = await cloudinary.uploader.upload(dataUri, {
    folder: "umkm-growth-copilot/invoices",
    resource_type: "image",
    transformation: [{ quality: "auto:good", fetch_format: "auto" }],
  });
  return result.secure_url;
}

async function fetchImageAsBase64(url: string): Promise<{ base64: string; mimeType: string }> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Gagal mengambil gambar dari Cloudinary: ${response.status}`);
  }
  const contentType = response.headers.get("content-type") ?? "image/jpeg";
  const mimeType = contentType.split(";")[0].trim();
  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  return { base64, mimeType };
}

// ── Server Action ──────────────────────────────────────────────────────────

export async function processInvoice(
  base64Image: string,
  mimeType: string,
): Promise<ProcessInvoiceResult> {
  try {
    // Validate env vars
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      return { success: false, error: "Konfigurasi Cloudinary belum lengkap." };
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      return { success: false, error: "GEMINI_API_KEY belum diset." };
    }

    // Step 1: Upload to Cloudinary
    const imageUrl = await uploadToCloudinary(base64Image, mimeType);

    // Step 2: Fetch back from Cloudinary as base64 for Gemini
    const { base64: fetchedBase64, mimeType: fetchedMime } = await fetchImageAsBase64(imageUrl);

    // Step 3: Call Gemini with structured output
    const ai = new GoogleGenAI({ apiKey: geminiApiKey });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Kamu adalah sistem OCR untuk UMKM Indonesia. Ekstrak semua data dari nota/struk belanja ini secara akurat.
Jika ada informasi yang tidak terbaca dengan jelas, gunakan nilai terbaik yang bisa kamu perkirakan.
Untuk harga, kembalikan sebagai angka integer tanpa titik, koma, atau simbol Rp.
Jika tanggal tidak ada, gunakan string kosong.
Jika nama toko tidak ada, gunakan "Tidak Diketahui".`,
            },
            {
              inlineData: {
                mimeType: fetchedMime,
                data: fetchedBase64,
              },
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: geminiResponseSchema,
        temperature: 0.1,
      },
    });

    const rawText = response.text ?? "";
    if (!rawText) {
      return { success: false, error: "AI tidak mengembalikan hasil ekstraksi." };
    }

    // Strip markdown fences if present
    const cleaned = rawText
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    const parsed = JSON.parse(cleaned) as unknown;

    // Validate with Zod
    const validated = InvoiceSchema.parse(parsed);

    return { success: true, data: validated, imageUrl };
  } catch (error) {
    console.error("[processInvoice] Error:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Data dari AI tidak sesuai format: ${error.issues.map((e) => e.message).join(", ")}`,
      };
    }

    if (error instanceof SyntaxError) {
      return {
        success: false,
        error: "AI mengembalikan format yang tidak valid. Coba lagi dengan gambar yang lebih jelas.",
      };
    }

    const message = error instanceof Error ? error.message : "Terjadi kesalahan internal.";

    if (message.includes("RESOURCE_EXHAUSTED") || message.includes("429")) {
      return { success: false, error: "Kuota Gemini sedang penuh. Coba lagi dalam beberapa menit." };
    }

    if (message.includes("API_KEY_INVALID")) {
      return { success: false, error: "GEMINI_API_KEY tidak valid." };
    }

    return { success: false, error: message };
  }
}
