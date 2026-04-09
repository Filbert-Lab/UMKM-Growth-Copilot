"use client";

import { useEffect, useMemo, useState } from "react";

type Settings = {
  persona: string;
  tone: string;
  language: "id" | "en";
  responseLength: "short" | "medium" | "long";
  temperature: number;
  businessScale: "mikro" | "kecil" | "menengah";
  sector: string;
};

type TeamInsight = {
  id: string;
  author: string;
  title: string;
  note: string;
  status: "todo" | "in-progress" | "done";
  createdAt: string;
};

type AdvancedToolsProps = {
  settings: Settings;
  onInjectPrompt: (text: string) => void;
};

const TEAM_STORAGE_KEY = "umkm-growth-team-workspace";

function numberValue(value: string, fallback: number) {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    return fallback;
  }
  return parsed;
}

function createInsightId() {
  return `insight-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function formatStatus(status: TeamInsight["status"]) {
  switch (status) {
    case "in-progress":
      return "In Progress";
    case "done":
      return "Done";
    case "todo":
    default:
      return "To Do";
  }
}

export function AdvancedTools({
  settings,
  onInjectPrompt,
}: AdvancedToolsProps) {
  const [kpiGoal, setKpiGoal] = useState("Naikkan omzet 20%");
  const [kpiTimeframe, setKpiTimeframe] = useState("30 hari");

  const [campaignBudget, setCampaignBudget] = useState("3500000");
  const [campaignDuration, setCampaignDuration] = useState("14");

  const [fixedCost, setFixedCost] = useState("5000000");
  const [variableCost, setVariableCost] = useState("12000");
  const [sellingPrice, setSellingPrice] = useState("25000");

  const [openingCash, setOpeningCash] = useState("7000000");
  const [cashInflow, setCashInflow] = useState("9000000");
  const [cashOutflow, setCashOutflow] = useState("10500000");

  const [productAName, setProductAName] = useState("Produk A");
  const [productAPrice, setProductAPrice] = useState("22000");
  const [productACost, setProductACost] = useState("11000");
  const [productBName, setProductBName] = useState("Produk B");
  const [productBPrice, setProductBPrice] = useState("18000");
  const [productBCost, setProductBCost] = useState("9000");
  const [bundleDiscount, setBundleDiscount] = useState("10");

  const [personaName, setPersonaName] = useState("Mahasiswa Produktif");
  const [personaAgeRange, setPersonaAgeRange] = useState("19-25");
  const [personaPainPoint, setPersonaPainPoint] = useState(
    "Butuh solusi cepat dengan harga terjangkau",
  );
  const [personaTrigger, setPersonaTrigger] = useState(
    "Promo terbatas dan rekomendasi teman",
  );

  const [contentDays, setContentDays] = useState("30");
  const [platformInstagram, setPlatformInstagram] = useState(true);
  const [platformTiktok, setPlatformTiktok] = useState(true);
  const [platformWhatsapp, setPlatformWhatsapp] = useState(false);

  const [revenueStability, setRevenueStability] = useState(65);
  const [bookkeepingReadiness, setBookkeepingReadiness] = useState(70);
  const [legalReadiness, setLegalReadiness] = useState(55);
  const [collateralStrength, setCollateralStrength] = useState(50);
  const [debtHealth, setDebtHealth] = useState(60);

  const [teamInsights, setTeamInsights] = useState<TeamInsight[]>(() => {
    if (typeof window === "undefined") {
      return [];
    }

    const stored = window.localStorage.getItem(TEAM_STORAGE_KEY);
    if (!stored) {
      return [];
    }

    try {
      const parsed = JSON.parse(stored) as TeamInsight[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [newAuthor, setNewAuthor] = useState("Tim Marketing");
  const [newTitle, setNewTitle] = useState("Insight mingguan");
  const [newNote, setNewNote] = useState("");

  useEffect(() => {
    window.localStorage.setItem(TEAM_STORAGE_KEY, JSON.stringify(teamInsights));
  }, [teamInsights]);

  const breakEven = useMemo(() => {
    const fixed = numberValue(fixedCost, 0);
    const variable = numberValue(variableCost, 0);
    const price = numberValue(sellingPrice, 0);
    const contribution = price - variable;

    if (contribution <= 0 || price <= 0) {
      return {
        valid: false,
        contribution: 0,
        bepUnits: 0,
        marginPct: 0,
      };
    }

    return {
      valid: true,
      contribution,
      bepUnits: Math.ceil(fixed / contribution),
      marginPct: ((price - variable) / price) * 100,
    };
  }, [fixedCost, variableCost, sellingPrice]);

  const cashflow = useMemo(() => {
    const opening = numberValue(openingCash, 0);
    const inflow = numberValue(cashInflow, 0);
    const outflow = numberValue(cashOutflow, 0);
    const net = inflow - outflow;

    if (net >= 0) {
      return {
        net,
        risk: "Aman",
        runwayMonths: Number.POSITIVE_INFINITY,
      };
    }

    const burnRate = Math.abs(net);
    const runwayMonths = burnRate > 0 ? opening / burnRate : 0;
    const risk =
      runwayMonths < 2 ? "Tinggi" : runwayMonths < 4 ? "Sedang" : "Rendah";

    return {
      net,
      risk,
      runwayMonths,
    };
  }, [openingCash, cashInflow, cashOutflow]);

  const bundling = useMemo(() => {
    const aPrice = numberValue(productAPrice, 0);
    const aCost = numberValue(productACost, 0);
    const bPrice = numberValue(productBPrice, 0);
    const bCost = numberValue(productBCost, 0);
    const discount = numberValue(bundleDiscount, 0);

    const normalTotal = aPrice + bPrice;
    const bundlePrice = normalTotal * (1 - discount / 100);
    const bundleCost = aCost + bCost;
    const bundleMarginPct =
      bundlePrice > 0 ? ((bundlePrice - bundleCost) / bundlePrice) * 100 : 0;
    const avgSingleTicket = normalTotal / 2;
    const aovLiftPct =
      avgSingleTicket > 0
        ? ((bundlePrice - avgSingleTicket) / avgSingleTicket) * 100
        : 0;

    return {
      normalTotal,
      bundlePrice,
      bundleCost,
      bundleMarginPct,
      aovLiftPct,
    };
  }, [
    productAPrice,
    productACost,
    productBPrice,
    productBCost,
    bundleDiscount,
  ]);

  const selectedPlatforms = useMemo(() => {
    const platforms: string[] = [];
    if (platformInstagram) {
      platforms.push("Instagram");
    }
    if (platformTiktok) {
      platforms.push("TikTok");
    }
    if (platformWhatsapp) {
      platforms.push("WhatsApp");
    }
    return platforms;
  }, [platformInstagram, platformTiktok, platformWhatsapp]);

  const loanScore = useMemo(() => {
    const weighted =
      revenueStability * 0.25 +
      bookkeepingReadiness * 0.2 +
      legalReadiness * 0.2 +
      collateralStrength * 0.15 +
      debtHealth * 0.2;

    const rounded = Math.round(weighted);
    const level =
      rounded >= 80 ? "Siap" : rounded >= 65 ? "Cukup Siap" : "Perlu Perbaikan";

    return {
      score: rounded,
      level,
    };
  }, [
    revenueStability,
    bookkeepingReadiness,
    legalReadiness,
    collateralStrength,
    debtHealth,
  ]);

  function injectKpiPrompt() {
    onInjectPrompt(
      `Buat KPI dashboard untuk sektor ${settings.sector} skala ${settings.businessScale} dengan target \"${kpiGoal}\" dalam ${kpiTimeframe}. Sertakan metrik leading dan lagging indicator, target angka mingguan, baseline, dan cara tracking sederhana.`,
    );
  }

  function injectCampaignPrompt() {
    onInjectPrompt(
      `Buat campaign planner ${campaignDuration} hari untuk usaha ${settings.sector} skala ${settings.businessScale} dengan budget Rp${numberValue(campaignBudget, 0).toLocaleString("id-ID")}. Susun objective, channel mix, alokasi budget, kalender eksekusi harian, dan KPI.`,
    );
  }

  function injectBundlingPrompt() {
    onInjectPrompt(
      `Buat strategi bundling untuk ${productAName} dan ${productBName}. Harga normal total Rp${Math.round(bundling.normalTotal).toLocaleString("id-ID")}, harga bundling usulan Rp${Math.round(bundling.bundlePrice).toLocaleString("id-ID")}, margin bundling ${bundling.bundleMarginPct.toFixed(1)}%. Beri 3 opsi paket dan argumentasi psikologis pricing.`,
    );
  }

  function injectPersonaPrompt() {
    onInjectPrompt(
      `Susun customer persona detail untuk bisnis ${settings.sector} dengan profil: nama persona ${personaName}, usia ${personaAgeRange}, pain point utama \"${personaPainPoint}\", buying trigger \"${personaTrigger}\". Berikan pesan marketing, channel utama, dan contoh copy iklan singkat.`,
    );
  }

  function injectContentPrompt() {
    const platformText =
      selectedPlatforms.length > 0 ? selectedPlatforms.join(", ") : "Instagram";
    onInjectPrompt(
      `Buat content calendar ${contentDays} hari untuk usaha ${settings.sector} di platform ${platformText}. Bagi ke pilar edukasi, promosi, testimoni, dan engagement. Sertakan ide konten harian, format konten, hook pembuka, dan CTA.`,
    );
  }

  function injectLoanPrompt() {
    onInjectPrompt(
      `Skor kesiapan pendanaan usaha saya adalah ${loanScore.score}/100 (${loanScore.level}). Tolong buat rencana peningkatan 30 hari untuk menaikkan skor ke minimal 80, lengkap dengan dokumen yang harus disiapkan dan prioritas eksekusi minggu 1-4.`,
    );
  }

  function addInsight() {
    const title = newTitle.trim();
    const note = newNote.trim();

    if (!title || !note) {
      return;
    }

    const insight: TeamInsight = {
      id: createInsightId(),
      author: newAuthor.trim() || "Tim",
      title,
      note,
      status: "todo",
      createdAt: new Date().toISOString(),
    };

    setTeamInsights((prev) => [insight, ...prev].slice(0, 12));
    setNewNote("");
  }

  function rotateInsightStatus(id: string) {
    setTeamInsights((prev) =>
      prev.map((item) => {
        if (item.id !== id) {
          return item;
        }

        if (item.status === "todo") {
          return { ...item, status: "in-progress" };
        }

        if (item.status === "in-progress") {
          return { ...item, status: "done" };
        }

        return { ...item, status: "todo" };
      }),
    );
  }

  function removeInsight(id: string) {
    setTeamInsights((prev) => prev.filter((item) => item.id !== id));
  }

  return (
    <div className="mt-6 space-y-4">
      <h3 className="text-lg font-semibold text-[#2f1a17]">
        Fitur Lanjutan Interaktif
      </h3>

      <section className="tool-card">
        <div className="tool-head">
          <h4>KPI Generator</h4>
          <button
            type="button"
            className="ui-btn ui-btn-soft text-xs"
            onClick={injectKpiPrompt}
          >
            Kirim ke Chat
          </button>
        </div>
        <div className="tool-grid-2">
          <label className="tool-label">
            Target KPI
            <input
              className="control-field mt-1"
              value={kpiGoal}
              onChange={(event) => setKpiGoal(event.target.value)}
            />
          </label>
          <label className="tool-label">
            Jangka Waktu
            <input
              className="control-field mt-1"
              value={kpiTimeframe}
              onChange={(event) => setKpiTimeframe(event.target.value)}
            />
          </label>
        </div>
      </section>

      <section className="tool-card">
        <div className="tool-head">
          <h4>Campaign Planner</h4>
          <button
            type="button"
            className="ui-btn ui-btn-soft text-xs"
            onClick={injectCampaignPrompt}
          >
            Kirim ke Chat
          </button>
        </div>
        <div className="tool-grid-2">
          <label className="tool-label">
            Budget (Rp)
            <input
              className="control-field mt-1"
              value={campaignBudget}
              onChange={(event) => setCampaignBudget(event.target.value)}
            />
          </label>
          <label className="tool-label">
            Durasi (hari)
            <input
              className="control-field mt-1"
              value={campaignDuration}
              onChange={(event) => setCampaignDuration(event.target.value)}
            />
          </label>
        </div>
      </section>

      <section className="tool-card">
        <div className="tool-head">
          <h4>Break-Even Analyzer</h4>
        </div>
        <div className="tool-grid-3">
          <label className="tool-label">
            Fixed Cost
            <input
              className="control-field mt-1"
              value={fixedCost}
              onChange={(event) => setFixedCost(event.target.value)}
            />
          </label>
          <label className="tool-label">
            Variabel per Unit
            <input
              className="control-field mt-1"
              value={variableCost}
              onChange={(event) => setVariableCost(event.target.value)}
            />
          </label>
          <label className="tool-label">
            Harga Jual
            <input
              className="control-field mt-1"
              value={sellingPrice}
              onChange={(event) => setSellingPrice(event.target.value)}
            />
          </label>
        </div>
        <p className="tool-result">
          {breakEven.valid
            ? `BEP: ${breakEven.bepUnits.toLocaleString("id-ID")} unit | Contribution margin: Rp${Math.round(breakEven.contribution).toLocaleString("id-ID")} | Gross margin: ${breakEven.marginPct.toFixed(1)}%`
            : "Harga jual harus lebih besar dari biaya variabel agar BEP valid."}
        </p>
      </section>

      <section className="tool-card">
        <div className="tool-head">
          <h4>Cashflow Alert</h4>
        </div>
        <div className="tool-grid-3">
          <label className="tool-label">
            Kas Awal
            <input
              className="control-field mt-1"
              value={openingCash}
              onChange={(event) => setOpeningCash(event.target.value)}
            />
          </label>
          <label className="tool-label">
            Inflow per Bulan
            <input
              className="control-field mt-1"
              value={cashInflow}
              onChange={(event) => setCashInflow(event.target.value)}
            />
          </label>
          <label className="tool-label">
            Outflow per Bulan
            <input
              className="control-field mt-1"
              value={cashOutflow}
              onChange={(event) => setCashOutflow(event.target.value)}
            />
          </label>
        </div>
        <p className="tool-result">
          Net cashflow: Rp{Math.round(cashflow.net).toLocaleString("id-ID")} /
          bulan | Risiko: {cashflow.risk}
          {Number.isFinite(cashflow.runwayMonths)
            ? ` | Estimasi runway: ${cashflow.runwayMonths.toFixed(1)} bulan`
            : " | Runway stabil (net positif)"}
        </p>
      </section>

      <section className="tool-card">
        <div className="tool-head">
          <h4>Product Bundling Recommender</h4>
          <button
            type="button"
            className="ui-btn ui-btn-soft text-xs"
            onClick={injectBundlingPrompt}
          >
            Kirim ke Chat
          </button>
        </div>
        <div className="tool-grid-3">
          <label className="tool-label">
            Produk A
            <input
              className="control-field mt-1"
              value={productAName}
              onChange={(event) => setProductAName(event.target.value)}
            />
          </label>
          <label className="tool-label">
            Harga A
            <input
              className="control-field mt-1"
              value={productAPrice}
              onChange={(event) => setProductAPrice(event.target.value)}
            />
          </label>
          <label className="tool-label">
            HPP A
            <input
              className="control-field mt-1"
              value={productACost}
              onChange={(event) => setProductACost(event.target.value)}
            />
          </label>
        </div>
        <div className="tool-grid-3 mt-2">
          <label className="tool-label">
            Produk B
            <input
              className="control-field mt-1"
              value={productBName}
              onChange={(event) => setProductBName(event.target.value)}
            />
          </label>
          <label className="tool-label">
            Harga B
            <input
              className="control-field mt-1"
              value={productBPrice}
              onChange={(event) => setProductBPrice(event.target.value)}
            />
          </label>
          <label className="tool-label">
            HPP B
            <input
              className="control-field mt-1"
              value={productBCost}
              onChange={(event) => setProductBCost(event.target.value)}
            />
          </label>
        </div>
        <label className="tool-label mt-2 block">
          Diskon Bundling (%)
          <input
            className="control-field mt-1"
            value={bundleDiscount}
            onChange={(event) => setBundleDiscount(event.target.value)}
          />
        </label>
        <p className="tool-result">
          Harga bundling: Rp
          {Math.round(bundling.bundlePrice).toLocaleString("id-ID")} | Margin
          bundling: {bundling.bundleMarginPct.toFixed(1)}% | Potensi kenaikan
          AOV: {bundling.aovLiftPct.toFixed(1)}%
        </p>
      </section>

      <section className="tool-card">
        <div className="tool-head">
          <h4>Customer Persona Builder</h4>
          <button
            type="button"
            className="ui-btn ui-btn-soft text-xs"
            onClick={injectPersonaPrompt}
          >
            Kirim ke Chat
          </button>
        </div>
        <div className="tool-grid-2">
          <label className="tool-label">
            Nama Persona
            <input
              className="control-field mt-1"
              value={personaName}
              onChange={(event) => setPersonaName(event.target.value)}
            />
          </label>
          <label className="tool-label">
            Rentang Usia
            <input
              className="control-field mt-1"
              value={personaAgeRange}
              onChange={(event) => setPersonaAgeRange(event.target.value)}
            />
          </label>
        </div>
        <label className="tool-label mt-2 block">
          Pain Point
          <input
            className="control-field mt-1"
            value={personaPainPoint}
            onChange={(event) => setPersonaPainPoint(event.target.value)}
          />
        </label>
        <label className="tool-label mt-2 block">
          Buying Trigger
          <input
            className="control-field mt-1"
            value={personaTrigger}
            onChange={(event) => setPersonaTrigger(event.target.value)}
          />
        </label>
      </section>

      <section className="tool-card">
        <div className="tool-head">
          <h4>Content Calendar AI</h4>
          <button
            type="button"
            className="ui-btn ui-btn-soft text-xs"
            onClick={injectContentPrompt}
          >
            Kirim ke Chat
          </button>
        </div>
        <label className="tool-label block">
          Durasi Kalender (hari)
          <input
            className="control-field mt-1"
            value={contentDays}
            onChange={(event) => setContentDays(event.target.value)}
          />
        </label>
        <div className="mt-2 flex flex-wrap gap-2 text-xs text-[#573531]">
          <label className="inline-flex items-center gap-1 rounded-full border border-[#d8ad9d] bg-white/70 px-2 py-1">
            <input
              type="checkbox"
              checked={platformInstagram}
              onChange={(event) => setPlatformInstagram(event.target.checked)}
            />
            Instagram
          </label>
          <label className="inline-flex items-center gap-1 rounded-full border border-[#d8ad9d] bg-white/70 px-2 py-1">
            <input
              type="checkbox"
              checked={platformTiktok}
              onChange={(event) => setPlatformTiktok(event.target.checked)}
            />
            TikTok
          </label>
          <label className="inline-flex items-center gap-1 rounded-full border border-[#d8ad9d] bg-white/70 px-2 py-1">
            <input
              type="checkbox"
              checked={platformWhatsapp}
              onChange={(event) => setPlatformWhatsapp(event.target.checked)}
            />
            WhatsApp
          </label>
        </div>
      </section>

      <section className="tool-card">
        <div className="tool-head">
          <h4>Loan Readiness Score</h4>
          <button
            type="button"
            className="ui-btn ui-btn-soft text-xs"
            onClick={injectLoanPrompt}
          >
            Kirim ke Chat
          </button>
        </div>
        <div className="space-y-2 text-xs text-[#5d3a35]">
          <label className="block">
            Stabilitas Omzet ({revenueStability})
            <input
              type="range"
              className="mt-1 w-full accent-[#c46746]"
              min={0}
              max={100}
              value={revenueStability}
              onChange={(event) =>
                setRevenueStability(Number(event.target.value))
              }
            />
          </label>
          <label className="block">
            Kesiapan Pembukuan ({bookkeepingReadiness})
            <input
              type="range"
              className="mt-1 w-full accent-[#c46746]"
              min={0}
              max={100}
              value={bookkeepingReadiness}
              onChange={(event) =>
                setBookkeepingReadiness(Number(event.target.value))
              }
            />
          </label>
          <label className="block">
            Legalitas Usaha ({legalReadiness})
            <input
              type="range"
              className="mt-1 w-full accent-[#c46746]"
              min={0}
              max={100}
              value={legalReadiness}
              onChange={(event) =>
                setLegalReadiness(Number(event.target.value))
              }
            />
          </label>
          <label className="block">
            Kekuatan Agunan ({collateralStrength})
            <input
              type="range"
              className="mt-1 w-full accent-[#c46746]"
              min={0}
              max={100}
              value={collateralStrength}
              onChange={(event) =>
                setCollateralStrength(Number(event.target.value))
              }
            />
          </label>
          <label className="block">
            Kesehatan Utang ({debtHealth})
            <input
              type="range"
              className="mt-1 w-full accent-[#c46746]"
              min={0}
              max={100}
              value={debtHealth}
              onChange={(event) => setDebtHealth(Number(event.target.value))}
            />
          </label>
        </div>
        <p className="tool-result">
          Skor pendanaan: {loanScore.score}/100 ({loanScore.level})
        </p>
      </section>

      <section className="tool-card">
        <div className="tool-head">
          <h4>Team Collaboration Workspace</h4>
        </div>
        <div className="tool-grid-2">
          <label className="tool-label">
            Tim atau Author
            <input
              className="control-field mt-1"
              value={newAuthor}
              onChange={(event) => setNewAuthor(event.target.value)}
            />
          </label>
          <label className="tool-label">
            Judul Insight
            <input
              className="control-field mt-1"
              value={newTitle}
              onChange={(event) => setNewTitle(event.target.value)}
            />
          </label>
        </div>
        <label className="tool-label mt-2 block">
          Catatan Insight
          <textarea
            className="control-field mt-1 min-h-[84px] resize-y"
            value={newNote}
            onChange={(event) => setNewNote(event.target.value)}
            placeholder="Contoh: CTR konten edukasi naik 18% ketika pakai hook pertanyaan di 3 detik pertama."
          />
        </label>
        <button
          type="button"
          className="ui-btn ui-btn-primary mt-2 w-full text-sm font-semibold"
          onClick={addInsight}
        >
          Simpan Insight Tim
        </button>

        <div className="mt-3 space-y-2">
          {teamInsights.length === 0 ? (
            <p className="text-xs text-[#6f4a44]">
              Belum ada insight tim tersimpan.
            </p>
          ) : (
            teamInsights.map((insight) => (
              <article
                key={insight.id}
                className="rounded-xl border border-[#e3bcb0] bg-white/75 p-2 text-xs text-[#4a2b28]"
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <p className="font-semibold">{insight.title}</p>
                  <span className="rounded-full border border-[#d6a698] bg-[#fff6ef] px-2 py-0.5 text-[10px]">
                    {formatStatus(insight.status)}
                  </span>
                </div>
                <p className="mb-1 whitespace-pre-wrap">{insight.note}</p>
                <p className="text-[10px] text-[#7a534e]">
                  {insight.author} •{" "}
                  {new Date(insight.createdAt).toLocaleDateString("id-ID")}
                </p>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    className="ui-btn ui-btn-soft px-2 py-1 text-[11px]"
                    onClick={() => rotateInsightStatus(insight.id)}
                  >
                    Ubah Status
                  </button>
                  <button
                    type="button"
                    className="ui-btn ui-btn-soft px-2 py-1 text-[11px]"
                    onClick={() => removeInsight(insight.id)}
                  >
                    Hapus
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
