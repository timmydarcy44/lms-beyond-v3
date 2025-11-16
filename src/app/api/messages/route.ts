import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
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
    const { recipientId, content, subject } = body;

    if (!recipientId || !content?.trim()) {
      return NextResponse.json(
        { error: "recipientId et content sont requis" },
        { status: 400 }
      );
    }

    console.log("[messages] Sending message from user:", userId, "to recipient:", recipientId, "subject:", subject);

    // Récupérer le rôle du destinataire pour le stocker dans metadata
    const { data: recipientProfile } = await supabase
      .from("profiles")
      .select("id, role, full_name, first_name, last_name")
      .eq("id", recipientId)
      .single();

    const recipientRole = recipientProfile?.role || "learner";
    const recipientName =
      recipientProfile?.full_name ||
      [recipientProfile?.first_name, recipientProfile?.last_name]
        .filter((part): part is string => Boolean(part && part.trim()))
        .join(" ")
        .trim() ||
      "Destinataire";

    const { data: senderProfile } = await supabase
      .from("profiles")
      .select("id, role, full_name, first_name, last_name")
      .eq("id", userId)
      .single();

    const senderRole = senderProfile?.role || "learner";
    const senderName =
      senderProfile?.full_name ||
      [senderProfile?.first_name, senderProfile?.last_name]
        .filter((part): part is string => Boolean(part && part.trim()))
        .join(" ")
        .trim() ||
      "Expéditeur";

    // Créer le message dans la table messages
    const messageContent = content.trim();
    const messageSubject = subject?.trim() || null;
    
    const messageData: any = {
      sender_id: userId,
      type: "message",
      content: messageContent,
      subject: messageSubject,
      body: messageContent,
      metadata: {
        recipientId: recipientId, // Stocker l'ID du destinataire pour faciliter la récupération
        recipientRole: recipientRole, // Stocker le rôle du destinataire pour l'affichage
        recipientName,
        senderRole: senderRole, // Stocker le rôle de l'expéditeur pour l'affichage
        senderName,
      },
    };

    const { data: message, error: messageError } = await supabase
      .from("messages")
      .insert(messageData)
      .select("id")
      .single();

    if (messageError || !message) {
      console.error("[messages] Error creating message:", messageError);
      return NextResponse.json(
        { error: "Erreur lors de la création du message", details: messageError?.message },
        { status: 500 }
      );
    }

    console.log("[messages] Message created:", message.id);

    // Créer l'entrée dans message_recipients pour le formateur
    const { error: recipientError } = await supabase
      .from("message_recipients")
      .insert({
        message_id: message.id,
        recipient_id: recipientId,
        read: false,
      });

    if (recipientError) {
      console.error("[messages] Error creating recipient:", recipientError);
      // On retourne quand même un succès partiel car le message est créé
      return NextResponse.json(
        { 
          success: true, 
          messageId: message.id,
          warning: "Message créé mais destinataire non enregistré",
          details: recipientError.message 
        },
        { status: 207 } // 207 Multi-Status
      );
    }

    console.log("[messages] Message sent successfully");

    return NextResponse.json({
      success: true,
      messageId: message.id,
      message: {
        id: message.id,
        sender_id: userId,
        content: messageContent,
        type: "message",
        created_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("[messages] Unexpected error:", error);
    return NextResponse.json(
      { error: "Erreur serveur", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

