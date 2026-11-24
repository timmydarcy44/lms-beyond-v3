import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { resolveEffectiveApprenantUserId } from "@/lib/control/learner-preview";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const LEVELS = new Set(["debutant", "intermediaire", "confirme", "expert"]);
const CONTEXTS = new Set(["stage", "job", "alternance", "asso_club", "perso"]);
const MATCH = new Set(["matched", "kept_raw", "pending_review"]);
const STATUS = new Set(["draft", "declared", "proven"]);

export async function GET() {
  const session = await getSession();
  if (!session?.id) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ error: "NO_DB" }, { status: 503 });

  const { userId } = await resolveEffectiveApprenantUserId(session.id);

  const rich = await db
    .from("skill_declarations")
    .select(
      "id, skill_id, raw_label, match_confidence, match_status, kind, level, context, proof_url, proof_note, proof_review_status, proof_review_note, status, updated_at, skills(id, label, description, is_soft, skill_domains(label))",
    )
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (rich.error && /proof_review/i.test(rich.error.message)) {
    const fallback = await db
      .from("skill_declarations")
      .select(
        "id, skill_id, raw_label, match_confidence, match_status, kind, level, context, proof_url, proof_note, status, updated_at, skills(id, label, description, is_soft, skill_domains(label))",
      )
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });
    if (fallback.error) return NextResponse.json({ error: fallback.error.message }, { status: 400 });
    return NextResponse.json({ declarations: fallback.data ?? [] });
  }

  if (rich.error) return NextResponse.json({ error: rich.error.message }, { status: 400 });
  return NextResponse.json({ declarations: rich.data ?? [] });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.id) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ error: "NO_DB" }, { status: 503 });

  const { preview } = await resolveEffectiveApprenantUserId(session.id);
  if (preview) {
    return NextResponse.json(
      { error: "Lecture seule en aperçu espace apprenant" },
      { status: 403 },
    );
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const kind = body?.kind === "soft" ? "soft" : "hard";
  const raw_label = String(body?.raw_label ?? "").trim() || "Sans titre";
  const match_status = MATCH.has(String(body?.match_status))
    ? String(body?.match_status)
    : "pending_review";
  const level = LEVELS.has(String(body?.level)) ? String(body?.level) : "intermediaire";
  const context = CONTEXTS.has(String(body?.context ?? "")) ? String(body?.context) : null;
  // Jamais « proven » côté client : seule l’analyse Byound (ou le BO) peut valider.
  let status = STATUS.has(String(body?.status)) ? String(body?.status) : "draft";
  if (status === "proven") status = "declared";
  const skill_id = body?.skill_id ? String(body.skill_id) : null;
  const match_confidence =
    body?.match_confidence == null || body.match_confidence === ""
      ? null
      : Number(body.match_confidence);
  const proof_url = body?.proof_url ? String(body.proof_url).trim() : null;
  const proof_note = body?.proof_note ? String(body.proof_note).trim() : null;

  const baseInsert = {
    user_id: session.id,
    skill_id,
    raw_label,
    match_confidence: Number.isFinite(match_confidence) ? match_confidence : null,
    match_status,
    kind,
    level,
    context,
    proof_url,
    proof_note,
    status,
    updated_at: new Date().toISOString(),
  };

  let { data, error } = await db
    .from("skill_declarations")
    .insert({
      ...baseInsert,
      proof_review_status: proof_url || proof_note ? "pending" : "none",
    })
    .select("id")
    .single();

  if (error && /proof_review/i.test(error.message)) {
    const retry = await db.from("skill_declarations").insert(baseInsert).select("id").single();
    data = retry.data;
    error = retry.error;
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ id: data!.id });
}
