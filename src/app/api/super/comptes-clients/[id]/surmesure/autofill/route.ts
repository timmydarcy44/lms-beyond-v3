import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { generateJSON } from "@/lib/ai/openai-client";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";
import {
  formatOrgContextForPrompt,
  loadSurMesureOrgContext,
} from "@/lib/training-courses/surmesure-org-context";

export const dynamic = "force-dynamic";

const SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    short_description: { type: "string" },
    duration: { type: "string" },
    level: { type: "string" },
    domain: { type: "string" },
    prerequisites: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 8 },
    specific_needs: { type: "string" },
    objectives: { type: "array", items: { type: "string" }, minItems: 4, maxItems: 10 },
    audience: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 6 },
    skills: { type: "array", items: { type: "string" }, minItems: 4, maxItems: 12 },
    formats: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 4 },
    intra_price: { type: "number" },
    inter_price: { type: "number" },
  },
  required: [
    "title",
    "short_description",
    "duration",
    "level",
    "domain",
    "prerequisites",
    "objectives",
    "audience",
    "skills",
    "formats",
  ],
};

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: orgId } = await context.params;
  const supabase = await getServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user || !(await isSuperAdmin())) {
    return NextResponse.json({ error: "Réservé au staff Byound" }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    prompt?: string;
    company?: { name?: string; siret?: string; sector?: string; naf?: string; city?: string };
  };
  const prompt = String(body.prompt ?? "").trim();
  if (prompt.length < 20) {
    return NextResponse.json(
      { error: "Décrivez le besoin client en au moins 20 caractères." },
      { status: 400 },
    );
  }

  const service = getServiceRoleClient();
  const loaded = service ? await loadSurMesureOrgContext(service, orgId) : null;
  const orgCtx = {
    name: String(body.company?.name ?? loaded?.name ?? "Entreprise").trim() || "Entreprise",
    siret: String(body.company?.siret ?? loaded?.siret ?? "").replace(/\D/g, "") || null,
    sector: String(body.company?.sector ?? loaded?.sector ?? "").trim() || null,
    naf: String(body.company?.naf ?? loaded?.naf ?? "").trim() || null,
    city: String(body.company?.city ?? loaded?.city ?? "").trim() || null,
  };

  const systemPrompt =
    "Tu es ingénieur pédagogique Qualiopi pour Byound Business (France). " +
    "À partir d'un brief commercial / client ET du contexte entreprise (SIRET, secteur, NAF), " +
    "propose une fiche formation Sur-mesure complète, ancrée dans le métier et le vocabulaire du secteur. " +
    "Réponds UNIQUEMENT en JSON valide, en français. " +
    "objectifs = objectifs pédagogiques mesurables (verbes d'action). " +
    "prerequisites = prérequis concrets (un item = une phrase courte). " +
    "skills = compétences visées. audience = publics cibles. " +
    "formats inclut souvent « Sur mesure ». Prix en euros HT (intra = forfait groupe, inter = /participant). " +
    "specific_needs = adaptations éventuelles (accessibilité, rythme) ou chaîne vide. " +
    "Adapte exemples, enjeux et formulations au secteur d'activité (ex. industrie ≠ retail ≠ services).";

  const userPrompt = `Contexte entreprise (compte client Byound) :
${formatOrgContextForPrompt(orgCtx)}

Brief commercial / client pour une formation Sur-mesure Byound :

${prompt}

Remplis la fiche Qualiopi (titre, description, durée, niveau, domaine, prérequis, besoins spécifiques, objectifs, public, compétences, formats, prix), en tenant compte du SIRET / secteur / NAF ci-dessus.`;

  const result = await generateJSON<Record<string, unknown>>(userPrompt, SCHEMA, systemPrompt);
  if (!result) {
    return NextResponse.json({ error: "IA indisponible — vérifiez OPENAI_API_KEY" }, { status: 503 });
  }

  const asList = (raw: unknown) =>
    Array.isArray(raw) ? raw.map(String).map((s) => s.trim()).filter(Boolean) : [];

  return NextResponse.json({
    draft: {
      title: String(result.title ?? "").trim(),
      short_description: String(result.short_description ?? "").trim(),
      duration: String(result.duration ?? "2 jours").trim(),
      level: String(result.level ?? "Intermédiaire").trim(),
      domain: String(result.domain ?? "").trim(),
      prerequisites: asList(result.prerequisites),
      specific_needs: String(result.specific_needs ?? "").trim(),
      objectives: asList(result.objectives),
      audience: asList(result.audience),
      skills: asList(result.skills),
      formats: asList(result.formats).length ? asList(result.formats) : ["Sur mesure"],
      intra_price:
        result.intra_price != null && Number.isFinite(Number(result.intra_price))
          ? Number(result.intra_price)
          : null,
      inter_price:
        result.inter_price != null && Number.isFinite(Number(result.inter_price))
          ? Number(result.inter_price)
          : null,
    },
    company: orgCtx,
  });
}
