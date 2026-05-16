"use client";

import { useCallback, useRef, useState } from "react";
import type { AnalysisResult, NotaItem, ProductInfo } from "./api/analyze-image/route";

// ── Types ──────────────────────────────────────────────────────────────────

type AnalysisType = "nota" | "produk" | "umum";

type AnalyzeResponse = {
  success: boolean;
  imageUrl: string;
  analysis: AnalysisResult;
  error?: string;
};

type UploadState = "idle" | "uploading" | "done" | "error";

// ── Sub-components ─────────────────────────────────────────────────────────

function NotaResultView({ items, rawText }: { items?: NotaItem[]; rawText?: string }) {
  const total = items?.reduce((sum, item) => sum + (item.subtotal ?? 0), 0) ?? 0;

  return (
    <div className="space-y-3">
      {items && items.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#9d5b49] mb-2">
            Daftar Item
          </p>
          <div className="rounded-xl overflow-hidden border border-[#e3bcb0]">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[#fff0e4] text-[#5c342d]">
                  <th className="text-left px-3 py-2 font-semibold">Nama Item</th>
                  <th className="text-center px-3 py-2 font-semibold">Qty</th>
                  <th className="text-right px-3 py-2 font-semibold">Harga Satuan</th>
                  <th className="text-right px-3 py-2 font-semibold">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr
                    key={idx}
                    className="border-t border-[#f0d5cb] bg-white/60 hover:bg-[#fff8f4] transition-colors"
                  >
                    <td className="px-3 py-2 text-[#2e1917] font-medium">{item.nama}</td>
                    <td className="px-3 py-2 text-center text-[#5c342d]">
                      {item.qty ?? "-"}
                    </td>
                    <td className="px-3 py-2 text-right text-[#5c342d]">
                      {item.harga_satuan != null
                        ? `Rp${item.harga_satuan.toLocaleString("id-ID")}`
                        : "-"}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold text-[#2e1917]">
                      {item.subtotal != null
                        ? `Rp${item.subtotal.toLocaleString("id-ID")}`
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
              {total > 0 && (
                <tfoot>
                  <tr className="bg-[#fff0e4] border-t-2 border-[#d6a698]">
                    <td
                      colSpan={3}
                      className="px-3 py-2 text-right font-bold text-[#5c342d] text-xs"
                    >
                      Total
                    </td>
                    <td className="px-3 py-2 text-right font-bold text-[#be5d3d]">
                      Rp{total.toLocaleString("id-ID")}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {rawText && (
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#9d5b49] mb-2">
            Teks Terbaca
          </p>
          <pre className="text-xs text-[#4a2b28] bg-white/70 border border-[#e3bcb0] rounded-xl p-3 whitespace-pre-wrap font-mono leading-relaxed">
            {rawText}
          </pre>
        </div>
      )}
    </div>
  );
}

function ProductResultView({ productInfo }: { productInfo: ProductInfo }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-white/70 border border-[#e3bcb0] p-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#9d5b49] mb-1">
            Nama Produk
          </p>
          <p className="text-sm font-semibold text-[#2e1917]">
            {productInfo.nama_produk}
          </p>
        </div>
        <div className="rounded-xl bg-white/70 border border-[#e3bcb0] p-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#9d5b49] mb-1">
            Kategori
          </p>
          <p className="text-sm font-semibold text-[#2e1917]">
            {productInfo.kategori}
          </p>
        </div>
      </div>

      <div className="rounded-xl bg-white/70 border border-[#e3bcb0] p-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#9d5b49] mb-1">
          Deskripsi Produk
        </p>
        <p className="text-sm text-[#3a1f1a] leading-relaxed">
          {productInfo.deskripsi}
        </p>
      </div>

      <div className="rounded-xl bg-[#fff6ef] border border-[#e3bcb0] p-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#9d5b49] mb-1">
          Estimasi Harga Jual
        </p>
        <p className="text-base font-bold text-[#be5d3d]">
          {productInfo.estimasi_harga}
        </p>
      </div>

      {productInfo.saran_marketing.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#9d5b49] mb-2">
            Saran Marketing
          </p>
          <ul className="space-y-2">
            {productInfo.saran_marketing.map((saran, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2 rounded-xl bg-white/70 border border-[#e3bcb0] p-3 text-sm text-[#3a1f1a]"
              >
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gradient-to-br from-[#be5d3d] to-[#d57852] text-white text-[10px] font-bold flex items-center justify-center mt-0.5">
                  {idx + 1}
                </span>
                <span className="leading-relaxed">{saran}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function GeneralResultView({ rawText }: { rawText?: string }) {
  return rawText ? (
    <div>
      <p className="text-xs font-bold uppercase tracking-widest text-[#9d5b49] mb-2">
        Teks Terbaca
      </p>
      <pre className="text-xs text-[#4a2b28] bg-white/70 border border-[#e3bcb0] rounded-xl p-3 whitespace-pre-wrap font-mono leading-relaxed">
        {rawText}
      </pre>
    </div>
  ) : null;
}

function AnalysisResultCard({
  imageUrl,
  analysis,
}: {
  imageUrl: string;
  analysis: AnalysisResult;
}) {
  const typeLabel: Record<AnalysisResult["type"], string> = {
    nota: "Nota / Struk",
    produk: "Foto Produk",
    umum: "Analisis Umum",
  };

  const typeIcon: Record<AnalysisResult["type"], string> = {
    nota: "🧾",
    produk: "📦",
    umum: "🔍",
  };

  return (
    <div className="tool-card reveal space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-xl">{typeIcon[analysis.type]}</span>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#9d5b49]">
            Hasil Analisis AI
          </p>
          <p className="text-sm font-bold text-[#2e1917]">
            {typeLabel[analysis.type]}
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="rounded-xl bg-gradient-to-br from-[#fff6ef] to-[#ffeee0] border border-[#e3bcb0] p-3">
        <p className="text-xs font-bold uppercase tracking-widest text-[#9d5b49] mb-1">
          Ringkasan
        </p>
        <p className="text-sm text-[#3a1f1a] leading-relaxed">{analysis.summary}</p>
      </div>

      {/* Uploaded image preview */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-[#9d5b49] mb-2">
          Gambar Terunggah
        </p>
        <a href={imageUrl} target="_blank" rel="noopener noreferrer">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt="Gambar yang dianalisis"
            className="rounded-xl border border-[#e3bcb0] max-h-48 object-contain w-full bg-white/60 hover:opacity-90 transition-opacity cursor-zoom-in"
          />
        </a>
      </div>

      {/* Type-specific result */}
      {analysis.type === "nota" && (
        <NotaResultView items={analysis.items} rawText={analysis.rawText} />
      )}
      {analysis.type === "produk" && analysis.productInfo && (
        <ProductResultView productInfo={analysis.productInfo} />
      )}
      {analysis.type === "umum" && (
        <GeneralResultView rawText={analysis.rawText} />
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export function ImageAnalyzer() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analysisType, setAnalysisType] = useState<AnalysisType>("produk");
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) {
      setErrorMessage("Format tidak didukung. Gunakan JPG, PNG, atau WebP.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage("Ukuran file terlalu besar. Maksimal 10 MB.");
      return;
    }

    setSelectedFile(file);
    setErrorMessage(null);
    setResult(null);
    setUploadState("idle");

    const reader = new FileReader();
    reader.onload = (e) => setPreviewUrl(e.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleReset = useCallback(() => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setResult(null);
    setErrorMessage(null);
    setUploadState("idle");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!selectedFile) return;

    setUploadState("uploading");
    setErrorMessage(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("analysisType", analysisType);

      const response = await fetch("/api/analyze-image", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as AnalyzeResponse;

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? "Analisis gagal. Coba lagi.");
      }

      setResult(data);
      setUploadState("done");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Terjadi kesalahan tidak terduga.";
      setErrorMessage(msg);
      setUploadState("error");
    }
  }, [selectedFile, analysisType]);

  const analysisTypeOptions: Array<{ value: AnalysisType; label: string; desc: string; icon: string }> = [
    { value: "produk", label: "Foto Produk", desc: "Analisis produk & saran marketing", icon: "📦" },
    { value: "nota", label: "Nota / Struk", desc: "Ekstrak data transaksi ke tabel", icon: "🧾" },
    { value: "umum", label: "Analisis Umum", desc: "Analisis bebas untuk gambar apapun", icon: "🔍" },
  ];

  const isLoading = uploadState === "uploading";

  return (
    <div className="space-y-4">
      {/* Analysis Type Selector */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-[#9d5b49] mb-2">
          Jenis Analisis
        </p>
        <div className="grid grid-cols-3 gap-2">
          {analysisTypeOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setAnalysisType(opt.value)}
              className={[
                "rounded-xl border p-2.5 text-left transition-all duration-200",
                analysisType === opt.value
                  ? "border-[#be5d3d] bg-gradient-to-br from-[#fff0e4] to-[#ffe5d0] shadow-sm"
                  : "border-[#e3bcb0] bg-white/60 hover:border-[#ca907d] hover:bg-[#fff8f4]",
              ].join(" ")}
            >
              <span className="text-lg block mb-1">{opt.icon}</span>
              <p className="text-xs font-bold text-[#2e1917] leading-tight">{opt.label}</p>
              <p className="text-[10px] text-[#7c5046] mt-0.5 leading-tight">{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !selectedFile && fileInputRef.current?.click()}
        className={[
          "relative rounded-2xl border-2 border-dashed transition-all duration-200 overflow-hidden",
          selectedFile ? "cursor-default" : "cursor-pointer",
          isDragging
            ? "border-[#be5d3d] bg-[#fff0e4] scale-[1.01]"
            : selectedFile
            ? "border-[#d6a698] bg-white/60"
            : "border-[#d6b3a8] bg-white/40 hover:border-[#be5d3d] hover:bg-[#fff8f4]",
        ].join(" ")}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={handleInputChange}
          disabled={isLoading}
        />

        {previewUrl ? (
          /* Preview */
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Preview gambar"
              className="w-full max-h-64 object-contain bg-white/50"
            />
            {/* Overlay info */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/40 to-transparent p-3">
              <p className="text-white text-xs font-medium truncate">
                {selectedFile?.name}
              </p>
              <p className="text-white/70 text-[10px]">
                {selectedFile ? (selectedFile.size / 1024).toFixed(0) : 0} KB
              </p>
            </div>
            {/* Change button */}
            {!isLoading && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="absolute top-2 right-2 rounded-full bg-black/40 hover:bg-black/60 text-white text-xs px-2.5 py-1 transition-colors"
              >
                Ganti
              </button>
            )}
          </div>
        ) : (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#f8d4c7] to-[#e4a896] flex items-center justify-center mb-3 shadow-sm">
              <svg
                className="w-7 h-7 text-[#9a4224]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth="1.8"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <p className="text-sm font-semibold text-[#3a1f1a] mb-1">
              {isDragging ? "Lepaskan gambar di sini" : "Unggah Gambar"}
            </p>
            <p className="text-xs text-[#7c5046]">
              Drag & drop atau klik untuk memilih
            </p>
            <p className="text-[10px] text-[#9d7a74] mt-1">
              JPG, PNG, WebP · Maks 10 MB
            </p>
          </div>
        )}
      </div>

      {/* Error message */}
      {errorMessage && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700 flex items-start gap-2">
          <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Action buttons */}
      {selectedFile && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={isLoading}
            className="flex-1 ui-btn ui-btn-primary ui-btn-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <svg
                  className="w-4 h-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Menganalisis...
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
                Analisis dengan AI
              </>
            )}
          </button>
          {!isLoading && (
            <button
              type="button"
              onClick={handleReset}
              className="ui-btn ui-btn-soft px-3"
              title="Hapus gambar"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div className="tool-card space-y-3 animate-pulse">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#f0d5cb]" />
            <div className="space-y-1.5 flex-1">
              <div className="h-2.5 bg-[#f0d5cb] rounded-full w-24" />
              <div className="h-2 bg-[#f0d5cb] rounded-full w-16" />
            </div>
          </div>
          <div className="h-16 bg-[#f0d5cb] rounded-xl" />
          <div className="space-y-2">
            <div className="h-3 bg-[#f0d5cb] rounded-full w-full" />
            <div className="h-3 bg-[#f0d5cb] rounded-full w-4/5" />
            <div className="h-3 bg-[#f0d5cb] rounded-full w-3/5" />
          </div>
          <p className="text-center text-xs text-[#9d7a74] pt-1">
            Mengunggah ke Cloudinary & menganalisis dengan Gemini AI...
          </p>
        </div>
      )}

      {/* Result */}
      {result && !isLoading && (
        <AnalysisResultCard imageUrl={result.imageUrl} analysis={result.analysis} />
      )}
    </div>
  );
}
