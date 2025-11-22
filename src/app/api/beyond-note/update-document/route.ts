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
    const { documentId, modifiedText } = body;

    if (!documentId || modifiedText === undefined) {
      return NextResponse.json(
        { error: "documentId et modifiedText requis" },
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

    // Mettre à jour le texte extrait du document
    const { data: updatedDocument, error: updateError } = await supabase
      .from("beyond_note_documents")
      .update({
        extracted_text: modifiedText,
        updated_at: new Date().toISOString(),
      })
      .eq("id", documentId)
      .select()
      .single();

    if (updateError) {
      console.error("[beyond-note/update-document] Error:", updateError);
      return NextResponse.json(
        { error: "Erreur lors de la sauvegarde" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      document: updatedDocument,
    });
  } catch (error) {
    console.error("[beyond-note/update-document] Error:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}







