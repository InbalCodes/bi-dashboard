import { NextResponse } from "next/server";
import { setSessionCookie } from "@/lib/auth";

export async function POST(request: Request) {
  const { email, password } = await request.json();

  const managerEmail = process.env.DEMO_USER_EMAIL;
  const managerPassword = process.env.DEMO_USER_PASSWORD;

  if (!managerEmail || !managerPassword) {
    return NextResponse.json(
      { error: "המערכת לא הוגדרה כראוי (משתמש דמו חסר)" },
      { status: 500 }
    );
  }

  if (email === managerEmail && password === managerPassword) {
    await setSessionCookie({ email, role: "manager", salesperson: null });
    return NextResponse.json({ ok: true, role: "manager" });
  }

  const salespersonEmail = process.env.DEMO_SALESPERSON_EMAIL;
  const salespersonPassword = process.env.DEMO_SALESPERSON_PASSWORD;
  const salespersonName = process.env.DEMO_SALESPERSON_NAME;

  if (
    salespersonEmail &&
    salespersonPassword &&
    salespersonName &&
    email === salespersonEmail &&
    password === salespersonPassword
  ) {
    await setSessionCookie({ email, role: "salesperson", salesperson: salespersonName });
    return NextResponse.json({ ok: true, role: "salesperson" });
  }

  return NextResponse.json({ error: "אימייל או סיסמה שגויים" }, { status: 401 });
}
