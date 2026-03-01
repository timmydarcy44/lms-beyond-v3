"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { MessageSquare } from "lucide-react";

import { useCommunityConversations } from "@/hooks/use-community-conversations";

const BASE_POLL_INTERVAL_MS = 10000;
const MAX_BACKOFF_MULTIPLIER = 4;

export function MessageNotificationsWatcher() {
  const pathname = usePathname();
  const router = useRouter();
  const setUnreadTotal = useCommunityConversations((state) => state.setUnreadTotal);

  const lastCheckRef = useRef<string | null>(null); // null pour la première vérification
  const lastNotifiedMessageIdRef = useRef<string | null>(null);
  const toastIdRef = useRef<string | number | null>(null);
  const isInitializedRef = useRef<boolean>(false);
  const pollTimeoutRef = useRef<number | null>(null);
  const failureCountRef = useRef(0);
  const failureLoggedRef = useRef(false);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    let isMounted = true;

    const clearScheduledPoll = () => {
      if (pollTimeoutRef.current !== null) {
        window.clearTimeout(pollTimeoutRef.current);
        pollTimeoutRef.current = null;
      }
    };

    const schedulePoll = (delay: number) => {
      clearScheduledPoll();
      if (!isMounted) return;
      pollTimeoutRef.current = window.setTimeout(runPoll, delay);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        failureCountRef.current = 0;
        failureLoggedRef.current = false;
        controllerRef.current?.abort();
        schedulePoll(250);
      } else {
        controllerRef.current?.abort();
        clearScheduledPoll();
      }
    };

    const runPoll = async () => {
      if (!isMounted) return;

      if (document.visibilityState !== "visible") {
        schedulePoll(BASE_POLL_INTERVAL_MS);
        return;
      }

      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;

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
          signal: controller.signal,
        });

        if (!isMounted) {
          return;
        }

        if (!response.ok) {
          throw new Error(`Polling failed with status ${response.status}`);
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
        }

        failureCountRef.current = 0;
        failureLoggedRef.current = false;

        if (
          isInitializedRef.current && // Ne pas afficher de notification lors de la première vérification
          data.hasNewMessages &&
          data.latestMessage &&
          !pathname.startsWith("/dashboard/communaute")
        ) {
          const latestId = data.latestMessage.id ?? null;
          if (latestId && lastNotifiedMessageIdRef.current === latestId) {
            // Already displayed this notification
          } else {
            lastNotifiedMessageIdRef.current = latestId;

            const messageContent =
              data.latestMessage.content?.trim() || "Vous avez reçu un nouveau message.";
            const senderName = data.latestMessage.senderName?.trim() || "Nouveau message";

            const displayContent =
              messageContent.length > 80 ? `${messageContent.substring(0, 80)}...` : messageContent;

            const isAttachment =
              messageContent.toLowerCase().includes("pièce jointe") ||
              messageContent.toLowerCase().includes("(pièce jointe)");

            const timeStr = data.latestMessage.createdAt
              ? new Date(data.latestMessage.createdAt).toLocaleTimeString("fr-FR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "À l'instant";

            if (toastIdRef.current) {
              toast.dismiss(toastIdRef.current);
            }

            toastIdRef.current = toast(
              <div
                className="flex w-full cursor-pointer items-start gap-3"
                onClick={() => {
                  router.push("/dashboard/communaute");
                  toast.dismiss(toastIdRef.current || undefined);
                }}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-sm font-semibold text-white shadow-lg">
                  {senderName.charAt(0).toUpperCase()}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                      {senderName}
                    </p>
                    <span className="shrink-0 text-xs text-gray-500 dark:text-gray-400">{timeStr}</span>
                  </div>

                  <p className="line-clamp-2 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
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
              },
            );
          }
        }

        // Marquer comme initialisé après la première vérification
        if (!isInitializedRef.current) {
          isInitializedRef.current = true;
        }

        lastCheckRef.current = new Date().toISOString();
        schedulePoll(BASE_POLL_INTERVAL_MS);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        if ((error as Error).name === "AbortError") {
          return;
        }

        failureCountRef.current += 1;
        if (!failureLoggedRef.current) {
          console.warn("[messaging] Polling temporarily paused:", error);
          failureLoggedRef.current = true;
        }
        const multiplier = Math.min(
          MAX_BACKOFF_MULTIPLIER,
          Math.pow(2, Math.max(0, failureCountRef.current - 1)),
        );
        schedulePoll(BASE_POLL_INTERVAL_MS * multiplier);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    schedulePoll(0);

    return () => {
      isMounted = false;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      controllerRef.current?.abort();
      clearScheduledPoll();
      if (toastIdRef.current) {
        toast.dismiss(toastIdRef.current);
      }
    };
  }, [pathname, setUnreadTotal, router]);

  return null; // No JSX needed, toast handles the display
}

