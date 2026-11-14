import { NextRequest, NextResponse } from "next/server";
import { writeDisabilityAccessLog } from "@/lib/handicap/access-log";
import { resolveDisabilityCaseId } from "@/lib/handicap/resolve-case";
import { requireDisabilityStaff } from "@/lib/handicap/staff";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string; docId: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const gate = await requireDisabilityStaff();
  if (!gate.ok) return NextResponse.json({ error: "Non autorisé" }, { status: gate.status });

  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const { id: rawId, docId } = await ctx.params;
  const caseId = await resolveDisabilityCaseId(service, rawId);
  if (!caseId) return NextResponse.json({ error: "Dossier introuvable" }, { status: 404 });

  const { data: doc } = await service
    .from("disability_documents")
    .select("id, storage_path")
    .eq("id", docId)
    .eq("case_id", caseId)
    .maybeSingle();
  if (!doc?.storage_path) {
    return NextResponse.json({ error: "Document introuvable" }, { status: 404 });
  }

  const { data: signed, error } = await service.storage
    .from("disability-docs")
    .createSignedUrl(String(doc.storage_path), 60);
  if (error || !signed?.signedUrl) {
    console.error("[disability] signedUrl", caseId, docId, error?.message);
    return NextResponse.json({ error: "URL indisponible" }, { status: 400 });
  }

  await writeDisabilityAccessLog(service, {
    caseId,
    actorId: gate.userId,
    action: "open_document",
  });

  return NextResponse.json({ signedUrl: signed.signedUrl });
}
