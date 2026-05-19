import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";

const isValidUUID = (value: string | null | undefined) => {
  if (!value) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as
      | {
          formation_id?: string;
          titre?: string;
          title?: string;
          description?: string | null;
          questions?: unknown[];
          scoring?: {
            points_par_question?: number;
            penalite?: number;
            score_minimum?: number;
          };
          type?: string;
          placement?: { type?: string; id?: string };
        }
      | null;

    const titre = String(body?.title ?? body?.titre ?? "").trim();
    if (!body?.formation_id || !titre || !Array.isArray(body.questions)) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
    }

    const supabase = await getServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const description =
      typeof body.description === "string" && body.description.trim().length > 0
        ? body.description.trim()
        : `Quiz généré par IA — ${titre}`;

    const baseTestData = {
      title: titre,
      description,
      status: "draft",
      questions: body.questions,
      created_by: user.id,
      owner_id: user.id,
      evaluation_type: body.type || "qcm",
      scoring: body.scoring ?? null,
    };

    const insertAttempts = [
      baseTestData,
      {
        title: baseTestData.title,
        description: baseTestData.description,
        questions: baseTestData.questions,
      },
      { title: baseTestData.title, description: baseTestData.description },
    ];

    let testData = null as any;
    let insertError = null as any;
    for (const payload of insertAttempts) {
      const { data, error } = await supabase.from("tests").insert(payload).select().single();
      if (!error) {
        testData = data;
        insertError = null;
        break;
      }
      insertError = error;
    }

    if (insertError || !testData?.id) {
      return NextResponse.json(
        { error: insertError?.message || "Impossible de créer le test" },
        { status: 500 },
      );
    }

    const placementType = body.placement?.type ?? "end";
    const placementId = body.placement?.id ?? null;
    // Lien (optionnel) entre course et test: best-effort.
    // Certains schémas minimaux n'ont pas `course_tests` ou n'ont pas toutes les colonnes.
    let linked = false;
    try {
      const minimalAttempts: Array<Record<string, any>> = [
        { course_id: body.formation_id, test_id: testData.id, order_index: 0 },
        { course_id: body.formation_id, test_id: testData.id },
      ];

      for (const payload of minimalAttempts) {
        const { error } = await supabase.from("course_tests").insert(payload);
        if (!error) {
          linked = true;
          break;
        }
        const message = String((error as any)?.message ?? "");
        const code = String((error as any)?.code ?? "");
        const isMissingTable =
          code === "42P01" ||
          message.toLowerCase().includes('relation "course_tests" does not exist') ||
          message.toLowerCase().includes("relation does not exist");
        if (isMissingTable) {
          break;
        }
      }
    } catch {
      // Ignorer: le builder injecte le bloc quiz dans le snapshot côté client.
    }

    return NextResponse.json({ success: true, test_id: testData.id, linked });
  } catch (error) {
    console.error("[api/formateur/quiz/save] error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
