import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  const body = await request.json().catch(() => null);
  const token = body && typeof body === "object" ? String((body as { token?: unknown }).token ?? "") : "";
  if (!token) return NextResponse.json({ error: "Lien invalide." }, { status: 400 });
  const current = await db.from("cfa_applications").select("id").eq("resume_token", token).maybeSingle();
  if (!current.data) return NextResponse.json({ error: "Candidature introuvable." }, { status: 404 });
  const saved = await db
    .from("cfa_applications")
    .update({ share_with_companies: true, share_with_companies_at: new Date().toISOString() })
    .eq("id", (current.data as { id: string }).id);
  if (saved.error) return NextResponse.json({ error: saved.error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
