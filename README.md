# UMKM Growth Copilot AI

Platform AI berbasis web untuk membantu pelaku UMKM Indonesia mengambil keputusan bisnis yang lebih cepat, terukur, dan berpotensi meningkatkan omzet.

## Ringkasan Eksekutif

UMKM Growth Copilot AI adalah asisten bisnis cerdas yang menggabungkan konsultasi AI realtime dengan alat bantu bisnis praktis seperti KPI generator, campaign planner, analisis break-even, cashflow alert, bundling calculator, sampai loan readiness score.

Tujuan utama project ini:

1. Memberikan dampak nyata bagi pelaku UMKM melalui rekomendasi yang dapat langsung dieksekusi.
2. Menyediakan AI tool yang fungsional dengan minimal 20 fitur aktif.
3. Menunjukkan potensi monetisasi sebagai produk digital berbasis SaaS.

## Tautan Utama

1. Repository GitHub: https://github.com/Filbert-Lab/UMKM-Growth-Copilot.git
2. Demo Vercel: https://umkm-growth-copilot.vercel.app/
3. Kelas: IF-C Sore
4. Deadline tugas: 13 April 2026 23:59 WIB

## Pemenuhan Instruksi Dosen (Poin 1-6)

| No  | Instruksi Dosen                                  | Status                                         | Bukti di README                   |
| --- | ------------------------------------------------ | ---------------------------------------------- | --------------------------------- |
| 1   | Menjelaskan ide project AI                       | Terpenuhi                                      | Bagian Ide Project AI             |
| 2   | Menjelaskan minimal 20 fitur penting             | Terpenuhi (24 fitur)                           | Bagian Daftar Fitur Penting       |
| 3   | Menjelaskan timeline masing-masing fitur         | Terpenuhi (24 timeline)                        | Bagian Timeline Penyelesaian      |
| 4   | Project dibuat di GitHub + invite dosen          | Terpenuhi sebagian (repo sudah, invite manual) | Bagian Administrasi Submit        |
| 5   | Menyertakan link GitHub + detail fitur di README | Terpenuhi                                      | Bagian Tautan Utama + tabel fitur |
| 6   | Submit cukup oleh perwakilan kelompok            | Terpenuhi                                      | Bagian Administrasi Submit        |

## Administrasi Submit

1. Repository sudah tersedia di GitHub.
2. Invite dosen dilakukan manual oleh perwakilan kelompok ke email: kelvin.chen996@gmail.com.
3. Submit tugas dilakukan oleh satu perwakilan kelompok sesuai instruksi.

## Ide Project AI

### Latar Belakang Masalah

Banyak UMKM tidak memiliki akses konsultasi bisnis yang cepat dan terjangkau. Akibatnya, keputusan pemasaran, operasional, dan keuangan sering tidak berbasis data atau strategi yang jelas.

### Solusi Yang Dibangun

UMKM Growth Copilot AI menyediakan:

1. AI chat konsultasi bisnis realtime.
2. Personalisasi berdasarkan persona, tone, skala bisnis, dan sektor usaha.
3. Toolkit praktis untuk analisis bisnis sehari-hari yang langsung dapat dipakai.

### Dampak Nyata ke Masyarakat

1. Membantu UMKM naik kelas melalui keputusan yang lebih terarah.
2. Mengurangi trial and error yang mahal dalam promosi dan operasional.
3. Meningkatkan daya saing bisnis lokal dan peluang kerja.
4. Mendorong literasi bisnis berbasis data untuk pelaku usaha kecil-menengah.

### Potensi Benefit dan Monetisasi

1. Model berlangganan bulanan (SaaS).
2. Paket Pro untuk fitur laporan dan automasi lanjutan.
3. White-label untuk komunitas, inkubator bisnis, dan instansi.
4. Kombinasi AI tool + konsultasi mentor premium.

## Arsitektur Singkat Sistem

1. Frontend: Next.js App Router (interface konsultasi dan business tools).
2. Backend: API route Next.js di endpoint /api/chat.
3. AI Provider: Groq API (OpenAI-compatible chat completions).
4. Storage lokal: localStorage untuk riwayat chat, preferensi, dan workspace insight tim.
5. Deployment: Vercel.

Alur penggunaan:

1. Pengguna memilih persona, tone, bahasa, skala bisnis, dan sektor.
2. Pengguna mengirim prompt ke endpoint /api/chat.
3. Sistem mengirim konteks ke model Groq dan menerima jawaban.
4. Jawaban ditampilkan, dapat disalin, diekspor, serta dilanjutkan dengan tools lanjutan.

