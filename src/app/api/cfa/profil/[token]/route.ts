import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest, context: { params: Promise<{ token: string }> }) {
  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  const { token } = await context.params;
  const body = await request.json().catch(() => null);
  const response = body && typeof body === "object" ? String((body as { response?: unknown }).response ?? "") : "";
  if (response !== "interested" && response !== "declined") {
    return NextResponse.json({ error: "Réponse invalide." }, { status: 400 });
  }
  const current = await db.from("cfa_profile_sends").select("id, expires_at, response").eq("token", token).maybeSingle();
  const row = current.data as { id: string; expires_at: string; response: string | null } | null;
  if (!row) return NextResponse.json({ error: "Lien introuvable." }, { status: 404 });
  if (new Date(row.expires_at).getTime() < Date.now()) return NextResponse.json({ error: "Ce lien a expiré." }, { status: 410 });
  if (row.response) return NextResponse.json({ error: "Une réponse a déjà été enregistrée." }, { status: 409 });
  const saved = await db.from("cfa_profile_sends").update({ response }).eq("id", row.id);
  if (saved.error) return NextResponse.json({ error: saved.error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
