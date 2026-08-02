import FilterBar from "@/components/FilterBar";
import ReportPanel from "@/components/ReportPanel";
import { getSession } from "@/lib/auth";
import { getFilterOptionsForSession } from "@/lib/authz";

export const dynamic = "force-dynamic";

export default async function ReportPage({
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
      <h1 className="text-2xl font-semibold mb-4 print:hidden">דוח ניהולי חכם</h1>
      <div className="print:hidden">
        <FilterBar options={options} lockedSalesperson={lockedSalesperson} />
      </div>
      <ReportPanel queryString={urlParams.toString()} />
    </div>
  );
}
