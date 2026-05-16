<div align="center">
  <h1>🚀 UMKM Growth Copilot AI</h1>
  <p><em>Platform AI cerdas berbasis web untuk membantu pelaku UMKM Indonesia mengambil keputusan bisnis yang lebih cepat, terukur, dan berdampak nyata pada omzet.</em></p>
  
  [![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
  [![Groq API](https://img.shields.io/badge/Groq_API-Llama_4_Scout-f55036?logo=groq)](https://groq.com/)
  [![Gemini API](https://img.shields.io/badge/Gemini_API-2.5_Flash-4285F4?logo=google)](https://aistudio.google.com/)
  [![Cloudinary](https://img.shields.io/badge/Cloudinary-Image_Upload-3448C5?logo=cloudinary)](https://cloudinary.com/)
  [![Hugging Face](https://img.shields.io/badge/Hugging_Face-FLUX.1-ffcc00?logo=huggingface)](https://huggingface.co/)
  [![Deployed on Vercel](https://img.shields.io/badge/Deployed_on-Vercel-black?logo=vercel)](https://umkm-growth-copilot.vercel.app/)
</div>

---

## 📑 Daftar Isi
- [Ringkasan Eksekutif](#-ringkasan-eksekutif)
- [Tautan Utama](#-tautan-utama)
- [Pemenuhan Instruksi Dosen](#-pemenuhan-instruksi-dosen)
- [Ide Project AI](#-ide-project-ai)
- [Arsitektur Sistem](#-arsitektur-sistem)
- [Konfigurasi AI (Sidebar)](#-konfigurasi-ai-sidebar)
- [Daftar Fitur (25 Fitur)](#-daftar-fitur-penting-25-fitur)
- [Timeline Penyelesaian](#-timeline-penyelesaian)
- [Teknologi & Instalasi Lokal](#-teknologi--cara-menjalankan-lokal)
- [Skenario Demo](#-skenario-demo-untuk-dosen)
- [Data Kelompok](#-data-kelompok)

---

## 🌟 Ringkasan Eksekutif

**UMKM Growth Copilot AI** adalah asisten bisnis cerdas komprehensif yang menggabungkan konsultasi AI *realtime* dengan alat bantu bisnis analitik (toolkit) dan kemampuan analisis gambar berbasis AI Vision.

**Tujuan Utama:**
1. 💡 Memberikan **dampak nyata** bagi UMKM melalui rekomendasi yang langsung dapat dieksekusi.
2. 🛠️ Menyediakan AI *tool* fungsional dengan **minimal 20 fitur aktif** (Selesai: 25 fitur).
3. 💰 Menunjukkan **potensi monetisasi** sebagai produk digital (SaaS) yang layak jual.

---

## 🔗 Tautan Utama

- 🌐 **Demo Vercel**: [Coba Aplikasi Langsung](https://umkm-growth-copilot.vercel.app/)
- 💻 **Repository GitHub**: [Filbert-Lab/UMKM-Growth-Copilot](https://github.com/Filbert-Lab/UMKM-Growth-Copilot.git)
- 🎓 **Kelas**: IF-C Sore
- ⏰ **Deadline**: 13 April 2026, 23:59 WIB

---

## 🎯 Pemenuhan Instruksi Dosen (Poin 1-6)

| No | Instruksi Dosen | Status | Referensi Bagian |
|:---|:---|:---:|:---|
| 1 | Menjelaskan ide project AI | ✅ Terpenuhi | [Ide Project AI](#-ide-project-ai) |
| 2 | Menjelaskan minimal 20 fitur penting | ✅ **25 Fitur** | [Daftar Fitur](#-daftar-fitur-penting-25-fitur) |
| 3 | Menjelaskan timeline masing-masing fitur | ✅ 25 Timeline | [Timeline](#-timeline-penyelesaian) |
| 4 | Project dibuat di GitHub + invite dosen | ✅ Terpenuhi | (Invite manual ke dosen) |
| 5 | Menyertakan link GitHub + detail fitur | ✅ Terpenuhi | [Tautan Utama](#-tautan-utama) |
| 6 | Submit cukup oleh perwakilan kelompok | ✅ Terpenuhi | Diwakilkan kelompok |

> **Administrasi Submit:**
> - Repositori telah tersedia di GitHub.
> - Invite GitHub dosen (`kelvin.chen996@gmail.com`) telah dilakukan secara manual.
> - Submit E-learning dilakukan oleh satu perwakilan kelompok sesuai instruksi.

---

## 🧠 Ide Project AI

### 🚨 Latar Belakang Masalah
Banyak UMKM **tidak memiliki akses konsultasi bisnis** yang cepat dan terjangkau. Akibatnya, keputusan pemasaran, operasional, dan pengelolaan arus kas seringkali tidak berbasis data yang akurat.

### 💡 Solusi Yang Dibangun
**UMKM Growth Copilot AI** hadir untuk memecahkan masalah tersebut dengan:
- Konsultasi bisnis interaktif secara *real-time*.
- *Persona* AI dan gaya bahasa yang bisa disesuaikan dan **benar-benar mengubah perilaku AI**.
- Toolkit interaktif premium (Generator Gambar, Analisis BEP, Cashflow Alert).
- Voice-to-text berbasis Whisper AI untuk input suara yang akurat.
- **Analisis gambar AI Vision** — unggah foto produk atau nota struk, AI mengekstrak data dan memberikan insight bisnis secara otomatis.

### 🌍 Dampak Sosial
- Membantu UMKM untuk "naik kelas".
- Mengurangi *trial and error* (kerugian biaya promosi).
- Meningkatkan daya saing dan literasi finansial.

### 💳 Potensi Monetisasi
Aplikasi ini memiliki arsitektur yang siap dikembangkan menjadi SaaS:
- *Subscription* bulanan (Freemium ke Pro).
- Paket khusus (White-label) untuk inkubator bisnis dan instansi.
- Kombinasi *AI Tools* dengan sesi *1-on-1 Mentoring*.

---

## 🏗️ Arsitektur Sistem

1. **Frontend:** Framework **Next.js 16 (App Router)** dengan antarmuka UI/UX Premium (Glassmorphism & Micro-animations), dioptimalkan untuk mobile.
2. **Backend:** Next.js API Routes (`/api/chat`, `/api/generate-image`, `/api/transcribe`, `/api/analyze-image`).
3. **AI Engine:**
   - **Groq API (Llama 3.1 / Llama 3.3):** Pemrosesan NLP, konsultasi chat, & Prompt Engineering adaptif.
   - **Groq API (Llama 4 Scout Vision):** Analisis gambar — membaca foto produk & nota struk, mengekstrak data ke format terstruktur.
   - **Groq Whisper (whisper-large-v3):** Transkripsi suara ke teks dengan domain prompt UMKM.
   - **Hugging Face (FLUX.1):** Generasi visual/gambar produk berkecepatan tinggi.
   - **Google Gemini (gemini-2.5-flash):** Analisis dokumen bisnis — membaca PDF, DOCX, dan TXT, mengekstrak ringkasan, poin penting, insight bisnis, dan langkah aksi.
4. **Image Storage:** **Cloudinary** — penyimpanan gambar cloud untuk pipeline analisis AI Vision.
5. **Data Storage:** Persistensi lokal klien (`localStorage`).
6. **Deployment:** Vercel Global Edge Network.

---

## ⚙️ Konfigurasi AI (Sidebar)

Setiap pengaturan di sidebar **benar-benar mengubah perilaku AI** melalui system prompt yang dinamis:

| Pengaturan | Efek Nyata pada AI |
|:---|:---|
| **Persona AI** | Mengubah sudut pandang dan fokus keahlian AI. *Konsultan Pertumbuhan* → selalu sertakan metrik target. *Spesialis Marketing* → berikan contoh caption/hook konkret. *Mentor Operasional* → berikan checklist/SOP siap tempel. *Advisor Keuangan* → sertakan angka dan rumus sederhana. |
| **Gaya Jawaban** | Mengubah gaya penulisan secara menyeluruh. *Aplikatif & Profesional* → lugas, satu aksi per paragraf. *Santai & Memotivasi* → pakai "Kak", "yuk", sisipkan motivasi. *Data-driven & Tegas* → wajib angka/persentase, hindari kata ambigu. *Formal Investor* → bahasa laporan bisnis, gunakan istilah ROI/CAC/LTV. |
| **Skala Bisnis** | Menyesuaikan kompleksitas dan biaya solusi. *Mikro* → solusi gratis/murah, WhatsApp & IG organik. *Kecil* → boleh pakai tools berbayar & tim kecil. *Menengah* → CRM, ERP, multi-channel, ekspansi. |
| **Sektor Usaha** | Menyuntikkan konteks industri ke setiap jawaban (contoh: "kuliner" → AI otomatis menyebut HPP bahan baku, food cost, dll). |
| **Panjang Respon** | *Ringkas* → maks 130 kata, langsung ke inti. *Sedang* → 220-350 kata. *Panjang* → 380-600 kata dengan penjabaran taktis. |
| **Kreativitas** | Mengontrol `temperature` Groq API (0.0 = deterministik/konsisten, 1.0 = kreatif/beragam). |

---

## ⚙️ Daftar Fitur Penting (25 Fitur)

> **Status:** Seluruh **25 fitur** telah berhasil diimplementasikan 100%.

| Kategori | No | Fitur | Deskripsi | Status |
|:---|:---|:---|:---|:---:|
| **Core Chat** | 1 | AI Chat Realtime | Konsultasi bisnis kilat (Groq API) | ✅ |
| | 2 | Persona AI | Pilihan ahli: Growth, Marketing, Ops, Finance — mengubah fokus & gaya AI | ✅ |
| | 3 | Tone Control | Pengaturan gaya bicara AI (4 mode berbeda) | ✅ |
| | 4 | Business Scale Context | Konteks skala bisnis (Mikro/Kecil/Menengah) — menyesuaikan kompleksitas solusi | ✅ |
| | 5 | Sector Context | Fokus sektor usaha — AI otomatis pakai istilah industri yang relevan | ✅ |
| | 6 | Response Length Control | Mode penjelasan Ringkas, Sedang, atau Panjang | ✅ |
| | 7 | Temperature Slider | Pengatur tingkat kreativitas respons AI (0.0–1.0) | ✅ |
| | 8 | Voice to Text (Whisper AI) | Input suara dengan transkripsi akurat berbasis domain UMKM | ✅ |
| **Productivity** | 9 | Prompt Template Library | Kumpulan template siap pakai premium | ✅ |
| | 10 | Local Chat History | Riwayat chat tersimpan tanpa database server | ✅ |
| | 11 | Export to Markdown | Ekspor sesi ke file `*.md` rapi | ✅ |
| | 12 | Copy Latest Answer | Menyalin instruksi dengan sekali klik | ✅ |
| | 13 | Session Stats | Menghitung token dan estimasi biaya pesan | ✅ |
| | 14 | Keyboard Shortcuts | Navigasi cepat (Enter kirim, Shift+Enter baris baru) | ✅ |
| | 15 | Error Handling UX | Pesan error ramah pengguna | ✅ |
| **Advanced Tools** | 16 | KPI Generator | Alat perumus Indikator Kinerja | ✅ |
| | 17 | Campaign Planner | Perencanaan kalender promosi | ✅ |
| | 18 | Break-Even Analyzer | Simulasi kalkulator BEP & Margin | ✅ |
| | 19 | Cashflow Alert | Analisis runway dan risiko keuangan | ✅ |
| | 20 | Bundling Recommender | Strategi menaikkan *Average Order Value* | ✅ |
| | 21 | Persona Builder | Membuat target pelanggan spesifik | ✅ |
| | 22 | Content Calendar AI | Pembuat kalender konten media sosial otomatis | ✅ |
| | 23 | Loan Readiness Score | Kalkulator skor kelayakan pendanaan bank | ✅ |
| | 24 | Team Workspace | Catatan strategi kolaborasi tim | ✅ |
| **AI Vision** | 25 | Analisis Gambar AI | Unggah foto produk atau nota struk — Groq Vision (Llama 4 Scout) mengekstrak data & memberikan insight bisnis otomatis | ✅ |
| **AI Dokumen** | 26 | Analisis Dokumen AI | Unggah PDF, DOCX, atau TXT — Gemini 2.5 Flash merangkum isi dokumen, mengekstrak poin penting, insight bisnis, dan langkah aksi | ✅ |

*Catatan: Modul Advanced Tools (No. 16-24) memiliki antarmuka khusus (glassmorphism UI) yang dapat menyuntikkan (inject) kalkulasinya langsung ke AI Chat. Fitur Analisis Gambar (No. 25) tersedia di tab "Analisis Gambar" pada panel Tools. Fitur Analisis Dokumen (No. 26) tersedia di tab "Analisis Dokumen" pada panel Tools.*

---

## 📅 Timeline Penyelesaian

Seluruh fitur telah diselesaikan tepat waktu sebelum *deadline* 13 April 2026.

<details>
<summary>👉 Klik untuk melihat detail timeline per fitur</summary>

| Fitur | Tanggal Selesai |
|---|---|
| AI Chat Realtime & Base Contexts (Fitur 1-5) | 06 Apr 2026 |
| Advanced Controls & Voice Input (Fitur 6-8) | 07 Apr 2026 |
| Productivity Features (Fitur 9-14) | 08 Apr 2026 |
| Error Handling & Basic Tools (Fitur 15-19) | 09 Apr 2026 |
| Advanced Tools & UI Refinements (Fitur 20-24) | 10 Apr 2026 |
| Analisis Gambar AI Vision (Fitur 25) | 17 Mei 2026 |
| Analisis Dokumen AI — Gemini (Fitur 26) | 17 Mei 2026 |

</details>

---

## 💻 Teknologi & Cara Menjalankan Lokal

Pastikan Anda memiliki [Node.js](https://nodejs.org/) terinstal di sistem Anda.

1. **Clone repository:**
   ```bash
   git clone https://github.com/Filbert-Lab/UMKM-Growth-Copilot.git
   cd UMKM-Growth-Copilot
   ```

2. **Install dependency:**
   ```bash
   npm install
   ```

3. **Atur Environment Variables:**
   Buat file `.env.local` di root folder berdasarkan `.env.example`:
   ```env
   # Groq AI — chat, vision, dan whisper (satu API key untuk semua)
   GROQ_API_KEY=KUNCI_API_GROQ_ANDA
   GROQ_MODEL=llama-3.1-8b-instant
   GROQ_WHISPER_MODEL=whisper-large-v3
   WHISPER_LANGUAGE=id

   # Hugging Face — generasi gambar promosi
   HF_API_KEY=KUNCI_HUGGING_FACE_ANDA
   HF_IMAGE_URL=https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell

   # Cloudinary — penyimpanan gambar untuk fitur Analisis Gambar AI
   CLOUDINARY_CLOUD_NAME=NAMA_CLOUD_ANDA
   CLOUDINARY_API_KEY=API_KEY_CLOUDINARY_ANDA
   CLOUDINARY_API_SECRET=API_SECRET_CLOUDINARY_ANDA

   # Google Gemini — analisis dokumen PDF/DOCX/TXT
   GEMINI_API_KEY=KUNCI_API_GEMINI_ANDA
   ```
   > ⚠️ Jangan pernah melakukan commit pada file `.env.local`

4. **Jalankan Server:**
   ```bash
   npm run dev
   ```
   Aplikasi bisa diakses di `http://localhost:3000`.

---

## 🔑 Environment Variables untuk Vercel

Tambahkan semua variabel berikut di **Vercel → Project → Settings → Environment Variables**:

| Variable | Keterangan |
|:---|:---|
| `GROQ_API_KEY` | API key Groq — dipakai untuk chat, vision, dan whisper |
| `GROQ_MODEL` | Model chat, contoh: `llama-3.1-8b-instant` |
| `GROQ_WHISPER_MODEL` | Model transkripsi suara: `whisper-large-v3` |
| `WHISPER_LANGUAGE` | Bahasa transkripsi: `id` |
| `HF_API_KEY` | API key Hugging Face untuk generasi gambar |
| `HF_IMAGE_URL` | URL endpoint model FLUX.1 di Hugging Face |
| `CLOUDINARY_CLOUD_NAME` | Nama cloud Cloudinary |
| `CLOUDINARY_API_KEY` | API key Cloudinary |
| `CLOUDINARY_API_SECRET` | API secret Cloudinary |
| `GEMINI_API_KEY` | API key Google Gemini — dipakai untuk analisis dokumen PDF/DOCX/TXT |

> **Catatan:** Model Gemini yang digunakan adalah `gemini-2.5-flash` (sudah di-hardcode di backend). Model vision untuk Analisis Gambar (`meta-llama/llama-4-scout-17b-16e-instruct`) juga sudah di-hardcode — tidak perlu env var tambahan selain yang tercantum di atas.

---

## 🎬 Skenario Demo Untuk Dosen

**Demo Konfigurasi AI (membuktikan setting benar-benar berpengaruh):**
1. Buka sidebar kiri, set **Persona** ke *"Mentor Operasional Toko"* dan **Gaya Jawaban** ke *"Data-driven dan tegas"*.
2. Ketik: *"Strategi naikkan omzet 20% dalam 30 hari untuk usaha kuliner."*
3. Perhatikan jawaban: ada angka/persentase konkret, format tegas, fokus operasional.
4. Ganti **Persona** ke *"Spesialis Marketing Digital"* dan **Gaya** ke *"Santai dan memotivasi"*, kirim pertanyaan yang sama.
5. Bandingkan: jawaban berubah total — ada contoh caption, pakai kata "Kak/yuk", tone berbeda.

**Demo Voice Input:**
1. Klik tombol mic di input chat.
2. Ucapkan: *"Buatkan SOP untuk kasir toko kuliner saya"*.
3. Teks muncul otomatis di kolom chat, siap dikirim.

**Demo Generator Gambar:**
1. Klik mode **Gambar** di header.
2. Ketik: *"Foto produk kopi susu estetik untuk Instagram"*.
3. Lihat gambar AI yang dihasilkan.

**Demo Analisis Dokumen AI (Fitur Baru — Gemini):**
1. Klik **Tools** di header kanan, buka tab **Analisis Dokumen**.
2. Upload file PDF, DOCX, atau TXT (contoh: proposal bisnis, laporan keuangan, SOP, kontrak).
3. Klik **Analisis dengan Gemini AI** — Gemini 2.5 Flash akan:
   - Membuat **ringkasan** dokumen dalam 2-3 kalimat.
   - Mengekstrak **poin penting** dari isi dokumen.
   - Memberikan **insight bisnis** yang relevan untuk UMKM.
   - Menyusun **langkah aksi** konkret berdasarkan konten dokumen.
4. Hasil tampil dalam UI terstruktur dengan kartu per kategori.

**Demo Analisis Gambar AI Vision (Fitur Baru):**
1. Klik **Tools** di header kanan, buka tab **Analisis Gambar**.
2. Pilih jenis analisis: **Foto Produk**, **Nota/Struk**, atau **Analisis Umum**.
3. Unggah foto produk UMKM atau foto nota belanja.
4. Klik **Analisis dengan AI** — Groq Vision (Llama 4 Scout) akan:
   - Untuk foto produk: mengidentifikasi nama, kategori, estimasi harga, dan 3 saran marketing.
   - Untuk nota struk: mengekstrak semua item, qty, harga satuan, subtotal, dan total ke tabel.
5. Hasil tampil dalam UI terstruktur, bukan teks mentah.

**Demo Advanced Tools:**
1. Klik **Tools** di header kanan, buka tab *Alat Analitik*.
2. Isi kalkulator **Break-Even Analyzer**, lalu klik **"Kirim ke Chat"**.
3. AI langsung menganalisis data BEP tersebut dalam konteks bisnis pengguna.

---

## 👥 Data Kelompok

**Kelompok 7 (Codex)**

| NIM | Nama Mahasiswa |
|:---:|:---|
| `241110460` | **Filbert Matthew** |
| `241110371` | **Zakky Pratama** |
| `241112002` | **Ryu Kierando** |
| `241112498` | **Nachelle Ferari** |

---
<div align="center">
  <p>Dibuat dengan ❤️ untuk UMKM Indonesia.</p>
</div>
