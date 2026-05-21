import { NextRequest, NextResponse } from "next/server";
import OpenAI, { APIError } from "openai";

export const maxDuration = 90;

const OPENAI_MODEL = process.env.BEYOND_IA_OPENAI_MODEL?.trim() || "gpt-4o-mini";
const MAX_PREVIOUS_CONTENT_CHARS = 14_000;
const MAX_PROMPT_CHARS = 24_000;

/** Valeurs UI (modal chapitre / sous-chapitre). */
type ContentStructureUi = "standard" | "definitions" | "schema" | "table" | "scientific_sources";
/** Anciennes valeurs ou interne. */
type ContentStructureLegacy =
  | "text"
  | "definition_example"
  | "schema"
  | "table"
  | "scientific_evidence";

type Payload = {
  prompt?: string;
  previousContent?: string;
  mode?: "theory" | "theory_examples";
  /** Oriente le prompt IA (création de chapitre). */
  contentStructure?: ContentStructureUi | ContentStructureLegacy;
};

function asHtml(text: string) {
  const escaped = text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
  const paragraphs = escaped
    .split(/\n{2,}/g)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${p.replaceAll("\n", "<br />")}</p>`)
    .join("");
  return paragraphs || "<p></p>";
}

/** Titre qui annonce un schéma / processus (détection post-traitement). */
const SCHEMA_HEADING_HINT = /schéma|d[ée]marche|[ée]tapes?|processus|parcours|flux|diffusion/i;

const SCHEMA_ROW_STYLE =
  "display:flex;align-items:flex-start;gap:14px;padding:14px 12px;margin-bottom:10px;border-radius:14px;background:#fff;box-shadow:0 2px 10px rgba(15,23,42,0.07);border:1px solid rgba(226,232,240,0.95);";
const SCHEMA_BADGE_STYLE =
  "flex-shrink:0;width:2.5rem;height:2.5rem;border-radius:9999px;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#0369a1,#0ea5e9);color:#fff;font-weight:700;font-size:0.85rem;";
const SCHEMA_BODY_STYLE = "flex:1;min-width:0;color:#0f172a;font-size:0.95rem;line-height:1.55;";
const SCHEMA_WRAP_OPEN = `<div style="border:1px solid rgba(148,163,184,0.45);border-radius:18px;padding:18px 16px;margin:20px 0;background:linear-gradient(180deg,rgba(248,250,252,0.98) 0%,rgba(226,232,240,0.45) 100%);">`;

function buildSchemaFlexFrise(stepBodies: string[]): string {
  const rows = stepBodies
    .map((body, i) => {
      const n = i + 1;
      return `<div style="${SCHEMA_ROW_STYLE}"><div style="${SCHEMA_BADGE_STYLE}">${n}</div><div style="${SCHEMA_BODY_STYLE}">${body}</div></div>`;
    })
    .join("");
  return `${SCHEMA_WRAP_OPEN}${rows}</div>`;
}

/**
 * <ol> nue après un titre « schéma » → frise flex (pastilles + cartes).
 */
function upgradeSchemaOlToFlexCards(html: string): string {
  return html.replace(
    /<h([23])([^>]*)>([\s\S]*?)<\/h\1>\s*(?:<p\b[^>]*>[\s\S]*?<\/p>\s*)*(<ol\b[^>]*>[\s\S]*?<\/ol>)/gi,
    (full, level: string, hAttrs: string, titleInner: string, olBlock: string) => {
      if (!SCHEMA_HEADING_HINT.test(String(titleInner))) return full;
      if (/display\s*:\s*flex/i.test(olBlock)) return full;

      const olInner = olBlock.replace(/^<ol\b[^>]*>/i, "").replace(/<\/ol>\s*$/i, "");
      const steps: string[] = [];
      const liRe = /<li\b[^>]*>([\s\S]*?)<\/li>/gi;
      let m: RegExpExecArray | null;
      while ((m = liRe.exec(olInner)) !== null) {
        const chunk = String(m[1] ?? "").trim();
        if (chunk) steps.push(chunk);
      }
      if (steps.length < 2) return full;

      return `<h${level}${hAttrs}>${titleInner}</h${level}>${buildSchemaFlexFrise(steps)}`;
    },
  );
}

const stripTagsOneLine = (s: string) => String(s ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

/** L’utilisateur demande explicitement des définitions / exemples dans le texte du prompt. */
function promptRequestsPedagogicalCallouts(prompt: string): boolean {
  return /\b(définition|définir|définissez|exemple|exemples|illustrer|illustration|encadré|encadre)\b/i.test(
    prompt,
  );
}

const CALLOUT_DEFINITION_RE =
  /<div[^>]*class="[^"]*bg-red-50[^"]*"[^>]*>[\s\S]*?<\/div>/gi;
const CALLOUT_EXAMPLE_RE =
  /<div[^>]*class="[^"]*bg-green-50[^"]*"[^>]*>[\s\S]*?<\/div>/gi;

/** Retire les encarts rouge/vert et garde le texte intérieur en paragraphe simple. */
function stripPedagogicalCallouts(html: string): string {
  try {
    return stripPedagogicalCalloutsInner(html);
  } catch (e) {
    console.warn("[beyond-ia/generate-rich-content] stripPedagogicalCallouts failed", e);
    return html;
  }
}

function stripPedagogicalCalloutsInner(html: string): string {
  return html.replace(CALLOUT_DEFINITION_RE, (block) => {
    const inner = block
      .replace(/<div[^>]*>/i, "")
      .replace(/<\/div>\s*$/i, "")
      .replace(/<strong>\s*Définition\s*:\s*<\/strong>/gi, "")
      .trim();
    return inner ? `<p>${inner}</p>` : "";
  }).replace(CALLOUT_EXAMPLE_RE, (block) => {
    const inner = block
      .replace(/<div[^>]*>/i, "")
      .replace(/<\/div>\s*$/i, "")
      .replace(/<strong>\s*Exemple\s+concret\s*:\s*<\/strong>/gi, "")
      .trim();
    return inner ? `<p>${inner}</p>` : "";
  });
}

function truncateForContext(text: string, maxChars: number): string {
  const t = String(text ?? "").trim();
  if (t.length <= maxChars) return t;
  return `${t.slice(0, maxChars)}\n\n[… contenu tronqué pour la génération …]`;
}

function openAiErrorMessage(error: unknown): string {
  if (error instanceof APIError) {
    if (error.status === 429) {
      return "Quota ou limite OpenAI atteinte. Réessayez dans quelques minutes.";
    }
    if (error.status === 401) {
      return "Clé OpenAI invalide côté serveur.";
    }
    const msg = String(error.message ?? "").trim();
    if (msg && !/sk-[a-zA-Z0-9]/i.test(msg)) return msg.slice(0, 280);
  }
  if (error instanceof Error) {
    const msg = error.message.trim();
    if (msg && !/sk-[a-zA-Z0-9]/i.test(msg)) return msg.slice(0, 280);
  }
  return "Erreur serveur";
}

/**
 * <table> après un titre « schéma » (souvent confondu avec la règle « utilise des tableaux ») → même frise flex.
 */
function upgradeSchemaTableToFlexCards(html: string): string {
  return html.replace(
    /<h([23])([^>]*)>([\s\S]*?)<\/h\1>\s*(?:<p\b[^>]*>[\s\S]*?<\/p>\s*)*(<table\b[^>]*>[\s\S]*?<\/table>)/gi,
    (full, level: string, hAttrs: string, titleInner: string, tableBlock: string) => {
      if (!SCHEMA_HEADING_HINT.test(String(titleInner))) return full;
      if (/display\s*:\s*flex/i.test(tableBlock)) return full;

      let slice = tableBlock;
      const tbodyM = slice.match(/<tbody\b[^>]*>([\s\S]*?)<\/tbody>/i);
      if (tbodyM) slice = tbodyM[1];
      else slice = slice.replace(/^<table\b[^>]*>/i, "").replace(/<\/table>\s*$/i, "");

      const steps: string[] = [];
      const trRe = /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi;
      let trM: RegExpExecArray | null;
      while ((trM = trRe.exec(slice)) !== null) {
        const trInner = trM[1];
        const tds: string[] = [];
        const cellRe = /<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi;
        let c: RegExpExecArray | null;
        while ((c = cellRe.exec(trInner)) !== null) {
          tds.push(String(c[1] ?? "").trim());
        }
        if (tds.length === 0) continue;

        const rowHasOnlyTh = /<th\b/i.test(trInner) && !/<td\b/i.test(trInner);
        if (rowHasOnlyTh) {
          const joined = stripTagsOneLine(tds.join(" ")).toLowerCase();
          if (
            /étape.*description|description.*étape|step.*description|^#/.test(joined) ||
            /^(étape|step|ordre|n°|description|libellé|phase)\b/.test(joined)
          ) {
            continue;
          }
        }

        if (tds.length === 1) {
          steps.push(tds[0]);
        } else {
          const a = tds[0];
          const b = tds.slice(1).join(" ");
          const aPlain = stripTagsOneLine(a);
          if (/^\d+\.?$/.test(aPlain)) {
            steps.push(b);
          } else {
            steps.push(`<strong>${a}</strong> ${b}`);
          }
        }
      }

      if (steps.length < 2) return full;
      return `<h${level}${hAttrs}>${titleInner}</h${level}>${buildSchemaFlexFrise(steps)}`;
    },
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Payload;
    const prompt = truncateForContext(String(body?.prompt ?? ""), MAX_PROMPT_CHARS);
    const previousContent = truncateForContext(
      String(body?.previousContent ?? ""),
      MAX_PREVIOUS_CONTENT_CHARS,
    );
    const mode = body?.mode === "theory_examples" ? "theory_examples" : "theory";
    const rawStructure = body?.contentStructure;
    const structureKey: ContentStructureLegacy =
      rawStructure === "definitions" || rawStructure === "definition_example"
        ? "definition_example"
        : rawStructure === "scientific_sources" || rawStructure === "scientific_evidence"
          ? "scientific_evidence"
          : rawStructure === "schema"
            ? "schema"
            : rawStructure === "table"
              ? "table"
              : "text";
    if (prompt.length < 10) {
      return NextResponse.json(
        { success: false, error: "Prompt trop court (min 10 caractères)." },
        { status: 400 },
      );
    }

    const structureRules =
      structureKey === "definition_example"
        ? [
            "TYPE DE CONTENU : Théorie + définitions + exemples.",
            "- Priorité absolue aux encarts Définition et Exemple concret (alterner ou combiner selon le sujet).",
            "- Corps du texte plus court : sert surtout à introduire chaque notion avant l’encart.",
          ]
        : structureKey === "schema"
          ? [
              "TYPE DE CONTENU : Théorie avec SCHÉMA VISUEL (frise / processus). Une simple <ol> ou liste numérotée sous un titre « schéma » est REFUSÉE : ce n’est pas un schéma, c’est une liste.",
              "",
              "OBLIGATION SCHÉMA (non négociable) :",
              "- Après une introduction courte (1–2 <p>), insère un <h3> dont le titre contient le mot « Schéma » ou « Démarche » ou « Étapes » (ex. « Schéma des étapes de … »).",
              "- Immédiatement sous ce <h3> : un conteneur <div> avec style inline (fond gris très clair, bordure slate, border-radius 18px, padding). À l’intérieur : une rangée par étape.",
              "- Chaque étape = un <div> avec style display:flex;align-items:flex-start;gap:14px;padding:14px 12px;margin-bottom:10px;border-radius:14px;background:#fff;box-shadow:0 2px 10px rgba(15,23,42,0.07);border:1px solid rgba(226,232,240,0.95);",
              "  • Colonne gauche : pastille <div style=\"flex-shrink:0;width:2.5rem;height:2.5rem;border-radius:9999px;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#0369a1,#0ea5e9);color:#fff;font-weight:700;font-size:0.85rem;\">1</div> (puis 2, 3…).",
              "  • Colonne droite : <div style=\"flex:1;min-width:0;color:#0f172a;font-size:0.95rem;line-height:1.55;\"><strong>Titre court</strong> phrase d’explication.</div>",
              "- Au moins 4 étapes (3 seulement si le sujet n’en a vraiment que 3).",
              "",
              "EXEMPLE DE STRUCTURE (copie le principe, adapte le texte au sujet) :",
              "<h3>Schéma des étapes de la diffusion</h3>",
              "<div style=\"border:1px solid rgba(148,163,184,0.45);border-radius:18px;padding:18px 16px;margin:20px 0;background:linear-gradient(180deg,rgba(248,250,252,0.98) 0%,rgba(226,232,240,0.45) 100%);\">",
              "<div style=\"display:flex;align-items:flex-start;gap:14px;padding:14px 12px;margin-bottom:10px;border-radius:14px;background:#fff;box-shadow:0 2px 10px rgba(15,23,42,0.07);border:1px solid rgba(226,232,240,0.95);\">",
              "<div style=\"flex-shrink:0;width:2.5rem;height:2.5rem;border-radius:9999px;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#0369a1,#0ea5e9);color:#fff;font-weight:700;font-size:0.85rem;\">1</div>",
              "<div style=\"flex:1;min-width:0;color:#0f172a;font-size:0.95rem;line-height:1.55;\"><strong>Sélection</strong> Valider et filtrer les informations pertinentes.</div>",
              "</div>",
              "</div>",
              "",
              "- INTERDIT sous le titre de schéma : <table>, <ol>, <ul>, ou paragraphes « 1. … 2. … » seuls — le schéma n’est jamais un tableau HTML.",
            ]
          : structureKey === "table"
            ? [
                "TYPE DE CONTENU : Théorie avec tableaux comparatifs.",
                "- Utilise au moins un tableau HTML comparatif (colonnes claires) pour structurer l’information.",
              ]
            : structureKey === "scientific_evidence"
              ? [
                  "TYPE DE CONTENU : Cours théorique sourcé (preuves, données, études).",
                  "- Chaque affirmation importante doit être étayée par une donnée chiffrée, une étude ou une source reconnue.",
                  "- Privilégie la crédibilité : méthodologie, ordre de grandeur, limites éventuelles.",
                  "- N’invente pas de DOI, d’URL fictive ni d’étude inexistante : cite des types de sources plausibles (méta-analyse, enquête INSEE, rapport OCDE, revue à comité de lecture…) avec année indicative si besoin.",
                ]
              : [
                  "TYPE DE CONTENU : Cours théorique standard (texte rédigé).",
                  "- Privilégie un exposé fluide en paragraphes (peu d’encarts).",
                ];

    const isSchema = structureKey === "schema";
    const isScientificEvidence = structureKey === "scientific_evidence";
    const useScientificCallouts = isScientificEvidence;
    const usePedagogicalCallouts =
      structureKey === "definition_example" ||
      (!isScientificEvidence && promptRequestsPedagogicalCallouts(prompt));

    const pedagogyRules = [
      "Tu es un ingénieur pédagogique.",
      "IMPORTANT : Le SUJET du cours est {prompt}.",
      ...structureRules,
      "NE PARLE PAS de neurosciences dans le texte, utilise-les simplement pour rendre le contenu plus mémorisable.",
      "Évite les introductions pompeuses. Entre directement dans le vif du sujet.",
      ...(isSchema
        ? [
            "Mode schéma : le cœur du message est le bloc visuel (frise d’étapes). Les paragraphes hors schéma restent courts ; ne remplace pas le schéma par une longue liste.",
          ]
        : [
            "Contenu à forte valeur ajoutée, exhaustif. Évite autant que possible les bullet points.",
          ]),
      "Ton d'expert passionné, direct et concret.",
      "Interdiction formelle d'utiliser ces tics de langage: \"En résumé\", \"En somme\", \"En conclusion\", \"Tout d'abord\".",
      "",
      ...(isSchema
        ? [
            "STRUCTURE (mode schéma) :",
            "- Introduction très courte.",
            "- Bloc schéma visuel OBLIGATOIRE (voir TYPE DE CONTENU) placé tôt dans le HTML.",
            "- Puis compléments : paragraphes courts uniquement.",
          ]
        : isScientificEvidence
          ? [
              "STRUCTURE (sources scientifiques) :",
              "- Introduction : enjeu + pourquoi les preuves comptent sur ce sujet.",
              "- Pour chaque section <h2> : développement argumenté, puis au moins un encart bleu « Élément sourcé » (donnée + source).",
              "- Au moins 3 encarts sourcés sur l’ensemble du chapitre.",
              "- Conclusion courte : ce que les données permettent de conclure (sans généralités non étayées).",
            ]
          : usePedagogicalCallouts
            ? [
                "STRUCTURE (définitions + exemples demandés) :",
                "- Introduction (accroche + contexte).",
                "- Pour chaque notion importante : courte explication, puis encart Définition, puis encart Exemple concret si utile.",
                "- Transition fluide entre les notions.",
              ]
            : [
                "STRUCTURE (cours standard) :",
                "- Introduction (accroche + contexte).",
                "- Corps du texte : explications fluides en paragraphes <p> et titres <h2>/<h3>.",
                "- Pas de cycle « définition + exemple encadré » systématique.",
              ]),
      "IMPORTANT : Je ne veux pas de listes de définitions. Pas de catalogue de définitions à la suite.",
      "Style : évite les gros blocs. Paragraphes courts et resserrés.",
      "",
      ...(useScientificCallouts
        ? [
            "ENCARTS SOURCÉS (bleu — obligatoires pour ce type de contenu) :",
            "- Chaque preuve / donnée / résultat d’étude dans :",
            "  <div class=\"bg-sky-50 border-l-4 border-sky-600 p-4 my-6 rounded-r-lg text-slate-900\">",
            "    <strong>Élément sourcé :</strong> [affirmation chiffrée ou constat]<br />",
            "    <span class=\"text-sm text-slate-700\"><em>Source :</em> [type d’étude, auteur ou organisme, année si pertinent, périmètre]</span>",
            "  </div>",
            "- Les paragraphes du corps introduisent l’idée ; l’encart bleu apporte la preuve.",
            "- Tu peux structurer le texte avec des titres <h2>/<h3> et des paragraphes ; les sections « définition » ou « exemple » du brief utilisateur se font en prose ou encarts bleus, pas en encarts rouge/vert.",
            "- Au moins 3 encarts bleus sur l’ensemble du contenu généré.",
          ]
        : usePedagogicalCallouts
        ? [
            "INSTRUCTION STRICTE (encarts colorés — uniquement parce qu’ils sont demandés) :",
            "",
            "DÉFINITIONS : chaque définition formelle dans <div class=\"bg-red-50 border-l-4 border-red-500 p-4 my-6 rounded-r-lg text-red-900\"><strong>Définition :</strong> ...</div>.",
            "EXEMPLES : chaque exemple illustratif dans <div class=\"bg-green-50 border-l-4 border-green-500 p-4 my-6 rounded-r-lg text-green-900\"><strong>Exemple concret :</strong> ...</div>.",
            "N’utilise ces encarts que pour de vraies définitions et de vrais exemples — pas pour tout le corps du cours.",
            ...(mode === "theory_examples"
              ? [
                  "",
                  "MODE : Théorie + exemples encadrés.",
                  "- Au moins un encart vert par grande idée.",
                ]
              : []),
          ]
        : [
              "ENCARTS ROUGE / VERT : INTERDIT par défaut.",
              "- N’utilise PAS <div class=\"bg-red-50\">, <div class=\"bg-green-50\">, border-red-500, border-green-500.",
              "- N’écris PAS « Définition : » ni « Exemple concret : » comme titres d’encarts colorés.",
              "- Intègre le vocabulaire dans des paragraphes <p> ; les termes clés peuvent être en <strong> dans le flux du texte.",
              "- N’ajoute pas d’exemples détaillés sauf si l’instruction utilisateur le demande explicitement.",
            ]),
      ...(isSchema
        ? [
            "",
            "TABLEAUX EN MODE SCHÉMA : INTERDIT d’utiliser <table>, <thead>, <tbody>, <tr>, <th>, <td> pour représenter le schéma, les étapes ou un processus. Les tableaux HTML sont réservés au type de contenu « théorie avec tableaux comparatifs », pas ici.",
            "",
            "SCHÉMA (HTML) : le bloc décrit dans TYPE DE CONTENU utilise uniquement des <div> avec styles inline (attribut style=\"…\"). Pas de Mermaid, pas d’image générée.",
          ]
        : [
            "",
            "TABLEAUX : Pour toute comparaison (avantages/inconvénients, forces/faiblesses, A vs B), tu DOIS utiliser des balises HTML <table> avec des bordures visibles (par ex. class=\"w-full border border-slate-200\" et cellules avec class=\"border border-slate-200 p-2\").",
          ]),
      "",
      "IMPORTANT : Ne génère pas de blocs de code Markdown (pas de ```html). Écris le HTML directement dans le texte.",
    ].join("\n");

    const promptSummary =
      prompt.length > 600 ? `${prompt.slice(0, 600)}… (consignes complètes dans le message utilisateur)` : prompt;
    const systemPrompt = pedagogyRules.replaceAll("{prompt}", promptSummary);

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      const fallback =
        "Contenu généré (mode mock) :\n\n" +
        prompt +
        "\n\n" +
        "Développez une progression pédagogique en expliquant les concepts, puis en illustrant avec des exemples concrets et une mise en pratique guidée.";
      return NextResponse.json({
        success: true,
        contentHtml: asHtml(fallback),
        mode: "mock",
      });
    }

    const userHtmlRules = isSchema
      ? "Retourne uniquement du HTML. Autorisé: <p>, <strong>, <em>, <h2>/<h3>, <div> (obligatoire pour le schéma avec style=\"…\" inline), <ul>/<ol>/<li> uniquement hors du bloc schéma si besoin, <br>, <a>. " +
        "INTERDIT pour illustrer le schéma ou les étapes : <table>, <thead>, <tbody>, <tr>, <th>, <td>. " +
        "Interdit: scripts, iframes, balises <style>, Markdown (```html). Pas de Markdown. Pas de JSON."
      : "Retourne uniquement du HTML. Autorisé: <p>, <strong>, <em>, <ul>/<ol>/<li> (si vraiment nécessaire), <h2>/<h3>, <table>/<thead>/<tbody>/<tr>/<th>/<td>, <div> (y compris avec attribut style=\"…\" pour les schémas), <br>, <a>. " +
        "Interdit: scripts, iframes, balises <style>, et tout bloc de code Markdown (```html). Pas de Markdown. Pas de JSON.";

    const userSchemaReminder = isSchema
      ? " Rappel final : le schéma = uniquement des <div> en flex + pastilles (message système). Aucun <table> pour les étapes. Aucune <ol> seule sous le titre du schéma."
      : "";

    const userParts: string[] = [];
    if (previousContent) {
      userParts.push(
        "Contexte (contenu précédent) à respecter pour la continuité des exemples et du fil conducteur:",
        previousContent,
        "",
        "Instruction: Sers-toi du contenu précédent pour assurer une continuité dans les exemples et le fil conducteur pédagogique.",
        "",
      );
    }
    userParts.push("Consignes et sujet à rédiger (priorité absolue):", prompt, "", userHtmlRules, userSchemaReminder);

    const client = new OpenAI({ apiKey });
    const resp = await client.chat.completions.create({
      model: OPENAI_MODEL,
      temperature: 0.3,
      max_tokens: 8000,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userParts.join("\n") },
      ],
    });

    const raw = resp.choices?.[0]?.message?.content ?? "";
    const content = String(raw).trim();
    if (!content) {
      return NextResponse.json(
        { success: false, error: "Réponse OpenAI vide." },
        { status: 502 },
      );
    }

    let contentHtml = content.startsWith("<") ? content : asHtml(content);
    if (!usePedagogicalCallouts && !useScientificCallouts && contentHtml.includes("<")) {
      contentHtml = stripPedagogicalCallouts(contentHtml);
    }
    if (isSchema && contentHtml.includes("<")) {
      contentHtml = upgradeSchemaTableToFlexCards(contentHtml);
      contentHtml = upgradeSchemaOlToFlexCards(contentHtml);
    }
    return NextResponse.json({
      success: true,
      contentHtml,
      mode: "openai",
      callouts: usePedagogicalCallouts,
    });
  } catch (error) {
    console.error("[beyond-ia/generate-rich-content] error", error);
    const message = openAiErrorMessage(error);
    const status =
      error instanceof APIError && error.status && error.status >= 400 && error.status < 600
        ? error.status
        : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

