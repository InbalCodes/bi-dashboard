"use client";

import { useState } from "react";
import DigestSourceViewer from "./DigestSourceViewer";
import type { AnalysisResult } from "@/lib/ai/schemas";

const TREND_LABEL: Record<string, string> = {
  positive: "מגמה חיובית",
  negative: "מגמה שלילית",
  neutral: "ללא שינוי משמעותי",
};

const TREND_COLOR: Record<string, string> = {
  positive: "text-green-700 dark:text-green-400",
  negative: "text-red-600 dark:text-red-400",
  neutral: "text-slate-500",
};

export default function AnalyzePanel({ queryString }: { queryString: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [digest, setDigest] = useState<unknown>(null);

  async function handleAnalyze() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/ai/analyze?${queryString}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "הניתוח נכשל");
        return;
      }
      setResult(data.result);
      setWarnings(data.warnings ?? []);
      setDigest(data.digest);
    } catch {
      setError("שגיאת תקשורת עם השרת");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={handleAnalyze}
        disabled={loading}
        className="rounded-md bg-blue-600 text-white px-5 py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 mb-6"
      >
        {loading ? "מנתח..." : "נתח את הנתונים"}
      </button>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      {result && (
        <div className="space-y-6">
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
            <h2 className="text-sm font-medium text-slate-500 mb-2">סיכום ביצועים ניהולי</h2>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{result.summary}</p>
          </section>

          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
            <h2 className="text-sm font-medium text-slate-500 mb-3">שלוש תובנות מרכזיות</h2>
            <ol className="space-y-3 list-decimal pr-5">
              {result.insights.map((insight, i) => (
                <li key={i} className="text-sm">
                  {insight.text}
                  {insight.basedOn.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {insight.basedOn.map((b, j) => (
                        <span key={j} className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 rounded px-1.5 py-0.5">
                          מבוסס על: {b}
                        </span>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ol>
          </section>

          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
            <h2 className="text-sm font-medium text-slate-500 mb-3">מגמות</h2>
            <ul className="space-y-1">
              {result.trends.map((t, i) => (
                <li key={i} className={`text-sm ${TREND_COLOR[t.direction]}`}>
                  <span className="font-medium">{TREND_LABEL[t.direction]}:</span> {t.description}
                </li>
              ))}
            </ul>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
              <h2 className="text-sm font-medium text-slate-500 mb-3">נתונים חריגים</h2>
              {result.anomalies.length === 0 ? (
                <p className="text-sm text-slate-400">לא זוהו חריגות</p>
              ) : (
                <ul className="list-disc pr-5 space-y-1 text-sm">
                  {result.anomalies.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              )}
            </section>

            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
              <h2 className="text-sm font-medium text-slate-500 mb-3">קמפיינים ואנשי מכירות חריגים</h2>
              {result.standoutCampaigns.length === 0 && result.standoutSalespeople.length === 0 ? (
                <p className="text-sm text-slate-400">לא זוהו ביצועים חריגים</p>
              ) : (
                <ul className="space-y-1 text-sm">
                  {result.standoutCampaigns.map((c, i) => (
                    <li key={`c-${i}`}>
                      <span className="font-medium">{c.name}</span> — {c.reason}
                    </li>
                  ))}
                  {result.standoutSalespeople.map((s, i) => (
                    <li key={`s-${i}`}>
                      <span className="font-medium">{s.name}</span> — {s.reason}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
              <h2 className="text-sm font-medium text-slate-500 mb-3">המלצות לפעולות המשך</h2>
              <ul className="list-disc pr-5 space-y-1 text-sm">
                {result.recommendations.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </section>

            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
              <h2 className="text-sm font-medium text-slate-500 mb-3">נקודות שכדאי לבדוק לעומק</h2>
              <ul className="list-disc pr-5 space-y-1 text-sm">
                {result.pointsToInvestigate.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </section>
          </div>

          {warnings.length > 0 && (
            <div className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950 rounded-md p-3">
              {warnings.map((w, i) => (
                <p key={i}>⚠ {w}</p>
              ))}
            </div>
          )}

          <DigestSourceViewer digest={digest} />
        </div>
      )}
    </div>
  );
}
