import SyncPanel from "@/components/SyncPanel";
import AlertRulesPanel from "@/components/AlertRulesPanel";
import { getLastSyncLog } from "@/lib/sync";
import { checkSheetsConnection } from "@/lib/sheets";
import { listAlertRules } from "@/lib/alerts";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [lastSync, connection, alertRules] = await Promise.all([
    getLastSyncLog().catch(() => null),
    checkSheetsConnection(),
    listAlertRules(),
  ]);

  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  const sheetUrl = spreadsheetId
    ? `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`
    : null;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold mb-4">הגדרות נתונים</h1>
      <SyncPanel
        initialConnected={connection.ok}
        initialConnectionError={connection.ok ? null : connection.error}
        initialLastSync={
          lastSync
            ? {
                syncedAt: String(lastSync.synced_at),
                rowsSynced: Number(lastSync.rows_synced),
                status: String(lastSync.status),
                errorMessage: lastSync.error_message,
              }
            : null
        }
        sheetUrl={sheetUrl}
      />
      <AlertRulesPanel initialRules={alertRules} />
    </div>
  );
}
