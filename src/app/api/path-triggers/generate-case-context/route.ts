import { NextResponse } from "next/server";
import { getOpenAIClient } from "@/lib/ai/openai-client";
import { getServerClient } from "@/lib/supabase/server";

class ContextBuildError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

function webSearchConfigured(): boolean {
  return Boolean(process.env.TAVILY_API_KEY?.trim()) || Boolean(process.env.BRAVE_SEARCH_API_KEY?.trim());
}

/** Recherche web optionnelle : en l’absence de clés ou de résultats, génération 100 % modèle */
async function tryBuildWebContext(
  courseTitle: string,
  hint: string,
): Promise<{ text: string; provider: "tavily" | "brave" | null }> {
  if (!webSearchConfigured()) {
    return { text: "", provider: null };
  }

  try {
    return await buildWebContext(courseTitle, hint);
  } catch (e) {
    if (e instanceof ContextBuildError && e.code === "TOPIC_TOO_SHORT") throw e;
    return { text: "", provider: null };
  }
}

async function fetchMarketSnippetsTavily(query: string): Promise<string | null> {
  const apiKey = process.env.TAVILY_API_KEY?.trim();
  if (!apiKey || query.length < 8) return null;

  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        query: `${query} marché taille segments tendances données chiffres clés étude analyse`,
        search_depth: "advanced",
        max_results: 10,
        include_answer: true,
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      answer?: string;
      results?: Array<{ title?: string; content?: string; url?: string }>;
    };
    const answer = typeof data?.answer === "string" ? data.answer.trim() : "";
    const results = Array.isArray(data?.results) ? data.results : [];
    const bullets = results
      .map((r) => {
        const t = String(r?.title ?? "").trim();
        const c = String(r?.content ?? "").trim();
        const u = String(r?.url ?? "").trim();
        const head = t ? `${t} — ` : "";
        if (!c) return "";
        const short = c.length > 420 ? `${c.slice(0, 420)}…` : c;
        return u ? `• ${head}${short} (${u})` : `• ${head}${short}`;
      })
      .filter(Boolean);

    const parts: string[] = [];
    if (answer)
      parts.push(`Synthèse rapide issue de la recherche (à reformuler ; vérifier les sources) : ${answer}`);
    if (bullets.length)
      parts.push([
        "Extraits et indicateurs rapportés dans les résultats (interprétation prudentielle, sources en fin de ligne) :",
        bullets.join("\n"),
      ].join("\n"));
    return parts.join("\n\n") || null;
  } catch {
    return null;
  }
}

