import { getServerClient, getServiceRoleClientOrFallback } from "@/lib/supabase/server";

export type Message = {
  id: string;
  sender_id: string;
  sender_name?: string;
  content: string;
  subject?: string | null;
  type: "message" | "consigne" | "notification";
  metadata?: {
    title?: string;
    dueDate?: string;
    fileUrl?: string;
    groupIds?: string[];
    learnerIds?: string[];
    recipientId?: string;
    recipientRole?: string;
    senderRole?: string;
  };
  created_at: string;
  read: boolean;
  read_at?: string;
};

export type Conversation = {
  id: string;
  name: string;
  role: string;
  avatarUrl: string;
  status: "en ligne" | "occupé" | "hors ligne";
  messages: Array<{
    id: string;
    author: "learner" | "mentor";
    content: string;
    sentAt: Date;
    type?: "message" | "consigne";
  }>;
  unreadCount: number;
};

const buildProfileName = (profile: {
  full_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  display_name?: string | null;
  email?: string | null;
}) => {
  const full = profile.full_name?.trim();
  if (full) return full;

  const combined = [profile.first_name, profile.last_name]
    .filter((value): value is string => Boolean(value && value.trim()))
    .join(" ")
    .trim();
  if (combined.length > 0) return combined;

  const display = profile.display_name?.trim();
  if (display) return display;

  const email = profile.email?.trim();
  if (email) return email;

  return "Utilisateur";
};

/**
 * Récupère tous les messages de l'utilisateur actuel (reçus ET envoyés)
 * Cela permet d'avoir une conversation bidirectionnelle complète
 */
