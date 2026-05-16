// app/components/InvoiceUploader.tsx
"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import { processInvoice, type InvoiceData } from "../actions/processInvoice";

// ── Types ──────────────────────────────────────────────────────────────────

type UploadState = "idle" | "processing" | "done" | "error";

// ── Helpers ────────────────────────────────────────────────────────────────

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the data URL prefix: "data:image/jpeg;base64,..."
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ── Sub-components ─────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="tool-card animate-pulse space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#f0d5cb]" />
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-[#f0d5cb] rounded-full w-40" />
          <div className="h-2.5 bg-[#f0d5cb] rounded-full w-24" />
        </div>
      </div>
      <div className="h-14 bg-[#f0d5cb] rounded-xl" />
      <div className="space-y-2">
        {[100, 85, 90, 70].map((w, i) => (
          <div key={i} className="h-3 bg-[#f0d5cb] rounded-full" style={{ width: `${w}%` }} />
        ))}
      </div>
      <p className="text-center text-xs text-[#9d7a74] pt-1">
        Mengunggah & mengekstrak data nota dengan Gemini AI...
      </p>
    </div>
  );
}

function InvoiceResultCard({
  data,
  imageUrl,
  onReset,
}: {
  data: InvoiceData;
  imageUrl: string;
  onReset: () => void;
}) {
  const calculatedTotal = data.daftar_item.reduce((sum, item) => sum + item.total_harga, 0);

  return (
    <div className="tool-card reveal space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#f8d4c7] to-[#e4a896] flex items-center justify-center flex-shrink-0 shadow-sm">
            <span className="text-xl">🧾</span>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#9d5b49]">
              Hasil Digitalisasi Nota
            </p>
            <p className="text-base font-bold text-[#2e1917] leading-tight mt-0.5">
              {data.nama_toko}
            </p>
            <p className="text-xs text-[#7c5046] mt-0.5">{data.tanggal_transaksi || "Tanggal tidak tersedia"}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="flex-shrink-0 ui-btn ui-btn-soft text-xs"
          title="Scan nota baru"
        >
          Scan Baru
        </button>
      </div>

      {/* Image preview */}
      <a href={imageUrl} target="_blank" rel="noopener noreferrer" className="block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt="Nota yang dianalisis"
          className="w-full max-h-48 object-contain rounded-xl border border-[#e3bcb0] bg-white/60 hover:opacity-90 transition-opacity cursor-zoom-in"
        />
      </a>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-gradient-to-br from-[#fff6ef] to-[#ffeee0] border border-[#e3bcb0] p-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#9d5b49] mb-1">
            Total Pembayaran
          </p>
          <p className="text-lg font-bold text-[#be5d3d] leading-tight">
            {formatRupiah(data.total_pembayaran)}
          </p>
        </div>
        <div className="rounded-xl bg-white/70 border border-[#e3bcb0] p-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#9d5b49] mb-1">
            Jumlah Item
          </p>
          <p className="text-lg font-bold text-[#2e1917] leading-tight">
            {data.daftar_item.length}{" "}
            <span className="text-sm font-normal text-[#7c5046]">item</span>
          </p>
        </div>
      </div>

      {/* Items table */}
      {data.daftar_item.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#9d5b49] mb-2">
            Daftar Item
          </p>
          <div className="rounded-xl overflow-hidden border border-[#e3bcb0]">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[#fff0e4] text-[#5c342d]">
                  <th className="text-left px-3 py-2 font-semibold">Nama Barang</th>
                  <th className="text-center px-2 py-2 font-semibold">Qty</th>
                  <th className="text-right px-2 py-2 font-semibold">Harga Satuan</th>
                  <th className="text-right px-3 py-2 font-semibold">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {data.daftar_item.map((item, idx) => (
                  <tr
                    key={idx}
                    className="border-t border-[#f0d5cb] bg-white/60 hover:bg-[#fff8f4] transition-colors"
                  >
                    <td className="px-3 py-2 text-[#2e1917] font-medium leading-tight">
                      {item.nama_barang}
                    </td>
                    <td className="px-2 py-2 text-center text-[#5c342d]">{item.jumlah}</td>
                    <td className="px-2 py-2 text-right text-[#5c342d]">
                      {formatRupiah(item.harga_satuan)}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold text-[#2e1917]">
                      {formatRupiah(item.total_harga)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-[#fff0e4] border-t-2 border-[#d6a698]">
                  <td colSpan={3} className="px-3 py-2 text-right font-bold text-[#5c342d] text-xs">
                    Total
                  </td>
                  <td className="px-3 py-2 text-right font-bold text-[#be5d3d]">
                    {formatRupiah(calculatedTotal)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          {Math.abs(calculatedTotal - data.total_pembayaran) > 1 && (
            <p className="mt-1.5 text-[10px] text-[#9d7a74] text-right">
              * Total dari AI: {formatRupiah(data.total_pembayaran)} · Total kalkulasi: {formatRupiah(calculatedTotal)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export function InvoiceUploader() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [result, setResult] = useState<{ data: InvoiceData; imageUrl: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isPending, startTransition] = useTransition();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const isLoading = uploadState === "processing" || isPending;

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

  const handleDragLeave = useCallback(() => setIsDragging(false), []);

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

  const handleProcess = useCallback(async () => {
    if (!selectedFile) return;

    setUploadState("processing");
    setErrorMessage(null);
    setResult(null);

    try {
      const base64 = await fileToBase64(selectedFile);

      startTransition(async () => {
        const response = await processInvoice(base64, selectedFile.type);

        if (!response.success) {
          setErrorMessage(response.error);
          setUploadState("error");
          return;
        }

        setResult({ data: response.data, imageUrl: response.imageUrl });
        setUploadState("done");
      });
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Terjadi kesalahan tidak terduga.");
      setUploadState("error");
    }
  }, [selectedFile]);

  // Show result card
  if (result && uploadState === "done") {
    return (
      <InvoiceResultCard
        data={result.data}
        imageUrl={result.imageUrl}
        onReset={handleReset}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Info banner */}
      <div className="rounded-xl border border-[#d8c4bc] bg-[#fff8f4] px-3 py-2.5 text-xs text-[#5c342d] flex items-start gap-2">
        <span className="text-base flex-shrink-0">🧾</span>
        <span>
          Upload foto nota atau struk belanja — <strong>Gemini AI</strong> akan
          mengekstrak nama toko, tanggal, dan semua item secara otomatis untuk pembukuan.
        </span>
      </div>

      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !selectedFile && !isLoading && fileInputRef.current?.click()}
        className={[
          "relative rounded-2xl border-2 border-dashed transition-all duration-200 overflow-hidden",
          isLoading ? "cursor-wait" : selectedFile ? "cursor-default" : "cursor-pointer",
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
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Preview nota"
              className="w-full max-h-72 object-contain bg-white/50"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/40 to-transparent p-3">
              <p className="text-white text-xs font-medium truncate">{selectedFile?.name}</p>
              <p className="text-white/70 text-[10px]">
                {selectedFile ? (selectedFile.size / 1024).toFixed(0) : 0} KB
              </p>
            </div>
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
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#f8d4c7] to-[#e4a896] flex items-center justify-center mb-3 shadow-sm">
              <svg
                className="w-8 h-8 text-[#9a4224]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth="1.6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <p className="text-sm font-semibold text-[#3a1f1a] mb-1">
              {isDragging ? "Lepaskan nota di sini" : "Upload Foto Nota"}
            </p>
            <p className="text-xs text-[#7c5046]">Drag & drop atau klik untuk memilih</p>
            <p className="text-[10px] text-[#9d7a74] mt-1">JPG, PNG, WebP · Maks 10 MB</p>
          </div>
        )}
      </div>

      {/* Error */}
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
      {selectedFile && !isLoading && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleProcess}
            className="flex-1 ui-btn ui-btn-primary ui-btn-lg flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Digitalisasi dengan Gemini AI
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="ui-btn ui-btn-soft px-3"
            title="Hapus"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && <LoadingSkeleton />}
    </div>
  );
}
