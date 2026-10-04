"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { Session } from "@/lib/auth";

const LINKS: { href: string; label: string; managerOnly?: boolean }[] = [
  { href: "/dashboard", label: "מרכז הבקרה" },
  { href: "/insights", label: "תובנות AI" },
  { href: "/ask", label: "שאלות על הנתונים" },
  { href: "/report", label: "דוח ניהולי חכם" },
  { href: "/settings", label: "הגדרות נתונים", managerOnly: true },
];

export default function Nav({ session }: { session: Session | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const links = LINKS.filter((l) => !l.managerOnly || session?.role === "manager");

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 print:hidden">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
        <nav className="flex items-center gap-1 overflow-x-auto">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 text-sm rounded-md whitespace-nowrap transition-colors ${
                  active
                    ? "bg-blue-600 text-white"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-3 shrink-0">
          {session ? (
            <>
              <span className="text-xs text-slate-400 hidden sm:inline">
                {session.role === "manager" ? "מחובר/ת כמנהל/ת" : `מחובר/ת כאיש/אשת מכירות: ${session.salesperson}`}
              </span>
              <button
                onClick={handleLogout}
                className="text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 whitespace-nowrap"
              >
                התנתקות
              </button>
            </>
          ) : (
            <Link
              href={`/login?next=${encodeURIComponent(pathname)}`}
              className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              התחברות
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
