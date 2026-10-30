import { NextResponse } from "next/server";
import { shareExpertDocument } from "@/lib/care/expert-patient-space";
import { requireCareExpert } from "@/lib/expert/care-auth";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireCareExpert();
  if (!gate.ok) return gate.response;
  const result = await shareExpertDocument({ expertId: gate.expertId, db: gate.db }, (await params).id);
  if (!result.ok) return NextResponse.json({ error: result.message }, { status: 404 });
  return NextResponse.json({ ok: true, emailSent: result.already ? true : result.emailSent });
}
