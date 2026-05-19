import { NextRequest, NextResponse } from "next/server";

import { getOpenAIClient } from "@/lib/ai/openai-client";
import { fetchSchoolGateProfile, schoolDashboardAllowed } from "@/lib/auth/school-access";
import { getSession } from "@/lib/auth/session";
import { getServerClient } from "@/lib/supabase/server";
import { getServiceSupabase } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

function assistantLabel() {
  return (process.env.NEXT_PUBLIC_ECOLE_ASSISTANT_NAME ?? "").trim() || "Assistant";
}

async function fetchSchoolStats(schoolId: string) {
  let svc: Awaited<ReturnType<typeof getServiceSupabase>>;
  try {
    svc = await getServiceSupabase();
  } catch {
    return null;
  }

  const { count: apprenantTotal, error: e1 } = await svc
    .from("school_students")
    .select("student_id", { count: "exact", head: true })
    .eq("school_id", schoolId);

  if (e1) {
    console.error("[assistant/stats] school_students", e1);
  }

  const { data: studentRows, error: e2 } = await svc
    .from("school_students")
    .select("student_id")
    .eq("school_id", schoolId);

  if (e2) {
    console.error("[assistant/stats] school_students rows", e2);
  }

  const ids = (studentRows ?? []).map((r: { student_id: string }) => r.student_id).filter(Boolean);
  let alternance = 0;
  if (ids.length) {
    const { data: profiles, error: e3 } = await svc
      .from("profiles")
      .select("id, contract_type")
      .in("id", ids);
    if (e3) {
      console.error("[assistant/stats] profiles", e3);
    } else {
      alternance = (profiles ?? []).filter((p: { contract_type?: string | null }) => {
        const c = String(p.contract_type ?? "").toLowerCase();
        return c.includes("alternance");
      }).length;
    }
  }

  const { count: clientsTotal, error: e4 } = await svc
    .from("crm_prospects")
    .select("id", { count: "exact", head: true })
    .eq("school_id", schoolId)
    .eq("company_status", "client");

  if (e4) {
    console.error("[assistant/stats] crm_prospects", e4);
  }

  const { data: offerRows, error: e5 } = await svc
    .from("job_offers")
    .select("id, title, description, contract_type")
    .eq("school_id", schoolId);

  if (e5) {
    console.error("[assistant/stats] job_offers", e5);
  }

  const offersList = offerRows ?? [];
  const offersTotal = offersList.length;
  const offersAlternance = offersList.filter((o: { contract_type?: string | null; title?: string | null; description?: string | null }) => {
    const c = String(o.contract_type ?? "").toLowerCase();
    const blob = `${o.title ?? ""} ${o.description ?? ""}`.toLowerCase();
    return c.includes("altern") || blob.includes("alternance");
  }).length;

  return {
    apprenants: apprenantTotal ?? 0,
    alternance,
    clients: clientsTotal ?? 0,
    offersTotal,
    offersAlternance,
  };
}

type ChatTurn = { role: "user" | "assistant"; content: string };

function lastAssistantDiscussedAlternanceApprenants(history: ChatTurn[]): boolean {
  const lastAsst = [...history].reverse().find((h) => h.role === "assistant");
  if (!lastAsst) return false;
  const t = String(lastAsst.content ?? "").toLowerCase();
  const aboutLearners = /\bapprenant/.test(t) || /\bélève/.test(t) || /\beleve/.test(t);
  const aboutAltern = /\baltern/.test(t);
  return aboutLearners && aboutAltern;
}