## Daftar Fitur Penting (24 Fitur)

Status saat ini: 24 fitur sudah terimplementasi dan dapat digunakan.

| No  | Fitur                        | Deskripsi                                               | Status  |
| --- | ---------------------------- | ------------------------------------------------------- | ------- |
| 1   | AI Chat Realtime             | Konsultasi bisnis langsung dengan Groq API              | Selesai |
| 2   | Persona AI                   | Pilihan persona growth, marketing, operasional, finance | Selesai |
| 3   | Tone Control                 | Kontrol gaya jawaban AI sesuai kebutuhan                | Selesai |
| 4   | Multi Language Output        | Output Bahasa Indonesia dan English                     | Selesai |
| 5   | Response Length Control      | Mode jawaban ringkas, sedang, panjang                   | Selesai |
| 6   | Temperature Slider           | Kontrol kreativitas model                               | Selesai |
| 7   | Business Scale Context       | Konteks skala mikro, kecil, menengah                    | Selesai |
| 8   | Sector Context               | Konteks sektor usaha agar jawaban relevan               | Selesai |
| 9   | Prompt Template Library      | Template prompt siap pakai                              | Selesai |
| 10  | Local Chat History           | Riwayat konsultasi tersimpan lokal                      | Selesai |
| 11  | Export to Markdown           | Ekspor hasil konsultasi ke file markdown                | Selesai |
| 12  | Copy Latest Answer           | Menyalin jawaban AI terbaru dengan cepat                | Selesai |
| 13  | Session Stats                | Statistik pesan dan estimasi token                      | Selesai |
| 14  | Keyboard Shortcut            | Ctrl/Cmd + Enter untuk kirim cepat                      | Selesai |
| 15  | Error Handling UX            | Pesan error jelas dan informatif                        | Selesai |
| 16  | KPI Generator                | Rekomendasi KPI otomatis per strategi                   | Selesai |
| 17  | Campaign Planner             | Perencanaan campaign mingguan/berjangka                 | Selesai |
| 18  | Break-Even Analyzer          | Simulasi BEP, margin, contribution                      | Selesai |
| 19  | Cashflow Alert               | Peringatan risiko arus kas dan runway                   | Selesai |
| 20  | Product Bundling Recommender | Simulasi bundling untuk menaikkan AOV                   | Selesai |
| 21  | Customer Persona Builder     | Penyusunan persona pelanggan terarah                    | Selesai |
| 22  | Content Calendar AI          | Kalender konten lintas platform                         | Selesai |
| 23  | Loan Readiness Score         | Skor kesiapan UMKM untuk pendanaan                      | Selesai |
| 24  | Team Collaboration Workspace | Catatan insight tim + tracking status                   | Selesai |

## Timeline Penyelesaian Masing-Masing Fitur

Semua fitur selesai sebelum deadline 13 April 2026 23:59 WIB.

| No  | Fitur                        | Tanggal Selesai |
| --- | ---------------------------- | --------------- |
| 1   | AI Chat Realtime             | 06 Apr 2026     |
| 2   | Persona AI                   | 06 Apr 2026     |
| 3   | Tone Control                 | 06 Apr 2026     |
| 4   | Multi Language Output        | 06 Apr 2026     |
| 5   | Response Length Control      | 07 Apr 2026     |
| 6   | Temperature Slider           | 07 Apr 2026     |
| 7   | Business Scale Context       | 07 Apr 2026     |
| 8   | Sector Context               | 07 Apr 2026     |
| 9   | Prompt Template Library      | 08 Apr 2026     |
| 10  | Local Chat History           | 08 Apr 2026     |
| 11  | Export to Markdown           | 08 Apr 2026     |
| 12  | Copy Latest Answer           | 08 Apr 2026     |
| 13  | Session Stats                | 08 Apr 2026     |
| 14  | Keyboard Shortcut            | 08 Apr 2026     |
| 15  | Error Handling UX            | 09 Apr 2026     |
| 16  | KPI Generator                | 09 Apr 2026     |
| 17  | Campaign Planner             | 09 Apr 2026     |
| 18  | Break-Even Analyzer          | 09 Apr 2026     |
| 19  | Cashflow Alert               | 09 Apr 2026     |
| 20  | Product Bundling Recommender | 10 Apr 2026     |
| 21  | Customer Persona Builder     | 10 Apr 2026     |
| 22  | Content Calendar AI          | 10 Apr 2026     |
| 23  | Loan Readiness Score         | 10 Apr 2026     |
| 24  | Team Collaboration Workspace | 10 Apr 2026     |

