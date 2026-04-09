# UMKM Growth Copilot AI

AI tool berbasis web untuk membantu pelaku UMKM mengambil keputusan bisnis secara cepat, terstruktur, dan berdampak pada omzet.

## Tautan Utama

- Repository GitHub: https://github.com/Filbert-Lab/UMKM-Growth-Copilot.git
- Demo Vercel: https://umkm-growth-copilot.vercel.app/
- Kelas: IF-C Sore
- Deadline tugas: 13 April 2026 23:59 WIB

## Checklist Kesesuaian Dengan Instruksi Dosen

| No | Kebutuhan Tugas | Status |
| --- | --- | --- |
| 1 | Menjelaskan ide project AI | Terpenuhi |
| 2 | Menyediakan minimal 20 fitur penting | Terpenuhi (24 fitur) |
| 3 | Menyediakan timeline per fitur | Terpenuhi (24 timeline) |
| 4 | Project dibuat di GitHub | Terpenuhi |
| 5 | Menyertakan link GitHub + detail fitur di README | Terpenuhi |
| 6 | Submit cukup oleh perwakilan kelompok | Siap dilakukan |

Catatan administrasi:
- Invite dosen ke GitHub tetap dilakukan dari akun perwakilan kelompok ke email: kelvin.chen996@gmail.com.

## 1) Ide Project AI

UMKM Growth Copilot AI adalah layanan asisten bisnis cerdas untuk UMKM. Pengguna dapat berkonsultasi tentang pemasaran, operasional, keuangan, dan pertumbuhan usaha. Sistem akan memberikan rekomendasi langkah yang praktis, terukur, dan relevan dengan skala bisnis pengguna.

### Dampak ke Masyarakat

- Membantu UMKM naik kelas dengan akses konsultasi yang lebih terjangkau.
- Menurunkan kesalahan pengambilan keputusan karena keputusan berbasis data dan strategi.
- Meningkatkan daya saing bisnis lokal.
- Mendukung pertumbuhan ekonomi mikro dan lapangan kerja.

### Potensi Monetisasi

- Model berlangganan bulanan (SaaS).
- Paket premium untuk fitur lanjutan dan laporan mendalam.
- Lisensi white-label untuk dinas, inkubator, atau komunitas UMKM.
- Kombinasi AI + konsultasi ahli berbayar.

## 2) Daftar Fitur Penting (24 Fitur)

Status saat ini: MVP sudah berjalan dan bisa digunakan publik melalui Vercel.

| No | Fitur | Deskripsi Singkat | Status |
| --- | --- | --- | --- |
| 1 | AI Chat Realtime | Konsultasi bisnis langsung dengan Gemini API | Selesai |
| 2 | Persona AI | Pilihan persona: growth, marketing, operasional, finance | Selesai |
| 3 | Tone Control | Mengatur gaya komunikasi jawaban AI | Selesai |
| 4 | Multi Language Output | Output Bahasa Indonesia atau English | Selesai |
| 5 | Response Length Control | Mode ringkas, sedang, panjang | Selesai |
| 6 | Temperature Slider | Pengaturan tingkat kreativitas model | Selesai |
| 7 | Business Scale Context | Konteks skala mikro, kecil, menengah | Selesai |
| 8 | Sector Context | Konteks sektor usaha agar output relevan | Selesai |
| 9 | Prompt Template Library | Template prompt siap pakai | Selesai |
| 10 | Local Chat History | Riwayat konsultasi tersimpan lokal | Selesai |
| 11 | Export to Markdown | Hasil konsultasi dapat diunduh | Selesai |
| 12 | Copy Latest Answer | Menyalin jawaban AI terbaru cepat | Selesai |
| 13 | Session Stats | Statistik pesan dan estimasi token | Selesai |
| 14 | Keyboard Shortcut | Ctrl/Cmd + Enter untuk kirim cepat | Selesai |
| 15 | Error Handling UX | Pesan error jelas dan informatif | Selesai |
| 16 | KPI Generator | Rekomendasi KPI otomatis per strategi | Roadmap |
| 17 | Campaign Planner | Planner campaign mingguan otomatis | Roadmap |
| 18 | Break-Even Analyzer | Simulasi BEP dan margin bisnis | Roadmap |
| 19 | Cashflow Alert | Peringatan risiko arus kas | Roadmap |
| 20 | Product Bundling Recommender | Rekomendasi bundling untuk naikkan AOV | Roadmap |
| 21 | Customer Persona Builder | Segmentasi pelanggan berdasarkan perilaku | Roadmap |
| 22 | Content Calendar AI | Kalender konten 30 hari lintas platform | Roadmap |
| 23 | Loan Readiness Score | Skor kesiapan UMKM untuk pendanaan | Roadmap |
| 24 | Team Collaboration Workspace | Kolaborasi insight AI antar tim | Roadmap |

