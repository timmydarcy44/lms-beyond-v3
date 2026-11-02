import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { formatEurosHt } from "@/lib/control/policy";
import { sendEmail } from "@/lib/email/resend-client";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await getServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user || !(await isSuperAdmin())) {
    return NextResponse.json({ error: "Réservé au staff Byound" }, { status: 403 });
  }
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  const invoice = await service.from("org_billing_documents").select("id, org_id, number, amount_ht_cents, due_at, paid_at, doc_type").eq("id", id).maybeSingle();
  if (invoice.error || !invoice.data || invoice.data.doc_type !== "invoice" || invoice.data.paid_at) {
    return NextResponse.json({ error: "Facture échue introuvable" }, { status: 404 });
  }
  const admin = await service.from("org_memberships").select("user_id").eq("org_id", invoice.data.org_id).eq("role", "admin").limit(1);
  const userId = admin.data?.[0]?.user_id as string | undefined;
  const profile = userId ? await service.from("profiles").select("email").eq("id", userId).maybeSingle() : { data: null };
  const email = profile.data?.email as string | undefined;
  if (!email) return NextResponse.json({ error: "Aucun administrateur à prévenir" }, { status: 404 });
  const sent = await sendEmail({
    to: email,
    subject: `Rappel de facture ${invoice.data.number ?? ""}`.trim(),
    html: `<p>La facture ${invoice.data.number ?? ""} de ${formatEurosHt(Number(invoice.data.amount_ht_cents ?? 0))} HT est arrivée à échéance.</p>`,
    skipBcc: true,
  });
  if (!sent.success) return NextResponse.json({ error: sent.error ?? "Envoi impossible" }, { status: 502 });
  return NextResponse.json({ ok: true });
}
