import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const supabase = await getServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });
    }

    const body = await request.json();
    const { documentId, action, result } = body;

    if (!documentId || !action || !result) {
      return NextResponse.json(
        { error: "documentId, action et result requis" },
        { status: 400 }
      );
    }

    // Vérifier que le document appartient à l'utilisateur
    const { data: document, error: docError } = await supabase
      .from("beyond_note_documents")
      .select("id, user_id")
      .eq("id", documentId)
      .eq("user_id", session.id)
      .single();

    if (docError || !document) {
      return NextResponse.json(
        { error: "Document non trouvé" },
        { status: 404 }
      );
    }

    // Stocker le résultat dans la table beyond_note_ai_results
    const { data: resultData, error: insertError } = await supabase
      .from("beyond_note_ai_results")
      .insert({
        document_id: documentId,
        action_type: action,
        result_text: result,
        user_id: session.id,
      })
      .select()
      .single();

    if (insertError) {
      console.error("[beyond-note/store-result] Error:", insertError);
      // Si la table n'existe pas encore, retourner un succès quand même
      if (insertError.code === "42P01") {
        return NextResponse.json({ success: true, stored: false });
      }
      return NextResponse.json(
        { error: "Erreur lors du stockage" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      stored: true,
      resultId: resultData.id,
    });
  } catch (error) {
    console.error("[beyond-note/store-result] Error:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

