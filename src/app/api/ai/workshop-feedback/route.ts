import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { generateJSON } from "@/lib/ai/openai-client";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";
import { normalizeWorkshopFeedback } from "@/lib/workshops/normalize-feedback";
import { findWorkshopBlock, workshopCaseBrief, workshopMaxImprovements, workshopMode } from "@/lib/workshops/workshop-block";
import type { CourseBuilderSnapshot } from "@/types/course-builder";

const PREVIEW_ROLES = ["instructor", "formateur", "admin", "tutor", "super_admin", "owner"];

const BodySchema = z.object({
  courseId: z.string().uuid(),
  blockId: z.string().min(1).max(200),
  preview: z.boolean().optional(),
  answers: z.record(z.string(), z.string()).refine((value) => Object.values(value).some((item) => item.trim().length > 0), {
    message: "Réponse vide",
  }),
});

const FeedbackSchema = z.object({
  criteres: z
    .array(
      z.object({
        critere: z.string(),
        statut: z.enum(["reussi", "a_ameliorer"]),
        commentaire: z.string(),
        suggestion: z.string(),
      }),
    )
    .min(1),
  commentaire_global: z.string().min(1).max(600),
});

export async function POST(request: NextRequest) {
  const supabase = await getServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 500 });

  const body = await request.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "La réponse est incomplète." }, { status: 400 });

  const { courseId, blockId, answers, preview } = parsed.data;
  const { data: course, error: courseError } = await service
    .from("courses")
    .select("id, title, builder_snapshot, creator_id, owner_id, org_id")
    .eq("id", courseId)
    .maybeSingle();
  if (courseError || !course) return NextResponse.json({ error: "Formation introuvable." }, { status: 404 });

  const staffPreview = preview === true && (await canPreviewCourse(user.id, course));
  if (!staffPreview) {
    const { data: enrollment, error: enrollmentError } = await service
      .from("enrollments")
      .select("user_id")
      .eq("user_id", user.id)
      .eq("course_id", courseId)
      .maybeSingle();
    if (enrollmentError) return NextResponse.json({ error: "Impossible de vérifier l'inscription." }, { status: 500 });
    if (!enrollment) return NextResponse.json({ error: "Vous n'êtes pas inscrit à cette formation." }, { status: 403 });
  }

  const snapshot = (course.builder_snapshot ?? null) as CourseBuilderSnapshot | null;
  const block = findWorkshopBlock(snapshot, blockId);
  if (!block || workshopMode(block.workshop) !== "atelier") {
    return NextResponse.json({ error: "Cet atelier n'est pas disponible." }, { status: 404 });
  }

  const max = workshopMaxImprovements(block.workshop);
  if (!staffPreview) {
    const { count, error: countError } = await service
      .from("learner_workshop_outputs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("course_id", courseId)
      .eq("block_id", blockId)
      .not("ai_feedback", "is", null);
    if (countError) return NextResponse.json({ error: "Impossible de vérifier les améliorations." }, { status: 500 });
    if ((count ?? 0) >= 1 + max) {
      return NextResponse.json({ error: "Nombre d'améliorations atteint." }, { status: 409 });
    }
  }

  const criteria = (block.workshop?.criteria ?? []).map((item) => item.label.trim()).filter(Boolean);
  const fields = (block.workshop?.fields ?? [])
    .map((item) => `${item.label.trim() || "Réponse"} : ${String(answers[item.label] ?? answers[item.id] ?? "").trim()}`)
    .filter((line) => !line.endsWith(":"));
  const prompt = [
    `Formation : ${course.title || "Formation"}`,
    `Votre mission : ${block.workshop?.brief || block.title || "Atelier"}`,
    workshopCaseBrief(block.workshop),
    criteria.length ? `Critères :\n- ${criteria.join("\n- ")}` : "",
    "Réponses de l'apprenant :",
    fields.join("\n"),
  ]
    .filter(Boolean)
    .join("\n\n");

  let raw: unknown;
  try {
    raw = await generateJSON(
      prompt,
      {
        type: "object",
        properties: {
          criteres: {
            type: "array",
            items: {
              type: "object",
              properties: {
                critere: { type: "string" },
                statut: { type: "string", enum: ["reussi", "a_ameliorer"] },
                commentaire: { type: "string" },
                suggestion: { type: "string" },
              },
              required: ["critere", "statut", "commentaire", "suggestion"],
            },
          },
          commentaire_global: { type: "string" },
        },
        required: ["criteres", "commentaire_global"],
      },
      [
        "Vous évaluez un atelier d'entraînement, en français, avec le vouvoiement.",
        "Jugez la réponse par rapport à la situation, au personnage et aux pièces. Un mail, une note ou un tableau est donné en entier. Pour un fichier, seul le titre est connu.",
        "Ton bienveillant, précis, orienté action.",
        "Utilisez exactement ces clés : criteres, critere, statut, commentaire, suggestion, commentaire_global.",
        "statut vaut uniquement reussi ou a_ameliorer, sans accent.",
        "Ne réécrivez jamais toute la réponse à la place de l'apprenant.",
        "commentaire_global tient en deux phrases maximum.",
        "Répondez uniquement avec le JSON demandé.",
      ].join(" "),
    );
  } catch (error) {
    console.error("[workshop-feedback] model call failed", error);
    return NextResponse.json({ error: "Le service IA ne répond pas." }, { status: 502 });
  }

  if (raw == null) {
    console.error("[workshop-feedback] empty model response");
    return NextResponse.json({ error: "Le service IA ne répond pas." }, { status: 502 });
  }

  const feedback = FeedbackSchema.safeParse(normalizeWorkshopFeedback(raw));
  if (!feedback.success) {
    console.error("[workshop-feedback] invalid model JSON", JSON.stringify(raw).slice(0, 8000), feedback.error.issues);
    return NextResponse.json({ error: "Réponse IA invalide." }, { status: 502 });
  }

  if (staffPreview) return NextResponse.json({ feedback: feedback.data, preview: true });

  const { data: rows, error: rowsError } = await service
    .from("learner_workshop_outputs")
    .select("id, version, is_final, ai_feedback")
    .eq("user_id", user.id)
    .eq("course_id", courseId)
    .eq("block_id", blockId)
    .order("version", { ascending: false })
    .limit(1);
  if (rowsError) return NextResponse.json({ error: "Impossible d'enregistrer le retour." }, { status: 500 });

  const latest = rows?.[0] as { id: string; version: number; is_final: boolean; ai_feedback: unknown } | undefined;
  if (latest && !latest.is_final && latest.ai_feedback == null) {
    const { error } = await service
      .from("learner_workshop_outputs")
      .update({ ai_feedback: feedback.data, answers, updated_at: new Date().toISOString() })
      .eq("id", latest.id);
    if (error) return NextResponse.json({ error: "Impossible d'enregistrer le retour." }, { status: 500 });
  } else {
    const version = (latest?.version ?? 0) + 1;
    const { error } = await service.from("learner_workshop_outputs").insert({
      user_id: user.id,
      course_id: courseId,
      block_id: blockId,
      version,
      answers,
      ai_feedback: feedback.data,
      is_final: false,
    });
    if (error) return NextResponse.json({ error: "Impossible d'enregistrer le retour." }, { status: 500 });
  }

  return NextResponse.json({ feedback: feedback.data });
}

async function canPreviewCourse(
  userId: string,
  course: { creator_id?: string | null; owner_id?: string | null; org_id?: string | null },
) {
  if (await isSuperAdmin()) return true;
  if (course.creator_id === userId || course.owner_id === userId) return true;
  if (!course.org_id) return false;
  const service = getServiceRoleClient();
  if (!service) return false;
  const { data } = await service
    .from("org_memberships")
    .select("role")
    .eq("user_id", userId)
    .eq("org_id", course.org_id)
    .in("role", PREVIEW_ROLES)
    .limit(1);
  return Boolean(data?.length);
}
