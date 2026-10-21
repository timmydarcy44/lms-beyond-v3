import { NextRequest, NextResponse } from "next/server";

import { isJadeDemoEmail } from "@/lib/demo/jade-account";
import { requireTutorClient } from "@/lib/tuteur/require-tutor";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireTutorClient();
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  const { id } = await params;
  if (isJadeDemoEmail(auth.ctx.email)) return NextResponse.json({ ok: true });
  await auth.ctx.supabase.from("tutor_resource_views").upsert({ user_id: auth.ctx.userId, resource_id: id, viewed_at: new Date().toISOString() });
  return NextResponse.json({ ok: true });
}
