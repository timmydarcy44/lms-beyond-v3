import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { statusesFromProofDecision, type ProofReviewDecision } from "@/lib/skills/analyze-skill-proof";

export const dynamic = "force-dynamic";

const DECISIONS = new Set<ProofReviewDecision>(["validated", "refused", "needs_more"]);

export async function GET() {
  if (!(await isSuperAdmin())) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ error: "NO_DB" }, { status: 503 });

  const { data, error } = await db
    .from("skill_declarations")
    .select(
      "id, raw_label, kind, level, proof_url, proof_note, proof_file_path, proof_review_status, proof_review_note, status, updated_at, user_id, profiles(email, full_name, first_name, last_name), skills(label)",
    )
    .in("proof_review_status", ["pending", "needs_more", "refused"])
    .order("updated_at", { ascending: false })
    .limit(100);

  if (error) {
    if (/proof_review/i.test(error.message)) {
      return NextResponse.json({ rows: [], warning: error.message });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ rows: data ?? [] });
}

export async function POST(request: NextRequest) {
  if (!(await isSuperAdmin())) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ error: "NO_DB" }, { status: 503 });

  const body = (await request.json().catch(() => null)) as {
    id?: string;
    decision?: string;
    note?: string;
  } | null;
  const id = String(body?.id ?? "").trim();
  const decision = String(body?.decision ?? "").trim() as ProofReviewDecision;
  if (!id || !DECISIONS.has(decision)) {
    return NextResponse.json({ error: "id + decision (validated|refused|needs_more) requis" }, { status: 400 });
  }

  const next = statusesFromProofDecision(decision);
  const note =
    String(body?.note ?? "").trim() ||
    (decision === "validated"
      ? "Preuve validée par Byound."
      : decision === "refused"
        ? "Preuve refusée par Byound."
        : "Pièces complémentaires demandées par Byound.");

  const { error } = await db
    .from("skill_declarations")
    .update({
      status: next.status,
      proof_review_status: next.proof_review_status,
      proof_review_note: note,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
