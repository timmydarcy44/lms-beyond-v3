import { create } from "zustand";

export type DriveDocument = {
  id: string;
  title: string;
  content: string;
  updatedAt: Date;
  status: "draft" | "shared";
  sharedWithInstructor: boolean;
  folderId?: string;
  consigneId?: string;
};

const initialDocuments: DriveDocument[] = [
  {
    id: "doc-neuro-brief",
    title: "Brief d'ouverture NeuroDesign",
    content: "Introduction émotionnelle pour la prochaine masterclass...",
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 6),
    status: "draft",
    sharedWithInstructor: false,
  },
  {
    id: "doc-parcours-live",
    title: "Synthèse parcours blended",
    content: "Résumé des feedbacks formateur + axes next step...",
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    status: "shared",
    sharedWithInstructor: true,
  },
  {
    id: "doc-profil-disc",
    title: "Analyse profil DISC du persona",
    content: "Hypothèses sur les leviers émotionnels à activer...",
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
    status: "draft",
    sharedWithInstructor: false,
  },
];

type DriveStore = {
  documents: DriveDocument[];
  addDocument: (document: DriveDocument) => void;
  updateDocument: (id: string, changes: Partial<DriveDocument>) => void | Promise<void>;
  toggleShare: (id: string) => void | Promise<void>;
  loadDocuments: () => Promise<void>;
};

export const useDriveDocuments = create<DriveStore>((set, get) => ({
  documents: initialDocuments,
  loadDocuments: async () => {
    try {
      const response = await fetch("/api/drive/documents");
      if (response.ok) {
        const data = await response.json();
        const dbDocuments: DriveDocument[] = (data.documents || []).map((doc: any) => ({
          id: doc.id,
          title: doc.title,
          content: doc.content || "",
          updatedAt: new Date(doc.updated_at || doc.created_at),
          status: doc.status || "draft",
          sharedWithInstructor: doc.status === "shared",
          folderId: doc.folder_id,
        }));
        
        // Combiner avec les documents mock existants (pour compatibilité)
        set({ documents: [...dbDocuments, ...initialDocuments] });
      }
    } catch (error) {
      console.error("[use-drive-documents] Error loading documents:", error);
    }
  },
  addDocument: (document) =>
    set((state) => ({
      documents: [document, ...state.documents],
    })),
  updateDocument: async (id: string, changes: Partial<DriveDocument>) => {
    // Mettre à jour dans la base de données si c'est un document réel (UUID)
    // Les documents mock (commençant par "doc-") ne sont pas dans la DB
    if (id.startsWith("doc-") && id.includes("timestamp")) {
      // C'est un document mock, on met à jour seulement le store
      set((state) => ({
        documents: state.documents.map((doc) =>
          doc.id === id
            ? {
                ...doc,
                ...changes,
                updatedAt: changes.updatedAt ?? new Date(),
              }
            : doc,
        ),
      }));
      return;
    }

    // Sinon, c'est un document réel, on met à jour dans la base de données
    try {
      const response = await fetch(`/api/drive/documents/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: changes.title,
          content: changes.content,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la mise à jour");
      }

      // Mettre à jour le store local
      set((state) => ({
        documents: state.documents.map((doc) =>
          doc.id === id
            ? {
                ...doc,
                ...changes,
                updatedAt: changes.updatedAt ?? new Date(),
              }
            : doc,
        ),
      }));
    } catch (error) {
      console.error("[use-drive-documents] Error updating document:", error);
      throw error;
    }
  },
  toggleShare: async (id: string) => {
    const document = useDriveDocuments.getState().documents.find((d) => d.id === id);
    if (!document) return;

    const newStatus = document.status === "shared" ? "draft" : "shared";

    // Mettre à jour dans la base de données
    try {
      const response = await fetch(`/api/drive/documents/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors du changement de statut");
      }

      // Mettre à jour le store local
      set((state) => ({
        documents: state.documents.map((doc) =>
          doc.id === id
            ? {
                ...doc,
                status: newStatus,
                sharedWithInstructor: newStatus === "shared",
                updatedAt: new Date(),
              }
            : doc,
        ),
      }));
    } catch (error) {
      console.error("[use-drive-documents] Error toggling share:", error);
      // L'erreur sera gérée par l'UI qui appelle cette fonction
      throw error;
    }
  },
}));

export const __internal = { initialDocuments };


