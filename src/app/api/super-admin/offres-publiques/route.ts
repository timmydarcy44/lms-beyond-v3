import { NextResponse } from "next/server";
import { z } from "zod";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { publicSlug } from "@/lib/offres/anonymity";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const decisionSchema = z.object({
  id: z.string().uuid(),
  decision: z.enum(["published", "blocked"]),
});

async function guard() {
  if (!(await isSuperAdmin())) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  return db;
}

export async function GET() {
  const db = await guard();
  if (db instanceof NextResponse) return db;
  const rows = await db
    .from("job_offers")
    .select("id, title, city, contract_type, public_status, anonymity_flags, school_id, created_at")
    .eq("public_status", "pending_review")
    .order("created_at", { ascending: false })
    .limit(40);
  if (rows.error) return NextResponse.json({ offers: [], needsMigration: true });
  const schoolIds = [...new Set((rows.data ?? []).map((row) => String((row as { school_id?: string }).school_id ?? "")).filter(Boolean))];
  const orgs = schoolIds.length
    ? await db.from("organizations").select("id, name").in("id", schoolIds)
    : { data: [] };
  const names = new Map((orgs.data ?? []).map((row) => [String((row as { id: string }).id), String((row as { name?: string | null }).name ?? "")]));
  const offers = (rows.data ?? []).map((row) => {
    const item = row as { id: string; title?: string | null; city?: string | null; contract_type?: string | null; school_id?: string | null; created_at?: string | null; anonymity_flags?: unknown };
    return {
      id: item.id,
      title: item.title ?? "Offre",
      city: item.city ?? "",
      contractType: item.contract_type ?? "",
      companyName: names.get(String(item.school_id ?? "")) ?? "Entreprise",
      createdAt: item.created_at ?? "",
      flags: Array.isArray(item.anonymity_flags) ? item.anonymity_flags : [],
    };
  });
  return NextResponse.json({ offers });
}

export async function POST(request: Request) {
  const db = await guard();
  if (db instanceof NextResponse) return db;
  const parsed = decisionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Décision invalide" }, { status: 400 });
  const current = await db
    .from("job_offers")
    .select("title, city, public_slug")
    .eq("id", parsed.data.id)
    .eq("public_status", "pending_review")
    .maybeSingle();
  const row = current.data as { title?: string | null; city?: string | null; public_slug?: string | null } | null;
  const existingSlug = String(row?.public_slug ?? "").trim();
  const weakSlug = !existingSlug || /^offre-[a-z0-9]{4}$/i.test(existingSlug);
  const update: Record<string, unknown> = {
    public_status: parsed.data.decision,
    updated_at: new Date().toISOString(),
  };
  if (parsed.data.decision === "published" && weakSlug) {
    update.public_slug = publicSlug(String(row?.title ?? ""), String(row?.city ?? ""), parsed.data.id);
  }
  const updated = await db
    .from("job_offers")
    .update(update)
    .eq("id", parsed.data.id)
    .eq("public_status", "pending_review");
  if (updated.error) return NextResponse.json({ error: "Mise à jour impossible" }, { status: 400 });
  return NextResponse.json({ ok: true });
}
