import { create } from "zustand";
import { nanoid } from "nanoid";

type MessageAuthor = "learner" | "mentor";

export type ConversationMessage = {
  id: string;
  author: MessageAuthor;
  content: string;
  subject?: string | null;
  sentAt: Date;
  type?: "message" | "consigne";
};

export type ConversationContact = {
  id: string;
  name: string;
  role: string;
  avatarUrl: string;
  status: "en ligne" | "occupé" | "hors ligne";
};

export type Conversation = ConversationContact & {
  messages: ConversationMessage[];
  unreadCount?: number;
};

type CommunityState = {
  conversations: Conversation[];
  activeConversationId: string;
  unreadTotal: number;
  setActiveConversation: (id: string) => void;
  sendMessage: (conversationId: string, content: string) => void;
  setConversations: (conversations: Conversation[]) => void;
  setUnreadTotal: (count: number) => void;
};

export const useCommunityConversations = create<CommunityState>((set) => ({
  conversations: [],
  activeConversationId: "",
  unreadTotal: 0,
  setActiveConversation: (id) => set({ activeConversationId: id }),
  setConversations: (conversations) => set({ conversations, activeConversationId: conversations[0]?.id || "" }),
  sendMessage: (conversationId, content) =>
    set((state) => {
      if (!content.trim()) return state;
      const conversations = state.conversations.map((conversation) => {
        if (conversation.id !== conversationId) return conversation;
        const message: ConversationMessage = {
          id: nanoid(),
          author: "learner",
          content: content.trim(),
          sentAt: new Date(),
        };
        return {
          ...conversation,
          messages: [...conversation.messages, message],
        };
      });
      return { conversations };
    }),
  setUnreadTotal: (count) => set({ unreadTotal: count }),
}));

// Pas de mocks exportés


