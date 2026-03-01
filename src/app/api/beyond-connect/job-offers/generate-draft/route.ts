import { NextRequest, NextResponse } from "next/server";
import { getOpenAIClient } from "@/lib/ai/openai-client";

const DIMENSIONS = [
  "Gestion des émotions",
  "Communication",
  "Persévérance",
  "Organisation",
  "Empathie",
  "Résolution de problèmes",
  "Collaboration",
  "Créativité",
  "Leadership",
  "Confiance en soi",
];

const CONTRACT_TYPES = ["Apprentissage", "Stage", "CDI", "CDD", "Freelance / Mission"];
const REMOTE_TYPES = ["Aucun", "Hybride", "Full remote"];

function safeJsonParse(input: string) {
  try {
    return JSON.parse(input);
  } catch {
    const match = input.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      prompt,
      culture_tags,
      perks,
      vision,
      tone,
      city,
      salary_min,
      salary_max,
      remote_policy,
      weekend_work,
      contract_type,
      daily_rate,
      mission_duration,
    } = body ?? {};

    if (!prompt) {
      return NextResponse.json({ error: "Le prompt est requis." }, { status: 400 });
    }

    const openai = getOpenAIClient();
    if (!openai) {
      return NextResponse.json({ error: "OpenAI non configuré." }, { status: 500 });
    }

    const system =
      "Tu es un expert RH. Rédige une offre d'emploi captivante et humaine. Évite le jargon trop formel. Utilise un ton qui donne envie de rejoindre l'aventure. Si le contrat est Freelance, adopte un ton expert orienté résultats et autonomie. Réponds en JSON strict sans texte supplémentaire.";
    const user = `Prompt: ${prompt}
Vision: ${vision || "Non précisée"}
Ambiance: ${Array.isArray(culture_tags) ? culture_tags.join(", ") : "Non précisé"}
Avantages: ${Array.isArray(perks) ? perks.join(", ") : "Non précisé"}
Ton: ${tone || "Institutionnel"}
Ville (si connue): ${city || "Non précisée"}
Salaire (si connu): ${salary_min || "?"} - ${salary_max || "?"}
TJM (si connu): ${daily_rate || "Non précisé"}
Durée mission (si connue): ${mission_duration || "Non précisée"}
Télétravail: ${remote_policy || "Non précisé"}
Travail le week-end: ${weekend_work || "Non précisé"}
Type de contrat (si connu): ${contract_type || "Non précisé"}
Contraintes:
- contract_type doit être parmi: ${CONTRACT_TYPES.join(", ")}
- remote doit être parmi: ${REMOTE_TYPES.join(", ")}
- soft_skills: 5 éléments parmi: ${DIMENSIONS.join(", ")} (si freelance, prioriser Organisation et Résolution de problèmes)
Format attendu:
{
  "title": "string",
  "city": "string",
  "contract_type": "Apprentissage|Stage|CDI|CDD|Freelance / Mission",
  "salary_min": number | null,
  "salary_max": number | null,
  "daily_rate": number | null,
  "mission_duration": "string",
  "remote": "Aucun|Hybride|Full remote",
  "remote_policy": "Jamais|Hybride|Full Remote|À négocier",
  "weekend_work": "Jamais|De temps en temps|Régulier",
  "hook": "L'opportunité (Pourquoi ce poste est génial)",
  "body": "Le quotidien (Tes futures victoires)\\nCe que tu apportes (Ton mindset avant tes diplômes)\\nLe deal (Le cadre de travail)\\nPhrase d'accroche forte finale.",
  "why_join": "string",
  "soft_skills": ["...","...","...","...","..."]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      max_tokens: 600,
    });

    const content = response.choices[0]?.message?.content ?? "";
    const parsed = safeJsonParse(content);
    if (!parsed) {
      return NextResponse.json({ error: "Réponse IA invalide." }, { status: 502 });
    }

    let softSkills = Array.isArray(parsed.soft_skills)
      ? parsed.soft_skills.filter((skill: string) => DIMENSIONS.includes(skill)).slice(0, 5)
      : [];
    const isFreelance = (parsed.contract_type || contract_type || "").includes("Freelance");
    if (isFreelance) {
      const mustHave = ["Organisation", "Résolution de problèmes"];
      mustHave.forEach((skill) => {
        if (!softSkills.includes(skill)) {
          softSkills = [skill, ...softSkills].slice(0, 5);
        }
      });
    }
    const hook = parsed.hook || "";
    const bodyText = parsed.body || "";
    const whyJoin = parsed.why_join || "";
    const description = [hook ? `Accroche\n${hook}` : "", bodyText ? `\n\nAnnonce\n${bodyText}` : "", whyJoin ? `\n\nPourquoi vous allez adorer nous rejoindre\n${whyJoin}` : ""]
      .filter(Boolean)
      .join("");

    return NextResponse.json({
      title: parsed.title || "",
      city: parsed.city || "",
      contract_type: CONTRACT_TYPES.includes(parsed.contract_type) ? parsed.contract_type : "Apprentissage",
      salary_min: typeof parsed.salary_min === "number" ? parsed.salary_min : null,
      salary_max: typeof parsed.salary_max === "number" ? parsed.salary_max : null,
      daily_rate: typeof parsed.daily_rate === "number" ? parsed.daily_rate : null,
      mission_duration: parsed.mission_duration || "",
      remote: REMOTE_TYPES.includes(parsed.remote) ? parsed.remote : "Aucun",
      remote_policy: parsed.remote_policy || remote_policy || "Jamais",
      weekend_work: parsed.weekend_work || weekend_work || "Jamais",
      description,
      hook,
      body: bodyText,
      why_join: whyJoin,
      soft_skills: softSkills,
    });
  } catch (error) {
    console.error("[beyond-connect/generate-draft] Error:", error);
    return NextResponse.json({ error: "Erreur lors de la génération." }, { status: 500 });
  }
}
