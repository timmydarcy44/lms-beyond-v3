import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";

import { sendEmail } from "@/lib/email/resend-client";
import { EDGE_COCKPIT_FROM } from "@/lib/email/edge-cockpit-from";
import { periodPrefill } from "@/lib/tuteur/followup-server";
import { requireTutorClient } from "@/lib/tuteur/require-tutor";

export async function POST(request: NextRequest, { params }: { params: Promise<{ periodId: string }> }) {
  const auth = await requireTutorClient();
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  const { periodId } = await params;
  const period = await auth.ctx.supabase.from("booklet_periods").select("*").eq("id", periodId).maybeSingle();
  if (!period.data) return NextResponse.json({ error: "Période introuvable" }, { status: 404 });
  if (period.data.status !== "awaiting_tutor") {
    return NextResponse.json({ error: "Ce n'est pas encore votre tour de signer" }, { status: 409 });
  }
  if (!String(period.data.tutor_appreciation ?? "").trim()) {
    return NextResponse.json({ error: "L'appréciation est obligatoire avant la signature" }, { status: 400 });
  }
  const booklet = await auth.ctx.supabase.from("apprenticeship_booklets").select("*").eq("id", period.data.booklet_id).maybeSingle();
  if (!booklet.data || booklet.data.tutor_id !== auth.ctx.userId) {
    return NextResponse.json({ error: "Période introuvable" }, { status: 404 });
  }
  const studentSign = await auth.ctx.supabase
    .from("booklet_signatures")
    .select("id")
    .eq("period_id", periodId)
    .eq("signer_role", "student")
    .maybeSingle();
  if (!studentSign.data) return NextResponse.json({ error: "L'alternant n'a pas encore signé" }, { status: 409 });

  const prefill = await periodPrefill(
    auth.ctx.supabase,
    String(booklet.data.student_id),
    String(period.data.start_date),
    String(period.data.end_date),
  );
  const snapshot = {
    period: period.data,
    prefill,
    booklet: { contract_start: booklet.data.contract_start, contract_end: booklet.data.contract_end },
  };
  const contentHash = createHash("sha256").update(JSON.stringify(snapshot)).digest("hex");
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
  const signed = await auth.ctx.supabase.from("booklet_signatures").insert({
    period_id: periodId,
    signer_role: "tutor",
    signer_id: auth.ctx.userId,
    ip,
    user_agent: request.headers.get("user-agent"),
    content_hash: contentHash,
  });
  if (signed.error) return NextResponse.json({ error: "Signature impossible" }, { status: 500 });
  await auth.ctx.supabase.from("booklet_periods").update({ status: "awaiting_cfa", snapshot, content_hash: contentHash }).eq("id", periodId);

  if (booklet.data.cfa_referent_id) {
    const referent = await auth.ctx.supabase.from("profiles").select("email").eq("id", booklet.data.cfa_referent_id).maybeSingle();
    if (referent.data?.email) {
      await sendEmail({
        to: String(referent.data.email),
        from: EDGE_COCKPIT_FROM,
        subject: "Livret d'alternance à signer",
        html: `<p>Une période de livret attend votre signature.</p><p><a href="https://www.byound.fr/livret/periode/${periodId}">Ouvrir la période</a></p>`,
      });
    }
  }
  return NextResponse.json({ ok: true });
}
