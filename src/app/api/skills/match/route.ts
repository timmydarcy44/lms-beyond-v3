import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { loadActiveSkills, matchSkillsLocally } from "@/lib/skills/skill-catalog";
import {
  consumeMatchRateLimit,
  getCachedMatch,
  matchSkillsWithLlm,
  setCachedMatch,
} from "@/lib/skills/skill-match-llm";
import { normalizeSkillText } from "@/lib/skills/normalize";

export const dynamic = "force-dynamic";

function serialize(skill: {
  id: string;
  label: string;
  description: string;
  domain_label: string;
}, confidence: number) {
  return {
    skill_id: skill.id,
    label: skill.label,
    description: skill.description,
    domain_label: skill.domain_label,
    confidence,
  };
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.id) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const text = String(body?.text ?? "").trim();
  const kind = body?.kind === "soft" ? "soft" : "hard";
  // Sécurité : n'accepte que text + kind
  if (text.length < 3) {
    return NextResponse.json({ best: null, alternatives: [], keepRawSuggested: true });
  }
  if (!consumeMatchRateLimit(session.id)) {
    return NextResponse.json({ error: "Trop de requêtes. Réessaie dans une minute." }, { status: 429 });
  }

  const cacheKey = `${kind}:${normalizeSkillText(text)}`;
  const cached = getCachedMatch(cacheKey);
  if (cached) return NextResponse.json(cached);

  const skills = await loadActiveSkills();
  if (!skills.length) {
    return NextResponse.json({ best: null, alternatives: [], keepRawSuggested: true });
  }

  const local = matchSkillsLocally(text, skills, kind);
  if (local[0]?.confidence >= 0.95) {
    const payload = {
      best: serialize(local[0].skill, local[0].confidence),
      alternatives: local.slice(1, 3).map((m) => serialize(m.skill, m.confidence)),
      keepRawSuggested: false,
    };
    setCachedMatch(cacheKey, payload);
    return NextResponse.json(payload);
  }

  const llm = await matchSkillsWithLlm(
    text,
    skills.filter((s) => (kind === "soft" ? s.is_soft : !s.is_soft)),
  );

  const byId = new Map(skills.map((s) => [s.id, s]));
  let best = llm?.best && byId.has(llm.best.skill_id)
    ? serialize(byId.get(llm.best.skill_id)!, llm.best.confidence)
    : local[0]
      ? serialize(local[0].skill, local[0].confidence)
      : null;

  const altIds = new Set<string>();
  const alternatives = [];
  for (const a of llm?.alternatives ?? []) {
    const skill = byId.get(a.skill_id);
    if (!skill || skill.id === best?.skill_id || altIds.has(skill.id)) continue;
    altIds.add(skill.id);
    alternatives.push(serialize(skill, a.confidence ?? 0.5));
  }
  for (const m of local.slice(best ? 0 : 1)) {
    if (alternatives.length >= 2) break;
    if (m.skill.id === best?.skill_id || altIds.has(m.skill.id)) continue;
    altIds.add(m.skill.id);
    alternatives.push(serialize(m.skill, m.confidence));
  }

  if (best && best.confidence < 0.6) {
    // Ne pas afficher « On a compris »
    alternatives.unshift(best);
    best = null;
  }

  const payload = {
    best,
    alternatives: alternatives.slice(0, 2),
    keepRawSuggested: !best || (best.confidence ?? 0) < 0.6,
  };
  setCachedMatch(cacheKey, payload);
  return NextResponse.json(payload);
}
