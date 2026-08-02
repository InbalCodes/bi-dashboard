import { NextResponse } from "next/server";
import { setSessionCookie } from "@/lib/auth";

export async function POST(request: Request) {
  const { email, password } = await request.json();

  const demoEmail = process.env.DEMO_USER_EMAIL;
  const demoPassword = process.env.DEMO_USER_PASSWORD;

  if (!demoEmail || !demoPassword) {
    return NextResponse.json(
      { error: "המערכת לא הוגדרה כראוי (משתמש דמו חסר)" },
      { status: 500 }
    );
  }

  if (email !== demoEmail || password !== demoPassword) {
    return NextResponse.json({ error: "אימייל או סיסמה שגויים" }, { status: 401 });
  }

  await setSessionCookie(email);
  return NextResponse.json({ ok: true });
}
