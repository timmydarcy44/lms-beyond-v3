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

    if (!body?.formation_id || !body?.titre || !Array.isArray(body.questions)) {
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

    const baseTestData = {
      title: body.titre,
      description: "Quiz généré par IA",
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
    const courseTestData: Record<string, any> = {
      course_id: body.formation_id,
      test_id: testData.id,
      order_index: 0,
      position_type: null,
      position_after_id: null,
      section_id: null,
      chapter_id: null,
      subchapter_id: null,
      local_section_id: null,
      local_chapter_id: null,
      local_subchapter_id: null,
      local_position_after_id: null,
    };

    if (placementType && placementType !== "end" && placementId) {
      courseTestData.position_type = placementType;
      if (isValidUUID(placementId)) {
        courseTestData.position_after_id = placementId;
      } else {
        courseTestData.local_position_after_id = placementId;
      }
      if (placementType === "after_section") {
        if (isValidUUID(placementId)) {
          courseTestData.section_id = placementId;
        } else {
          courseTestData.local_section_id = placementId;
        }
      }
      if (placementType === "after_chapter") {
        if (isValidUUID(placementId)) {
          courseTestData.chapter_id = placementId;
        } else {
          courseTestData.local_chapter_id = placementId;
        }
      }
      if (placementType === "after_subchapter") {
        if (isValidUUID(placementId)) {
          courseTestData.subchapter_id = placementId;
        } else {
          courseTestData.local_subchapter_id = placementId;
        }
      }
    }

    const { error: courseTestError } = await supabase.from("course_tests").insert(courseTestData);
    if (courseTestError) {
      return NextResponse.json({ error: courseTestError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, test_id: testData.id });
  } catch (error) {
    console.error("[api/formateur/quiz/save] error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
