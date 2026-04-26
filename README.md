<div align="center">
  <h1>🚀 UMKM Growth Copilot AI</h1>
  <p><em>Platform AI cerdas berbasis web untuk membantu pelaku UMKM Indonesia mengambil keputusan bisnis yang lebih cepat, terukur, dan berdampak nyata pada omzet.</em></p>
  
  [![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
  [![Groq API](https://img.shields.io/badge/Groq_API-Llama_3.1-f55036?logo=groq)](https://groq.com/)
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
- [Daftar Fitur (24 Fitur)](#-daftar-fitur-penting-24-fitur)
- [Timeline Penyelesaian](#-timeline-penyelesaian)
- [Teknologi & Instalasi Lokal](#-teknologi--cara-menjalankan-lokal)
- [Skenario Demo](#-skenario-demo-untuk-dosen)
- [Data Kelompok](#-data-kelompok)

---

## 🌟 Ringkasan Eksekutif

**UMKM Growth Copilot AI** adalah asisten bisnis cerdas komprehensif yang menggabungkan konsultasi AI *realtime* dengan alat bantu bisnis analitik (toolkit).

**Tujuan Utama:**
1. 💡 Memberikan **dampak nyata** bagi UMKM melalui rekomendasi yang langsung dapat dieksekusi.
2. 🛠️ Menyediakan AI *tool* fungsional dengan **minimal 20 fitur aktif** (Selesai: 24 fitur).
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
| 2 | Menjelaskan minimal 20 fitur penting | ✅ **24 Fitur** | [Daftar Fitur](#-daftar-fitur-penting-24-fitur) |
| 3 | Menjelaskan timeline masing-masing fitur | ✅ 24 Timeline | [Timeline](#-timeline-penyelesaian) |
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
- *Persona* AI dan gaya bahasa yang bisa disesuaikan (Custom Tone & Context).
- Toolkit interaktif premium (Generator Gambar, Analisis BEP, Cashflow Alert).

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

1. **Frontend:** Framework **Next.js 16 (App Router)** dengan antarmuka UI/UX Premium (Glassmorphism & Micro-animations).
2. **Backend:** Next.js API Routes (`/api/chat` dan `/api/generate-image`).
3. **AI Engine:**
   - **Groq API (Llama 3.1):** Pemrosesan NLP, konsultasi chat, & Prompt Engineering.
   - **Hugging Face (FLUX.1):** Generasi visual/gambar produk berkecepatan tinggi.
4. **Data Storage:** Persistensi lokal klien (`localStorage`).
5. **Deployment:** Vercel Global Edge Network.

---

## ⚙️ Daftar Fitur Penting (24 Fitur)

> **Status:** Seluruh **24 fitur** telah berhasil diimplementasikan 100%.

| Kategori | No | Fitur | Deskripsi | Status |
|:---|:---|:---|:---|:---:|
| **Core Chat** | 1 | AI Chat Realtime | Konsultasi bisnis kilat (Groq API) | ✅ |
| | 2 | Persona AI | Pilihan ahli: Growth, Marketing, Ops, Finance | ✅ |
| | 3 | Tone Control | Pengaturan gaya bicara AI | ✅ |
| | 4 | Multi Language Output | Output Bilingual (Indonesia / Inggris) | ✅ |
| | 5 | Response Length Control | Mode penjelasan Singkat, Sedang, atau Panjang | ✅ |
| | 6 | Temperature Slider | Pengatur tingkat kreativitas respons AI | ✅ |
| | 7 | Business Scale Context | Konteks skala bisnis (Mikro, Kecil, Menengah) | ✅ |
| | 8 | Sector Context | Fokus sektor usaha (Kuliner, Jasa, Fashion, dll) | ✅ |
| **Productivity** | 9 | Prompt Template Library | Kumpulan template siap pakai premium | ✅ |
| | 10 | Local Chat History | Riwayat chat tersimpan tanpa database server | ✅ |
| | 11 | Export to Markdown | Ekspor sesi ke file `*.md` rapi | ✅ |
| | 12 | Copy Latest Answer | Menyalin instruksi dengan sekali klik | ✅ |
| | 13 | Session Stats | Menghitung token dan estimasi biaya pesan | ✅ |
| | 14 | Keyboard Shortcuts | Navigasi cepat (Ctrl+Enter) | ✅ |
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

*Catatan: Modul Advanced Tools (No. 16-24) memiliki antarmuka khusus (glassmorphism UI) yang dapat menyuntikkan (inject) kalkulasinya langsung ke otak AI.*

---

## 📅 Timeline Penyelesaian

Seluruh fitur telah diselesaikan tepat waktu sebelum *deadline* 13 April 2026.

<details>
<summary>👉 Klik untuk melihat detail timeline per fitur</summary>

| Fitur | Tanggal Selesai |
|---|---|
| AI Chat Realtime & Base Contexts (Fitur 1-4) | 06 Apr 2026 |
| Advanced Controls (Fitur 5-8) | 07 Apr 2026 |
| Productivity Features (Fitur 9-14) | 08 Apr 2026 |
| Error Handling & Basic Tools (Fitur 15-19) | 09 Apr 2026 |
| Advanced Tools & UI Refinements (Fitur 20-24)| 10 Apr 2026 |

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
   Buat file `.env.local` di root folder dan isi dengan key berikut:
   ```env
   GROQ_API_KEY=KUNCI_API_GROQ_ANDA
   GROQ_MODEL=llama-3.1-8b-instant
   HF_API_KEY=KUNCI_HUGGING_FACE_ANDA
   ```
   *(Peringatan: Jangan pernah melakukan commit pada file `.env.local` Anda)*

4. **Jalankan Server:**
   ```bash
   npm run dev
   ```
   Aplikasi bisa diakses di `http://localhost:3000`.

---

## 🎬 Skenario Demo Untuk Dosen

Untuk mendemonstrasikan keandalan aplikasi secara penuh, ikuti langkah berikut:

1. Buka tab **Pengaturan Sidebar** (Kiri).
2. Set Persona ke **"Mentor Operasional Toko"** dan Tone ke **"Data-driven dan tegas"**.
3. Ketik di chat: *"Buat strategi naikkan omzet 20% dalam 30 hari untuk usaha kuliner."*
4. Evaluasi hasil _formatting_ tabel dan _bold text_ dari AI.
5. Klik mode **Gambar**, ketik *"Foto produk kopi estetik"*, dan lihat generasi gambarnya.
6. Buka **Fitur & Tools** (Kanan), coba salah satu kalkulator (misal: Break-Even), lalu tekan **"Kirim ke Chat"** untuk melihat bagaimana alat analitik bekerja terpadu dengan AI Chat.

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
