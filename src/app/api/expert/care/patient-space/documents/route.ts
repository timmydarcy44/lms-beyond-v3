import { NextRequest, NextResponse } from "next/server";
import { storeExpertDocument } from "@/lib/care/expert-patient-space";
import { requireCareExpert } from "@/lib/expert/care-auth";

export async function POST(request: NextRequest) {
  const gate = await requireCareExpert();
  if (!gate.ok) return gate.response;
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!form || !(file instanceof File)) return NextResponse.json({ error: "Fichier requis" }, { status: 400 });
  const result = await storeExpertDocument({ expertId: gate.expertId, db: gate.db }, {
    clientId: String(form.get("clientId") ?? ""),
    kind: String(form.get("kind") ?? ""),
    title: String(form.get("title") ?? ""),
    subjectRelativeId: String(form.get("subjectRelativeId") ?? "") || null,
    file,
  });
  if (!result.ok) return NextResponse.json({ error: result.message }, { status: 400 });
  return NextResponse.json({ id: result.id });
}
