import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";
import { insertQuizTestRow, resolveQuizAuthorOrgId } from "@/lib/formateur/quiz-test-insert";

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
    if (!body?.formation_id || !titre || !Array.isArray(body.questions) || body.questions.length === 0) {
      return NextResponse.json({ error: "Données manquantes (formation, titre ou questions)" }, { status: 400 });
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

    const orgId = await resolveQuizAuthorOrgId(supabase, user.id);

    const { data: testData, error: insertError } = await insertQuizTestRow(supabase, {
      title: titre,
      description,
      questions: body.questions,
      userId: user.id,
      orgId,
      evaluationType: body.type || "qcm",
      scoring: body.scoring ?? null,
    });

    if (insertError || !testData?.id) {
      return NextResponse.json(
        {
          error: insertError?.message || "Impossible de créer le test",
          code: insertError?.code,
        },
        { status: 500 },
      );
    }

    let linked = false;
    try {
      const minimalAttempts: Array<Record<string, unknown>> = [
        { course_id: body.formation_id, test_id: testData.id, order_index: 0 },
        { course_id: body.formation_id, test_id: testData.id },
      ];

      for (const payload of minimalAttempts) {
        const { error } = await supabase.from("course_tests").insert(payload);
        if (!error) {
          linked = true;
          break;
        }
        const message = String((error as { message?: string })?.message ?? "");
        const code = String((error as { code?: string })?.code ?? "");
        const isMissingTable =
          code === "42P01" ||
          message.toLowerCase().includes('relation "course_tests" does not exist') ||
          message.toLowerCase().includes("relation does not exist");
        if (isMissingTable) break;
      }
    } catch {
      // Le builder injecte le bloc quiz dans le snapshot côté client.
    }

    return NextResponse.json({ success: true, test_id: testData.id, linked });
  } catch (error) {
    console.error("[api/formateur/quiz/save] error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
