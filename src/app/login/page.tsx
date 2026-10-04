"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "שגיאה בהתחברות");
        return;
      }
      const next = searchParams.get("next") || "/dashboard";
      router.push(next);
      router.refresh();
    } catch {
      setError("שגיאת תקשורת עם השרת");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_42%),linear-gradient(135deg,#f8fbff_0%,#eef4ff_35%,#f8fafc_100%)] dark:bg-[radial-gradient(circle_at_top,_rgba(96,165,250,0.22),_transparent_34%),linear-gradient(135deg,#020817_0%,#0f172a_40%,#111827_100%)] px-4 py-10" dir="rtl">
      <div className="mx-auto flex max-w-5xl flex-col overflow-hidden rounded-[28px] border border-slate-200/80 bg-white/70 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/75 md:flex-row">
        <div className="flex flex-1 flex-col justify-between bg-slate-950 p-8 text-white dark:bg-slate-950 md:p-10">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-medium tracking-[0.24em] text-blue-200 uppercase">
              InsightFlow
            </div>
            <h1 className="text-3xl font-semibold leading-tight md:text-4xl">
              Sales intelligence
              <span className="block text-blue-300">for modern teams</span>
            </h1>
          </div>

          <div className="mt-8 space-y-4 text-sm text-slate-200">
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-500/20 text-blue-200">✓</span>
              <span>לוחות מחוונים דינמיים ומבוססי נתונים</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-200">✓</span>
              <span>ניתוח AI על ביצועים, מגמות וחריגות</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-500/20 text-violet-200">✓</span>
              <span>דוחות, סינונים וראיית מצב בזמן אמת</span>
            </div>
          </div>

          <div className="mt-8">
            <a
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-full border border-blue-400/30 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-100 transition hover:bg-blue-500/15"
            >
              תצוגת דמו מלאה
            </a>
          </div>
        </div>

        <div className="flex w-full items-center justify-center bg-white/80 p-6 dark:bg-slate-900/70 md:w-[440px] md:p-8">
          <div className="w-full max-w-sm">
            <div className="mb-6">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">גישה</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">התחברות</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="email">אימייל</label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-3 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="password">סיסמה</label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-3 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  placeholder="••••••••"
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "מתחבר..." : "התחברות"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
