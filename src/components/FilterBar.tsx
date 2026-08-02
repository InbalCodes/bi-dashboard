"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { FilterOptions } from "@/lib/metrics";

const FIELDS: { key: string; label: string }[] = [
  { key: "campaign", label: "קמפיין" },
  { key: "channel", label: "ערוץ פרסום" },
  { key: "salesperson", label: "איש מכירות" },
  { key: "region", label: "אזור" },
  { key: "product", label: "מוצר או שירות" },
];

const CONTROL_CLASS =
  "w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-2 py-1.5 text-sm";

export default function FilterBar({ options }: { options: FilterOptions }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  }

  function reset() {
    router.push(pathname);
  }

  const optionsByField: Record<string, string[]> = {
    campaign: options.campaigns,
    channel: options.channels,
    salesperson: options.salespeople,
    region: options.regions,
    product: options.products,
  };

  const hasActiveFilters = Array.from(searchParams.keys()).length > 0;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 mb-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <div>
          <label className="block text-xs text-slate-500 mb-1">מתאריך</label>
          <input
            type="date"
            value={searchParams.get("dateFrom") ?? ""}
            onChange={(e) => updateParam("dateFrom", e.target.value)}
            className={CONTROL_CLASS}
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">עד תאריך</label>
          <input
            type="date"
            value={searchParams.get("dateTo") ?? ""}
            onChange={(e) => updateParam("dateTo", e.target.value)}
            className={CONTROL_CLASS}
          />
        </div>
        {FIELDS.map((field) => (
          <div key={field.key}>
            <label className="block text-xs text-slate-500 mb-1">{field.label}</label>
            <select
              value={searchParams.get(field.key) ?? ""}
              onChange={(e) => updateParam(field.key, e.target.value)}
              className={CONTROL_CLASS}
            >
              <option value="">הכל</option>
              {optionsByField[field.key].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
      {hasActiveFilters && (
        <button onClick={reset} className="text-sm text-blue-600 hover:underline mt-3">
          איפוס כל המסננים
        </button>
      )}
    </div>
  );
}
