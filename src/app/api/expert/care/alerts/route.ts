import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getServiceRoleClient } from "@/lib/supabase/server";

export async function GET() {
  const session = await getSession();
  const db = getServiceRoleClient();
  if (!session?.id || !db) return NextResponse.json({ alerts: [] });
  const { data } = await db
    .from("notifications")
    .select("id, title, message, created_at, read")
    .eq("user_id", session.id)
    .eq("read", false)
    .ilike("title", "Nouveau rendez-vous")
    .order("created_at", { ascending: false })
    .limit(5);
  return NextResponse.json({
    alerts: (data ?? []).map((row) => ({
      id: String(row.id),
      title: String(row.title ?? "Nouveau rendez-vous"),
      message: String(row.message ?? ""),
      createdAt: String(row.created_at ?? ""),
    })),
  });
}

export async function POST(request: Request) {
  const session = await getSession();
  const db = getServiceRoleClient();
  if (!session?.id || !db) return NextResponse.json({ ok: false }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as { id?: string };
  if (!body.id) return NextResponse.json({ ok: false }, { status: 400 });
  await db.from("notifications").update({ read: true }).eq("id", body.id).eq("user_id", session.id);
  return NextResponse.json({ ok: true });
}
