import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await getServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const userId = authData.user.id;
    const body = await request.json();
    const { consigneId, messageId, title } = body;

    if (!consigneId || !messageId) {
      return NextResponse.json({ error: "consigneId et messageId sont requis" }, { status: 400 });
    }

    // Récupérer le message pour obtenir les infos de la consigne
    const { data: message, error: messageError } = await supabase
      .from("messages")
      .select("id, sender_id, subject, metadata")
      .eq("id", messageId)
      .single();

    if (messageError || !message) {
      return NextResponse.json({ error: "Message non trouvé" }, { status: 404 });
    }

    // Vérifier que l'utilisateur est bien destinataire de cette consigne
    const { data: recipient } = await supabase
      .from("message_recipients")
      .select("recipient_id")
      .eq("message_id", messageId)
      .eq("recipient_id", userId)
      .single();

    if (!recipient) {
      return NextResponse.json({ error: "Accès refusé à cette consigne" }, { status: 403 });
    }

    // Nom du dossier basé sur le titre de la consigne
    const folderName = `Consignes - ${title || message.subject || "Sans titre"}`;

    // Vérifier si un dossier existe déjà pour cette consigne et cet apprenant
    const { data: existingFolder } = await supabase
      .from("drive_folders")
      .select("id")
      .eq("owner_id", userId)
      .eq("name", folderName)
      .single();

    if (existingFolder) {
      return NextResponse.json({ folderId: existingFolder.id });
    }

    // Créer un nouveau dossier pour cette consigne
    const { data: newFolder, error: folderError } = await supabase
      .from("drive_folders")
      .insert({
        name: folderName,
        owner_id: userId,
        consigne_id: consigneId || null,
        due_at: (message.metadata as any)?.dueDate ? new Date((message.metadata as any).dueDate) : null,
      })
      .select("id")
      .single();

    if (folderError || !newFolder) {
      console.error("[drive/folders/consigne] Error creating folder:", folderError);
      return NextResponse.json({ error: "Erreur lors de la création du dossier" }, { status: 500 });
    }

    return NextResponse.json({ folderId: newFolder.id, folderName });
  } catch (error) {
    console.error("[drive/folders/consigne] Unexpected error:", error);
    return NextResponse.json(
      { error: "Erreur serveur", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}








