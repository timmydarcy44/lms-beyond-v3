import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const LEVELS = new Set(["debutant", "intermediaire", "confirme", "expert"]);
const CONTEXTS = new Set(["stage", "job", "alternance", "asso_club", "perso"]);
const MATCH = new Set(["matched", "kept_raw", "pending_review"]);
const STATUS = new Set(["draft", "declared", "proven"]);

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session?.id) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ error: "NO_DB" }, { status: 503 });

  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "INVALID" }, { status: 400 });

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if ("raw_label" in body) patch.raw_label = String(body.raw_label ?? "").trim() || "Sans titre";
  if ("skill_id" in body) patch.skill_id = body.skill_id ? String(body.skill_id) : null;
  if ("kind" in body) patch.kind = body.kind === "soft" ? "soft" : "hard";
  if ("match_status" in body && MATCH.has(String(body.match_status))) {
    patch.match_status = String(body.match_status);
  }
  if ("match_confidence" in body) {
    const n = Number(body.match_confidence);
    patch.match_confidence = Number.isFinite(n) ? n : null;
  }
  if ("level" in body && LEVELS.has(String(body.level))) patch.level = String(body.level);
  if ("context" in body) {
    patch.context = CONTEXTS.has(String(body.context ?? "")) ? String(body.context) : null;
  }
  if ("status" in body && STATUS.has(String(body.status))) {
    // Le client ne peut pas s’auto-valider « proven »
    const next = String(body.status);
    patch.status = next === "proven" ? "declared" : next;
  }
  if ("proof_url" in body) patch.proof_url = body.proof_url ? String(body.proof_url).trim() : null;
  if ("proof_note" in body) patch.proof_note = body.proof_note ? String(body.proof_note).trim() : null;
  if ("proof_url" in body || "proof_note" in body) {
    const hasProof = Boolean(patch.proof_url || patch.proof_note);
    if (hasProof) {
      patch.proof_review_status = "pending";
      if (patch.status === "proven") patch.status = "declared";
    }
  }

  const { data, error } = await db
    .from("skill_declarations")
    .update(patch)
    .eq("id", id)
    .eq("user_id", session.id)
    .select("id, status, match_status, skill_id, raw_label, level, context")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!data) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  return NextResponse.json({ declaration: data });
}
