import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const supabase = await getServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { messageId } = await params;

    // Récupérer le message
    const { data: message, error } = await supabase
      .from("messages")
      .select("id, sender_id, content, subject, body, type, metadata, created_at")
      .eq("id", messageId)
      .single();

    if (error || !message) {
      return NextResponse.json({ error: "Message non trouvé" }, { status: 404 });
    }

    // Vérifier que l'utilisateur a accès à ce message (expéditeur ou destinataire)
    const userId = authData.user.id;
    const isSender = message.sender_id === userId;
    
    let isRecipient = false;
    if (!isSender) {
      const { data: recipient } = await supabase
        .from("message_recipients")
        .select("recipient_id")
        .eq("message_id", messageId)
        .eq("recipient_id", userId)
        .single();
      
      isRecipient = !!recipient;
    }

    if (!isSender && !isRecipient) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    return NextResponse.json({ message });
  } catch (error) {
    console.error("[messages/[messageId]] Error:", error);
    return NextResponse.json(
      { error: "Erreur serveur", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}









