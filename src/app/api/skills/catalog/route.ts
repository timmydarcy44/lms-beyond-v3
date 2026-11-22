import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { buildCatalogPayload, loadActiveSkills } from "@/lib/skills/skill-catalog";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session?.id) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const skills = await loadActiveSkills();
  if (!skills.length) {
    return NextResponse.json(
      { error: "Référentiel indisponible. Applique la migration skill_referential_v2.", domains: [], softSkills: [] },
      { status: 503 },
    );
  }

  const payload = buildCatalogPayload(skills);

  // Compétences fréquentes selon la filière (specialization CFA) si dispo
  let frequent: Array<{ id: string; label: string }> = [];
  try {
    const db = getServiceRoleClient();
    if (db) {
      const { data: app } = await db
        .from("cfa_applications")
        .select("specialization")
        .or(`profile_id.eq.${session.id},user_id.eq.${session.id}`)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      const specialization = String((app as { specialization?: string } | null)?.specialization ?? "");
      const hints: Record<string, string[]> = {
        sport_business: ["Recherche de sponsors", "Dossier de partenariat", "Activation des partenaires", "Prospection à froid"],
        ai_business: ["Utiliser l'IA au quotidien", "Rédiger des prompts", "Automatiser des tâches", "Prospection à froid"],
        real_estate: ["Prise de mandat", "Visites et négociation immobilière", "Estimation d'un bien", "Prospection à froid"],
      };
      const wanted = hints[specialization] ?? ["Prospection à froid", "Découverte des besoins", "Utilisation d'un CRM", "Fixer des objectifs"];
      frequent = wanted
        .map((label) => skills.find((s) => s.label.toLowerCase() === label.toLowerCase()))
        .filter(Boolean)
        .map((s) => ({ id: s!.id, label: s!.label }));
    }
  } catch {
    frequent = [];
  }

  return NextResponse.json({ ...payload, frequent });
}
