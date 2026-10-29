import { NextRequest, NextResponse } from "next/server";
import { linkInvoiceForAttestation } from "@/lib/care/expert-patient-space";
import { requireCareExpert } from "@/lib/expert/care-auth";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireCareExpert();
  if (!gate.ok) return gate.response;
  const body = await request.json().catch(() => null) as { clientId?: string; subjectRelativeId?: string | null } | null;
  if (!body?.clientId) return NextResponse.json({ error: "Membre requis" }, { status: 400 });
  const result = await linkInvoiceForAttestation({ expertId: gate.expertId, db: gate.db }, (await params).id, body.clientId, body.subjectRelativeId || null);
  if (!result.ok) return NextResponse.json({ error: result.message }, { status: 404 });
  return NextResponse.json({ ok: true });
}
