import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const supabase = await getServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });
    }

    // Récupérer tous les documents de l'utilisateur
    const { data: documents, error } = await supabase
      .from("beyond_note_documents")
      .select("*")
      .eq("user_id", session.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[beyond-note/documents] Error:", error);
      // Si la table n'existe pas encore, retourner un tableau vide
      if (error.code === "42P01") {
        console.warn("[beyond-note/documents] Table beyond_note_documents n'existe pas encore. Exécutez CREATE_BEYOND_NOTE_TABLES.sql");
        return NextResponse.json({ 
          documents: [],
          warning: "Table non créée - exécutez CREATE_BEYOND_NOTE_TABLES.sql"
        });
      }
      return NextResponse.json({ 
        error: "Erreur lors de la récupération",
        details: error.message,
        code: error.code,
      }, { status: 500 });
    }

    return NextResponse.json({ documents: documents || [] });
  } catch (error) {
    console.error("[beyond-note/documents] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Erreur serveur inconnue";
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error("[beyond-note/documents] Error details:", { errorMessage, errorStack });
    return NextResponse.json(
      { 
        error: "Erreur serveur",
        details: errorMessage,
        ...(process.env.NODE_ENV === "development" && { stack: errorStack })
      },
      { status: 500 }
    );
  }
}

