import { NextRequest, NextResponse } from "next/server";

import { isJadeDemoEmail } from "@/lib/demo/jade-account";
import { jadeConversations } from "@/lib/demo/jade-tutor-pages";
import { requireTutorClient } from "@/lib/tuteur/require-tutor";

export async function POST(request: NextRequest) {
  const auth = await requireTutorClient();
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  const body = await request.json().catch(() => null);
  const peerId = String(body?.peerId ?? "");
  if (!peerId) return NextResponse.json({ error: "Choisissez un destinataire." }, { status: 400 });
  if (isJadeDemoEmail(auth.ctx.email)) {
    const existing = jadeConversations().find((item) => item.learnerId === peerId || item.id === peerId);
    return NextResponse.json({ id: existing?.id ?? "c-lea" });
  }
  const created = await auth.ctx.supabase.rpc("create_tutor_conversation", { peer_id: peerId });
  if (created.error || !created.data) return NextResponse.json({ error: "La conversation n'a pas pu être ouverte." }, { status: 403 });
  return NextResponse.json({ id: created.data });
}
