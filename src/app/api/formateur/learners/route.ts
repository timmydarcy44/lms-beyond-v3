import { NextRequest, NextResponse } from "next/server";
import { getFormateurLearners } from "@/lib/queries/formateur";

export async function GET(request: NextRequest) {
  try {
    const learners = await getFormateurLearners();
    console.log("[api/formateur/learners] Returning learners:", {
      count: learners.length,
      learners: learners.map(l => ({ id: l.id, email: l.email, name: l.full_name })),
    });
    return NextResponse.json({ learners });
  } catch (error) {
    console.error("[api/formateur/learners] Error:", error);
    return NextResponse.json(
      { 
        error: "Erreur lors de la récupération des apprenants",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

