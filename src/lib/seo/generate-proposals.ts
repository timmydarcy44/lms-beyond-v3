import { randomUUID } from "node:crypto";
import { generateJSON } from "@/lib/ai/openai-client";
import { loadSeoPage, seoScore } from "@/lib/seo/byound-seo";
import { seoDraftFromPage, type SeoDraftFields } from "@/lib/seo/draft";
import { asPlainText, proposalViolatesSource } from "@/lib/seo/proposal-safety";
import type { SeoProposalField, SeoProposalRecord } from "@/lib/seo/proposals";
import { getServiceRoleClient } from "@/lib/supabase/server";

type CurrentInput = Partial<SeoDraftFields>;

function sourceCorpus(page: ReturnType<typeof seoDraftFromPage>, text: string) {
  return [
    page.title,
    page.meta_description,
    page.h1,
    page.h2.join(" "),
    page.ai_summary,
    page.faq.map((item) => `${item.question} ${item.answer}`).join(" "),
    text,
  ].join("\n");
}

function parseFaq(raw: unknown): Array<{ question: string; answer: string }> {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    const question = asPlainText(row.question);
    const answer = asPlainText(row.answer);
    return question && answer ? [{ question, answer }] : [];
  });
}

export async function generateSeoProposals(opts: {
  path: string;
  batchId?: string | null;
  current?: CurrentInput;
}): Promise<{ proposals: SeoProposalRecord[]; skipped: SeoProposalField[] }> {
  const published = await loadSeoPage(opts.path);
  const current: SeoDraftFields = {
    ...seoDraftFromPage(published),
    ...(published.draft ?? {}),
    ...opts.current,
  };
  const scored = seoScore({ ...published, ...current }, []);
  const failing = scored.checks.filter((item) => !item.passed).map((item) => item.message);
  const pageText = (published.headings_cache?.text ?? "").slice(0, 4000);
  const source = sourceCorpus(current, pageText);
  const generated = await generateJSON(
    `Page publique Byound : https://www.byound.fr${opts.path === "/" ? "/" : opts.path}
Mot-clé principal : ${current.focus_keyword || "(aucun)"}
Titre actuel : ${current.title}
Description actuelle : ${current.meta_description}
Résumé IA actuel : ${current.ai_summary}
FAQ actuelle : ${JSON.stringify(current.faq)}
Contrôles en échec : ${failing.join(" | ") || "aucun"}
Contenu réel de la page (extrait) :
${pageText || "(HTML non encore lu : s'appuyer uniquement sur les champs ci-dessus, sans inventer)"}

Propose un JSON avec :
- title (50 à 60 caractères, inclure le mot-clé s'il existe)
- meta_description (140 à 160 caractères, inclure le mot-clé s'il existe)
- ai_summary (80 à 180 mots, vouvoiement, pour llms.txt)
- faq : 2 ou 3 objets { question, answer }

Règles strictes :
- français vouvoiement, factuel
- n'inventez jamais de chiffres, de prix, de durées, de taux ou de promesses absents du contenu
- pas de superlatif (n°1, garanti, 100%)
- chaque champ est une chaîne, jamais un objet imbriqué`,
    {
      type: "object",
      properties: {
        title: { type: "string" },
        meta_description: { type: "string" },
        ai_summary: { type: "string" },
        faq: {
          type: "array",
          items: { type: "object", properties: { question: { type: "string" }, answer: { type: "string" } } },
        },
      },
    },
    "Tu es Byound AI, rédacteur SEO. Tu ne cites que des faits présents dans le contenu fourni.",
  );
  if (!generated) throw new Error("Génération IA indisponible.");
  const row = generated as Record<string, unknown>;
  const candidates: Array<{ field: SeoProposalField; old_value: unknown; new_value: unknown; text: string }> = [];
  const title = asPlainText(row.title);
  const description = asPlainText(row.meta_description);
  const summary = asPlainText(row.ai_summary);
  const faq = parseFaq(row.faq).filter((item) => !proposalViolatesSource(`${item.question} ${item.answer}`, source));
  if (title && !proposalViolatesSource(title, source) && title !== current.title) {
    candidates.push({ field: "title", old_value: current.title, new_value: title, text: title });
  }
  if (description && !proposalViolatesSource(description, source) && description !== current.meta_description) {
    candidates.push({ field: "meta_description", old_value: current.meta_description, new_value: description, text: description });
  }
  if (summary && !proposalViolatesSource(summary, source) && summary !== current.ai_summary) {
    candidates.push({ field: "ai_summary", old_value: current.ai_summary, new_value: summary, text: summary });
  }
  if (faq.length >= 2) {
    candidates.push({ field: "faq", old_value: current.faq, new_value: faq, text: faq.map((item) => item.question).join(" ") });
  }
  const skipped: SeoProposalField[] = (["title", "meta_description", "ai_summary", "faq"] as SeoProposalField[]).filter(
    (field) => !candidates.some((item) => item.field === field),
  );
  const batchId = opts.batchId ?? randomUUID();
  const db = getServiceRoleClient();
  const proposals: SeoProposalRecord[] = [];
  for (const item of candidates) {
    const id = randomUUID();
    const record: SeoProposalRecord = {
      id,
      path: opts.path,
      batch_id: batchId,
      field: item.field,
      old_value: item.old_value,
      new_value: item.new_value,
      status: "pending",
    };
    if (db) {
      await db.from("seo_ai_proposals").insert({
        id,
        path: opts.path,
        batch_id: batchId,
        field: item.field,
        old_value: item.old_value,
        new_value: item.new_value,
        status: "pending",
      });
    }
    proposals.push(record);
  }
  return { proposals, skipped };
}