export async function getLearnerMessages(): Promise<Message[]> {
  const supabase = await getServerClient();
  if (!supabase) {
    return [];
  }
  const adminClient = await getServiceRoleClientOrFallback();

  try {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user?.id) {
      console.log("[messaging] No user authenticated");
      return [];
    }

    const userId = authData.user.id;
    console.log("[messaging] Fetching messages for user:", userId);

    // 1. Récupérer les messages REÇUS (où l'utilisateur est destinataire)
    const { data: messageRecipients, error: recipientsError } = await supabase
      .from("message_recipients")
      .select("message_id, read, read_at")
      .eq("recipient_id", userId);

    console.log("[messaging] message_recipients (received) query result:", {
      count: messageRecipients?.length || 0,
      error: recipientsError ? { code: recipientsError.code, message: recipientsError.message } : null,
    });

    // 2. Récupérer les messages ENVOYÉS (où l'utilisateur est expéditeur)
    const { data: sentMessages, error: sentError } = await supabase
      .from("messages")
      .select("id, sender_id, content, subject, body, type, metadata, created_at")
      .eq("sender_id", userId);

    console.log("[messaging] sent messages query result:", {
      count: sentMessages?.length || 0,
      error: sentError ? { code: sentError.code, message: sentError.message } : null,
    });

    // 3. Récupérer les messages reçus correspondants
    let receivedMessages: any[] = [];
    if (messageRecipients && messageRecipients.length > 0) {
      const messageIds = messageRecipients.map((mr: any) => mr.message_id);
      const { data: receivedMessagesData, error: messagesError } = await supabase
        .from("messages")
        .select("id, sender_id, content, subject, body, type, metadata, created_at")
        .in("id", messageIds);

      if (!messagesError && receivedMessagesData) {
        receivedMessages = receivedMessagesData;
      }
    }

    // Combiner tous les messages (reçus + envoyés)
    const allMessagesData = [
      ...(receivedMessages || []),
      ...(sentMessages || []),
    ];

    if (allMessagesData.length === 0) {
      console.log("[messaging] No messages found, falling back to notifications");
      return await getLearnerMessagesFromNotifications(userId);
    }

    // Récupérer les noms de tous les participants (expéditeurs et destinataires)
    const allSenderIds = [...new Set(allMessagesData.map((m: any) => m.sender_id))];
    
    // Récupérer aussi les IDs des destinataires depuis metadata et message_recipients
    const recipientIdsFromMetadata = allMessagesData
      .map((m: any) => (m.metadata as any)?.recipientId)
      .filter(Boolean);
    const recipientIdsFromRecipients = (messageRecipients || [])
      .map((mr: any) => mr.recipient_id)
      .filter((id: any) => id !== userId); // Exclure l'utilisateur actuel
    
    const allParticipantIds = [...new Set([...allSenderIds, ...recipientIdsFromMetadata, ...recipientIdsFromRecipients])];
    
    // Récupérer full_name, first_name, last_name, role pour avoir les vrais noms et rôles
    const profileClient = adminClient ?? supabase;

    const { data: participantsData } = await profileClient
      .from("profiles")
      .select("id, full_name, first_name, last_name, display_name, email, role")
      .in("id", allParticipantIds);

    // Créer un map avec le nom complet et le rôle
    // (full_name > first_name + last_name > display_name > email > "Utilisateur")
    const participantsMap = new Map(
      (participantsData || []).map((s: any) => {
        const name = buildProfileName({
          full_name: s.full_name,
          first_name: s.first_name,
          last_name: s.last_name,
          display_name: s.display_name,
          email: s.email,
        });
        return [s.id, { name, role: s.role || "learner" }];
      })
    );

    // Créer un map pour lier message_recipients aux messages reçus
    const recipientsMap = new Map((messageRecipients || []).map((mr: any) => [mr.message_id, mr]));

    // Transformer les données
    const messages: Message[] = allMessagesData.map((msg: any) => {
      const recipient = recipientsMap.get(msg.id);
      const content = msg.content || msg.body || "";
      const subject = msg.subject || null;
      const isSentByUser = msg.sender_id === userId;

      const metadata = (msg.metadata as Record<string, unknown>) || {};
      // Pour les messages envoyés, récupérer le nom du destinataire depuis metadata
      const recipientId = (metadata as any)?.recipientId;
      const metadataRecipientName = typeof (metadata as any)?.recipientName === "string" ? (metadata as any)?.recipientName : null;
      const metadataSenderName = typeof (metadata as any)?.senderName === "string" ? (metadata as any)?.senderName : null;
      const recipientInfo = recipientId ? participantsMap.get(recipientId) : null;
      const senderInfo = participantsMap.get(msg.sender_id);

      const resolvedRecipientName =
        recipientInfo?.name || metadataRecipientName || recipient?.recipient_display_name || "Destinataire";
      const resolvedSenderName =
        senderInfo?.name || metadataSenderName || "Utilisateur";

      return {
        id: msg.id,
        sender_id: msg.sender_id,
        sender_name: isSentByUser ? resolvedRecipientName : resolvedSenderName,
        content: content,
        subject: subject,
        type: msg.type || "message",
        metadata: {
          ...msg.metadata,
          recipientId: recipientId, // S'assurer que recipientId est dans metadata
          recipientRole: recipientInfo?.role, // Stocker le rôle du destinataire
          senderRole: senderInfo?.role, // Stocker le rôle de l'expéditeur
          recipientName: resolvedRecipientName,
          senderName: resolvedSenderName,
        },
        created_at: msg.created_at,
        read: isSentByUser ? true : (recipient?.read || false), // Les messages envoyés sont considérés comme lus
        read_at: isSentByUser ? msg.created_at : recipient?.read_at,
        // Ajouter un flag pour savoir si le message a été envoyé par l'utilisateur actuel
        is_sent: isSentByUser,
      } as Message & { is_sent?: boolean };
    });

    // Trier par date de création (du plus récent au plus ancien)
    messages.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    console.log("[messaging] Total messages (received + sent):", messages.length);
    return messages;
  } catch (error) {
    console.error("[messaging] Error:", error);
    return [];
  }
}

/**
 * Récupère les messages depuis la table notifications (fallback)
 */
