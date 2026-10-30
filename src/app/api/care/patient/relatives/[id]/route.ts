import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { deletePatientRelative } from "@/lib/care/patient-relatives";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.id) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  const removed = await deletePatientRelative(session.id, (await params).id);
  if (!removed) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
