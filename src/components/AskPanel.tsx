"use client";

import { useState } from "react";
import DigestSourceViewer from "./DigestSourceViewer";
import type { AskResult } from "@/lib/ai/schemas";

const EXAMPLES = [
  "איזה קמפיין היה הכי רווחי?",
  "מי איש המכירות עם אחוז הסגירה הגבוה ביותר?",
  "איזה ערוץ מביא את הלידים הזולים ביותר?",
  "מה כדאי לשפר בחודש הבא?",
];

interface QaEntry {
  question: string;
  result?: AskResult;
  digest?: unknown;
  error?: string;
}

export default function AskPanel({ queryString }: { queryString: string }) {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<QaEntry[]>([]);

  async function ask(q: string) {
    if (!q.trim() || loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/ai/ask?${queryString}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const data = await res.json();
      if (!res.ok) {
        setHistory((h) => [{ question: q, error: data.error ?? "השאלה נכשלה" }, ...h]);
      } else {
        setHistory((h) => [{ question: q, result: data.result, digest: data.digest }, ...h]);
      }
    } catch {
      setHistory((h) => [{ question: q, error: "שגיאת תקשורת עם השרת" }, ...h]);
    } finally {
      setLoading(false);
      setQuestion("");
    }
  }

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(question);
        }}
        className="flex gap-2 mb-3"
      >
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="שאלו שאלה על הנתונים המסוננים..."
          className="flex-1 rounded-md border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "שואל..." : "שאל"}
        </button>
      </form>

      <div className="flex flex-wrap gap-2 mb-6">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            onClick={() => ask(ex)}
            disabled={loading}
            className="text-xs rounded-full border border-slate-300 dark:border-slate-700 px-3 py-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
          >
            {ex}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {history.map((entry, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
            <p className="text-sm font-medium mb-2">{entry.question}</p>
            {entry.error && <p className="text-sm text-red-600">{entry.error}</p>}
            {entry.result && (
              <>
                <p className="text-sm leading-relaxed">{entry.result.answer}</p>
                {!entry.result.hasEnoughData && (
                  <p className="text-xs text-amber-600 mt-2">
                    ⚠ אין מספיק נתונים בסינון הנוכחי כדי לענות על כך בביטחון מלא
                  </p>
                )}
                {(entry.result.basedOn ?? []).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {(entry.result.basedOn ?? []).map((b, j) => (
                      <span key={j} className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 rounded px-1.5 py-0.5">
                        מבוסס על: {b}
                      </span>
                    ))}
                  </div>
                )}
                <DigestSourceViewer digest={entry.digest} />
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
