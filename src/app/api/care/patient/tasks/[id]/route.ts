import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { setPatientTaskDone } from "@/lib/care/patient-space";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.id) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  const body = await request.json().catch(() => null) as { done?: boolean } | null;
  const saved = await setPatientTaskDone(session.id, (await params).id, body?.done === true);
  if (!saved) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
