import { NextResponse } from "next/server";

export function POST() {
  return NextResponse.json({ error: "La connexion Google n'est pas proposée." }, { status: 410 });
}
