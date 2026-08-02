import { NextResponse } from "next/server";
import { deleteAlertRule } from "@/lib/alerts";

export const dynamic = "force-dynamic";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId)) {
    return NextResponse.json({ error: "מזהה לא תקין" }, { status: 400 });
  }
  await deleteAlertRule(numericId);
  return NextResponse.json({ ok: true });
}
