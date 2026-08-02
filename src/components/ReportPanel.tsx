"use client";

import { useState } from "react";
import KpiCards from "./KpiCards";
import DashboardCharts from "./DashboardCharts";
import type { Metrics, ChartsData } from "@/lib/metrics";
import type { ReportResult } from "@/lib/ai/schemas";

interface Digest {
  totals: {
    spent: number;
    revenue: number;
    leads: number;
    deals: number;
    conversionRatePct: number | null;
    avgCostPerLead: number | null;
    avgCostPerDeal: number | null;
    roiPct: number | null;
  };
  topCampaign: { name: string; revenue: number } | null;
  topChannel: { name: string; revenue: number } | null;
  revenueVsSpendOverTime: ChartsData["revenueVsSpendOverTime"];
  leadsByChannel: ChartsData["leadsByChannel"];
  conversionByCampaign: ChartsData["conversionByCampaign"];
  funnel: ChartsData["funnel"];
}

const IMAGE_TYPES: { key: string; label: string }[] = [
  { key: "cover", label: "תמונת שער לדוח" },
  { key: "summary", label: "תמונת סיכום ביצועים" },
  { key: "campaign_win", label: "תמונה שיווקית - הקמפיין המוביל" },
  { key: "achievement", label: "גרפיקת הישג מרכזי" },
];

function digestToMetrics(digest: Digest): Metrics {
  return {
    totalSpent: digest.totals.spent,
    totalRevenue: digest.totals.revenue,
    totalLeads: digest.totals.leads,
    totalDeals: digest.totals.deals,
    conversionRate: digest.totals.conversionRatePct,
    avgCostPerLead: digest.totals.avgCostPerLead,
    avgCostPerDeal: digest.totals.avgCostPerDeal,
    roi: digest.totals.roiPct,
    topCampaign: digest.topCampaign,
    topChannel: digest.topChannel,
  };
}

function digestToCharts(digest: Digest): ChartsData {
  return {
    revenueVsSpendOverTime: digest.revenueVsSpendOverTime,
    leadsByChannel: digest.leadsByChannel,
    conversionByCampaign: digest.conversionByCampaign,
    funnel: digest.funnel,
  };
}

