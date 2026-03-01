import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    if (!payload?.prenom || !payload?.nom || !payload?.email || !payload?.password) {
      return NextResponse.json({ ok: false, error: "Missing fields" }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400 });
  }
}