async function fetchMarketSnippetsBrave(query: string): Promise<string | null> {
  const apiKey = process.env.BRAVE_SEARCH_API_KEY?.trim();
  if (!apiKey || query.length < 3) return null;

  try {
    const url = new URL("https://api.search.brave.com/res/v1/web/search");
    url.searchParams.set("q", `${query} marché statistiques tendances données récentes`);
    url.searchParams.set("count", "10");

    const res = await fetch(url.toString(), {
      headers: { Accept: "application/json", "X-Subscription-Token": apiKey },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      web?: { results?: Array<{ title?: string; description?: string; url?: string }> };
    };
    const results = Array.isArray(data?.web?.results) ? data.web.results : [];
    const bullets = results
      .map((r) => {
        const t = String(r?.title ?? "").trim();
        const d = String(r?.description ?? "").trim();
        const u = String(r?.url ?? "").trim();
        if (!d && !t) return "";
        const body = d || "";
        const short = body.length > 380 ? `${body.slice(0, 380)}…` : body;
        const head = t ? `${t} — ` : "";
        return u ? `• ${head}${short} (${u})` : `• ${head}${short}`;
      })
      .filter(Boolean);
    if (!bullets.length) return null;
    return [
      "Éléments issus du moteur Brave Search (agrégés automatiquement, à croiser avec des sources officielles) :",
      bullets.join("\n"),
    ].join("\n");
  } catch {
    return null;
  }
}

async function buildWebContext(courseTitle: string, hint: string): Promise<{ text: string; provider: "tavily" | "brave" }> {
  const qRaw = `${courseTitle} ${hint}`.trim() || courseTitle.trim() || hint.trim();
  if (qRaw.length < 8) {
    throw new ContextBuildError(
      "TOPIC_TOO_SHORT",
      "Indiquez au minimum le titre de formation ou quelques mots de consigne (8 caractères minimum).",
    );
  }

  let text = await fetchMarketSnippetsTavily(qRaw);
  let provider: "tavily" | "brave" = "tavily";
  if (text?.trim()) {
    return { text: text.trim(), provider };
  }

  text = await fetchMarketSnippetsBrave(qRaw);
  provider = "brave";
  if (!text?.trim()) {
    throw new ContextBuildError(
      "WEB_SEARCH_NO_RESULTS",
      "Pas d’extrait exploitable depuis la recherche web.",
    );
  }

  return { text: text.trim(), provider };
}

export async function POST(request: Request) {
  try {
    const supabase = await getServerClient();
    if (!supabase) return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });

    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user?.id) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const courseTitle = String(body?.courseTitle ?? "").trim();
    const hint = String(body?.hint ?? "").trim();

    const client = getOpenAIClient();
    if (!client) return NextResponse.json({ error: "OPENAI_API_KEY manquante" }, { status: 500 });

    const topicDraft = `${courseTitle} ${hint}`.trim() || courseTitle || hint;
    if (topicDraft.length < 8) {
      return NextResponse.json(
        {
          code: "TOPIC_TOO_SHORT",
          error:
            "Indiquez au minimum le titre de formation ou quelques mots de consigne (8 caractères minimum).",
        },
        { status: 422 },
      );
    }

    let webBundle: { text: string; provider: "tavily" | "brave" | null };
    try {
      webBundle = await tryBuildWebContext(courseTitle, hint);
    } catch (e) {
      if (e instanceof ContextBuildError) {
        return NextResponse.json({ code: e.code, error: e.message }, { status: 422 });
      }
      throw e;
    }

    const hasWeb = Boolean(webBundle.text?.trim());

    const system = [
      "Tu rédiges une CONSIGNE d’étude de cas (brief missionné), en français, pas un exposé ni une présentation de cours.",
      "Le texte doit plonger l’apprenant dans une situation opérationnelle : rôle joué explicite, organisation ou projet fictif nommé ; inclure des chiffres réalistes (CA, marges, parts de marché, délais…) pour incarner les enjeux.",
      "Structure imposée : adresse au « vous » ; ouvrir par une phrase du type « Vous êtes [fonction] chez [entreprise ou entité fictive mais crédible], [activité / segment]. » puis développer la situation (perte de CA, retard projet, menace concurrentielle, contrainte réglementaire, etc.) avec acteurs, délais et objectifs.",
      hasWeb
        ? "Tu t’appuies sur le bloc « recherche web » ci-dessous pour secteur et ordres de grandeur ; chaque chiffre issu des extraits doit être qualifié (environ, d’après les extraits agrégés) — pas comme vérité officielle. Si les sources divergent, le signaler brièvement."
        : "Sans recherche web : tu peux intégrer des données et pourcentages plausibles mais explicitement comme éléments de fiction pédagogique (scénario d’étude de cas).",
      "Interdit : ton magistral générique (panorama sans mission) ; titres markdown ; listes à puces ; méta (« voici la consigne »).",
      "Plusieurs paragraphes séparés par des lignes blanches ; longueur cible 1600 à 2600 caractères.",
    ].join(" ");

    const user = [
      courseTitle ? `Formation / unité (titre de référence pour le thème) : ${courseTitle}` : "",
      hint ? `Précisions du formateur (à intégrer dans la mise en situation) : ${hint}` : "",
      hasWeb
        ? [
            `--- Recherche web agrégée (fournisseur: ${webBundle.provider}) ---`,
            webBundle.text,
            "--- Fin recherche agrégée ---",
            "Rédige la consigne en t’aidant du bloc précédent : chiffres dès qu’ils apparaissent dans les extraits, livrable ou question implicite pour l’apprenant.",
          ].join("\n")
        : "Aucune recherche web disponible ; invente une situation cohérente avec le titre et les précisions ci-dessus, avec métriques et contraintes crédibles (fiction pédagogique). Livrable ou question implicite pour l’apprenant (sans grille de notation).",
    ]
      .filter(Boolean)
      .join("\n\n");

    const res = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.4,
      max_tokens: 1400,
    });

    const context = String(res.choices[0]?.message?.content ?? "").trim();
    if (!context) return NextResponse.json({ error: "Réponse vide" }, { status: 500 });

    return NextResponse.json({
      context,
      usedWebContext: hasWeb,
      webProvider: webBundle.provider,
    });
  } catch (e) {
    console.error("[api/path-triggers/generate-case-context]", e);
    return NextResponse.json({ error: "Erreur de génération" }, { status: 500 });
  }
}
