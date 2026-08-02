import FilterBar from "@/components/FilterBar";
import AskPanel from "@/components/AskPanel";
import { getSession } from "@/lib/auth";
import { getFilterOptionsForSession } from "@/lib/authz";

export const dynamic = "force-dynamic";

export default async function AskPage({
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
      <h1 className="text-2xl font-semibold mb-1">שאלות על הנתונים</h1>
      <p className="text-sm text-slate-500 mb-4">
        שאלו שאלה בשפה חופשית על הנתונים המסוננים.
      </p>
      <FilterBar options={options} lockedSalesperson={lockedSalesperson} />
      <AskPanel queryString={urlParams.toString()} />
    </div>
  );
}
