# UMKM Growth Copilot AI

Project AI untuk membantu UMKM mengambil keputusan bisnis lebih cepat, lebih terstruktur, dan lebih menguntungkan menggunakan Gemini API.

## 1) Ide Project

UMKM Growth Copilot AI adalah AI Tool berbasis web yang berfungsi sebagai asisten bisnis untuk pelaku usaha mikro, kecil, dan menengah. Tool ini membantu analisis kondisi usaha, rekomendasi langkah praktis, strategi marketing, efisiensi operasional, dan kesiapan pendanaan.

### Manfaat untuk Masyarakat

- Meningkatkan daya saing UMKM lokal.
- Membantu pemilik usaha non-teknis membuat keputusan berbasis data.
- Menurunkan trial-and-error biaya promosi dan operasional.
- Mendorong pertumbuhan ekonomi lokal lewat peningkatan omzet UMKM.

### Potensi Monetisasi

- Berlangganan bulanan per UMKM (SaaS).
- Paket Pro untuk fitur lanjutan (forecasting, OCR nota, evaluasi cabang).
- White-label untuk dinas koperasi, inkubator bisnis, dan lembaga pendamping UMKM.
- Konsultasi premium berbasis AI + human expert.

## 2) Minimal 20 Fitur Penting

Status saat ini: MVP telah tersedia dan siap deploy. Daftar berikut berisi fitur MVP + roadmap lanjutan.

| No  | Fitur                        | Deskripsi Singkat                                        | Status  |
| --- | ---------------------------- | -------------------------------------------------------- | ------- |
| 1   | AI Chat Realtime             | Konsultasi bisnis langsung dengan Gemini API             | Selesai |
| 2   | Persona AI                   | Pilihan persona: growth, marketing, operasional, finance | Selesai |
| 3   | Tone Control                 | Atur gaya jawaban AI sesuai kebutuhan                    | Selesai |
| 4   | Multi Language Output        | Output Bahasa Indonesia/English                          | Selesai |
| 5   | Response Length Control      | Output ringkas/sedang/panjang                            | Selesai |
| 6   | Temperature Slider           | Atur kreativitas model                                   | Selesai |
| 7   | Business Scale Context       | Konteks mikro/kecil/menengah                             | Selesai |
| 8   | Sector Context               | Input sektor usaha untuk jawaban lebih relevan           | Selesai |
| 9   | Prompt Template Library      | Template prompt siap pakai                               | Selesai |
| 10  | Local Chat History           | Riwayat chat otomatis tersimpan lokal                    | Selesai |
| 11  | Export to Markdown           | Hasil konsultasi dapat diunduh                           | Selesai |
| 12  | Copy Latest Answer           | Salin jawaban AI instan                                  | Selesai |
| 13  | Session Stats                | Statistik jumlah pesan dan estimasi token                | Selesai |
| 14  | Keyboard Shortcut            | Ctrl/Cmd + Enter untuk kirim cepat                       | Selesai |
| 15  | Error Handling UX            | Pesan error jelas ketika API bermasalah                  | Selesai |
| 16  | KPI Generator                | Rekomendasi KPI otomatis per strategi                    | Roadmap |
| 17  | Campaign Planner             | Rencana campaign mingguan otomatis                       | Roadmap |
| 18  | Break-Even Analyzer          | Simulasi BEP dan margin usaha                            | Roadmap |
| 19  | Cashflow Alert               | Alert risiko cashflow negatif                            | Roadmap |
| 20  | Product Bundling Recommender | Saran bundling produk untuk naikkan AOV                  | Roadmap |
| 21  | Customer Persona Builder     | Segmentasi pelanggan berdasarkan perilaku                | Roadmap |
| 22  | Content Calendar AI          | Kalender konten 30 hari lintas platform                  | Roadmap |
| 23  | Loan Readiness Score         | Skor kelayakan UMKM untuk pembiayaan                     | Roadmap |
| 24  | Team Collaboration Workspace | Berbagi insight AI ke tim internal                       | Roadmap |