## Penjelasan Fitur Secara Menyeluruh (Kategori)

### A. Core AI Consultation

1. AI Chat Realtime
2. Persona AI
3. Tone Control
4. Multi Language Output
5. Response Length Control
6. Temperature Slider
7. Business Scale Context
8. Sector Context

Tujuan kategori ini: menghasilkan jawaban AI yang relevan dengan kondisi bisnis pengguna, bukan jawaban generik.

### B. Productivity and Session Management

1. Prompt Template Library
2. Local Chat History
3. Export to Markdown
4. Copy Latest Answer
5. Session Stats
6. Keyboard Shortcut
7. Error Handling UX

Tujuan kategori ini: mempercepat alur kerja konsultasi harian dan memudahkan dokumentasi hasil konsultasi.

### C. Advanced Business Toolkit

1. KPI Generator
2. Campaign Planner
3. Break-Even Analyzer
4. Cashflow Alert
5. Product Bundling Recommender
6. Customer Persona Builder
7. Content Calendar AI
8. Loan Readiness Score
9. Team Collaboration Workspace

Tujuan kategori ini: memberikan alat bantu langsung untuk pengambilan keputusan bisnis, bukan hanya chat.

## Teknologi Yang Dipakai

1. Next.js 16 + TypeScript
2. Tailwind CSS v4 + custom CSS
3. Groq API chat completions
4. Vercel (hosting/deployment)
5. localStorage (persistensi data sisi klien)

## Struktur Project Inti

1. src/app/page.tsx: halaman utama UI konsultasi.
2. src/app/advanced-tools.tsx: modul fitur lanjutan (fitur 16-24).
3. src/app/api/chat/route.ts: API route untuk integrasi Groq.
4. src/app/globals.css: style global dan interaksi UI.
5. .env.example: contoh konfigurasi environment.

## Cara Menjalankan Project Secara Lokal

1. Clone repository.
2. Install dependency:

```bash
npm install
```

3. Siapkan environment variable:

```bash
GROQ_API_KEY=YOUR_GROQ_API_KEY
GROQ_MODEL=llama-3.1-8b-instant
```

4. Jalankan development server:

```bash
npm run dev
```

5. Buka http://localhost:3000.

## Panduan Deploy Ke Vercel

1. Import repository GitHub ke Vercel.
2. Tambahkan Environment Variables berikut:
   - GROQ_API_KEY
   - GROQ_MODEL=llama-3.1-8b-instant
3. Jalankan redeploy.

## Skenario Demo Untuk Dosen

1. Pilih persona "Mentor Operasional Toko".
2. Pilih tone "Data-driven dan tegas".
3. Isi sektor usaha, contoh: Kuliner.
4. Kirim prompt: "Buat strategi naikkan omzet 20% dalam 30 hari".
5. Tunjukkan hasil AI, lalu klik Copy dan Export Markdown.
6. Buka modul Advanced Tools, coba Break-Even dan Cashflow.
7. Klik "Kirim ke Chat" dari KPI/Campaign Planner untuk melihat integrasi tool -> AI.
8. Tambahkan 1 insight pada Team Collaboration Workspace.

## Checklist Uji Fungsional Singkat

1. Chat bisa kirim dan menerima respon.
2. Persona dan tone memengaruhi kualitas jawaban.
3. Bahasa output bisa ID/EN.
4. Response length berubah sesuai pilihan.
5. Riwayat chat tersimpan setelah refresh.
6. Tombol copy dan export berfungsi.
7. Semua advanced tools menampilkan hasil perhitungan/logika.
8. Insight tim tersimpan lokal.

## Data Kelompok

Nama Kelompok: Kelompok 7

| NIM       | Nama            |
| --------- | --------------- |
| 241110460 | Filbert Matthew |
| 241110371 | Zakky Pratama   |
| 241112002 | Ryu Kierando    |
| 241112498 | Nachelle Ferari |

## Penutup

Project UMKM Growth Copilot AI dirancang untuk memenuhi seluruh poin tugas dengan pendekatan produk nyata: fungsional, berdampak, dan memiliki arah monetisasi. Dokumentasi ini disusun agar dosen dapat menilai dengan cepat dari sisi ide, implementasi fitur, timeline, dan kesiapan deploy.
