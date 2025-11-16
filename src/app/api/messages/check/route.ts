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

    const unreadMessages = messages.filter((msg) => !msg.read);
    const unreadCount = unreadMessages.length;

    let hasNewMessages = false;
    let latestRelevant = unreadMessages[0] ?? null;

    if (lastCheckTime) {
      const lastCheck = new Date(lastCheckTime);
      const newSinceLastCheck = unreadMessages.filter(
        (msg) => new Date(msg.created_at) > lastCheck,
      );
      hasNewMessages = newSinceLastCheck.length > 0;
      if (newSinceLastCheck.length > 0) {
        latestRelevant = newSinceLastCheck[0];
      }
    } else {
      hasNewMessages = unreadCount > 0;
    }

    return NextResponse.json(
      {
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
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[messages/check] Error:", error);
    return NextResponse.json(
      { hasNewMessages: false, unreadCount: 0, latestMessage: null },
      { status: 200 },
    );
  }
}

