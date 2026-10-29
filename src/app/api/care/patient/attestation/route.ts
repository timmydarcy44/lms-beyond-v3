import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { attestationPdf } from "@/lib/care/attestation-pdf";
import { formatPersonName } from "@/lib/care/person-name";
import { activeSubjectId, loadPatientRelatives, sameSubject } from "@/lib/care/patient-relatives";
import { getServiceRoleClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session?.id) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ error: "Indisponible" }, { status: 503 });
  const relatives = await loadPatientRelatives();
  const subjectId = activeSubjectId(request.nextUrl.searchParams.get("personne") ?? undefined, relatives);
  const { data: invoices } = await db
    .from("expert_care_invoices")
    .select("number, amount_cents, paid_at, method, sent_at, created_at, subject_relative_id, expert_id")
    .eq("patient_account_id", session.id)
    .not("paid_at", "is", null)
    .order("paid_at", { ascending: true });
  const rows = (invoices ?? []).filter((row) => sameSubject(row.subject_relative_id ? String(row.subject_relative_id) : null, subjectId));
  if (!rows.length) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  const expertId = String(rows[0].expert_id);
  const [{ data: profile }, { data: account }, { data: relative }] = await Promise.all([
    db.from("care_profiles").select("display_name, title, address, city").eq("expert_id", expertId).maybeSingle(),
    db.from("profiles").select("first_name, last_name").eq("id", session.id).maybeSingle(),
    subjectId ? db.from("care_relatives").select("first_name, last_name").eq("id", subjectId).eq("account_id", session.id).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const patientName = relative
    ? [formatPersonName(String(relative.first_name ?? "")), formatPersonName(String(relative.last_name ?? ""))].filter(Boolean).join(" ")
    : [formatPersonName(String(account?.first_name ?? "")), formatPersonName(String(account?.last_name ?? ""))].filter(Boolean).join(" ") || "Patient";
  const address = [profile?.address, profile?.city].filter(Boolean).join(", ") || null;
  const bytes = attestationPdf({
    practitionerName: formatPersonName(String(profile?.display_name ?? "")) || "Votre praticien",
    practitionerTitle: String(profile?.title ?? ""),
    practitionerAddress: address,
    patientName,
    lines: rows.map((row) => ({
      number: row.number ? String(row.number) : null,
      issuedAt: String(row.sent_at || row.created_at),
      paidAt: String(row.paid_at),
      amountCents: Number(row.amount_cents) || 0,
      method: row.method ? String(row.method) : null,
    })),
  });
  return new NextResponse(bytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "inline; filename=\"attestation-byound-care.pdf\"",
      "Cache-Control": "private, no-store",
    },
  });
}
