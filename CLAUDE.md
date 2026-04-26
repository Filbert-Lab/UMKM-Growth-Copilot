
# Instruksi Claude Code untuk UMKM Growth Copilot

File ini menyediakan panduan komprehensif bagi Claude Code (`claude.ai/code`) dan asisten AI lainnya saat bekerja dalam repositori  **UMKM Growth Copilot** .

## 📌 Gambaran Umum Proyek

UMKM Growth Copilot adalah aplikasi asisten AI berbasis web yang dirancang khusus untuk membantu Usaha Mikro, Kecil, dan Menengah (UMKM) Indonesia. Fitur utamanya mencakup konsultasi bisnis, pembuatan SOP ( *Standard Operating Procedure* ),  *copywriting* , dan pembuatan poster ( *Image Generation* ). Proyek ini dikembangkan oleh **Tim Codex** (Nachelle, Ryu, Filbert, Zakky) menggunakan pendekatan  *Agile Mindset* .

## 🏗️ Arsitektur & Direktori

Proyek ini adalah aplikasi *Fullstack* yang dibangun menggunakan App Router dari Next.js.

```
umkm-growth-copilot/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── chat/route.ts            # Core Backend: Logika Groq API & SOP Builder
│   │   │   └── generate-image/route.ts  # Image Generation via Hugging Face
│   │   ├── layout.tsx                   # Root layout Next.js
│   │   ├── page.tsx                     # Core Frontend: UI Chatbox & State useChat
│   │   ├── advanced-tools.tsx           # Komponen UI untuk fitur spesifik (SEO, Marketing)
│   │   └── globals.css                  # Konfigurasi Tailwind & Utility classes
├── public/                              # Aset statis (SVG, Ikon)
├── .env.example                         # Template variabel lingkungan (Wajib dijaga sinkronisasinya)
├── AGENTS.md                            # Panduan persona AI untuk system prompt
└── CLAUDE.md                            # Panduan asisten koding (File ini)
```

## 🛠️ Pengembangan & Perintah (Development Commands)

### Manajemen Dependensi & Menjalankan Server

* `npm install`: Menginstal semua dependensi proyek.
* `npm run dev`: Menjalankan server pengembangan lokal (tersedia di `http://localhost:3000`).

### Code Quality (Kualitas Kode)

* `npm run lint`: Menjalankan ESLint untuk memeriksa masalah pada kode.
* `npm run build`: Membangun aplikasi untuk produksi (wajib dijalankan sebelum *push* ke Vercel CI/CD untuk memastikan tidak ada *error* tipe data).

## 🧠 Aturan Koding Khusus Proyek (Coding Standards)

### 1. Framework & UI (Frontend - `page.tsx`, `advanced-tools.tsx`)

* **Next.js App Router:** Gunakan App Router (`src/app`). Komponen secara *default* adalah  *Server Components* , gunakan direktif `"use client"` HANYA pada komponen yang membutuhkan *state* interaktif (misal: `useChat`).
* **Tailwind CSS:** Wajib menggunakan kelas utilitas Tailwind untuk  *styling* . Prioritaskan desain *Mobile-First* yang responsif (gunakan prefix `sm:`, `md:`). Hindari penulisan CSS mentah di `globals.css` jika bisa diselesaikan dengan Tailwind.
* **Vercel AI SDK:** Gunakan hook `useChat` dari `@ai-sdk/react` untuk mengelola *state* percakapan (input, pesan, status  *loading* ).

### 2. Integrasi API & Backend (Backend - `api/chat/route.ts`)

* **REST API vs SDK:** Backend komunikasi AI menggunakan pemanggilan REST API secara manual (`fetch`) ke Groq API (`https://api.groq.com/openai/v1/chat/completions`). **JANGAN** mengubah logika ini kembali menggunakan Vercel AI Core SDK kecuali diinstruksikan.
* **Text Normalization:** Aplikasi UMKM membutuhkan antarmuka yang bersih. Selalu terapkan fungsi `normalizeReplyStyle()` untuk menghapus format Markdown tingkat lanjut (seperti `**`, tabel, atau *heading* bertingkat) sebelum mengirim respons ke  *client* .
* **SOP Builder Logic:** Fungsi `isSopRequest()` dan logika `buildComplaintSopReply()` adalah inti bisnis aplikasi ini. Berhati-hatilah saat mengedit bagian ini agar template SOP yang mengandung PIC dan SLA tidak terhapus.

### 3. Penanganan Error (Error Handling)

* Terapkan strategi *graceful degradation* saat berhadapan dengan limitasi API (HTTP 429).
* Gunakan kelas `GroqApiError` dan fungsi `toUserFriendlyError()` untuk memastikan *user* (pedagang UMKM) menerima pesan kesalahan yang sopan dalam Bahasa Indonesia (misal: "Kuota sedang penuh, coba lagi dalam X detik"), BUKAN pesan JSON mentah.
* Selalu periksa `FALLBACK_MODELS` jika `GROQ_MODEL` utama gagal.
