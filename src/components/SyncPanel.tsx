"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface LastSync {
  syncedAt: string;
  rowsSynced: number;
  status: string;
  errorMessage: string | null;
}

export default function SyncPanel({
  initialConnected,
  initialConnectionError,
  initialLastSync,
  sheetUrl,
}: {
  initialConnected: boolean;
  initialConnectionError: string | null;
  initialLastSync: LastSync | null;
  sheetUrl: string | null;
}) {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<{
    ok: boolean;
    message: string;
    skipped?: { rowNumber: number; reason: string }[];
  } | null>(null);

  async function handleSync() {
    setSyncing(true);
    setResult(null);
    try {
      const res = await fetch("/api/sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setResult({ ok: false, message: data.error ?? "הסנכרון נכשל" });
      } else {
        setResult({
          ok: true,
          message: `סונכרנו ${data.rowsSynced} שורות בהצלחה.`,
          skipped: data.skipped,
        });
        router.refresh();
      }
    } catch {
      setResult({ ok: false, message: "שגיאת תקשורת עם השרת" });
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
        <h2 className="text-sm font-medium text-slate-500 mb-3">מקור הנתונים</h2>
        {sheetUrl ? (
          <a href={sheetUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-sm break-all">
            {sheetUrl}
          </a>
        ) : (
          <p className="text-sm text-slate-400">לא הוגדר GOOGLE_SHEETS_SPREADSHEET_ID</p>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
        <h2 className="text-sm font-medium text-slate-500 mb-3">מצב חיבור</h2>
        <div className="flex items-center gap-2 mb-2">
          <span className={`w-2.5 h-2.5 rounded-full ${initialConnected ? "bg-green-500" : "bg-red-500"}`} />
          <span className="text-sm">{initialConnected ? "מחובר" : "החיבור נכשל"}</span>
        </div>
        {!initialConnected && initialConnectionError && (
          <p className="text-sm text-red-600">{initialConnectionError}</p>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
        <h2 className="text-sm font-medium text-slate-500 mb-3">סנכרון אחרון</h2>
        {initialLastSync ? (
          <div className="text-sm space-y-1">
            <p>מועד: {new Date(initialLastSync.syncedAt).toLocaleString("he-IL")}</p>
            <p>סטטוס: {initialLastSync.status === "success" ? "הצליח" : "נכשל"}</p>
            <p>שורות שסונכרנו: {initialLastSync.rowsSynced}</p>
            {initialLastSync.errorMessage && (
              <p className="text-red-600">{initialLastSync.errorMessage}</p>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-400">עדיין לא בוצע סנכרון</p>
        )}

        <button
          onClick={handleSync}
          disabled={syncing}
          className="mt-4 rounded-md bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {syncing ? "מסנכרן..." : "סנכרון ידני עכשיו"}
        </button>

        {result && (
          <div className={`mt-3 text-sm ${result.ok ? "text-green-700" : "text-red-600"}`}>
            <p>{result.message}</p>
            {result.skipped && result.skipped.length > 0 && (
              <details className="mt-1">
                <summary className="cursor-pointer">
                  {result.skipped.length} שורות דולגו (לא תקינות)
                </summary>
                <ul className="list-disc pr-5 mt-1 text-slate-500">
                  {result.skipped.slice(0, 20).map((s, i) => (
                    <li key={i}>
                      שורה {s.rowNumber}: {s.reason}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
