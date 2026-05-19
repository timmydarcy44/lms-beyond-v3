import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

/** Valeurs UI (modal chapitre / sous-chapitre). */
type ContentStructureUi = "standard" | "definitions" | "schema" | "table";
/** Anciennes valeurs ou interne. */
type ContentStructureLegacy = "text" | "definition_example" | "schema" | "table";

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
    const prompt = String(body?.prompt ?? "").trim();
    const previousContent = String(body?.previousContent ?? "").trim();
    const mode = body?.mode === "theory_examples" ? "theory_examples" : "theory";
    const rawStructure = body?.contentStructure;
    const structureKey: "text" | "definition_example" | "schema" | "table" =
      rawStructure === "definitions" || rawStructure === "definition_example"
        ? "definition_example"
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
            : [
                "TYPE DE CONTENU : Cours théorique standard (texte rédigé).",
                "- Privilégie un exposé fluide en paragraphes (peu d’encarts).",
              ];

    const isSchema = structureKey === "schema";

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
            "- Puis compléments : paragraphes courts ; éventuellement 1 définition + 1 exemple encadrés si le sujet s’y prête.",
          ]
        : [
            "STRUCTURE IMPÉRATIVE (cycle pédagogique) :",
            "- Introduction (accroche + contexte).",
            "- Corps du texte (explications fluides en paragraphes courts).",
            "- Encart Focus : 1 définition précise + 1 exemple concret.",
            "- Transition vers le point suivant.",
            "- Répète ce cycle autant de fois que nécessaire pour couvrir le sujet en profondeur.",
          ]),
      "IMPORTANT : Je ne veux pas de listes de définitions. Pas de catalogue de définitions à la suite.",
      "Style : évite les gros blocs. Paragraphes courts et resserrés.",
      "",
      "INSTRUCTION STRICTE (IMPÉRATIVE): Tu DOIS utiliser du HTML brut pour la mise en forme suivante :",
      "",
      "DÉFINITIONS : Enveloppe TOUTES les définitions dans <div class=\"bg-red-50 border-l-4 border-red-500 p-4 my-6 rounded-r-lg text-red-900\"><strong>Définition :</strong> ...</div>.",
      "EXEMPLES : Enveloppe TOUS les exemples dans <div class=\"bg-green-50 border-l-4 border-green-500 p-4 my-6 rounded-r-lg text-green-900\"><strong>Exemple concret :</strong> ...</div>.",
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
      ...(mode === "theory_examples"
        ? [
            "",
            "MODE : Cours théorique + exemples.",
            "- Ajoute des exemples concrets à chaque grande idée (au moins 1).",
            "- Chaque exemple doit être dans un encadré vert.",
          ]
        : [
            "",
            "MODE : Cours théorique.",
            "- Limite les exemples au strict nécessaire (uniquement si cela clarifie un concept).",
          ]),
    ].join("\n");

    const systemPrompt = pedagogyRules.replaceAll("{prompt}", prompt);

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

    const client = new OpenAI({ apiKey });
    const resp = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.3,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content:
            (previousContent
              ? "Contexte (contenu précédent) à respecter pour la continuité des exemples et du fil conducteur:\n" +
                previousContent +
                "\n\nInstruction: Sers-toi du contenu précédent pour assurer une continuité dans les exemples et le fil conducteur pédagogique.\n\n"
              : "") +
            userHtmlRules +
            userSchemaReminder,
        },
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
    if (isSchema && contentHtml.includes("<")) {
      contentHtml = upgradeSchemaTableToFlexCards(contentHtml);
      contentHtml = upgradeSchemaOlToFlexCards(contentHtml);
    }
    return NextResponse.json({ success: true, contentHtml, mode: "openai" });
  } catch (error) {
    console.error("[beyond-ia/generate-rich-content] error", error);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}

