import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { FORMATION_PROPOSAL_SQL_HINT } from "@/lib/expert/formation-proposals";
import { missingRelation } from "@/lib/expert/care-auth";
import { getServiceRoleClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const action = body?.action === "approve" || body?.action === "reject" ? body.action : null;
  if (!action) return NextResponse.json({ error: "Action invalide." }, { status: 400 });
  const note = typeof body?.note === "string" ? body.note.trim().slice(0, 2000) : "";
  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  const { error } = await db
    .from("expert_formation_proposals")
    .update({
      status: action === "approve" ? "approved" : "rejected",
      review_note: note || null,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) {
    return NextResponse.json(
      { error: missingRelation(error) ? FORMATION_PROPOSAL_SQL_HINT : "La décision n'a pas pu être enregistrée." },
      { status: 500 },
    );
  }
  revalidatePath("/super/formations-proposees");
  revalidatePath("/dashboard/expert/formations/proposer");
  return NextResponse.json({ ok: true });
}
