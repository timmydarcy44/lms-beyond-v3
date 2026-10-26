import { NextRequest, NextResponse } from "next/server";
import { sendApprenticeProfile } from "@/lib/cfa/send-apprentice-profile";
import { getServiceRoleClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  const body = await request.json().catch(() => null) as { token?: unknown; companyId?: unknown; needId?: unknown; jobOfferId?: unknown } | null;
  const token = String(body?.token ?? "");
  const companyId = String(body?.companyId ?? "");
  const needId = String(body?.needId ?? "");
  const jobOfferId = String(body?.jobOfferId ?? "");
  if (!token || !companyId || (!needId && !jobOfferId)) return NextResponse.json({ error: "Lien invalide." }, { status: 400 });

  const current = await db.from("cfa_applications").select("id").eq("resume_token", token).maybeSingle();
  const applicationId = String((current.data as { id?: string } | null)?.id ?? "");
  if (!applicationId) return NextResponse.json({ error: "Candidature introuvable." }, { status: 404 });

  const company = await db.from("cfa_companies").select("id, organization_id").eq("id", companyId).maybeSingle();
  const owner = company.data as { organization_id?: string | null } | null;
  if (!owner) return NextResponse.json({ error: "Entreprise introuvable." }, { status: 404 });
  if (needId) {
    const need = await db.from("cfa_company_needs").select("id").eq("id", needId).eq("company_id", companyId).maybeSingle();
    if (!need.data) return NextResponse.json({ error: "Offre introuvable." }, { status: 404 });
  } else {
    const offer = await db.from("job_offers").select("school_id").eq("id", jobOfferId).maybeSingle();
    if (!offer.data || String((offer.data as { school_id?: string | null }).school_id ?? "") !== String(owner.organization_id ?? "")) {
      return NextResponse.json({ error: "Offre introuvable." }, { status: 404 });
    }
  }

  const saved = await db
    .from("cfa_applications")
    .update({ share_with_companies: true, share_with_companies_at: new Date().toISOString() })
    .eq("id", applicationId);
  if (saved.error) return NextResponse.json({ error: saved.error.message }, { status: 400 });

  const sent = await sendApprenticeProfile(db, {
    companyId,
    applicationId,
    needId: needId || null,
    jobOfferId: jobOfferId || null,
  });
  if (!sent.ok) return NextResponse.json({ ok: true, emailed: false, error: sent.error });
  return NextResponse.json({ ok: true, emailed: !sent.already });
}
