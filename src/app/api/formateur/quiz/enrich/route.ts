import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";

type Incoming = {
  question?: string;
  title?: string;
  options?: unknown;
  explication?: string;
  explanation?: string;
  concept_ref?: { label?: string } | null;
  concept_label?: string;
};

function existingExplanation(question: Incoming) {
  return String(question.explication ?? question.explanation ?? "").trim();
}

function existingConcept(question: Incoming) {
  return String(question.concept_ref?.label ?? question.concept_label ?? "").trim();
}

export async function POST(request: Request) {
  const supabase = await getServerClient();
  const { data: auth } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  if (!auth?.user || !supabase) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const apply = Boolean(body?.apply);
  const testId = String(body?.testId ?? "").trim();
  let source: Incoming[] = Array.isArray(body?.questions) ? body.questions : [];

  if (testId) {
    const db = getServiceRoleClient() ?? supabase;
    const { data, error } = await db.from("tests").select("id, questions, creator_id, owner_id").eq("id", testId).maybeSingle();
    if (error || !data) return NextResponse.json({ error: "Quiz introuvable" }, { status: 404 });
    const owner = String((data as { creator_id?: string; owner_id?: string }).creator_id ?? (data as { owner_id?: string }).owner_id ?? "");
    if (owner && owner !== auth.user.id && !(await isSuperAdmin())) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }
    source = Array.isArray((data as { questions?: unknown }).questions) ? ((data as { questions: Incoming[] }).questions) : [];
  }

  if (!source.length) return NextResponse.json({ error: "Aucune question" }, { status: 400 });

  const missing = source
    .map((question, index) => ({ index, question: String(question.question ?? question.title ?? ""), needsExplanation: !existingExplanation(question), needsConcept: !existingConcept(question) }))
    .filter((item) => item.question && (item.needsExplanation || item.needsConcept));

  if (!missing.length) return NextResponse.json({ questions: source, filled: 0 });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "OpenAI non configuré" }, { status: 503 });

  const openai = new OpenAI({ apiKey });
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 2500,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `Tu complètes des questions de quiz déjà écrites. Tu ne réécris pas l'énoncé.
Retourne {"items":[{"index":0,"explication":"...","concept":"nom de la notion"}]}.
L'explication fait 2 ou 3 phrases, tutoiement, situation concrète. La notion est un nom court.
Ne remplis un champ que s'il est demandé.`,
      },
      { role: "user", content: JSON.stringify({ items: missing }) },
    ],
  });

  const raw = response.choices[0]?.message?.content || "{}";
  const parsed = JSON.parse(raw) as { items?: Array<{ index?: number; explication?: string; concept?: string }> };
  const proposals = new Map((parsed.items ?? []).map((item) => [Number(item.index), item]));

  const questions = source.map((question, index) => {
    const proposal = proposals.get(index);
    const explanation = existingExplanation(question) || String(proposal?.explication ?? "").trim();
    const concept = existingConcept(question) || String(proposal?.concept ?? "").trim();
    return {
      ...question,
      explication: explanation,
      explanation: explanation,
      concept_label: concept,
      concept_ref: concept ? { ...(question.concept_ref ?? {}), label: concept } : question.concept_ref,
    };
  });

  const filled = missing.length;
  if (apply && testId) {
    const db = getServiceRoleClient() ?? supabase;
    const { error } = await db.from("tests").update({ questions }).eq("id", testId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ questions, filled, applied: Boolean(apply && testId) });
}