## 3) Timeline Penyelesaian Fitur

| No | Fitur | Target Selesai |
| --- | --- | --- |
| 1 | AI Chat Realtime | 10 Apr 2026 |
| 2 | Persona AI | 10 Apr 2026 |
| 3 | Tone Control | 10 Apr 2026 |
| 4 | Multi Language Output | 10 Apr 2026 |
| 5 | Response Length Control | 10 Apr 2026 |
| 6 | Temperature Slider | 10 Apr 2026 |
| 7 | Business Scale Context | 11 Apr 2026 |
| 8 | Sector Context | 11 Apr 2026 |
| 9 | Prompt Template Library | 11 Apr 2026 |
| 10 | Local Chat History | 11 Apr 2026 |
| 11 | Export to Markdown | 11 Apr 2026 |
| 12 | Copy Latest Answer | 11 Apr 2026 |
| 13 | Session Stats | 11 Apr 2026 |
| 14 | Keyboard Shortcut | 11 Apr 2026 |
| 15 | Error Handling UX | 11 Apr 2026 |
| 16 | KPI Generator | 15 Apr 2026 |
| 17 | Campaign Planner | 16 Apr 2026 |
| 18 | Break-Even Analyzer | 17 Apr 2026 |
| 19 | Cashflow Alert | 18 Apr 2026 |
| 20 | Product Bundling Recommender | 19 Apr 2026 |
| 21 | Customer Persona Builder | 20 Apr 2026 |
| 22 | Content Calendar AI | 21 Apr 2026 |
| 23 | Loan Readiness Score | 22 Apr 2026 |
| 24 | Team Collaboration Workspace | 23 Apr 2026 |

## 4) Teknologi Yang Dipakai

- Frontend dan backend: Next.js 16 + TypeScript
- Styling: Tailwind CSS v4
- AI engine: Google Gemini API melalui package @google/generative-ai
- Hosting dan deployment: Vercel

## 5) Cara Menjalankan Project (Untuk Semua Orang)

1. Clone repository.
2. Install dependency:

```bash
npm install
```

3. Buat file environment dari contoh file dan isi API key:

```bash
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
GEMINI_MODEL=gemini-2.5-flash
```

4. Jalankan aplikasi:

```bash
npm run dev
```

5. Buka browser ke alamat: http://localhost:3000

## 6) Panduan Deploy Ke Vercel

1. Import repository GitHub ke Vercel.
2. Tambahkan environment variables berikut:
   - GEMINI_API_KEY
   - GEMINI_MODEL (disarankan: gemini-2.5-flash)
3. Deploy.

## 7) Struktur Project Inti

- src/app/page.tsx: Halaman UI utama aplikasi.
- src/app/api/chat/route.ts: Endpoint API untuk komunikasi dengan Gemini.
- .env.example: Contoh konfigurasi environment.

## 8) Data Kelompok

- Nama Kelompok: Kelompok 7

| NIM | Nama |
| --- | --- |
| 241110460 | Filbert Matthew |
| 241110371 | Zakky Pratama |
| 241112002 | Ryu Kierando |
| 241112498 | Nachelle Ferari |

## 9) Pernyataan Penutup

Project ini dirancang untuk memenuhi instruksi tugas AI dengan fokus pada dampak nyata, keberfungsian produk, dan potensi monetisasi.
