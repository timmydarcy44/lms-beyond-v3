import { NextRequest, NextResponse } from "next/server";
import { getFormateurGroups } from "@/lib/queries/formateur";

export async function GET(request: NextRequest) {
  try {
    const groups = await getFormateurGroups();
    return NextResponse.json({ groups });
  } catch (error) {
    console.error("[api/formateur/groups] Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}









