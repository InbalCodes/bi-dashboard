import "server-only";
import { google } from "googleapis";

export class SheetsConnectionError extends Error {}

function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

  if (!email || !rawKey) {
    throw new SheetsConnectionError(
      "משתני הסביבה GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY חסרים"
    );
  }

  const key = rawKey.replace(/\\n/g, "\n");

  return new google.auth.JWT({
    email,
    key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
}

/** Raw rows from the sheet, including the header row at index 0. */
export async function fetchSheetRows(): Promise<string[][]> {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  if (!spreadsheetId) {
    throw new SheetsConnectionError("משתנה הסביבה GOOGLE_SHEETS_SPREADSHEET_ID חסר");
  }
  const range = process.env.GOOGLE_SHEETS_RANGE || "נתונים";

  try {
    const sheets = google.sheets({ version: "v4", auth: getAuth() });
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
      valueRenderOption: "FORMATTED_VALUE",
    });
    return (res.data.values as string[][]) ?? [];
  } catch (err) {
    if (err instanceof SheetsConnectionError) throw err;
    const message = err instanceof Error ? err.message : String(err);
    throw new SheetsConnectionError(`החיבור ל-Google Sheets נכשל: ${message}`);
  }
}

/** Lightweight connectivity check used by /api/sync/status. */
export async function checkSheetsConnection(): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await fetchSheetRows();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
