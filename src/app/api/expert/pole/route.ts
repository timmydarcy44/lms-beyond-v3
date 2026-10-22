import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { EXPERT_POLE_COOKIE, loadExpertPoleState, type ExpertPole } from "@/lib/expert/poles";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { pole?: string } | null;
  const pole = body?.pole === "care" || body?.pole === "formation" ? body.pole : null;
  if (!pole) return NextResponse.json({ error: "Pôle invalide" }, { status: 400 });

  const state = await loadExpertPoleState();
  const allowed = state.memberships.some((item) => item.pole === pole && item.status === "active");
  if (!allowed) return NextResponse.json({ error: "Appartenance inactive" }, { status: 403 });

  const jar = await cookies();
  jar.set(EXPERT_POLE_COOKIE, pole satisfies ExpertPole, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 400,
  });
  return NextResponse.json({ ok: true, pole });
}
