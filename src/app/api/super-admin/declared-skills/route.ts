import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClient } from "@/lib/supabase/server";
import {
  getSkillDeclarationStatus,
  mergeDeclaredPortfolio,
  type StoredHardSkillMeta,
} from "@/lib/hard-skills/hard-skills-portfolio";
import { canonicalSkillName, foldSkillKey } from "@/lib/hard-skills/skill-catalog-policy";

export const dynamic = "force-dynamic";

type SkillRow = {
  skill: string;
  category: string;
  declarations: number;
  withProof: number;
  hasBadge: boolean;
  lastActivity: string | null;
};

function csvCell(value: string | number | boolean) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

export async function GET(request: NextRequest) {
  if (!(await isSuperAdmin())) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const [profilesRes, badgesRes, suggestionsRes] = await Promise.all([
    service.from("profiles").select("hard_skills, skills_metadata"),
    service.from("open_badges").select("name"),
    service.from("skill_suggestions").select("id, user_id, label, status, merged_into, created_at").order("created_at", { ascending: false }),
  ]);

  const badgeNames = new Set((badgesRes.data ?? []).map((row) => foldSkillKey(String(row.name ?? ""))).filter(Boolean));
  const aggregate = new Map<string, SkillRow>();
  let before = 0;
  let after = 0;
  let proofsBefore = 0;
  let proofsAfter = 0;

  for (const profile of profilesRes.data ?? []) {
    const names = Array.isArray(profile.hard_skills) ? (profile.hard_skills as string[]) : [];
    const meta = (profile.skills_metadata as Record<string, StoredHardSkillMeta> | null) ?? {};
    const merged = mergeDeclaredPortfolio(names, meta);
    before += merged.before;
    after += merged.after;
    proofsBefore += merged.proofsBefore;
    proofsAfter += merged.proofsAfter;
    for (const skill of merged.names) {
      const row = merged.meta[skill];
      const status = getSkillDeclarationStatus(row, {
        badgeEarned: badgeNames.has(foldSkillKey(skill)),
      });
      const current = aggregate.get(skill) ?? {
        skill,
        category: row?.category ?? "Autre",
        declarations: 0,
        withProof: 0,
        hasBadge: badgeNames.has(foldSkillKey(skill)),
        lastActivity: null,
      };
      current.declarations += 1;
      if (status.proofCount > 0) current.withProof += 1;
      const activity = (row?.proofs ?? []).map((proof) => proof.createdAt).filter(Boolean).sort().at(-1) ?? null;
      if (activity && (!current.lastActivity || activity > current.lastActivity)) current.lastActivity = activity;
      aggregate.set(skill, current);
    }
  }

  const skills = [...aggregate.values()].sort((a, b) => b.declarations - a.declarations || a.skill.localeCompare(b.skill, "fr"));
  const suggestions = suggestionsRes.data ?? [];

  if (request.nextUrl.searchParams.get("format") === "csv") {
    const header = ["competence", "categorie", "declarations", "avec_preuve", "badge", "derniere_activite"];
    const lines = skills.map((row) =>
      [row.skill, row.category, row.declarations, row.withProof, row.hasBadge ? "oui" : "non", row.lastActivity ?? ""].map(csvCell).join(","),
    );
    return new NextResponse([header.join(","), ...lines].join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=competences-declarees.csv",
      },
    });
  }

  return NextResponse.json({
    skills,
    suggestions,
    counts: { before, after, proofsBefore, proofsAfter },
  });
}

export async function POST(request: NextRequest) {
  if (!(await isSuperAdmin())) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const body = (await request.json().catch(() => null)) as {
    action?: "add" | "merge";
    ids?: string[];
    category?: string;
    canonical?: string;
  } | null;
  const ids = (body?.ids ?? []).filter(Boolean);
  if (!ids.length) return NextResponse.json({ error: "Aucune suggestion" }, { status: 400 });

  const { data: rows, error } = await service.from("skill_suggestions").select("id, label").in("id", ids);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  if (body?.action === "add") {
    const category = String(body.category ?? "Autre").trim() || "Autre";
    for (const row of rows ?? []) {
      const label = canonicalSkillName(String(row.label ?? ""));
      if (!label) continue;
      await service.from("skill_catalog_additions").upsert({ label, category }, { onConflict: "label" });
    }
    await service.from("skill_suggestions").update({ status: "added" }).in("id", ids);
    return NextResponse.json({ ok: true });
  }

  if (body?.action === "merge") {
    const canonical = canonicalSkillName(String(body.canonical ?? "").trim());
    if (!canonical) return NextResponse.json({ error: "Compétence cible requise" }, { status: 400 });
    for (const row of rows ?? []) {
      const alias = String(row.label ?? "").trim();
      if (!alias || foldSkillKey(alias) === foldSkillKey(canonical)) continue;
      await service.from("skill_catalog_aliases").upsert({ alias, canonical }, { onConflict: "alias" });
    }
    await service.from("skill_suggestions").update({ status: "merged", merged_into: canonical }).in("id", ids);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
}