async function getLearnerMessagesFromNotifications(userId: string): Promise<Message[]> {
  const supabase = await getServerClient();
  if (!supabase) {
    return [];
  }

  try {
    // La table notifications utilise recipient_id et payload (JSONB)
    const { data: notifications, error } = await supabase
      .from("notifications")
      .select("id, type, recipient_id, payload, read_at, created_at")
      .eq("recipient_id", userId)
      .eq("type", "consigne")
      .order("created_at", { ascending: false });

    if (error || !notifications) {
      console.error("[messaging] Error fetching notifications:", error);
      return [];
    }

    return notifications.map((notif: any) => {
      const payload = notif.payload || {};
      return {
        id: notif.id,
        sender_id: "", // Notifications n'ont pas de sender_id
        sender_name: "Formateur",
        content: payload.message || payload.title || "",
        type: "consigne" as const,
        metadata: {
          title: payload.title,
          dueDate: payload.dueDate,
          fileUrl: payload.fileUrl,
        },
        created_at: notif.created_at,
        read: !!notif.read_at, // Si read_at existe, c'est lu
        read_at: notif.read_at,
      };
    });
  } catch (error) {
    console.error("[messaging] Error fetching from notifications:", error);
    return [];
  }
}

/**
 * Récupère tous les messages reçus par un formateur (même logique que getLearnerMessages)
 */
export async function getInstructorMessages(): Promise<Message[]> {
  // Utilise la même logique que getLearnerMessages car la structure est identique
  return getLearnerMessages();
}

/**
 * Convertit les messages en conversations pour l'affichage (apprenant ou formateur)
 * Les conversations sont groupées par expéditeur
 */
