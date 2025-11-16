"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Bell } from "lucide-react";

import { useCommunityConversations } from "@/hooks/use-community-conversations";

type IncomingNotification = {
  id: string | null;
  sender: string;
  content: string;
  createdAt?: string | null;
};

const POLLING_INTERVAL_MS = 10000;
const TOAST_DURATION_MS = 6000;

export function MessageNotificationsWatcher() {
  const pathname = usePathname();
  const router = useRouter();
  const setUnreadTotal = useCommunityConversations((state) => state.setUnreadTotal);

  const [notification, setNotification] = useState<IncomingNotification | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastCheckRef = useRef<string>(new Date().toISOString());
  const lastNotifiedMessageIdRef = useRef<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchUnread = async () => {
      try {
        const response = await fetch("/api/messages/check", {
          method: "GET",
          headers: {
            "x-last-check-time": lastCheckRef.current,
          },
          cache: "no-store",
        });

        if (!response.ok || !isMounted) {
          return;
        }

        const data: {
          hasNewMessages: boolean;
          unreadCount?: number;
          latestMessage?: {
            id?: string;
            senderName?: string;
            content?: string;
            createdAt?: string;
          } | null;
        } = await response.json();

        if (typeof data.unreadCount === "number") {
          setUnreadTotal(data.unreadCount);
        }

        if (
          data.hasNewMessages &&
          data.latestMessage &&
          !pathname.startsWith("/dashboard/communaute")
        ) {
          const latestId = data.latestMessage.id ?? null;
          if (latestId && lastNotifiedMessageIdRef.current === latestId) {
            // Already displayed this notification
            return;
          }

          lastNotifiedMessageIdRef.current = latestId;

          const messageContent =
            data.latestMessage.content?.trim() || "Vous avez reçu un nouveau message.";
          const senderName = data.latestMessage.senderName?.trim() || "Nouveau message";

          setNotification({
            id: latestId,
            sender: senderName,
            content: messageContent,
            createdAt: data.latestMessage.createdAt ?? null,
          });

          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
          timeoutRef.current = setTimeout(() => {
            setNotification(null);
          }, TOAST_DURATION_MS);
        }
      } catch (error) {
        console.error("[messagerie] Failed to poll new messages:", error);
      } finally {
        lastCheckRef.current = new Date().toISOString();
      }
    };

    // Initial fetch
    fetchUnread();
    const interval = setInterval(fetchUnread, POLLING_INTERVAL_MS);

    return () => {
      isMounted = false;
      clearInterval(interval);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [pathname, setUnreadTotal]);

  if (!notification) {
    return null;
  }

  // Truncate content for display
  const displayContent = notification.content.length > 100 
    ? notification.content.substring(0, 100) + "..." 
    : notification.content;

  // Check if it's an attachment
  const isAttachment = notification.content.toLowerCase().includes("pièce jointe") || 
                       notification.content.toLowerCase().includes("(pièce jointe)");

  return (
    <AnimatePresence>
      <motion.div
        key={notification.id ?? `${notification.sender}-${notification.content}`}
        className="fixed right-4 top-4 z-[60] flex max-w-[320px]"
        initial={{ opacity: 0, x: 20, scale: 0.9 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 20, scale: 0.9 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        <div className="flex w-full items-start gap-3 rounded-2xl bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl p-4 shadow-2xl shadow-black/20 border border-gray-200/50 dark:border-gray-700/50">
          {/* Avatar */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white text-sm font-semibold">
            {notification.sender.charAt(0).toUpperCase()}
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {notification.sender}
              </p>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {notification.createdAt
                  ? new Date(notification.createdAt).toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "À l'instant"}
              </span>
            </div>
            
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-2 line-clamp-2">
              {isAttachment ? (
                <span className="flex items-center gap-1.5">
                  <span className="text-gray-400">📎</span>
                  <span className="italic">{notification.content}</span>
                </span>
              ) : (
                displayContent
              )}
            </p>
            
            <button
              type="button"
              onClick={() => {
                setNotification(null);
                router.push("/dashboard/communaute");
              }}
              className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              Ouvrir →
            </button>
          </div>
          
          {/* Close button */}
          <button
            type="button"
            className="shrink-0 rounded-full p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            onClick={() => setNotification(null)}
            aria-label="Fermer la notification"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