## 3) Timeline Penyelesaian Setiap Fitur

| No  | Fitur                        | Target Selesai |
| --- | ---------------------------- | -------------- |
| 1   | AI Chat Realtime             | 10 Apr 2026    |
| 2   | Persona AI                   | 10 Apr 2026    |
| 3   | Tone Control                 | 10 Apr 2026    |
| 4   | Multi Language Output        | 10 Apr 2026    |
| 5   | Response Length Control      | 10 Apr 2026    |
| 6   | Temperature Slider           | 10 Apr 2026    |
| 7   | Business Scale Context       | 11 Apr 2026    |
| 8   | Sector Context               | 11 Apr 2026    |
| 9   | Prompt Template Library      | 11 Apr 2026    |
| 10  | Local Chat History           | 11 Apr 2026    |
| 11  | Export to Markdown           | 11 Apr 2026    |
| 12  | Copy Latest Answer           | 11 Apr 2026    |
| 13  | Session Stats                | 11 Apr 2026    |
| 14  | Keyboard Shortcut            | 11 Apr 2026    |
| 15  | Error Handling UX            | 11 Apr 2026    |
| 16  | KPI Generator                | 15 Apr 2026    |
| 17  | Campaign Planner             | 16 Apr 2026    |
| 18  | Break-Even Analyzer          | 17 Apr 2026    |
| 19  | Cashflow Alert               | 18 Apr 2026    |
| 20  | Product Bundling Recommender | 19 Apr 2026    |
| 21  | Customer Persona Builder     | 20 Apr 2026    |
| 22  | Content Calendar AI          | 21 Apr 2026    |
| 23  | Loan Readiness Score         | 22 Apr 2026    |
| 24  | Team Collaboration Workspace | 23 Apr 2026    |

## 4) Teknologi yang Digunakan

- Framework: Next.js 16 + TypeScript
- UI: Tailwind CSS v4
- AI Engine: Google Gemini API (`@google/generative-ai`)
- Deployment: Vercel

## 5) Cara Menjalankan Lokal

1. Install dependencies:

```bash
npm install
```

2. Set environment variable (sudah ada contoh di `.env.example`):

```bash
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
GEMINI_MODEL=gemini-2.5-flash
```

3. Jalankan development server:

```bash
npm run dev
```

4. Buka `http://localhost:3000`.

## 6) Deploy ke Vercel

1. Push project ke GitHub.
2. Login ke Vercel dan Import Project dari repository GitHub.
3. Tambahkan environment variables di Vercel Project Settings:
   - `GEMINI_API_KEY`
   - `GEMINI_MODEL` (opsional, default `gemini-2.5-flash`)
4. Klik Deploy.

### Link Repository

- GitHub: https://github.com/Filbert-Lab/UMKM-Growth-Copilot.git

### Link Deploy

- Vercel: (isi setelah deploy, contoh: https://umkm-growth-copilot.vercel.app)

## 7) Langkah Pengumpulan Sesuai Instruksi Tugas

1. Buat repository GitHub dari project ini.
2. Invite dosen ke repository: `kelvin.chen996@gmail.com`.
3. Pastikan bagian README sudah memuat:
   - ide project,
   - minimal 20 fitur,
   - timeline setiap fitur,
   - link deploy (Vercel).
4. Submit hanya oleh satu perwakilan kelompok.

## 8) Struktur Inti Project

- `src/app/page.tsx`: Halaman utama UI AI tool.
- `src/app/api/chat/route.ts`: API route untuk koneksi ke Gemini.
- `.env.example`: Contoh konfigurasi environment.

## 9) Data Kelompok

- Nama Kelompok: Kelompok 7

| NIM       | Nama            |
| --------- | --------------- |
| 241110460 | Filbert Matthew |
| 241110371 | Zakky Pratama   |
| 241112002 | Ryu Kierando    |
| 241112498 | Nachelle Ferari |

---

Project ini disusun untuk memenuhi kebutuhan tugas AI kelompok dengan orientasi produk nyata, siap dipakai, dan memiliki peluang monetisasi.