function downloadBlob(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function buildCsv(report: ReportResult, metrics: Metrics): string {
  const lines: string[] = [];
  lines.push(`תקופת הדוח,${report.periodLabel}`);
  lines.push("");
  lines.push("מדד,ערך");
  lines.push(`סך ההוצאות,${metrics.totalSpent}`);
  lines.push(`סך ההכנסות,${metrics.totalRevenue}`);
  lines.push(`מספר הלידים,${metrics.totalLeads}`);
  lines.push(`מספר העסקאות,${metrics.totalDeals}`);
  lines.push(`אחוז המרה,${metrics.conversionRate ?? ""}`);
  lines.push(`עלות ממוצעת לליד,${metrics.avgCostPerLead ?? ""}`);
  lines.push(`עלות ממוצעת לעסקה,${metrics.avgCostPerDeal ?? ""}`);
  lines.push(`ROI,${metrics.roi ?? ""}`);
  lines.push(`קמפיין מוביל,${metrics.topCampaign?.name ?? ""}`);
  lines.push(`ערוץ מוביל,${metrics.topChannel?.name ?? ""}`);
  lines.push("");
  lines.push("סיכום");
  lines.push(`"${report.summary.replace(/"/g, '""')}"`);
  lines.push("");
  lines.push("תובנות");
  report.insights.forEach((i) => lines.push(`"${i.replace(/"/g, '""')}"`));
  lines.push("");
  lines.push("חריגות");
  report.anomalies.forEach((a) => lines.push(`"${a.replace(/"/g, '""')}"`));
  lines.push("");
  lines.push("המלצות");
  report.recommendations.forEach((r) => lines.push(`"${r.replace(/"/g, '""')}"`));
  return "﻿" + lines.join("\n");
}

export default function ReportPanel({ queryString }: { queryString: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<ReportResult | null>(null);
  const [digest, setDigest] = useState<Digest | null>(null);

  const [imageLoading, setImageLoading] = useState<string | null>(null);
  const [images, setImages] = useState<Record<string, { url: string; prompt: string }>>({});

  async function generateReport() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/ai/report?${queryString}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "יצירת הדוח נכשלה");
        return;
      }
      setReport(data.report);
      setDigest(data.digest);
    } catch {
      setError("שגיאת תקשורת עם השרת");
    } finally {
      setLoading(false);
    }
  }

  async function generateReportImage(type: string) {
    setImageLoading(type);
    try {
      const res = await fetch(`/api/ai/image?${queryString}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "יצירת התמונה נכשלה");
        return;
      }
      const url = `data:${data.mimeType};base64,${data.imageBase64}`;
      setImages((prev) => ({ ...prev, [type]: { url, prompt: data.prompt } }));
    } catch {
      setError("שגיאת תקשורת עם השרת");
    } finally {
      setImageLoading(null);
    }
  }

  return (
    <div>
      <div className="flex gap-3 mb-6 print:hidden">
        <button
          onClick={generateReport}
          disabled={loading}
          className="rounded-md bg-blue-600 text-white px-5 py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "יוצר דוח..." : "צור דוח ניהולי"}
        </button>
        {report && digest && (
          <>
            <button
              onClick={() => downloadBlob(buildCsv(report, digestToMetrics(digest)), "report.csv", "text/csv;charset=utf-8")}
              className="rounded-md border border-slate-300 dark:border-slate-700 px-4 py-2.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              ייצוא CSV
            </button>
            <button
              onClick={() => window.print()}
              className="rounded-md border border-slate-300 dark:border-slate-700 px-4 py-2.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              ייצוא PDF
            </button>
          </>
        )}
      </div>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      {report && digest && (
        <div className="space-y-6">
          <h2 className="text-lg font-medium">תקופת הדוח: {report.periodLabel}</h2>

          <KpiCards metrics={digestToMetrics(digest)} />
          <DashboardCharts charts={digestToCharts(digest)} />

          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
            <h3 className="text-sm font-medium text-slate-500 mb-2">סיכום ביצועים</h3>
            <p className="text-sm leading-relaxed">{report.summary}</p>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
              <h3 className="text-sm font-medium text-slate-500 mb-2">תובנות AI</h3>
              <ul className="list-disc pr-5 space-y-1 text-sm">
                {report.insights.map((i, idx) => (
                  <li key={idx}>{i}</li>
                ))}
              </ul>
            </section>
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
              <h3 className="text-sm font-medium text-slate-500 mb-2">חריגות שזוהו</h3>
              <ul className="list-disc pr-5 space-y-1 text-sm">
                {report.anomalies.map((a, idx) => (
                  <li key={idx}>{a}</li>
                ))}
              </ul>
            </section>
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
              <h3 className="text-sm font-medium text-slate-500 mb-2">המלצות להמשך</h3>
              <ul className="list-disc pr-5 space-y-1 text-sm">
                {report.recommendations.map((r, idx) => (
                  <li key={idx}>{r}</li>
                ))}
              </ul>
            </section>
          </div>

          <section className="print:hidden">
            <h3 className="text-sm font-medium text-slate-500 mb-3">יצירת תמונה באמצעות AI</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {IMAGE_TYPES.map((t) => (
                <button
                  key={t.key}
                  onClick={() => generateReportImage(t.key)}
                  disabled={imageLoading !== null}
                  className="text-sm rounded-md border border-slate-300 dark:border-slate-700 px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
                >
                  {imageLoading === t.key ? "יוצר..." : t.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(images).map(([type, img]) => (
                <div key={type} className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt={type} className="w-full h-auto" />
                  <div className="p-3">
                    <a href={img.url} download={`${type}.png`} className="text-xs text-blue-600 hover:underline">
                      הורדת התמונה
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
