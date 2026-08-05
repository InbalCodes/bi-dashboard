import "server-only";
import { sql } from "./db";
import { fetchSheetRows } from "./sheets";
import { parseSheetRows, type ParsedRow } from "./parse";

const BATCH_SIZE = 200;

const COLUMNS = [
  "row_id",
  "row_date",
  "campaign_name",
  "channel",
  "budget",
  "spent",
  "impressions",
  "clicks",
  "leads",
  "meetings",
  "deals",
  "revenue",
  "salesperson",
  "region",
  "product",
  "synced_at",
] as const;

async function upsertBatch(batch: ParsedRow[]) {
  const values: unknown[] = [];
  const placeholders: string[] = [];
  const now = new Date().toISOString();

  batch.forEach((row, idx) => {
    const base = idx * COLUMNS.length;
    placeholders.push(`(${COLUMNS.map((_, ci) => `$${base + ci + 1}`).join(", ")})`);
    values.push(
      row.rowId,
      row.rowDate,
      row.campaignName,
      row.channel,
      row.budget,
      row.spent,
      row.impressions,
      row.clicks,
      row.leads,
      row.meetings,
      row.deals,
      row.revenue,
      row.salesperson,
      row.region,
      row.product,
      now
    );
  });

  const query = `
    INSERT INTO marketing_rows (${COLUMNS.join(", ")})
    VALUES ${placeholders.join(", ")}
    ON CONFLICT (row_id) DO UPDATE SET
      row_date = EXCLUDED.row_date,
      campaign_name = EXCLUDED.campaign_name,
      channel = EXCLUDED.channel,
      budget = EXCLUDED.budget,
      spent = EXCLUDED.spent,
      impressions = EXCLUDED.impressions,
      clicks = EXCLUDED.clicks,
      leads = EXCLUDED.leads,
      meetings = EXCLUDED.meetings,
      deals = EXCLUDED.deals,
      revenue = EXCLUDED.revenue,
      salesperson = EXCLUDED.salesperson,
      region = EXCLUDED.region,
      product = EXCLUDED.product,
      synced_at = EXCLUDED.synced_at
  `;

  await sql.query(query, values);
}

export interface SyncOutcome {
  status: "success" | "error";
  rowsSynced: number;
  rowsRemoved: number;
  skipped: { rowNumber: number; reason: string }[];
  error?: string;
}

/** Deletes rows whose row_id is no longer present in the sheet, so the table
 * stays a true mirror of the source instead of accumulating rows that were
 * removed upstream. Guarded by requiring at least one current row_id, so a
 * transient empty/failed read can never wipe the table. */
async function pruneRemovedRows(currentRowIds: string[]): Promise<number> {
  if (currentRowIds.length === 0) return 0;
  const result = await sql.query(
    `DELETE FROM marketing_rows WHERE row_id != ALL($1) RETURNING row_id`,
    [currentRowIds]
  );
  return result.length;
}

/** Fetches the sheet, upserts rows by row_id (no duplicates), removes rows no
 * longer present in the sheet, and logs the outcome. */
export async function runSync(): Promise<SyncOutcome> {
  try {
    const raw = await fetchSheetRows();
    const { rows, skipped } = parseSheetRows(raw);

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      await upsertBatch(rows.slice(i, i + BATCH_SIZE));
    }

    const rowsRemoved = await pruneRemovedRows(rows.map((r) => r.rowId));

    await sql`
      INSERT INTO sync_log (rows_synced, status, error_message)
      VALUES (${rows.length}, 'success', NULL)
    `;

    return { status: "success", rowsSynced: rows.length, rowsRemoved, skipped };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    try {
      await sql`
        INSERT INTO sync_log (rows_synced, status, error_message)
        VALUES (0, 'error', ${message})
      `;
    } catch {
      // If even the DB is unreachable, swallow — the caller still gets the error message.
    }
    return { status: "error", rowsSynced: 0, rowsRemoved: 0, skipped: [], error: message };
  }
}

export async function getLastSyncLog() {
  const rows = await sql`
    SELECT synced_at, rows_synced, status, error_message
    FROM sync_log
    ORDER BY synced_at DESC
    LIMIT 1
  `;
  return rows[0] ?? null;
}
