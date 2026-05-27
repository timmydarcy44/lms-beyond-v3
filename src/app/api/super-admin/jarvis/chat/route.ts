import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getOpenAIClient } from "@/lib/ai/openai-client";
import { getJarvisSuperContext } from "@/lib/crm/jarvis-context";

const SUPER_KNOWLEDGE = `
Espace /super — sections principales :
- Dashboard /super : KPIs, actions rapides
- CRM /super/utilisateurs : contacts (table type Pipedrive)
- CRM Pipeline BTOB /super/crm/pipeline : ventes (A appeler → Réussi/Échec), bandeau CA dès « Proposition envoyé »
- CRM Pipeline BTOC /super/crm/pipeline?type=btoc : Inscription → Badge passé → Paiement (sync auto DB)
- CRM Validators /super/crm/validators : table validators (experts validateurs badges)
- CRM Emails /super/crm/emails : envoi Resend (tous, segment, individuel)
- Organisations /super/organisations
- Open Badges /super/open-badges/badgeclasses : création badges, QCM, validateurs
- IA /super/ia, Chiffre d'affaires /super/chiffre-affaires, Statistiques /super/statistiques
- Premium (Beyond Care, Connect, Play, Note), Paramètres, CMS /super/pages
`;

export async function POST(req: NextRequest) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const body = (await req.json().catch(() => null)) as {
    message?: string;
    history?: Array<{ role: string; content: string }>;
  } | null;

  const message = body?.message?.trim();
  if (!message) {
    return NextResponse.json({ error: "Message requis" }, { status: 400 });
  }

  const liveContext = await getJarvisSuperContext().catch(() => null);

  const openai = getOpenAIClient();
  if (!openai) {
    return NextResponse.json({
      reply:
        "JARVIS Super : OpenAI n'est pas configuré. Je peux quand même vous orienter : CRM → /super/utilisateurs, Pipeline → /super/crm/pipeline, Badges → /super/open-badges/badgeclasses.",
    });
  }

  const system = [
    "Tu es JARVIS, assistant du super-admin Beyond LMS.",
    "Tu connais tout l'espace /super et tu aides à la gestion (CRM, badges, orgs, emails).",
    "Pour les effectifs (formateurs, apprenants, etc.), utilise UNIQUEMENT liveContext.totals et liveContext.usersByRole — pas d'autres sources.",
    "formateursTotal = formateurs réels (profil instructor). instructorsFromMemberships peut être 0 si le formateur n'est pas rattaché à une org.",
    "Réponds en français, concis, actionnable. Propose des liens relatifs quand pertinent (/super/...).",
    SUPER_KNOWLEDGE,
    `CONTEXTE LIVE (JSON): ${JSON.stringify(liveContext)}`,
  ].join("\n");

  const history = (body?.history ?? []).slice(-8).map((h) => ({
    role: h.role === "user" ? ("user" as const) : ("assistant" as const),
    content: h.content,
  }));

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: system }, ...history, { role: "user", content: message }],
      max_tokens: 900,
    });

    return NextResponse.json({
      reply: completion.choices[0]?.message?.content?.trim() || "Je n'ai pas de réponse.",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
