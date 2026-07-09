import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";
import type { InterviewFeedbackPayload } from "@/app/api/ai/experiential-interview/feedback/route";

type ChatMessage = { role: "user" | "assistant"; content: string };

export async function POST(request: NextRequest) {
  try {
    const supabase = await getServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = (await request.json()) as {
      courseId?: string | null;
      lessonId?: string;
      interviewStyle?: "coaching" | "experiential";
      audience?: string;
      chapterTitle?: string;
      courseTitle?: string;
      status?: "completed" | "abandoned";
      messages?: ChatMessage[];
      feedback?: InterviewFeedbackPayload | null;
      startedAt?: string;
      durationSeconds?: number;
    };

    const lessonId = String(body.lessonId ?? "").trim();
    if (!lessonId) {
      return NextResponse.json({ error: "lessonId requis" }, { status: 400 });
    }

    const messages = Array.isArray(body.messages) ? body.messages : [];
    const userTurnCount = messages.filter((m) => m.role === "user" && String(m.content ?? "").trim()).length;

    const { data, error } = await supabase
      .from("experiential_interview_sessions")
      .insert({
        user_id: user.id,
        course_id: body.courseId || null,
        lesson_id: lessonId,
        interview_style: body.interviewStyle === "coaching" ? "coaching" : "experiential",
        audience: body.audience ?? null,
        chapter_title: body.chapterTitle ?? null,
        course_title: body.courseTitle ?? null,
        status: body.status ?? "completed",
        user_turn_count: userTurnCount,
        messages,
        feedback: body.feedback ?? null,
        started_at: body.startedAt ? new Date(body.startedAt).toISOString() : new Date().toISOString(),
        completed_at: new Date().toISOString(),
        duration_seconds: Math.max(0, Number(body.durationSeconds ?? 0)),
      })
      .select("id")
      .single();

    if (error) {
      console.error("[interview-session] insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, id: data?.id });
  } catch (e) {
    console.error("[interview-session]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur serveur" },
      { status: 500 },
    );
  }
}
