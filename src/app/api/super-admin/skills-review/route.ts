import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { normalizeSkillText } from "@/lib/skills/normalize";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isSuperAdmin())) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ error: "NO_DB" }, { status: 503 });

  const [{ data: pending }, { data: skills }, { data: domains }] = await Promise.all([
    db
      .from("skill_declarations")
      .select("id, raw_label, kind, created_at, user_id")
      .eq("match_status", "pending_review")
      .order("created_at", { ascending: false })
      .limit(2000),
    db
      .from("skills")
      .select("id, label, is_soft, skill_domains(label)")
      .eq("is_active", true)
      .order("label"),
    db.from("skill_domains").select("id, slug, label, position").order("position"),
  ]);

  const groupsMap = new Map<string, { raw_label: string; count: number; ids: string[]; kind: string }>();
  for (const row of pending ?? []) {
    const key = normalizeSkillText(String(row.raw_label));
    const prev = groupsMap.get(key);
    if (prev) {
      prev.count += 1;
      prev.ids.push(String(row.id));
    } else {
      groupsMap.set(key, {
        raw_label: String(row.raw_label),
        count: 1,
        ids: [String(row.id)],
        kind: String(row.kind),
      });
    }
  }

  return NextResponse.json({
    groups: [...groupsMap.values()].sort((a, b) => b.count - a.count),
    skills: (skills ?? []).map((s) => ({
      id: s.id,
      label: s.label,
      is_soft: s.is_soft,
      domain: (s.skill_domains as { label?: string } | null)?.label ?? "",
    })),
    domains: domains ?? [],
  });
}

export async function POST(request: NextRequest) {
  if (!(await isSuperAdmin())) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ error: "NO_DB" }, { status: 503 });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const action = String(body?.action ?? "");
  const ids = Array.isArray(body?.ids) ? body.ids.map((id) => String(id)) : [];
  if (!ids.length) return NextResponse.json({ error: "ids manquants" }, { status: 400 });

  if (action === "ignore") {
    const { error } = await db
      .from("skill_declarations")
      .update({ match_status: "kept_raw", updated_at: new Date().toISOString() })
      .in("id", ids);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  if (action === "attach") {
    const skillId = String(body?.skill_id ?? "");
    if (!skillId) return NextResponse.json({ error: "skill_id manquant" }, { status: 400 });
    const { data: skill } = await db.from("skills").select("id, aliases").eq("id", skillId).maybeSingle();
    if (!skill) return NextResponse.json({ error: "Compétence introuvable" }, { status: 404 });

    const { data: rows } = await db.from("skill_declarations").select("raw_label").in("id", ids);
    const aliases = new Set<string>(Array.isArray(skill.aliases) ? (skill.aliases as string[]) : []);
    for (const row of rows ?? []) {
      const label = String(row.raw_label ?? "").trim();
      if (label) aliases.add(label);
    }
    await db.from("skills").update({ aliases: [...aliases] }).eq("id", skillId);
    const { error } = await db
      .from("skill_declarations")
      .update({
        skill_id: skillId,
        match_status: "matched",
        match_confidence: 1,
        updated_at: new Date().toISOString(),
      })
      .in("id", ids);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  if (action === "create") {
    const label = String(body?.label ?? "").trim();
    const domainId = String(body?.domain_id ?? "").trim();
    const description = String(body?.description ?? "").trim();
    const isSoft = Boolean(body?.is_soft);
    if (!label || !domainId) {
      return NextResponse.json({ error: "label et domain_id requis" }, { status: 400 });
    }
    const slug = label
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const { data: rows } = await db.from("skill_declarations").select("raw_label").in("id", ids);
    const aliases = [...new Set((rows ?? []).map((r) => String(r.raw_label).trim()).filter(Boolean))];
    const { data: created, error: createError } = await db
      .from("skills")
      .insert({
        domain_id: domainId,
        slug,
        label,
        description,
        aliases,
        is_soft: isSoft,
        is_active: true,
      })
      .select("id")
      .single();
    if (createError || !created) {
      return NextResponse.json({ error: createError?.message || "Création impossible" }, { status: 400 });
    }
    const { error } = await db
      .from("skill_declarations")
      .update({
        skill_id: created.id,
        match_status: "matched",
        match_confidence: 1,
        kind: isSoft ? "soft" : "hard",
        updated_at: new Date().toISOString(),
      })
      .in("id", ids);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true, skill_id: created.id });
  }

  return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
}
