import { NextResponse } from "next/server";

type ImageRequestBody = {
  prompt?: string;
};

type GroqCompletionPayload = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
};

type HuggingFaceErrorPayload = {
  error?: string;
  estimated_time?: number;
};

class ExternalApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const GROQ_CHAT_COMPLETIONS_URL =
  "https://api.groq.com/openai/v1/chat/completions";
const GROQ_PROMPT_MODEL = "llama-3.1-8b-instant";
const DEFAULT_HF_IMAGE_URL =
  "https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell";
const PROMPT_ENGINEER_SYSTEM =
  "You are a prompt engineer for UMKM product photography. Translate and enhance the user's idea into a highly detailed English prompt for Stable Diffusion.";

function toUserFriendlyError(error: unknown) {
  if (error instanceof ExternalApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Terjadi kesalahan internal saat memproses gambar.";
}

async function enhancePromptWithGroq(apiKey: string, userPrompt: string) {
  const response = await fetch(GROQ_CHAT_COMPLETIONS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_PROMPT_MODEL,
      messages: [
        {
          role: "system",
          content: PROMPT_ENGINEER_SYSTEM,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      temperature: 0.4,
      max_tokens: 350,
    }),
  });

  const payload = (await response
    .json()
    .catch(() => null)) as GroqCompletionPayload | null;

  if (!response.ok) {
    const providerMessage =
      payload?.error?.message ||
      `Permintaan ke Groq gagal dengan status ${response.status}.`;

    if (response.status === 401 || response.status === 403) {
      throw new ExternalApiError(
        response.status,
        "GROQ_API_KEY tidak valid atau tidak memiliki akses.",
      );
    }

    throw new ExternalApiError(502, providerMessage);
  }

  const enhancedPrompt = payload?.choices?.[0]?.message?.content?.trim();
  if (!enhancedPrompt) {
    throw new ExternalApiError(502, "Groq tidak mengembalikan prompt gambar.");
  }

  return enhancedPrompt;
}

async function createImageWithHuggingFace(
  apiKey: string,
  enhancedPrompt: string,
  modelUrl: string,
) {
  const response = await fetch(modelUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      inputs: enhancedPrompt,
    }),
  });

  if (!response.ok) {
    const payload = (await response
      .json()
      .catch(() => null)) as HuggingFaceErrorPayload | null;

    if (response.status === 401 || response.status === 403) {
      throw new ExternalApiError(
        response.status,
        "HF_API_KEY tidak valid atau tidak memiliki akses ke model inference.",
      );
    }

    if (response.status === 503) {
      const waitHint = payload?.estimated_time
        ? ` Coba lagi dalam sekitar ${Math.ceil(payload.estimated_time)} detik.`
        : " Coba lagi dalam beberapa saat.";
      throw new ExternalApiError(
        503,
        "Model gambar Hugging Face sedang memuat." + waitHint,
      );
    }

    const providerMessage =
      payload?.error ||
      `Permintaan ke Hugging Face gagal dengan status ${response.status}.`;
    throw new ExternalApiError(502, providerMessage);
  }

  const contentType = response.headers.get("content-type") || "image/jpeg";
  if (!contentType.startsWith("image/")) {
    throw new ExternalApiError(
      502,
      "Respons Hugging Face bukan data gambar yang valid.",
    );
  }

  const imageBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(imageBuffer).toString("base64");
  return `data:${contentType};base64,${base64}`;
}

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    let body: ImageRequestBody;
    try {
      body = (await request.json()) as ImageRequestBody;
    } catch {
      return NextResponse.json(
        { error: "Body JSON tidak valid." },
        { status: 400 },
      );
    }

    const prompt = body?.prompt?.trim();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt gambar tidak boleh kosong." },
        { status: 400 },
      );
    }

    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      return NextResponse.json(
        {
          error:
            "GROQ_API_KEY belum diset. Tambahkan environment variable pada .env.local atau Vercel.",
        },
        { status: 500 },
      );
    }

    const huggingFaceApiKey = process.env.HF_API_KEY;
    if (!huggingFaceApiKey) {
      return NextResponse.json(
        {
          error:
            "HF_API_KEY belum diset. Tambahkan environment variable pada .env.local atau Vercel.",
        },
        { status: 500 },
      );
    }

    const huggingFaceModelUrl =
      process.env.HF_IMAGE_URL?.trim() || DEFAULT_HF_IMAGE_URL;

    const enhancedPrompt = await enhancePromptWithGroq(groqApiKey, prompt);
    const base64Image = await createImageWithHuggingFace(
      huggingFaceApiKey,
      enhancedPrompt,
      huggingFaceModelUrl,
    );

    return NextResponse.json({ reply: base64Image });
  } catch (error) {
    const message = toUserFriendlyError(error);
    const status = error instanceof ExternalApiError ? error.status : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
