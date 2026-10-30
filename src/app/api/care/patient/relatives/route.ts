import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { createPatientRelative } from "@/lib/care/patient-relatives";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.id) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  const body = await request.json().catch(() => null) as {
    firstName?: string;
    lastName?: string;
    birthYear?: number | null;
    relation?: string;
  } | null;
  if (!body) return NextResponse.json({ error: "Données illisibles" }, { status: 400 });
  const year = body.birthYear == null || String(body.birthYear).trim() === "" ? null : Number(body.birthYear);
  const result = await createPatientRelative({
    accountId: session.id,
    firstName: body.firstName ?? "",
    lastName: body.lastName ?? "",
    birthYear: year,
    relation: body.relation ?? "",
  });
  if (!result.ok) return NextResponse.json({ error: result.message }, { status: 400 });
  return NextResponse.json({ id: result.id });
}
