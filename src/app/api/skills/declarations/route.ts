import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
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

  const { data, error } = await db
    .from("skill_declarations")
    .select(
      "id, skill_id, raw_label, match_confidence, match_status, kind, level, context, proof_url, proof_note, status, updated_at, skills(id, label, description, is_soft, skill_domains(label))",
    )
    .eq("user_id", session.id)
    .order("updated_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ declarations: data ?? [] });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.id) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ error: "NO_DB" }, { status: 503 });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const kind = body?.kind === "soft" ? "soft" : "hard";
  const raw_label = String(body?.raw_label ?? "").trim() || "Sans titre";
  const match_status = MATCH.has(String(body?.match_status))
    ? String(body?.match_status)
    : "pending_review";
  const level = LEVELS.has(String(body?.level)) ? String(body?.level) : "intermediaire";
  const context = CONTEXTS.has(String(body?.context ?? "")) ? String(body?.context) : null;
  const status = STATUS.has(String(body?.status)) ? String(body?.status) : "draft";
  const skill_id = body?.skill_id ? String(body.skill_id) : null;
  const match_confidence =
    body?.match_confidence == null || body.match_confidence === ""
      ? null
      : Number(body.match_confidence);

  const { data, error } = await db
    .from("skill_declarations")
    .insert({
      user_id: session.id,
      skill_id,
      raw_label,
      match_confidence: Number.isFinite(match_confidence) ? match_confidence : null,
      match_status,
      kind,
      level,
      context,
      proof_url: body?.proof_url ? String(body.proof_url).trim() : null,
      proof_note: body?.proof_note ? String(body.proof_note).trim() : null,
      status,
      updated_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ id: data.id });
}
