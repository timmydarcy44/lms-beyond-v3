import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";
import { getLearnerMessages } from "@/lib/queries/messaging";

export async function GET(request: NextRequest) {
  try {
    const supabase = await getServerClient();
    if (!supabase) {
      return NextResponse.json({ hasNewMessages: false, unreadCount: 0 }, { status: 200 });
    }

    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user?.id) {
      return NextResponse.json({ hasNewMessages: false, unreadCount: 0 }, { status: 200 });
    }

    const lastCheckTime = request.headers.get("x-last-check-time");
    const messages = await getLearnerMessages();

    console.log("[messages/check] Total messages:", messages.length);
    console.log("[messages/check] Messages sample:", messages.slice(0, 2).map(m => ({
      id: m.id,
      sender_id: m.sender_id,
      read: m.read,
      is_sent: (m as any).is_sent,
      created_at: m.created_at,
    })));

    // Filtrer uniquement les messages REÇUS (pas envoyés) pour les notifications
    const receivedMessages = messages.filter((msg) => !(msg as any).is_sent);
    const unreadMessages = receivedMessages.filter((msg) => !msg.read);
    const unreadCount = unreadMessages.length;

    console.log("[messages/check] Received messages:", receivedMessages.length);
    console.log("[messages/check] Unread messages:", unreadCount);
    console.log("[messages/check] Unread messages sample:", unreadMessages.slice(0, 2).map(m => ({
      id: m.id,
      sender_name: m.sender_name,
      created_at: m.created_at,
    })));

    let hasNewMessages = false;
    let latestRelevant = unreadMessages[0] ?? null;

    if (lastCheckTime) {
      const lastCheck = new Date(lastCheckTime);
      console.log("[messages/check] Last check time:", lastCheckTime, "Parsed:", lastCheck);
      
      // Détecter les NOUVEAUX messages reçus depuis la dernière vérification
      // Peu importe s'ils sont lus ou non, on veut notifier pour tous les nouveaux messages
      const newReceivedSinceLastCheck = receivedMessages.filter(
        (msg) => new Date(msg.created_at) > lastCheck,
      );
      
      console.log("[messages/check] New received messages since last check:", newReceivedSinceLastCheck.length);
      
      // Si on a de nouveaux messages reçus, on notifie
      hasNewMessages = newReceivedSinceLastCheck.length > 0;
      
      if (newReceivedSinceLastCheck.length > 0) {
        // Prendre le plus récent parmi les nouveaux messages reçus
        latestRelevant = newReceivedSinceLastCheck.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];
        
        console.log("[messages/check] Latest relevant message:", {
          id: latestRelevant.id,
          sender_name: latestRelevant.sender_name,
          created_at: latestRelevant.created_at,
          read: latestRelevant.read,
        });
      }
    } else {
      // Première vérification : notifier seulement s'il y a des messages non lus
      hasNewMessages = unreadCount > 0;
      console.log("[messages/check] First check, hasNewMessages:", hasNewMessages, "unreadCount:", unreadCount);
    }

    const response = {
      hasNewMessages,
      unreadCount,
      latestMessage: latestRelevant
        ? {
            id: latestRelevant.id,
            senderName: latestRelevant.sender_name ?? "Nouveau message",
            content: latestRelevant.content,
            createdAt: latestRelevant.created_at,
          }
        : null,
    };

    console.log("[messages/check] Response:", {
      hasNewMessages: response.hasNewMessages,
      unreadCount: response.unreadCount,
      hasLatestMessage: !!response.latestMessage,
    });

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("[messages/check] Error:", error);
    return NextResponse.json(
      { hasNewMessages: false, unreadCount: 0, latestMessage: null },
      { status: 200 },
    );
  }
}

