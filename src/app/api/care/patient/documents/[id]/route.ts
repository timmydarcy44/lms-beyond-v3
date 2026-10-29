import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { openPatientDocument } from "@/lib/care/patient-documents";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  const session = await getSession();
  if (!session?.id) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  const { id } = await params;
  const download = new URL(request.url).searchParams.get("download") === "1";
  const opened = await openPatientDocument(session.id, id, download);
  if (!opened) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  if (download) {
    if (!opened.signedUrl) return NextResponse.json({ error: "Fichier indisponible" }, { status: 404 });
    return NextResponse.redirect(opened.signedUrl);
  }
  return NextResponse.json({ signedUrl: opened.signedUrl });
}
