import { NextRequest, NextResponse } from "next/server";
import { readExpertPatientSpace, saveExpertJourney } from "@/lib/care/expert-patient-space";
import { requireCareExpert } from "@/lib/expert/care-auth";

export async function GET(request: NextRequest) {
  const gate = await requireCareExpert();
  if (!gate.ok) return gate.response;
  const clientId = request.nextUrl.searchParams.get("clientId")?.trim() ?? "";
  const space = await readExpertPatientSpace({ expertId: gate.expertId, db: gate.db }, clientId);
  if (!space) return NextResponse.json({ error: "Membre introuvable" }, { status: 404 });
  return NextResponse.json(space);
}

export async function PUT(request: NextRequest) {
  const gate = await requireCareExpert();
  if (!gate.ok) return gate.response;
  const body = await request.json().catch(() => null) as {
    clientId?: string;
    subjectRelativeId?: string | null;
    title?: string;
    steps?: Array<{ title?: string; status?: string; date?: string | null }>;
    tasks?: Array<{ label?: string; hint?: string | null }>;
    note?: string;
    resource?: { title?: string; kind?: string; durationMin?: number | null; url?: string } | null;
  } | null;
  if (!body?.clientId) return NextResponse.json({ error: "Membre requis" }, { status: 400 });
  const result = await saveExpertJourney({ expertId: gate.expertId, db: gate.db }, {
    clientId: body.clientId,
    subjectRelativeId: body.subjectRelativeId || null,
    title: body.title ?? "",
    steps: (body.steps ?? []).map((step) => ({ title: step.title ?? "", status: step.status ?? "todo", date: step.date ?? null })),
    tasks: (body.tasks ?? []).map((task) => ({ label: task.label ?? "", hint: task.hint ?? null })),
    note: body.note ?? "",
    resource: body.resource?.url
      ? {
          title: body.resource.title ?? "",
          kind: body.resource.kind ?? "Lecture",
          durationMin: body.resource.durationMin ?? null,
          url: body.resource.url,
        }
      : null,
  });
  if (!result.ok) return NextResponse.json({ error: result.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
