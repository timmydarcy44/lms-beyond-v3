import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getServiceRoleClient, getServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** L'alternant démarre ou soumet une mission assignée par son tuteur. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session?.id) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const db = getServiceRoleClient() ?? (await getServerClient());
  if (!db) return NextResponse.json({ error: "NO_DB_CLIENT" }, { status: 500 });

  const { id: missionId } = await params;
  const body = (await request.json().catch(() => null)) as { action?: string } | null;
  const action = String(body?.action ?? "");

  const nextStatus =
    action === "start" ? "in_progress" : action === "submit" ? "submitted" : null;
  if (!nextStatus) {
    return NextResponse.json({ error: "Action inconnue (start | submit)" }, { status: 400 });
  }

  const { data: mission } = await db
    .from("tutor_missions")
    .select("id, assignment_id, status")
    .eq("id", missionId)
    .maybeSingle();
  if (!mission) return NextResponse.json({ error: "Mission introuvable" }, { status: 404 });

  const { data: assignment } = await db
    .from("tutor_assignments")
    .select("id, learner_id, status")
    .eq("id", (mission as { assignment_id: string }).assignment_id)
    .maybeSingle();

  if (
    !assignment ||
    String((assignment as { learner_id: string }).learner_id) !== session.id ||
    !["active", "paused"].includes(String((assignment as { status?: string }).status ?? ""))
  ) {
    return NextResponse.json({ error: "Mission introuvable" }, { status: 404 });
  }

  const current = String((mission as { status?: string }).status ?? "todo");
  if (action === "start" && !["todo", "correction_requested"].includes(current)) {
    return NextResponse.json({ error: "Cette mission n’est plus à démarrer." }, { status: 400 });
  }
  if (action === "submit" && !["todo", "in_progress", "correction_requested"].includes(current)) {
    return NextResponse.json({ error: "Cette mission n’est plus à envoyer." }, { status: 400 });
  }

  const payload: Record<string, unknown> = {
    status: nextStatus,
  };
  if (nextStatus === "submitted") {
    payload.submitted_at = new Date().toISOString();
  }

  const { error } = await db.from("tutor_missions").update(payload).eq("id", missionId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true, status: nextStatus });
}