async function fetchAlternanceCompanyRows(schoolId: string) {
  let svc: Awaited<ReturnType<typeof getServiceSupabase>>;
  try {
    svc = await getServiceSupabase();
  } catch {
    return null;
  }

  const { data: ssRows, error: ssErr } = await svc.from("school_students").select("student_id").eq("school_id", schoolId);
  if (ssErr) {
    console.error("[assistant/alternance-company] school_students", ssErr);
    return null;
  }
  const ids = (ssRows ?? []).map((r: { student_id: string }) => r.student_id).filter(Boolean);
  if (!ids.length) return [];

  const { data: profs, error: pErr } = await svc
    .from("profiles")
    .select("id, first_name, last_name, contract_type, company_id")
    .in("id", ids);
  if (pErr) {
    console.error("[assistant/alternance-company] profiles", pErr);
    return null;
  }

  const altern = (profs ?? []).filter((p: { contract_type?: string | null }) => {
    const c = String(p.contract_type ?? "").toLowerCase();
    return c.includes("alternance");
  });

  const companyIds = [...new Set(altern.map((p: { company_id?: string | null }) => p.company_id).filter(Boolean))] as string[];
  const companyLabel = new Map<string, string>();
  if (companyIds.length) {
    const { data: crm, error: cErr } = await svc
      .from("crm_prospects")
      .select("id, company_name, name")
      .in("id", companyIds);
    if (cErr) {
      console.error("[assistant/alternance-company] crm_prospects", cErr);
    } else {
      for (const c of crm ?? []) {
        const row = c as { id: string; company_name?: string | null; name?: string | null };
        const label = String(row.company_name || row.name || "").trim() || "Entreprise";
        companyLabel.set(row.id, label);
      }
    }
  }

  return altern.map((p: { first_name?: string | null; last_name?: string | null; company_id?: string | null }) => {
    const name = [p.first_name, p.last_name].filter(Boolean).join(" ").trim() || "Apprenant";
    const cid = p.company_id ?? null;
    const company = cid ? companyLabel.get(cid) ?? null : null;
    return { name, company };
  });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.id) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const userClient = await getServerClient();
  if (!userClient) {
    return NextResponse.json({ error: "NO_DB_CLIENT" }, { status: 500 });
  }

  const isDemo = session.role === "demo";
  const gate = await fetchSchoolGateProfile(session.id, session.email, userClient);
  /* Même logique d’accès que le tableau de bord école (pas le chemin technique /api/...). */
  const pathFromRequest = "/dashboard/ecole";
  const allowed = schoolDashboardAllowed({
    isDemoSession: isDemo,
    sessionFrontendRole: session.role,
    role: gate?.role ?? "",
    roleType: gate?.roleType ?? "",
    schoolIdPresent: Boolean(gate?.school_id),
    profileRowPresent: Boolean(gate),
    requestPath: pathFromRequest,
  });

  if (!allowed) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const schoolId = gate?.school_id ?? null;
  if (!schoolId) {
    return NextResponse.json({ error: "NO_SCHOOL_ID" }, { status: 400 });
  }

  let body: { message?: string; history?: ChatTurn[] } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const q = String(body.message ?? "").trim();
  if (!q) {
    return NextResponse.json({ error: "MESSAGE_REQUIRED" }, { status: 400 });
  }

  const history = Array.isArray(body.history) ? body.history.filter((h) => h && (h.role === "user" || h.role === "assistant") && String(h.content ?? "").trim()) : [];
  const trimmedHistory = history
    .map((h) => ({ role: h.role, content: String(h.content).trim() }))
    .slice(-16);

  const lower = q.toLowerCase();
  const name = assistantLabel();
  const asksOffers = /\boffre(s)?\b/.test(lower);

  const asksAlternanceCompany =
    /\b(entreprise|société|societe|employeur|boîte|boite)\b/i.test(q) &&
    (/\baltern|\bstage\b|\bcontrat\b/i.test(lower) ||
      /\b(il|elle|ils|elles|l['’]apprenant|cette apprenante|cet apprenant|mon apprenant)\b/i.test(lower) ||
      lastAssistantDiscussedAlternanceApprenants(trimmedHistory));

  if (asksAlternanceCompany) {
    const rows = await fetchAlternanceCompanyRows(schoolId);
    if (rows === null) {
      return NextResponse.json({
        reply: `${name} ne peut pas lire les fiches pour le moment (service ou base indisponible).`,
      });
    }
    if (!rows.length) {
      return NextResponse.json({
        reply:
          "Aucun apprenant n’est détecté en **alternance** pour votre établissement (champ « type de contrat »). Si besoin, vérifiez les profils dans **Mes apprenants**.",
      });
    }
    const lines = rows.map((r) => {
      if (r.company) return `- **${r.name}** : **${r.company}**`;
      return `- **${r.name}** : entreprise **non renseignée** sur la fiche (liez une fiche **Entreprise / CRM** depuis le formulaire apprenant).`;
    });
    const head =
      rows.length === 1
        ? "Voici l’entreprise associée en base (fiche CRM liée au profil) :"
        : "Voici les apprenants en **alternance** et l’entreprise renseignée (si disponible) :";
    return NextResponse.json({ reply: `${head}\n\n${lines.join("\n")}` });
  }

  const wantsCounts =
    /\b(combien|nombre|total|combien de|j'ai|'ai|ai.?je)\b/i.test(q) &&
    (/\bapprenant/.test(lower) ||
      /\bélève/.test(lower) ||
      /\beleve/.test(lower) ||
      /\bclient/.test(lower) ||
      /\balternance/.test(lower) ||
      /\baltern\b/.test(lower) ||
      asksOffers);

  if (wantsCounts) {
    const stats = await fetchSchoolStats(schoolId);
    if (!stats) {
      return NextResponse.json({
        reply: `${name} ne peut pas lire les statistiques pour le moment (configuration serveur ou base indisponible).`,
      });
    }
    const parts: string[] = [];
    if (/\bapprenant/.test(lower) || /\bélève/.test(lower) || /\beleve/.test(lower)) {
      parts.push(
        `Vous avez **${stats.apprenants}** apprenant(s) rattaché(s) à votre établissement, dont **${stats.alternance}** en contrat d’alternance (détecté via le champ « type de contrat »).`,
      );
    }
    if (/\bclient/.test(lower) || /\bentreprise/.test(lower)) {
      parts.push(`Côté CRM, vous avez **${stats.clients}** fiche(s) entreprise au statut **client**.`);
    }
    if (asksOffers || /\boffre/.test(lower)) {
      parts.push(
        `Offres enregistrées pour votre école (**job_offers**) : **${stats.offersTotal}** au total, **${stats.offersAlternance}** repérée(s) comme alternance (titre, description ou type de contrat).`,
      );
      if (stats.offersTotal === 0) {
        parts.push(
          `_Note :_ l’écran **Mes apprenants** peut afficher des offres de **démonstration** qui ne sont pas dans cette table — les chiffres ci-dessus ne comptent que les offres réellement en base.`,
        );
      }
    }
    if (parts.length === 0) {
      parts.push(
        `Indicateurs : **${stats.apprenants}** apprenant(s), dont **${stats.alternance}** en alternance ; **${stats.clients}** client(s) entreprise ; **${stats.offersTotal}** offre(s) (**${stats.offersAlternance}** alternance détectée).`,
      );
    }
    return NextResponse.json({ reply: parts.join(" ") });
  }

  const looksMetaPing =
    /^(tu\s+fonctionn|fonctionn(es)?\s*-?\s*tu|ça\s+marche|tu\s+m['’]entends|es[- ]tu\s+l[àa]|tu\s+es\s+l[àa]|hello|hi|hey|bonjour|coucou|merci|ok)\b/i.test(
      q.trim(),
    ) || /\b(tu\s+fonctionn|comment\s+ça\s+va|ça\s+va)\b/i.test(lower);

  if (looksMetaPing) {
    return NextResponse.json({
      reply: `Oui, tout fonctionne correctement de mon côté. Je suis **${name}** — je peux vous aider sur votre établissement (apprenants, alternance, entreprises, offres, prospection) et répondre aussi à des questions plus générales quand c’est pertinent. Que souhaitez-vous ?`,
    });
  }

  const llm = getOpenAIClient();
  if (llm) {
    try {
      const stats = await fetchSchoolStats(schoolId);
      const system = [
        `Tu es l’assistant d’un centre de formation (tableau de bord école) nommé **${name}**.`,
        `Réponds en français, ton professionnel et agréable.`,
        `Pour les salutations ou les questions très courtes (« tu fonctionnes ? », « ça va ? »), réponds brièvement et naturellement.`,
        `Tu peux élargir au-delà du strict contenu de l’application (conseils pédagogiques, organisation, relation école-entreprise…) tout en restant prudent : si une donnée chiffrée concerne CET établissement, base-toi sur le CONTEXTE JSON ci-dessous ; s’il manque une info, dis-le clairement.`,
        `Ne te présente pas comme « uniquement » un bot à effectifs.`,
        `CONTEXTE (JSON, peut être incomplet) : ${JSON.stringify(stats ?? null)}`,
      ].join("\n");

      const msgs: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
        { role: "system", content: system },
        ...trimmedHistory.slice(-10).map((h) => ({
          role: h.role === "user" ? ("user" as const) : ("assistant" as const),
          content: h.content,
        })),
        { role: "user", content: q },
      ];

      const resp = await llm.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.55,
        max_tokens: 700,
        messages: msgs,
      });
      const text = resp.choices[0]?.message?.content?.trim();
      if (text) {
        return NextResponse.json({ reply: text });
      }
    } catch (e) {
      console.error("[assistant/llm]", e);
    }
  }

  const hasConversation =
    trimmedHistory.length >= 2 ||
    trimmedHistory.some((h) => h.role === "user") ||
    trimmedHistory.some((h) => h.role === "assistant");

  let reply = hasConversation
    ? `${name} — dites-moi ce dont vous avez besoin (apprenants, alternance, entreprises, offres, prospection). Pour des chiffres : « combien d’apprenants ? » par exemple.`
    : `${name} : posez votre question librement, ou demandez des effectifs (ex. « combien d’apprenants ? »).`;

  if (lower.includes("questionnaire") || lower.includes("questionnaires")) {
    reply =
      "Pour savoir si quelqu’un a répondu à un questionnaire précis, il faut encore brancher la donnée questionnaire sur cet assistant. En attendant, ouvrez la fiche apprenant ou le module de suivi correspondant.";
  } else if (lower.includes("client") && !wantsCounts) {
    reply =
      "Les **clients** (entreprises signées) sont sous **Entreprises → Clients** et dans l’onglet **Clients** de la **Prospection** après passage en colonne « Gagné ».";
  } else if (lower.includes("apprenant") && !wantsCounts) {
    reply =
      "Les apprenants sont dans **Mes apprenants**. Rattachement par email, UUID complet ou fragment d’ID (après migration serveur).";
  } else if (asksOffers && /\b(vois|voir|pourtant|affiches?|interface|écran|zero|zéro|0)\b/i.test(q)) {
    const stats = await fetchSchoolStats(schoolId);
    if (stats) {
      reply = `En base pour votre établissement : **${stats.offersTotal}** offre(s) (**job_offers**), dont **${stats.offersAlternance}** classée(s) comme alternance par le moteur de détection. Si vous en voyez d’autres dans l’interface, ce sont souvent des **offres démo** hors base — seules les offres enregistrées sont comptées ici.`;
    }
  } else if (lower.includes("prospect") || lower.includes("pipeline")) {
    reply =
      "Le pipeline **Prospection** va jusqu’à **Gagné** : la fiche passe alors en **client** et sort du kanban vers l’onglet **Clients**.";
  }

  return NextResponse.json({ reply });
}
