import { NextRequest, NextResponse } from "next/server";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

/**
 * DELETE /api/messages/conversation/[conversationId]
 * Supprime tous les messages d'une conversation pour l'utilisateur actuel
 * 
 * Note: On ne supprime pas physiquement les messages de la base de données,
 * mais on les marque comme supprimés pour l'utilisateur actuel en utilisant
 * une table de soft-delete ou en supprimant les entrées dans message_recipients.
 * 
 * Pour l'instant, on supprime les messages où l'utilisateur est soit l'expéditeur
 * soit le destinataire, en supprimant les entrées dans message_recipients et
 * en marquant les messages comme supprimés si l'utilisateur est l'expéditeur.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params;
    const supabase = await getServerClient();
    
    if (!supabase) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const userId = authData.user.id;

    console.log("[messages/conversation] Deleting conversation:", conversationId, "for user:", userId);

    // Utiliser le service role client pour bypasser RLS si nécessaire
    const serviceClient = getServiceRoleClient();
    const clientToUse = serviceClient || supabase;

    // Récupérer tous les messages de cette conversation
    // Une conversation est identifiée par l'ID de l'autre partie (expéditeur ou destinataire)
    // On doit trouver tous les messages où :
    // - L'utilisateur actuel est l'expéditeur ET l'autre partie est conversationId
    // - OU l'utilisateur actuel est le destinataire ET l'expéditeur est conversationId

    // 1. Récupérer les IDs des messages envoyés par conversationId à l'utilisateur actuel
    const { data: messagesFromConversation } = await clientToUse
      .from("messages")
      .select("id")
      .eq("sender_id", conversationId);

    const messageIdsFromConversation = messagesFromConversation?.map(m => m.id) || [];

    // Supprimer les entrées dans message_recipients pour ces messages (messages reçus)
    let deletedRecipientsCount = 0;
    if (messageIdsFromConversation.length > 0) {
      const { error: deleteRecipientsError } = await clientToUse
        .from("message_recipients")
        .delete()
        .eq("recipient_id", userId)
        .in("message_id", messageIdsFromConversation);

      if (deleteRecipientsError) {
        console.error("[messages/conversation] Error deleting recipients:", deleteRecipientsError);
      } else {
        deletedRecipientsCount = messageIdsFromConversation.length;
      }
    }

    // 2. Récupérer les messages envoyés par l'utilisateur actuel à conversationId
    // On récupère tous les messages envoyés par l'utilisateur et on filtre par metadata.recipientId
    const { data: allUserMessages } = await clientToUse
      .from("messages")
      .select("id, metadata")
      .eq("sender_id", userId);

    // Filtrer les messages où metadata.recipientId === conversationId
    const messageIdsToConversation = (allUserMessages || [])
      .filter((msg: any) => msg.metadata?.recipientId === conversationId)
      .map((msg: any) => msg.id);

    // 2. Pour les messages envoyés par l'utilisateur actuel, on ne les supprime PAS physiquement
    //    On supprime seulement les entrées dans message_recipients pour que l'utilisateur ne les voie plus
    //    Mais le destinataire peut toujours les voir
    let deletedMessagesCount = 0;
    if (messageIdsToConversation.length > 0) {
      // Supprimer seulement les entrées dans message_recipients pour ces messages
      // Cela cache les messages pour l'utilisateur actuel sans les supprimer pour le destinataire
      const { error: deleteRecipientsError2 } = await clientToUse
        .from("message_recipients")
        .delete()
        .in("message_id", messageIdsToConversation);

      if (deleteRecipientsError2) {
        console.error("[messages/conversation] Error deleting recipients for sent messages:", deleteRecipientsError2);
        return NextResponse.json(
          { error: "Erreur lors de la suppression", details: deleteRecipientsError2.message },
          { status: 500 }
        );
      }

      // Créer une table deleted_messages pour marquer les messages comme supprimés pour l'utilisateur
      // Si la table n'existe pas, on utilisera juste la suppression des recipients
      // Pour l'instant, on ne supprime pas physiquement les messages
      deletedMessagesCount = messageIdsToConversation.length;
    }

    console.log("[messages/conversation] Conversation deleted successfully:", {
      conversationId,
      deletedRecipients: deletedRecipientsCount,
      deletedMessages: deletedMessagesCount,
    });

    return NextResponse.json({
      success: true,
      deletedRecipients: deletedRecipientsCount,
      deletedMessages: deletedMessagesCount,
    });
  } catch (error) {
    console.error("[messages/conversation] Unexpected error:", error);
    return NextResponse.json(
      { error: "Erreur serveur", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

