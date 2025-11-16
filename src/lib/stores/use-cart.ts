import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  id: string;
  content_id: string;
  content_type: "module" | "test" | "ressource" | "parcours";
  title: string;
  price: number;
  thumbnail_url?: string | null;
};

type CartStore = {
  items: CartItem[];
  isOpen: boolean;
  addItem: (item: CartItem) => Promise<void>;
  removeItem: (contentId: string, contentType: string) => Promise<void>;
  clearCart: () => Promise<void>;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
  syncWithServer: () => Promise<void>;
};

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: async (item: CartItem) => {
        const currentItems = get().items;
        
        // Vérifier si l'item existe déjà
        const exists = currentItems.some(
          (i) => i.content_id === item.content_id && i.content_type === item.content_type
        );

        if (exists) {
          // Si déjà dans le panier, ouvrir le drawer
          set({ isOpen: true });
          return;
        }

        // Ajouter au panier local
        const newItems = [...currentItems, item];
        set({ items: newItems, isOpen: true }); // Ouvrir le drawer automatiquement

        // Synchroniser avec le serveur (en arrière-plan, ne pas bloquer)
        fetch("/api/cart/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content_id: item.content_id,
            content_type: item.content_type,
            title: item.title,
            price: item.price,
            thumbnail_url: item.thumbnail_url,
          }),
        })
        .then(async (response) => {
          if (!response.ok) {
            const errorText = await response.text();
            console.error("[cart] Server error:", errorText);
            // Ne pas supprimer l'item du panier local en cas d'erreur serveur
            // Le panier local reste fonctionnel
          }
        })
        .catch((error) => {
          console.error("[cart] Error syncing with server:", error);
          // En cas d'erreur réseau, le panier local reste fonctionnel
        });
      },

      removeItem: async (contentId: string, contentType: string) => {
        const currentItems = get().items;
        const newItems = currentItems.filter(
          (i) => !(i.content_id === contentId && i.content_type === contentType)
        );
        set({ items: newItems });

        // Synchroniser avec le serveur
        try {
          await fetch("/api/cart/remove", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content_id: contentId, content_type: contentType }),
          });
        } catch (error) {
          console.error("[cart] Error removing from server:", error);
        }
      },

      clearCart: async () => {
        set({ items: [] });

        // Synchroniser avec le serveur
        try {
          await fetch("/api/cart/clear", {
            method: "POST",
          });
        } catch (error) {
          console.error("[cart] Error clearing server cart:", error);
        }
      },

      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      getTotal: () => {
        return get().items.reduce((sum, item) => sum + item.price, 0);
      },

      getItemCount: () => {
        return get().items.length;
      },

      syncWithServer: async () => {
        try {
          const response = await fetch("/api/cart");
          if (!response.ok) {
            // Si l'API échoue, garder les items locaux
            return;
          }
          const data = await response.json();
          
          // Ne synchroniser que si on a des items côté serveur ET que le panier local est vide
          // Sinon, on garde les items locaux pour éviter de perdre les ajouts récents
          if (data.items && data.items.length > 0 && get().items.length === 0) {
            set({ items: data.items });
          }
        } catch (error) {
          // En cas d'erreur, garder les items locaux
          console.error("[cart] Error syncing with server:", error);
        }
      },
    }),
    {
      name: "cart-storage",
      partialize: (state) => ({ items: state.items }), // Ne persister que les items
    }
  )
);

