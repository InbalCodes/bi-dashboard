export interface ParsedRow {
  rowId: string;
  rowDate: string; // ISO yyyy-mm-dd
  campaignName: string;
  channel: string;
  budget: number | null;
  spent: number;
  impressions: number;
  clicks: number;
  leads: number;
  meetings: number;
  deals: number;
  revenue: number;
  salesperson: string;
  region: string | null;
  product: string;
}

export interface ParseResult {
  rows: ParsedRow[];
  skipped: { rowNumber: number; reason: string }[];
}

// Maps the Hebrew column headers from the sheet (must not be renamed there,
// per assignment rules) to our internal field names.
const HEADER_MAP: Record<string, keyof RawRow> = {
  "מזהה שורה": "rowId",
  "תאריך": "rowDate",
  "שם קמפיין": "campaignName",
  "ערוץ פרסום": "channel",
  "תקציב": "budget",
  "סכום שהוצא בפועל": "spent",
  "חשיפות": "impressions",
  "קליקים": "clicks",
  "לידים": "leads",
  "פגישות": "meetings",
  "עסקאות": "deals",
  "הכנסות": "revenue",
  "איש מכירות": "salesperson",
  "אזור": "region",
  "מוצר או שירות": "product",
};

type RawRow = Record<
  | "rowId"
  | "rowDate"
  | "campaignName"
  | "channel"
  | "budget"
  | "spent"
  | "impressions"
  | "clicks"
  | "leads"
  | "meetings"
  | "deals"
  | "revenue"
  | "salesperson"
  | "region"
  | "product",
  string
>;

function parseDate(value: string): string | null {
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const [, day, month, year] = match;
  const iso = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return iso;
}

function parseIntOrNull(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const n = Number(trimmed.replace(/,/g, ""));
  return Number.isFinite(n) ? Math.round(n) : null;
}

/**
 * Turns raw sheet rows (header row + data rows) into validated ParsedRow objects.
 * Rows with missing budget/region are kept (those are intentionally nullable per
 * the data dictionary). Rows missing any other required field, or with an
 * unparseable date, are skipped and reported.
 */
export function parseSheetRows(rawRows: string[][]): ParseResult {
  if (rawRows.length === 0) return { rows: [], skipped: [] };

  const [headerRow, ...dataRows] = rawRows;
  const fieldByColumnIndex: (keyof RawRow | null)[] = headerRow.map(
    (h) => HEADER_MAP[h.trim()] ?? null
  );

  const rows: ParsedRow[] = [];
  const skipped: ParseResult["skipped"] = [];

  dataRows.forEach((raw, i) => {
    const rowNumber = i + 2; // 1-indexed + header row
    if (raw.every((cell) => (cell ?? "").trim() === "")) return; // blank trailing row

    const record: Partial<RawRow> = {};
    fieldByColumnIndex.forEach((field, colIdx) => {
      if (field) record[field] = raw[colIdx] ?? "";
    });

    const rowId = (record.rowId ?? "").trim();
    if (!rowId) {
      skipped.push({ rowNumber, reason: "מזהה שורה חסר" });
      return;
    }

    const rowDate = parseDate(record.rowDate ?? "");
    if (!rowDate) {
      skipped.push({ rowNumber, reason: `תאריך לא תקין: "${record.rowDate}"` });
      return;
    }

    const campaignName = (record.campaignName ?? "").trim();
    const channel = (record.channel ?? "").trim();
    const salesperson = (record.salesperson ?? "").trim();
    const product = (record.product ?? "").trim();
    if (!campaignName || !channel || !salesperson || !product) {
      skipped.push({ rowNumber, reason: "שדה טקסט חובה חסר (קמפיין/ערוץ/איש מכירות/מוצר)" });
      return;
    }

    const spent = parseIntOrNull(record.spent ?? "");
    const impressions = parseIntOrNull(record.impressions ?? "");
    const clicks = parseIntOrNull(record.clicks ?? "");
    const leads = parseIntOrNull(record.leads ?? "");
    const meetings = parseIntOrNull(record.meetings ?? "");
    const deals = parseIntOrNull(record.deals ?? "");
    const revenue = parseIntOrNull(record.revenue ?? "");

    if (
      spent === null ||
      impressions === null ||
      clicks === null ||
      leads === null ||
      meetings === null ||
      deals === null ||
      revenue === null
    ) {
      skipped.push({ rowNumber, reason: "שדה מספרי חובה חסר או לא תקין" });
      return;
    }

    const region = (record.region ?? "").trim();

    rows.push({
      rowId,
      rowDate,
      campaignName,
      channel,
      budget: parseIntOrNull(record.budget ?? ""),
      spent,
      impressions,
      clicks,
      leads,
      meetings,
      deals,
      revenue,
      salesperson,
      region: region === "" ? null : region,
      product,
    });
  });

  return { rows, skipped };
}
