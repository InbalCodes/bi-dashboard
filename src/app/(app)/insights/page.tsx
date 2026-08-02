import FilterBar from "@/components/FilterBar";
import AnalyzePanel from "@/components/AnalyzePanel";
import { getSession } from "@/lib/auth";
import { getFilterOptionsForSession } from "@/lib/authz";

export const dynamic = "force-dynamic";

export default async function InsightsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const rawParams = await searchParams;
  const urlParams = new URLSearchParams();
  for (const [key, value] of Object.entries(rawParams)) {
    if (typeof value === "string") urlParams.set(key, value);
  }

  const session = await getSession();
  const lockedSalesperson = session?.role === "salesperson" ? session.salesperson ?? undefined : undefined;
  const options = await getFilterOptionsForSession();

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">תובנות AI</h1>
      <p className="text-sm text-slate-500 mb-4">
        בחרו סינון ולחצו על &quot;נתח את הנתונים&quot; כדי לקבל ניתוח מבוסס-AI על הנתונים המסוננים בלבד.
      </p>
      <FilterBar options={options} lockedSalesperson={lockedSalesperson} />
      <AnalyzePanel queryString={urlParams.toString()} />
    </div>
  );
}
