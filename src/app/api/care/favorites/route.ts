import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { getServiceRoleClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  expertId: z.string().uuid(),
  on: z.boolean(),
});

export async function GET() {
  const session = await getSession();
  if (!session?.id) return NextResponse.json({ ids: [] }, { status: 401 });
  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ ids: [] });
  const { data, error } = await db.from("care_practitioner_favorites").select("expert_id").eq("user_id", session.id);
  if (error) return NextResponse.json({ ids: [] });
  return NextResponse.json({ ids: (data ?? []).map((row) => String(row.expert_id)) });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.id) return NextResponse.json({ ok: false }, { status: 401 });
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ error: "Indisponible" }, { status: 500 });
  if (parsed.data.on) {
    await db.from("care_practitioner_favorites").upsert({ user_id: session.id, expert_id: parsed.data.expertId });
  } else {
    await db.from("care_practitioner_favorites").delete().eq("user_id", session.id).eq("expert_id", parsed.data.expertId);
  }
  return NextResponse.json({ ok: true });
}
