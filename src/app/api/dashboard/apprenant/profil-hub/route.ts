import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { resolveEffectiveApprenantUserId } from "@/lib/control/learner-preview";
import { getServiceRoleClient, getServerClient } from "@/lib/supabase/server";
import { fetchLatestSoftSkillsResult } from "@/lib/soft-skills/resolve-soft-skills-result";

export const dynamic = "force-dynamic";

/**
 * Hub profil apprenant (DISC / IDMC / soft / expériences) — honore la preview BtoC staff.
 * Remplace les lectures client Supabase (RLS = session staff) pendant « Ouvrir son espace ».
 */
export async function GET() {
  const session = await getSession();
  if (!session?.id) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const db = getServiceRoleClient() ?? (await getServerClient());
  if (!db) return NextResponse.json({ error: "NO_DB_CLIENT" }, { status: 500 });

  const { userId, preview } = await resolveEffectiveApprenantUserId(session.id);

  const [profileRes, discRes, idmcRes, softRes, expRes, dipRes] = await Promise.all([
    db
      .from("profiles")
      .select(
        "first_name, last_name, email, phone, telephone, city, avatar_url, target_career_slug, type_profil, objective_details, cross_profile_completion, professional_project, hard_skills, skills_metadata",
      )
      .eq("id", userId)
      .maybeSingle(),
    db.from("disc_resultats").select("scores, updated_at").eq("profile_id", userId).maybeSingle(),
    db.from("idmc_resultats").select("scores, updated_at").eq("profile_id", userId).maybeSingle(),
    fetchLatestSoftSkillsResult(db, userId, "scores, taken_at"),
    db.from("experiences_pro").select("*").eq("learner_id", userId),
    db.from("diplomes").select("*").eq("learner_id", userId),
  ]);

  return NextResponse.json({
    preview: Boolean(preview),
    userId,
    profile: profileRes.data ?? null,
    disc: discRes.data ?? null,
    idmc: idmcRes.data ?? null,
    softSkills: softRes ?? null,
    experiences: expRes.data ?? [],
    diplomes: dipRes.data ?? [],
  });
}
