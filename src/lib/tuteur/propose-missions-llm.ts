import { generateJSON } from "@/lib/ai/openai-client";
import type { CompanyContext, CursusSkill, ProposedMission } from "@/lib/tuteur/cursus-missions";
import { proposeCursusMissions } from "@/lib/tuteur/cursus-missions";

type LlmMission = {
  code?: string;
  competency?: string;
  title?: string;
  description?: string;
  deliverable?: string;
  skill_id?: string;
};

/** Propose un catalogue de missions entreprise, contextualisé au secteur. */
export async function proposeMissionsWithLlm(
  skills: CursusSkill[],
  company: CompanyContext | null,
): Promise<ProposedMission[]> {
  if (!skills.length) return [];

  const fallback = () => proposeCursusMissions(skills, company);

  const companyLine = company
    ? `${company.name}${company.city ? `, ${company.city}` : ""} — secteur : ${company.sector}`
    : "Entreprise d’accueil non renseignée";

  const result = await generateJSON(
    `Entreprise d'accueil : ${companyLine}

Compétences / blocs du référentiel (fiche cursus) :
${JSON.stringify(skills.map((s) => ({ id: s.id, code: s.code, title: s.title, brief: s.brief })))}

Génère entre ${Math.min(4, skills.length)} et ${Math.min(8, Math.max(4, skills.length))} missions concrètes
que le tuteur pourra sélectionner pour composer le catalogue de l'alternant.
Chaque mission doit :
- coller au référentiel (skill_id parmi la liste)
- coller au secteur / usages de l'entreprise
- avoir un livrable vérifiable (document, démo, fichier, compte-rendu…)
- être réaliste pour un alternant

JSON : { "missions": [ { "skill_id": "...", "code": "...", "competency": "...", "title": "...", "description": "...", "deliverable": "..." } ] }`,
    {
      type: "object",
      properties: {
        missions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              skill_id: { type: "string" },
              code: { type: "string" },
              competency: { type: "string" },
              title: { type: "string" },
              description: { type: "string" },
              deliverable: { type: "string" },
            },
          },
        },
      },
      required: ["missions"],
    },
    `Tu es pédagogue CFA + expert métier.
Tu proposes des missions en entreprise pour un maître d'apprentissage.
Pas de jargon RH vide. Des livrables concrets.
Réponds uniquement en JSON.`,
  );

  if (!result || typeof result !== "object") return fallback();
  const rows = Array.isArray((result as { missions?: unknown }).missions)
    ? ((result as { missions: LlmMission[] }).missions ?? [])
    : [];
  if (!rows.length) return fallback();

  const byId = new Map(skills.map((s) => [s.id, s]));
  const mapped: ProposedMission[] = [];
  for (const [index, row] of rows.entries()) {
    const skill = row.skill_id ? byId.get(String(row.skill_id)) : null;
    const title = String(row.title ?? "").trim();
    if (!title) continue;
    const base = skill ?? skills[index % skills.length];
    mapped.push({
      id: `ai-${base.id}-${index}`,
      code: String(row.code ?? base.code ?? `M${index + 1}`).trim() || `M${index + 1}`,
      competency: String(row.competency ?? base.title).trim() || base.title,
      title,
      description:
        String(row.description ?? "").trim() ||
        `${base.brief}. À mener dans le contexte de ${company?.name ?? "l’entreprise d’accueil"}.`,
      deliverable: String(row.deliverable ?? "").trim() || "Compte rendu de mission",
    });
  }

  return mapped.length ? mapped : fallback();
}
