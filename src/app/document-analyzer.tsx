"use client";

import { useCallback, useRef, useState } from "react";
import type { DocumentAnalysisResult } from "./api/analyze-document/route";

// ── Types ──────────────────────────────────────────────────────────────────

type AnalyzeDocumentResponse = {
  success: boolean;
  analysis: DocumentAnalysisResult;
  error?: string;
};

type UploadState = "idle" | "uploading" | "done" | "error";

// ── Helpers ────────────────────────────────────────────────────────────────

const ALLOWED_EXTENSIONS: Record<string, string> = {
  "application/pdf": "PDF",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
  "text/plain": "TXT",
};

function getFileIcon(fileType: DocumentAnalysisResult["fileType"]) {
  switch (fileType) {
    case "pdf":
      return "📄";
    case "docx":
      return "📝";
    case "txt":
      return "📃";
    default:
      return "📁";
  }
}

function formatWordCount(count: number) {
  if (count >= 1000) {
    return `~${(count / 1000).toFixed(1)}k kata`;
  }
  return `~${count} kata`;
}

// ── Sub-components ─────────────────────────────────────────────────────────

function SectionCard({
  icon,
  title,
  items,
  accent = false,
}: {
  icon: string;
  title: string;
  items: string[];
  accent?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-xl border p-3 space-y-2",
        accent
          ? "border-[#be5d3d]/40 bg-gradient-to-br from-[#fff6ef] to-[#ffeee0]"
          : "border-[#e3bcb0] bg-white/70",
      ].join(" ")}
    >
      <p className="text-xs font-bold uppercase tracking-widest text-[#9d5b49] flex items-center gap-1.5">
        <span>{icon}</span>
        {title}
      </p>
      <ul className="space-y-1.5">
        {items.map((item, idx) => (
          <li key={idx} className="flex items-start gap-2 text-sm text-[#3a1f1a]">
            <span className="flex-shrink-0 w-4 h-4 rounded-full bg-gradient-to-br from-[#be5d3d] to-[#d57852] text-white text-[9px] font-bold flex items-center justify-center mt-0.5">
              {idx + 1}
            </span>
            <span className="leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AnalysisResultCard({ analysis }: { analysis: DocumentAnalysisResult }) {
  return (
    <div className="tool-card reveal space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0">{getFileIcon(analysis.fileType)}</span>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#9d5b49]">
            Hasil Analisis Dokumen
          </p>
          <p
            className="text-sm font-bold text-[#2e1917] truncate"
            title={analysis.fileName}
          >
            {analysis.fileName}
          </p>
          <p className="text-[10px] text-[#7c5046] mt-0.5">
            {analysis.fileType.toUpperCase()} · {formatWordCount(analysis.wordCount)}
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="rounded-xl bg-gradient-to-br from-[#fff6ef] to-[#ffeee0] border border-[#e3bcb0] p-3">
        <p className="text-xs font-bold uppercase tracking-widest text-[#9d5b49] mb-1.5">
          📋 Ringkasan
        </p>
        <p className="text-sm text-[#3a1f1a] leading-relaxed">{analysis.summary}</p>
      </div>

      {/* Key Points */}
      {analysis.keyPoints.length > 0 && (
        <SectionCard
          icon="🔑"
          title="Poin Penting"
          items={analysis.keyPoints}
        />
      )}

      {/* Business Insights */}
      {analysis.businessInsights.length > 0 && (
        <SectionCard
          icon="💡"
          title="Insight Bisnis"
          items={analysis.businessInsights}
          accent
        />
      )}

      {/* Action Items */}
      {analysis.actionItems.length > 0 && (
        <SectionCard
          icon="✅"
          title="Langkah Aksi"
          items={analysis.actionItems}
        />
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export function DocumentAnalyzer() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [result, setResult] = useState<DocumentAnalysisResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!ALLOWED_EXTENSIONS[file.type]) {
      setErrorMessage("Format tidak didukung. Gunakan PDF, DOCX, atau TXT.");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setErrorMessage("Ukuran file terlalu besar. Maksimal 20 MB.");
      return;
    }
    if (file.size === 0) {
      setErrorMessage("File kosong. Pastikan dokumen memiliki konten.");
      return;
    }

    setSelectedFile(file);
    setErrorMessage(null);
    setResult(null);
    setUploadState("idle");
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

      const response = await fetch("/api/analyze-document", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as AnalyzeDocumentResponse;

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? "Analisis gagal. Coba lagi.");
      }

      setResult(data.analysis);
      setUploadState("done");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Terjadi kesalahan tidak terduga.";
      setErrorMessage(msg);
      setUploadState("error");
    }
  }, [selectedFile]);

  const isLoading = uploadState === "uploading";

  const fileLabel = selectedFile
    ? ALLOWED_EXTENSIONS[selectedFile.type] ?? "FILE"
    : null;

  return (
    <div className="space-y-4">
      {/* Info banner */}
      <div className="rounded-xl border border-[#d8c4bc] bg-[#fff8f4] px-3 py-2.5 text-xs text-[#5c342d] flex items-start gap-2">
        <span className="text-base flex-shrink-0">✨</span>
        <span>
          Upload dokumen bisnis (proposal, laporan, kontrak, SOP) dan biarkan{" "}
          <strong>Gemini AI</strong> menganalisis isinya — ringkasan, poin penting,
          insight bisnis, dan langkah aksi.
        </span>
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
          accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
          className="hidden"
          onChange={handleInputChange}
          disabled={isLoading}
        />

        {selectedFile ? (
          /* File selected state */
          <div className="flex items-center gap-3 p-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#f8d4c7] to-[#e4a896] flex items-center justify-center flex-shrink-0 shadow-sm">
              <span className="text-xl">
                {fileLabel === "PDF" ? "📄" : fileLabel === "DOCX" ? "📝" : "📃"}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p
                className="text-sm font-semibold text-[#2e1917] truncate"
                title={selectedFile.name}
              >
                {selectedFile.name}
              </p>
              <p className="text-xs text-[#7c5046] mt-0.5">
                {fileLabel} · {(selectedFile.size / 1024).toFixed(0)} KB
              </p>
            </div>
            {!isLoading && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="flex-shrink-0 rounded-full bg-[#f0d5cb] hover:bg-[#e4b9ab] text-[#7a3a2a] text-xs px-2.5 py-1 transition-colors font-medium"
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <p className="text-sm font-semibold text-[#3a1f1a] mb-1">
              {isDragging ? "Lepaskan dokumen di sini" : "Unggah Dokumen"}
            </p>
            <p className="text-xs text-[#7c5046]">
              Drag & drop atau klik untuk memilih
            </p>
            <p className="text-[10px] text-[#9d7a74] mt-1">
              PDF, DOCX, TXT · Maks 20 MB
            </p>
          </div>
        )}
      </div>

      {/* Error message */}
      {errorMessage && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700 flex items-start gap-2">
          <svg
            className="w-4 h-4 flex-shrink-0 mt-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
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
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
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
                Menganalisis dokumen...
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
                Analisis dengan Gemini AI
              </>
            )}
          </button>
          {!isLoading && (
            <button
              type="button"
              onClick={handleReset}
              className="ui-btn ui-btn-soft px-3"
              title="Hapus dokumen"
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
              <div className="h-2.5 bg-[#f0d5cb] rounded-full w-32" />
              <div className="h-2 bg-[#f0d5cb] rounded-full w-20" />
            </div>
          </div>
          <div className="h-16 bg-[#f0d5cb] rounded-xl" />
          <div className="space-y-2">
            <div className="h-3 bg-[#f0d5cb] rounded-full w-full" />
            <div className="h-3 bg-[#f0d5cb] rounded-full w-5/6" />
            <div className="h-3 bg-[#f0d5cb] rounded-full w-4/6" />
          </div>
          <p className="text-center text-xs text-[#9d7a74] pt-1">
            Dokumen sedang diproses oleh Gemini AI...
          </p>
        </div>
      )}

      {/* Result */}
      {result && !isLoading && <AnalysisResultCard analysis={result} />}
    </div>
  );
}
