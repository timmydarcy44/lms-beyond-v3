"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Paperclip, PhoneCall, Search, Send, Video, Wifi, FileText, MessageSquarePlus, Bell, Trash2, MoreVertical } from "lucide-react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useCommunityConversations, type Conversation } from "@/hooks/use-community-conversations";
import { ContactSelector } from "@/components/messaging/contact-selector";
import { NewMessageModal } from "@/components/messaging/new-message-modal";
import type { Contact } from "@/lib/queries/contacts";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SourceChip } from "@/components/ui/source-chip";

const bubbleVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

type CommunityViewProps = {
  initialConversations: Conversation[];
  availableContacts: Contact[];
};

export default function CommunityView({ initialConversations, availableContacts }: CommunityViewProps) {
  const router = useRouter();
  const conversations = useCommunityConversations((state) => state.conversations);
  const activeConversationId = useCommunityConversations((state) => state.activeConversationId);
  const setActiveConversation = useCommunityConversations((state) => state.setActiveConversation);
  const setConversations = useCommunityConversations((state) => state.setConversations);
  const sendMessage = useCommunityConversations((state) => state.sendMessage);
  const setUnreadTotal = useCommunityConversations((state) => state.setUnreadTotal);

  // Initialiser les conversations depuis les props
  useEffect(() => {
    console.log("[community-view] Initial conversations:", initialConversations);
    console.log("[community-view] Initial conversations count:", initialConversations.length);
    if (initialConversations.length > 0) {
      setConversations(initialConversations);
      console.log("[community-view] Conversations set in Zustand");
    } else {
      console.warn("[community-view] No initial conversations provided!");
    }
  }, [initialConversations, setConversations]);
  
  // Debug: log current conversations state
  useEffect(() => {
    console.log("[community-view] Current conversations in state:", conversations);
    console.log("[community-view] Active conversation ID:", activeConversationId);
  }, [conversations, activeConversationId]);

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeConversationId) ?? conversations[0],
    [conversations, activeConversationId],
  );

  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState("");
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const notificationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [incomingMessage, setIncomingMessage] = useState<{
    sender: string;
    content: string;
    createdAt?: string;
  } | null>(null);
  const [workflowNotice, setWorkflowNotice] = useState<{ resource?: string | null } | null>(null);
  const normalizedNoticeResource = workflowNotice?.resource?.toLowerCase() ?? null;
  const workflowNoticeText = workflowNotice
    ? `Tâche associée clôturée dans To-Do${workflowNotice.resource ? ` · ${workflowNotice.resource}` : ""}`
    : null;
  const canSend = message.trim().length > 0 && (activeConversation || selectedContactId);
  const conversationContextHint = useMemo(() => {
    if (!activeConversation) return null;
    const hasConsigne = activeConversation.messages.some((message) => message.type === "consigne");
    if (hasConsigne) {
      return "Échange lié à une validation de contenu";
    }
    const roleLabel = activeConversation.role?.toLowerCase() ?? "";
    if (roleLabel.includes("suivi") || roleLabel.includes("coach") || roleLabel.includes("tuteur")) {
      return "Discussion de suivi pédagogique";
    }
    return null;
  }, [activeConversation]);

  // Calculer le nombre de messages non lus
  const unreadCount = useMemo(() => {
    return conversations.reduce((total, conv) => total + (conv.unreadCount || 0), 0);
  }, [conversations]);

  useEffect(() => {
    setUnreadTotal(unreadCount);
  }, [unreadCount, setUnreadTotal]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = sessionStorage.getItem("trainerWorkflow:lastCompletedSource");
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as { key?: string; resource?: string; at?: number };
      if (parsed?.key === "messaging" && typeof parsed.at === "number" && Date.now() - parsed.at < 5 * 60 * 1000) {
        setWorkflowNotice({ resource: parsed.resource ?? null });
        sessionStorage.removeItem("trainerWorkflow:lastCompletedSource");
      }
    } catch (error) {
      console.warn("[messaging] Cannot read completion source", error);
    }
  }, []);

  // Fonction pour supprimer une conversation
  const handleDeleteConversation = async (conversationId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette conversation ? Cette action est irréversible.")) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/messages/conversation/${conversationId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la suppression");
      }

      // Retirer la conversation de la liste
      const updatedConversations = conversations.filter((conv) => conv.id !== conversationId);
      setConversations(updatedConversations);

      // Si la conversation supprimée était active, sélectionner la première conversation disponible
      if (activeConversationId === conversationId) {
        if (updatedConversations.length > 0) {
          setActiveConversation(updatedConversations[0].id);
        } else {
          setActiveConversation("");
        }
      }

      toast.success("Conversation supprimée", {
        description: "La conversation a été supprimée avec succès.",
      });

      // Recharger la page pour synchroniser avec le serveur
      router.refresh();
    } catch (error) {
      console.error("[community-view] Error deleting conversation:", error);
      toast.error("Erreur", {
        description: error instanceof Error ? error.message : "Impossible de supprimer la conversation.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Polling pour vérifier les nouveaux messages toutes les 10 secondes
  useEffect(() => {
    let lastCheckTime = new Date().toISOString();

    const interval = setInterval(async () => {
      try {
        const response = await fetch("/api/messages/check", {
          method: "GET",
          headers: {
            "x-last-check-time": lastCheckTime,
          },
          cache: "no-store",
        });

        if (response.ok) {
          const data: {
            hasNewMessages: boolean;
            unreadCount?: number;
            latestMessage?: { senderName?: string; content?: string; createdAt?: string };
          } = await response.json();

          if (typeof data.unreadCount === "number") {
            setUnreadTotal(data.unreadCount);
          }

          if (data.hasNewMessages) {
            const latest = data.latestMessage;
            setIncomingMessage({
              sender: latest?.senderName || "Nouveau message",
              content: latest?.content || "Vous avez reçu un nouveau message.",
              createdAt: latest?.createdAt,
            });
            if (notificationTimeoutRef.current) {
              clearTimeout(notificationTimeoutRef.current);
            }
            notificationTimeoutRef.current = setTimeout(() => {
              setIncomingMessage(null);
            }, 6000);
          }

          lastCheckTime = new Date().toISOString();
        }
      } catch (error) {
        console.error("[community-view] Error checking new messages:", error);
      }
    }, 10000);

    return () => {
      clearInterval(interval);
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
    };
  }, [setUnreadTotal]);

  // Marquer les messages comme lus quand on affiche la conversation
  useEffect(() => {
    if (activeConversation) {
      // Marquer tous les messages non lus de la conversation active comme lus
      const unreadMessages = activeConversation.messages.filter((msg) => {
        // Un message est non lu si c'est un message reçu (mentor) qui n'a pas été lu
        return msg.author === "mentor" && !(msg as any).read;
      });
      
      unreadMessages.forEach(async (msg) => {
        try {
          await fetch("/api/messages/mark-read", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ messageId: msg.id }),
          });
        } catch (error) {
          console.error("[community-view] Error marking message as read:", error);
        }
      });
    }
  }, [activeConversation?.id, activeConversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [activeConversation?.messages.length, activeConversationId]);

  const filteredConversations = useMemo(() => {
    if (!filter.trim()) return conversations;
    const lower = filter.toLowerCase();
    return conversations.filter((conversation) =>
      [conversation.name, conversation.role].some((value) => value.toLowerCase().includes(lower)),
    );
  }, [conversations, filter]);

  const notificationToast = (
    <AnimatePresence>
      {incomingMessage && (
        <motion.div
          key="message-toast"
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="fixed right-6 top-6 z-50 w-[320px] rounded-3xl border border-white/10 bg-gradient-to-br from-[#1a1b1f] via-[#141418] to-[#09090c] p-5 shadow-2xl shadow-black/40"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.45em] text-white/40">Messagerie</p>
              <p className="mt-2 text-sm font-semibold text-white">{incomingMessage.sender}</p>
              <p className="mt-1 text-sm text-white/70 line-clamp-3">{incomingMessage.content}</p>
            </div>
            <button
              type="button"
              className="rounded-full border border-white/10 bg-white/5 p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
              onClick={() => setIncomingMessage(null)}
            >
              <Bell className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-white/40">
            <span>
              {incomingMessage.createdAt
                ? new Date(incomingMessage.createdAt).toLocaleTimeString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "À l’instant"}
            </span>
            <Button
              size="sm"
              className="rounded-full bg-white px-3 text-xs font-semibold text-black hover:bg-white/90"
              onClick={() => {
                setIncomingMessage(null);
                router.push("/dashboard/student/community");
              }}
            >
              Ouvrir
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const handleSubmit = async (eventOrForm: React.FormEvent<HTMLFormElement> | HTMLFormElement) => {
    let form: HTMLFormElement;
    if (eventOrForm instanceof HTMLFormElement) {
      form = eventOrForm;
    } else {
      eventOrForm.preventDefault();
      form = eventOrForm.currentTarget as HTMLFormElement;
    }
    
    // Déterminer le destinataire : soit depuis la conversation active, soit depuis le contact sélectionné
    const recipientId = activeConversation?.id || selectedContactId;
    
    if (!recipientId || !message.trim()) return;

    const messageContent = message.trim();
    setMessage(""); // Optimistic update: clear input immediately

    // Si on envoie à un nouveau contact, créer une nouvelle conversation
    if (selectedContactId && !activeConversation) {
      const newConversation: Conversation = {
        id: selectedContactId,
        name: availableContacts.find((c) => c.id === selectedContactId)?.name || "Contact",
        role: availableContacts.find((c) => c.id === selectedContactId)?.type === "group" ? "Groupe" : "Contact",
        avatarUrl: availableContacts.find((c) => c.id === selectedContactId)?.avatarUrl || "",
        status: "hors ligne",
        messages: [],
        unreadCount: 0,
      };
      setConversations([...conversations, newConversation]);
      setActiveConversation(selectedContactId);
      setSelectedContactId(null);
    }

    // Optimistic update: add message to UI immediately
    if (recipientId) {
      sendMessage(recipientId, messageContent);
    }

    try {
      // Envoyer le message au serveur
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipientId: recipientId,
          content: messageContent,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("[community-view] Error sending message:", data);
        // Optionnel: afficher une erreur à l'utilisateur ou annuler l'optimistic update
        // Pour l'instant, on laisse le message visible même en cas d'erreur
      } else {
        console.log("[community-view] Message sent successfully:", data);
      }
    } catch (error) {
      console.error("[community-view] Failed to send message:", error);
      // Optionnel: afficher une erreur à l'utilisateur
    }
  };

  // Fonction pour gérer l'envoi depuis le modal
  const handleSendFromModal = async (data: { recipientId: string; subject: string; content: string }) => {
    const { recipientId, subject, content } = data;

    // Créer ou activer la conversation
    const existingConv = conversations.find((c) => c.id === recipientId);
    if (existingConv) {
      setActiveConversation(recipientId);
    } else {
      const contact = availableContacts.find((c) => c.id === recipientId);
      if (contact) {
        const newConversation: Conversation = {
          id: recipientId,
          name: contact.name,
          role: contact.type === "group" ? "Groupe" : contact.type === "instructor" ? "Formateur" : contact.type === "admin" ? "Admin" : "Apprenant",
          avatarUrl: contact.avatarUrl || "",
          status: "hors ligne",
          messages: [],
          unreadCount: 0,
        };
        setConversations([...conversations, newConversation]);
        setActiveConversation(recipientId);
      }
    }

    // Envoyer le message
    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipientId: recipientId,
          subject: subject || undefined, // Envoyer le sujet séparément
          content: content,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || "Erreur lors de l'envoi du message");
      }

      // Ajouter le message à la conversation via Zustand
      sendMessage(recipientId, content);
    } catch (error) {
      console.error("[community-view] Error sending message from modal:", error);
      throw error; // L'erreur sera gérée par le modal
    }
  };

  // Si pas de conversation active mais un contact sélectionné, afficher un message
  if (!activeConversation && !selectedContactId) {
    return (
      <>
        {notificationToast}
        <div className="flex flex-col gap-8">
        {workflowNoticeText ? (
          <p className="rounded-2xl border border-white/12 bg-white/6 px-4 py-3 text-xs text-white/60">
            {workflowNoticeText}
          </p>
        ) : null}
        <Card className="border-white/10 bg-gradient-to-br from-[#141414] via-[#101010] to-[#050505] text-white">
          <CardContent className="flex flex-wrap items-center gap-4 p-6">
            <Badge className="rounded-full bg-gradient-to-r from-[#00C6FF] to-[#0072FF] px-4 py-1 text-[10px] uppercase tracking-[0.35em] text-white">
              Messagerie temps réel
            </Badge>
            <p className="text-sm text-white/70">
              Sélectionnez une conversation ou un contact pour commencer à discuter.
            </p>
          </CardContent>
        </Card>
      <div className="grid min-h-[520px] gap-6 rounded-3xl border border-white/4 bg-transparent p-6 text-white shadow-sm shadow-black/30 md:grid-cols-[280px_1fr]">
          <div className="flex flex-col gap-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <Input
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                placeholder="Rechercher un contact"
                className="pl-11 pr-4 text-sm text-white placeholder:text-white/40"
              />
            </div>
            <div className="space-y-2 overflow-y-auto pr-1">
              {filteredConversations.map((conversation) => {
                const isActive = conversation.id === activeConversationId;
                const lastMessage = conversation.messages[conversation.messages.length - 1];
                const lastMessagePreview =
                  lastMessage?.type === "consigne"
                    ? "📋 Consigne reçue"
                    : lastMessage?.content ?? "Aucun message";
                const lastMessageTime =
                  lastMessage?.sentAt &&
                  new Date(lastMessage.sentAt).toLocaleTimeString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                const hasUnread = (conversation.unreadCount ?? 0) > 0;
                return (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => setActiveConversation(conversation.id)}
                    className={cn(
                      "flex w-full items-center gap-4 rounded-2xl border border-transparent px-5 py-4 text-left transition duration-300",
                      isActive ? "bg-white/6 border-white/12" : "hover:bg-white/8",
                    )}
                  >
                    <div className="relative h-12 w-12 overflow-hidden rounded-full">
                      <Image src={conversation.avatarUrl} alt={conversation.name} fill className="object-cover" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-white/90">{conversation.name}</p>
                        <div className="flex items-center gap-2">
                          {lastMessageTime ? (
                            <span className="text-xs text-white/45">{lastMessageTime}</span>
                          ) : null}
                          {hasUnread ? <span className="h-2.5 w-2.5 rounded-full bg-cyan-400/55" aria-hidden /> : null}
                        </div>
                      </div>
                      <p className="text-xs uppercase tracking-[0.3em] text-white/40">{conversation.role}</p>
                      <p className="line-clamp-1 text-xs text-white/55">{lastMessagePreview}</p>
                      {normalizedNoticeResource &&
                      normalizedNoticeResource === conversation.name.toLowerCase() ? (
                        <p className="text-[11px] text-white/45">Tâche associée clôturée dans To-Do</p>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex flex-col items-center justify-center rounded-3xl border border-white/10 bg-black/20 p-8 text-center">
            <div className="mb-4">
              <ContactSelector
                contacts={availableContacts}
                selectedContactId={selectedContactId}
                onSelectContact={setSelectedContactId}
              />
            </div>
            <p className="text-sm text-white/60">
              Sélectionnez un contact pour commencer une nouvelle conversation
            </p>
          </div>
        </div>
      </div>
      </>
    );
  }

  if (!activeConversation && selectedContactId) {
    // Afficher un placeholder pour un nouveau contact sélectionné
    const selectedContact = availableContacts.find((c) => c.id === selectedContactId);
    return (
      <div className="flex flex-col gap-8">
        {workflowNoticeText ? (
          <p className="rounded-2xl border border-white/12 bg-white/6 px-4 py-3 text-xs text-white/60">
            {workflowNoticeText}
          </p>
        ) : null}
        <Card className="border-white/10 bg-gradient-to-br from-[#141414] via-[#101010] to-[#050505] text-white">
          <CardContent className="flex flex-wrap items-center gap-4 p-6">
            <Badge className="rounded-full bg-gradient-to-r from-[#00C6FF] to-[#0072FF] px-4 py-1 text-[10px] uppercase tracking-[0.35em] text-white">
              Nouvelle conversation
            </Badge>
            <p className="text-sm text-white/70">
              Conversation avec {selectedContact?.name || "le contact sélectionné"}
            </p>
          </CardContent>
        </Card>
        {/* Réutiliser la même structure mais avec un placeholder pour les messages */}
        <div className="grid min-h-[520px] gap-6 rounded-3xl border border-white/6 bg-white/[0.02] p-6 text-white shadow-md shadow-black/35 md:grid-cols-[280px_1fr]">
          {/* Sidebar des conversations */}
          <div className="flex flex-col gap-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <Input
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                placeholder="Rechercher un contact"
                className="pl-11 pr-4 text-sm text-white placeholder:text-white/40"
              />
            </div>
            <div className="space-y-2 overflow-y-auto pr-1">
              {filteredConversations.map((conversation) => {
                const isActive = conversation.id === activeConversationId;
                const lastMessage = conversation.messages[conversation.messages.length - 1];
                const lastMessagePreview =
                  lastMessage?.type === "consigne"
                    ? "📋 Consigne reçue"
                    : lastMessage?.content ?? "Aucun message";
                const lastMessageTime =
                  lastMessage?.sentAt &&
                  new Date(lastMessage.sentAt).toLocaleTimeString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                const hasUnread = (conversation.unreadCount ?? 0) > 0;
                return (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => setActiveConversation(conversation.id)}
                    className={cn(
                      "flex w-full items-center gap-4 rounded-2xl border border-transparent px-5 py-4 text-left transition duration-300",
                      isActive ? "bg-white/6 border-white/10" : "hover:bg-white/8",
                    )}
                  >
                    <div className="relative h-12 w-12 overflow-hidden rounded-full">
                      <Image src={conversation.avatarUrl} alt={conversation.name} fill className="object-cover" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-white">{conversation.name}</p>
                        <div className="flex items-center gap-2">
                          {lastMessageTime ? (
                            <span className="text-xs text-white/45">{lastMessageTime}</span>
                          ) : null}
                          {hasUnread ? <span className="h-2.5 w-2.5 rounded-full bg-cyan-400/55" aria-hidden /> : null}
                        </div>
                      </div>
                      <p className="text-xs uppercase tracking-[0.3em] text-white/40">{conversation.role}</p>
                      <p className="line-clamp-1 text-xs text-white/60">{lastMessagePreview}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          {/* Zone de conversation */}
          <div className="flex flex-col overflow-hidden rounded-3xl border border-white/6 bg-white/[0.02] shadow-md shadow-black/35">
            <div className="flex items-center gap-3 border-b border-white/10 px-6 py-4">
              <div className="relative h-12 w-12 overflow-hidden rounded-full border border-white/10">
                <Image src={selectedContact?.avatarUrl || ""} alt={selectedContact?.name || ""} fill className="object-cover" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{selectedContact?.name}</p>
                <p className="text-xs uppercase tracking-[0.3em] text-white/40">
                  {selectedContact?.type === "group" ? "Groupe" : "Contact"}
                </p>
              </div>
            </div>
            <div className="relative flex flex-1 flex-col overflow-hidden">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-black/50 via-black/25 to-transparent" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/55 via-black/25 to-transparent" />
              <div className="mx-auto flex h-full w-full max-w-3xl flex-col items-center justify-center gap-3 rounded-3xl border border-white/8 bg-white/[0.02] px-7 py-12 text-center text-sm text-white/65">
                <p>Commencez la conversation en envoyant un message.</p>
                <p className="text-xs text-white/45">Une réponse courte suffit pour lancer l’échange.</p>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3 border-t border-white/10 bg-black/25 px-6 py-5">
              <div className="flex items-end gap-3">
                <Textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Écrire un message (une réponse courte suffit)"
                  rows={1}
                  className="min-h-[60px] resize-none rounded-2xl border border-white/12 bg-white/[0.03] px-5 py-3 text-sm text-white placeholder:text-white/45 focus-visible:ring-white/30"
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      if (message.trim()) {
                        const form = event.currentTarget.closest("form") as HTMLFormElement;
                        if (form) {
                          handleSubmit(form);
                        }
                      }
                    }
                  }}
                />
                <div className="flex items-center gap-2">
                  <Button
                    type="submit"
                    disabled={!message.trim()}
                    className={cn(
                      "rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition",
                      message.trim()
                        ? "border border-cyan-300/30 bg-cyan-500/12 text-white hover:border-cyan-200/40 hover:bg-cyan-500/18"
                        : "border border-white/18 bg-white/8 text-white/45",
                    )}
                  >
                    Envoyer
                    <Send className="ml-2 h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {notificationToast}
      <div className="flex flex-col gap-8">
      {workflowNoticeText ? (
        <p className="rounded-2xl border border-white/12 bg-white/6 px-4 py-3 text-xs text-white/65">
          {workflowNoticeText}
        </p>
      ) : null}
      <Card className="border-white/10 bg-gradient-to-br from-[#141414] via-[#101010] to-[#050505] text-white">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
        <div className="flex flex-wrap items-center gap-4">
          <Badge className="rounded-full bg-gradient-to-r from-[#00C6FF] to-[#0072FF] px-4 py-1 text-[10px] uppercase tracking-[0.35em] text-white">
            Messagerie temps réel
          </Badge>
          <p className="text-sm text-white/70">
            Discutez avec vos formateurs, partagez vos rituels, posez vos questions. L&apos;historique sera synchronisé avec Supabase pour faciliter le suivi pédagogique.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 ? (
            <div className="relative">
              <Bell className="h-5 w-5 text-white/70" />
              <Badge className="absolute -right-2 -top-2 h-5 min-w-5 rounded-full bg-cyan-500/60 px-1.5 text-[10px] text-white border-2 border-[#141414]">
                {unreadCount > 99 ? "99+" : unreadCount}
              </Badge>
            </div>
          ) : null}
          <Button
            type="button"
            onClick={() => setShowNewMessageModal(true)}
            className="rounded-full border border-white/15 bg-white/8 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/70 transition hover:border-white/25 hover:text-white"
          >
            <MessageSquarePlus className="mr-2 h-3.5 w-3.5" />
            Nouvelle conversation
          </Button>
        </div>
        </CardContent>
      </Card>

      <div className="grid min-h-[520px] gap-6 rounded-3xl border border-white/10 bg-transparent p-6 text-white shadow-sm shadow-black/25 md:grid-cols-[280px_1fr]">
        <div className="flex flex-col gap-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <Input
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              placeholder="Rechercher une conversation"
              className="pl-11 pr-4 text-sm text-white placeholder:text-white/40"
            />
          </div>
            <div className="space-y-2 overflow-y-auto pr-1">
            {filteredConversations.map((conversation) => {
              const isActive = conversation.id === activeConversation?.id;
              const lastMessage = conversation.messages[conversation.messages.length - 1];
              const lastMessagePreview =
                lastMessage?.type === "consigne"
                  ? "📋 Consigne reçue"
                  : lastMessage?.content ?? "Aucun message";
              const lastMessageTime =
                lastMessage?.sentAt &&
                new Date(lastMessage.sentAt).toLocaleTimeString("fr-FR", {
                  hour: "2-digit",
                  minute: "2-digit",
                });
              const hasUnread = (conversation.unreadCount ?? 0) > 0;

              return (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => setActiveConversation(conversation.id)}
                  className={cn(
                      "flex w-full items-center gap-4 rounded-2xl border border-transparent px-5 py-4 text-left transition duration-300",
                      isActive ? "bg-white/6 border-white/12" : "hover:bg-white/8",
                  )}
                >
                  <div className="relative h-12 w-12 overflow-hidden rounded-full">
                    <Image src={conversation.avatarUrl} alt={conversation.name} fill className="object-cover" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-white/90">{conversation.name}</p>
                      <div className="flex items-center gap-2">
                        {lastMessageTime ? (
                          <span className="text-xs text-white/45">{lastMessageTime}</span>
                        ) : null}
                        {hasUnread ? <span className="h-2.5 w-2.5 rounded-full bg-cyan-400/55" aria-hidden /> : null}
                      </div>
                    </div>
                    <p className="text-xs uppercase tracking-[0.3em] text-white/40">{conversation.role}</p>
                      <p className="line-clamp-1 text-xs text-white/55">{lastMessagePreview}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/[0.01] shadow-sm shadow-black/20">
          <div className="flex items-center justify-between gap-4 border-b border-white/12 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="relative h-12 w-12 overflow-hidden rounded-full border border-white/10">
                <Image src={activeConversation.avatarUrl} alt={activeConversation.name} fill className="object-cover" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{activeConversation.name}</p>
                <p className="text-xs uppercase tracking-[0.3em] text-white/40">{activeConversation.role}</p>
                <div className="mt-1">
                  <SourceChip label="Message" />
                  {workflowNoticeText &&
                  normalizedNoticeResource === activeConversation.name.toLowerCase() ? (
                    <p className="mt-1 text-[11px] text-white/50">{workflowNoticeText}</p>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-white/60">
              <Button variant="ghost" size="icon" className="rounded-full border border-white/20 text-white hover:bg-white/10">
                <PhoneCall className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full border border-white/20 text-white hover:bg-white/10">
                <Video className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="rounded-full border border-white/20 text-white hover:bg-white/10"
                    disabled={isDeleting}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="border-white/10 bg-[#1a1a1a] text-white">
                  <DropdownMenuItem
                    onClick={() => handleDeleteConversation(activeConversation.id)}
                    className="cursor-pointer text-red-400 focus:bg-red-500/20 focus:text-red-300"
                    disabled={isDeleting}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {isDeleting ? "Suppression..." : "Supprimer la conversation"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="relative flex-1 overflow-hidden">
            <div className="absolute inset-x-0 top-0 hidden h-6 items-center justify-center gap-2 text-[10px] uppercase tracking-[0.4em] text-white/40 md:flex">
              <Wifi className="h-3.5 w-3.5" />
              En conversation privée
            </div>
            <div className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-black/45 via-black/20 to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
            <div className="flex h-full flex-col overflow-y-auto px-5 pb-12 pt-12">
              <div className="mx-auto w-full max-w-4xl">
                <div className="flex flex-col gap-6 rounded-[28px] border border-white/12 bg-white/[0.012] px-6 py-8 shadow-sm shadow-black/15">
                  {conversationContextHint ? (
                    <p className="mx-auto max-w-md text-center text-xs text-white/40">{conversationContextHint}</p>
                  ) : null}
                  {activeConversation.messages.length <= 1 ? (
                    <p className="mx-auto max-w-md text-center text-xs text-white/45">
                      Vous pouvez commencer l’échange ici. Une réponse simple suffit.
                    </p>
                  ) : null}
                  <AnimatePresence initial={false}>
                    {(() => {
                      let lastDateLabel: string | null = null;
                      return activeConversation.messages.map((message, index) => {
                        const messageDate = new Date(message.sentAt);
                        const dateLabel = Number.isNaN(messageDate.getTime())
                          ? null
                          : messageDate.toLocaleDateString("fr-FR", {
                              weekday: "short",
                              day: "2-digit",
                              month: "short",
                            });
                        const showDateDivider = dateLabel !== null && dateLabel !== lastDateLabel;
                        if (dateLabel) {
                          lastDateLabel = dateLabel;
                        }
                        const isLearner = message.author === "learner";
                        const previousMessage = index > 0 ? activeConversation.messages[index - 1] : null;
                        const isSameAuthor = previousMessage?.author === message.author;
                        const bubbleTime = Number.isNaN(messageDate.getTime())
                          ? ""
                          : messageDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
                        const contentLength = (message.content || "").trim().length;
                        const isCompact = contentLength > 0 && contentLength <= 32;

                        return (
                          <Fragment key={message.id}>
                            {showDateDivider ? (
                              <div className="flex items-center gap-4 text-[11px] uppercase tracking-[0.4em] text-white/35">
                                <span className="flex-1 border-t border-white/10" />
                                <span>{dateLabel}</span>
                                <span className="flex-1 border-t border-white/10" />
                              </div>
                            ) : null}
                            <motion.div
                              variants={bubbleVariants}
                              initial="hidden"
                              animate="visible"
                              exit="hidden"
                              transition={{ duration: 0.25, ease: "easeOut" }}
                              className={cn(
                                "flex w-full",
                                isLearner ? "justify-end" : "justify-start",
                                isSameAuthor ? "mt-2" : "mt-5",
                              )}
                            >
                              <div
                                className={cn(
                                  "min-w-[112px] max-w-[82%] border text-sm leading-relaxed shadow-sm transition-colors",
                                  isCompact ? "rounded-3xl" : "rounded-[26px]",
                                  isSameAuthor ? "rounded-t-xl" : "",
                                  message.type === "consigne"
                                    ? cn(
                                        "bg-[#22364a]/90 border-cyan-300/20 px-6 py-3 text-white shadow-[0_16px_40px_-26px_rgba(14,165,233,0.35)]",
                                        isCompact && "py-2.5",
                                      )
                                    : isLearner
                                      ? cn(
                                          "bg-[#0d1724]/92 border-white/12 px-5 text-white/82",
                                          isCompact ? "py-2.5" : "py-3",
                                          "mr-[2px]",
                                        )
                                      : cn(
                                          "bg-[#21384a]/92 border-cyan-200/22 px-6 text-white/92 shadow-[0_18px_42px_-24px_rgba(56,189,248,0.45)]",
                                          isCompact ? "py-2.5" : "py-3",
                                          "ml-[3px]",
                                        ),
                                )}
                              >
                                {message.type === "consigne" && (
                                  <div className="mb-2 flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-white/80" />
                                    <span className="text-xs font-semibold uppercase tracking-[0.3em] text-white/80">
                                      Consigne
                                    </span>
                                  </div>
                                )}
                                {message.subject && (
                                  <div className="mb-2 border-b border-white/15 pb-2">
                                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/75">
                                      {message.subject}
                                    </p>
                                  </div>
                                )}
                                <div className="text-white/90">
                                  <div
                                    className={cn(
                                      message.type === "consigne" &&
                                        "prose prose-invert prose-headings:text-white prose-p:text-white/90 max-w-none",
                                    )}
                                    dangerouslySetInnerHTML={{
                                      __html: message.content.replace(/\n/g, "<br />"),
                                    }}
                                  />
                                </div>
                                {message.type === "consigne" && (
                                  <div className="mt-3 border-t border-cyan-300/20 pt-3">
                                    <Button
                                      asChild
                                      size="sm"
                                      className="w-full rounded-full border border-cyan-300/30 bg-cyan-500/15 text-xs font-semibold uppercase tracking-[0.2em] text-white hover:border-cyan-200/40 hover:bg-cyan-500/25"
                                    >
                                      <Link href={`/dashboard/student/tools/drive/new?consigne=${activeConversation?.id}&message=${message.id}`}>
                                        Valider le document
                                      </Link>
                                    </Button>
                                  </div>
                                )}
                                {bubbleTime ? (
                                  <span className="mt-2 block text-xs text-white/55">{bubbleTime}</span>
                                ) : null}
                              </div>
                            </motion.div>
                          </Fragment>
                        );
                      });
                    })()}
                  </AnimatePresence>
                  <div ref={messagesEndRef} />
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3 border-t border-white/12 bg-black/20 px-6 py-5">
            {!activeConversation && (
              <div className="mb-2">
                <ContactSelector
                  contacts={availableContacts}
                  selectedContactId={selectedContactId}
                  onSelectContact={setSelectedContactId}
                  placeholder="Sélectionner un contact pour commencer une conversation..."
                />
              </div>
            )}
            <div className="flex items-end gap-3">
              <Textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder={
                  activeConversation
                    ? "Écrire un message (une réponse courte suffit)"
                    : "Sélectionnez un contact d'abord..."
                }
                rows={1}
                disabled={!activeConversation && !selectedContactId}
                className="min-h-[60px] resize-none rounded-2xl border border-white/12 bg-white/[0.03] px-5 py-3 text-sm text-white placeholder:text-white/45 focus-visible:ring-white/30 disabled:opacity-50"
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    if (message.trim() && (activeConversation || selectedContactId)) {
                      const form = event.currentTarget.closest('form') as HTMLFormElement;
                      if (form) {
                        handleSubmit(form);
                      }
                    }
                  }
                }}
              />
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="rounded-full border border-white/20 text-white hover:bg-white/10"
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Button
                  type="submit"
                  disabled={!canSend}
                  className={cn(
                    "rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition",
                    canSend
                      ? "border border-cyan-300/30 bg-cyan-500/12 text-white hover:border-cyan-200/40 hover:bg-cyan-500/18"
                      : "border border-white/18 bg-white/8 text-white/45",
                  )}
                >
                  Envoyer
                  <Send className="ml-2 h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            <p className="text-[10px] uppercase tracking-[0.4em] text-white/30">Les messages seront archivés dans Supabase ✔</p>
          </form>
        </div>
      </div>

      </div>
      {/* Modal pour écrire un nouveau message */}
      <NewMessageModal
        open={showNewMessageModal}
        onOpenChange={setShowNewMessageModal}
        availableContacts={availableContacts}
        onSend={handleSendFromModal}
      />
    </>
  );
}


