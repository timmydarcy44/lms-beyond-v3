import { NextRequest, NextResponse } from "next/server";
import { getFormateurContentLibrary } from "@/lib/queries/formateur";

export async function GET(request: NextRequest) {
  try {
    const library = await getFormateurContentLibrary();
    return NextResponse.json(library);
  } catch (error) {
    console.error("[api/formateur/content-library] Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}




