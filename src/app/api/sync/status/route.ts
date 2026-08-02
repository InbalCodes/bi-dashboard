import { NextResponse } from "next/server";
import { getLastSyncLog } from "@/lib/sync";
import { checkSheetsConnection } from "@/lib/sheets";

export const dynamic = "force-dynamic";

export async function GET() {
  const [lastSync, connection] = await Promise.all([
    getLastSyncLog().catch(() => null),
    checkSheetsConnection(),
  ]);

  return NextResponse.json({
    connected: connection.ok,
    connectionError: connection.ok ? null : connection.error,
    lastSync: lastSync
      ? {
          syncedAt: lastSync.synced_at,
          rowsSynced: lastSync.rows_synced,
          status: lastSync.status,
          errorMessage: lastSync.error_message,
        }
      : null,
  });
}
