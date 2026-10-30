import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClient } from "@/lib/supabase/server";

const querySchema = z.object({
  path: z.string().min(1),
});

const patchSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["accepted", "ignored"]),
});

export async function GET(req: NextRequest) {
  if (!(await isSuperAdmin())) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  const parsed = querySchema.safeParse({ path: req.nextUrl.searchParams.get("path") ?? "" });
  if (!parsed.success || !parsed.data.path.startsWith("/")) {
    return NextResponse.json({ error: "Chemin invalide" }, { status: 400 });
  }
  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ proposals: [] });
  const { data } = await db
    .from("seo_ai_proposals")
    .select("id, path, batch_id, field, old_value, new_value, status")
    .eq("path", parsed.data.path)
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  return NextResponse.json({ proposals: data ?? [] });
}

export async function PATCH(req: NextRequest) {
  if (!(await isSuperAdmin())) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ ok: true });
  await db.from("seo_ai_proposals").update({ status: parsed.data.status }).eq("id", parsed.data.id);
  return NextResponse.json({ ok: true });
}
