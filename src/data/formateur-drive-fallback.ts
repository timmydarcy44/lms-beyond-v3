import { FormateurDriveDocument } from "@/lib/queries/formateur";

const formatDate = (date: Date) =>
  date.toLocaleString("fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
  });

export const formateurDriveFallback = (): FormateurDriveDocument[] => {
  const now = Date.now();
  return [
    {
      id: "doc-rituels-ia",
      title: "Rituel d'ouverture immersif",
      author: "Lina Moreau",
      authorRole: "Apprenante",
      authorEmail: "lina.moreau@example.com",
      depositedAt: formatDate(new Date(now - 1000 * 60 * 60 * 2)),
      dueAt: formatDate(new Date(now - 1000 * 60 * 60 * 1)),
      aiUsageScore: 38,
      wordCount: 1240,
      summary: "Structure complète du rituel avec prompts d'IA et retouches manuelles détaillées.",
      fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      isRead: false,
      isLate: true,
      folderId: "folder-rituels",
      folderName: "Consignes • Rituel d'ouverture",
    },
    {
      id: "doc-disc-audio",
      title: "Synthèse audio — Méthode DISC",
      author: "Noam Patel",
      authorRole: "Apprenant",
      authorEmail: "noam.patel@example.com",
      depositedAt: formatDate(new Date(now - 1000 * 60 * 60 * 6)),
      dueAt: formatDate(new Date(now + 1000 * 60 * 60 * 6)),
      aiUsageScore: 72,
      wordCount: 860,
      summary: "Script généré avec Beyond AI puis adapté pour un podcast immersif.",
      fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      isRead: true,
      isLate: false,
      folderId: "folder-disc",
      folderName: "Consignes • Diagnostics DISC",
    },
    {
      id: "doc-pitch-neuro",
      title: "Pitch de session neuro cognitive",
      author: "Jade Laurent",
      authorRole: "Apprenante",
      authorEmail: "jade.laurent@example.com",
      depositedAt: formatDate(new Date(now - 1000 * 60 * 60 * 28)),
      dueAt: formatDate(new Date(now - 1000 * 60 * 60 * 20)),
      aiUsageScore: 81,
      wordCount: 1540,
      summary: "Pitch détaillé avec sections rédigées par IA (cohérence et storytelling renforcés).",
      fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      isRead: false,
      isLate: true,
      folderId: "folder-pitch",
      folderName: "Consignes • Pitch Neuro",
    },
    {
      id: "doc-scenario-live",
      title: "Scénario live blended",
      author: "Léo Caron",
      authorRole: "Apprenant",
      authorEmail: "leo.caron@example.com",
      depositedAt: formatDate(new Date(now - 1000 * 60 * 60 * 52)),
      dueAt: formatDate(new Date(now - 1000 * 60 * 60 * 60)),
      aiUsageScore: 22,
      wordCount: 980,
      summary: "Document mostly handcrafted avec prompts IA uniquement pour la partie quiz.",
      fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      isRead: true,
      isLate: false,
      folderId: "folder-live",
      folderName: "Consignes • Scénario Live",
    },
  ];
};


