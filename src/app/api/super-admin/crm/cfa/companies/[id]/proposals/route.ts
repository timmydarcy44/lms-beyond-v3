import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { loadProposals, resolveOfferCursus, skillTitle } from "@/lib/cfa/profile-share";
import { getServiceRoleClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!(await isSuperAdmin())) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  const { id } = await context.params;
  const needId = request.nextUrl.searchParams.get("needId") ?? "";
  const offerId = request.nextUrl.searchParams.get("offerId") ?? "";
  const chosen = request.nextUrl.searchParams.get("cursusId") ?? "";

  let cursusId = chosen;
  let title = "Profils à proposer";
  let softSkillIds: string[] = [];
  let alias: string | null = null;

  if (needId) {
    const need = await db.from("cfa_company_needs").select("title, cursus_id, soft_skill_ids").eq("id", needId).eq("company_id", id).maybeSingle();
    if (!need.data) return NextResponse.json({ error: "Poste introuvable." }, { status: 404 });
    const row = need.data as { title: string; cursus_id: string | null; soft_skill_ids: string[] | null };
    title = `Poste : ${row.title}`;
    cursusId = row.cursus_id ?? "";
    softSkillIds = row.soft_skill_ids ?? [];
  } else if (offerId) {
    const offer = await db.from("job_offers").select("title, diploma_prepared").eq("id", offerId).maybeSingle();
    if (!offer.data) return NextResponse.json({ error: "Offre introuvable." }, { status: 404 });
    const row = offer.data as { title?: string; diploma_prepared?: string | null };
    title = `Offre : ${row.title || "Sans titre"}`;
    alias = String(row.diploma_prepared ?? "").trim();
    if (!cursusId) cursusId = (await resolveOfferCursus(db, alias)) ?? "";
  }

  if (!cursusId) {
    return NextResponse.json({ title, candidates: [], cursusId: "", alias, needsCursus: true, skills: softSkillIds.map(skillTitle).filter(Boolean) });
  }
  const candidates = await loadProposals(db, { cursusId, softSkillIds });
  return NextResponse.json({
    title,
    candidates,
    cursusId,
    alias,
    needsCursus: false,
    skills: softSkillIds.map(skillTitle).filter(Boolean),
  });
}
