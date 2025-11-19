"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { MessageSquare } from "lucide-react";

import { useCommunityConversations } from "@/hooks/use-community-conversations";

const POLLING_INTERVAL_MS = 10000;

export function MessageNotificationsWatcher() {
  const pathname = usePathname();
  const router = useRouter();
  const setUnreadTotal = useCommunityConversations((state) => state.setUnreadTotal);
  const unreadTotal = useCommunityConversations((state) => state.unreadTotal);

  const lastCheckRef = useRef<string | null>(null); // null pour la première vérification
  const lastNotifiedMessageIdRef = useRef<string | null>(null);
  const toastIdRef = useRef<string | number | null>(null);
  const isInitializedRef = useRef<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    const fetchUnread = async () => {
      try {
        const headers: HeadersInit = {
          "Cache-Control": "no-store",
        };
        
        // Envoyer lastCheckTime seulement après la première vérification
        if (lastCheckRef.current) {
          headers["x-last-check-time"] = lastCheckRef.current;
        }

        const response = await fetch("/api/messages/check", {
          method: "GET",
          headers,
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

        // Toujours mettre à jour le nombre de messages non lus (pour le badge)
        if (typeof data.unreadCount === "number") {
          setUnreadTotal(data.unreadCount);
          console.log("[messaging] Unread count updated:", data.unreadCount, "Previous:", unreadTotal);
        }

        // Afficher une notification toast seulement pour les NOUVEAUX messages (pas lors de la première vérification)
        // et seulement si on n'est pas déjà sur la page de messagerie
        console.log("[messaging] Checking notification conditions:", {
          isInitialized: isInitializedRef.current,
          hasNewMessages: data.hasNewMessages,
          hasLatestMessage: !!data.latestMessage,
          isOnMessagingPage: pathname.startsWith("/dashboard/communaute"),
          unreadCount: data.unreadCount,
        });

        if (
          isInitializedRef.current && // Ne pas afficher de notification lors de la première vérification
          data.hasNewMessages &&
          data.latestMessage &&
          !pathname.startsWith("/dashboard/communaute")
        ) {
          const latestId = data.latestMessage.id ?? null;
          if (latestId && lastNotifiedMessageIdRef.current === latestId) {
            // Already displayed this notification
            console.log("[messaging] Notification already displayed for message:", latestId);
          } else {
            console.log("[messaging] ✅ New message detected, showing notification:", {
              messageId: latestId,
              senderName: data.latestMessage.senderName,
              unreadCount: data.unreadCount,
              content: data.latestMessage.content?.substring(0, 50),
            });

            lastNotifiedMessageIdRef.current = latestId;

          const messageContent =
            data.latestMessage.content?.trim() || "Vous avez reçu un nouveau message.";
          const senderName = data.latestMessage.senderName?.trim() || "Nouveau message";

          // Truncate content for display
          const displayContent = messageContent.length > 80 
            ? messageContent.substring(0, 80) + "..." 
            : messageContent;

          // Check if it's an attachment
          const isAttachment = messageContent.toLowerCase().includes("pièce jointe") || 
                               messageContent.toLowerCase().includes("(pièce jointe)");

          // Format time
          const timeStr = data.latestMessage.createdAt
            ? new Date(data.latestMessage.createdAt).toLocaleTimeString("fr-FR", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "À l'instant";

          // Dismiss previous toast if exists
          if (toastIdRef.current) {
            toast.dismiss(toastIdRef.current);
          }

                   // Show new toast notification (style iPhone/WhatsApp)
                   toastIdRef.current = toast(
                     <div 
                       className="flex items-start gap-3 w-full cursor-pointer"
                       onClick={() => {
                         router.push("/dashboard/communaute");
                         toast.dismiss(toastIdRef.current || undefined);
                       }}
                     >
                       {/* Avatar */}
                       <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white text-sm font-semibold shadow-lg">
                         {senderName.charAt(0).toUpperCase()}
                       </div>
                       
                       {/* Content */}
                       <div className="flex-1 min-w-0">
                         <div className="flex items-center gap-2 mb-1">
                           <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                             {senderName}
                           </p>
                           <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">
                             {timeStr}
                           </span>
                         </div>
                         
                         <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed line-clamp-2">
                           {isAttachment ? (
                             <span className="flex items-center gap-1.5">
                               <span className="text-gray-400">📎</span>
                               <span className="italic">{messageContent}</span>
                             </span>
                           ) : (
                             displayContent
                           )}
                         </p>
                       </div>
                     </div>,
                     {
                       duration: 6000,
                       position: "top-right",
                       action: {
                         label: "Ouvrir",
                         onClick: () => {
                           router.push("/dashboard/communaute");
                           toast.dismiss(toastIdRef.current || undefined);
                         },
                       },
                       cancel: {
                         label: "Fermer",
                         onClick: () => {
                           toast.dismiss(toastIdRef.current || undefined);
                         },
                       },
                       icon: <MessageSquare className="h-5 w-5 text-blue-500" />,
                       className: "cursor-pointer",
                     }
                   );
          }
        }

        // Marquer comme initialisé après la première vérification
        if (!isInitializedRef.current) {
          isInitializedRef.current = true;
          console.log("[messaging] Initial check completed, unread count:", data.unreadCount);
        }
      } catch (error) {
        console.error("[messagerie] Failed to poll new messages:", error);
      } finally {
        // Mettre à jour lastCheckTime seulement après avoir traité les données
        lastCheckRef.current = new Date().toISOString();
      }
    };

    // Initial fetch
    fetchUnread();
    const interval = setInterval(fetchUnread, POLLING_INTERVAL_MS);

    return () => {
      isMounted = false;
      clearInterval(interval);
      if (toastIdRef.current) {
        toast.dismiss(toastIdRef.current);
      }
    };
  }, [pathname, setUnreadTotal, router]);

  return null; // No JSX needed, toast handles the display
}