export async function getLearnerConversations(): Promise<Conversation[]> {
  const messages = await getLearnerMessages();
  
  console.log("[messaging] Converting messages to conversations. Messages count:", messages.length);
  console.log("[messaging] Sample messages:", messages.slice(0, 2));

  // Grouper les messages par formateur
  const conversationsMap = new Map<string, Conversation>();

  // Obtenir l'ID de l'utilisateur actuel pour déterminer l'auteur des messages
  let currentUserId: string | null = null;
  try {
    const supabase = await getServerClient();
    const { data: authData } = await supabase?.auth.getUser() || {};
    currentUserId = authData?.user?.id || null;
  } catch {
    // Ignorer les erreurs d'authentification
  }

  for (const message of messages) {
    // Déterminer l'autre partie de la conversation
    // Si le message a été envoyé par l'utilisateur actuel, l'autre partie est le destinataire
    // Sinon, l'autre partie est l'expéditeur
    const messageAny = message as Message & { is_sent?: boolean };
    const isSentByCurrentUser = messageAny.is_sent || (currentUserId && message.sender_id === currentUserId);
    
    console.log("[messaging] Processing message:", {
      messageId: message.id,
      senderId: message.sender_id,
      currentUserId,
      isSentByCurrentUser,
      senderName: message.sender_name,
      type: message.type,
    });
    
    // L'ID de conversation est l'ID de l'autre partie (pas l'utilisateur actuel)
    // Si le message a été envoyé par l'utilisateur actuel, l'autre partie est le destinataire
    // Sinon, l'autre partie est l'expéditeur
    let conversationId: string;
    if (isSentByCurrentUser) {
      // Message envoyé : récupérer le destinataire depuis metadata
      conversationId = (message.metadata as any)?.recipientId || message.sender_id;
      console.log("[messaging] Message sent by user, conversationId (recipient):", conversationId);
    } else {
      // Message reçu : l'expéditeur est l'autre partie
      conversationId = message.sender_id;
      console.log("[messaging] Message received, conversationId (sender):", conversationId);
    }
    
    // Vérifier que conversationId n'est pas l'ID de l'utilisateur actuel
    if (conversationId === currentUserId) {
      console.warn("[messaging] WARNING: conversationId equals currentUserId! This should not happen.", {
        conversationId,
        currentUserId,
        messageId: message.id,
        isSentByCurrentUser,
      });
      // Essayer de récupérer le destinataire depuis message_recipients ou metadata
      const recipientId = (message.metadata as any)?.recipientId;
      if (recipientId && recipientId !== currentUserId) {
        conversationId = recipientId;
        console.log("[messaging] Fixed conversationId from metadata:", conversationId);
      } else {
        console.error("[messaging] Cannot fix conversationId, skipping message");
        continue; // Skip ce message car on ne peut pas déterminer l'autre partie
      }
    }
    
    if (!conversationsMap.has(conversationId)) {
      const isConsigne = message.type === "consigne";
      // sender_name contient :
      // - Pour les messages envoyés : le nom du destinataire
      // - Pour les messages reçus : le nom de l'expéditeur
      // Donc dans les deux cas, sender_name est le nom de l'autre partie
      const name = message.sender_name || (isConsigne ? "Formateur" : "Utilisateur");
      
      // Déterminer le rôle de l'autre partie depuis metadata
      const otherPartyRole = isSentByCurrentUser 
        ? ((message.metadata as any)?.recipientRole || "learner")
        : ((message.metadata as any)?.senderRole || "learner");
      
      // Mapper le rôle DB vers le label français
      let roleLabel = "Utilisateur";
      if (isConsigne) {
        roleLabel = "Formateur";
      } else {
        switch (otherPartyRole) {
          case "instructor":
            roleLabel = "Formateur";
            break;
          case "learner":
            roleLabel = "Apprenant";
            break;
          case "admin":
            roleLabel = "Admin";
            break;
          case "tutor":
            roleLabel = "Tuteur";
            break;
          default:
            roleLabel = "Utilisateur";
        }
      }
      
      conversationsMap.set(conversationId, {
        id: conversationId,
        name: name, // Utilise maintenant le nom complet (full_name ou first_name + last_name)
        role: roleLabel,
        avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
        status: "hors ligne",
        messages: [],
        unreadCount: 0,
      });
    }

    const conversation = conversationsMap.get(conversationId)!;
    
    // Déterminer l'auteur : si envoyé par l'utilisateur actuel, c'est "learner", sinon "mentor"
    const author: "learner" | "mentor" = isSentByCurrentUser ? "learner" : 
                                         (message.type === "consigne" ? "mentor" : "mentor");
    
    // Convertir le message
    conversation.messages.push({
      id: message.id,
      author: author,
      content: message.content,
      subject: message.subject || null,
      sentAt: new Date(message.created_at),
      type: message.type === "consigne" ? "consigne" : "message",
    });

    // Compter les non lus (seulement pour les messages reçus)
    if (!isSentByCurrentUser && !message.read) {
      conversation.unreadCount++;
    }
  }

  // Trier les messages dans chaque conversation (du plus ancien au plus récent)
  conversationsMap.forEach((conversation) => {
    conversation.messages.sort((a, b) => a.sentAt.getTime() - b.sentAt.getTime());
  });

  // Trier les conversations par date du dernier message (du plus récent au plus ancien)
  const sortedConversations = Array.from(conversationsMap.values()).sort((a, b) => {
    const aLastMsg = a.messages[a.messages.length - 1]?.sentAt || new Date(0);
    const bLastMsg = b.messages[b.messages.length - 1]?.sentAt || new Date(0);
    return bLastMsg.getTime() - aLastMsg.getTime();
  });
  
  console.log("[messaging] Final conversations count:", sortedConversations.length);
  console.log("[messaging] Sample conversations:", sortedConversations.slice(0, 2));
  
  return sortedConversations;
}

/**
 * Marque un message comme lu
 */
export async function markMessageAsRead(messageId: string): Promise<boolean> {
  const supabase = await getServerClient();
  if (!supabase) {
    return false;
  }

  try {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user?.id) {
      return false;
    }

    const userId = authData.user.id;

    // Essayer de mettre à jour message_recipients
    const { error: mrError } = await supabase
      .from("message_recipients")
      .update({ read: true, read_at: new Date().toISOString() })
      .eq("message_id", messageId)
      .eq("recipient_id", userId);

    if (!mrError) {
      return true;
    }

    // Fallback: mettre à jour notifications
    // La table notifications utilise recipient_id (et optionnellement user_id)
    const { error: notifError } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", messageId)
      .or(`recipient_id.eq.${userId},user_id.eq.${userId}`);

    return !notifError;
  } catch (error) {
    console.error("[messaging] Error marking as read:", error);
    return false;
  }
}

