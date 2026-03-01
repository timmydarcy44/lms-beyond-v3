import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { FormateurDriveDocument } from "@/lib/queries/formateur";

type DriveStorageSummaryProps = {
  documents: FormateurDriveDocument[];
};

export function DriveStorageSummary({ documents }: DriveStorageSummaryProps) {
  const totalDocuments = documents.length;
  const unreadDocuments = documents.filter((doc) => !doc.isRead).length;
  const aiAverage = documents.length ? documents.reduce((acc, doc) => acc + doc.aiUsageScore, 0) / documents.length : 0;
  const highAiDocuments = documents.filter((doc) => doc.aiUsageScore >= 75).length;
  const lateDocuments = documents.filter((doc) => doc.isLate).length;
  const folderSet = new Set<string>();
  documents.forEach((doc) => {
    const key = doc.folderId ?? doc.folderName;
    if (key) {
      folderSet.add(key);
    }
  });
  const pendingFolders = folderSet.size;

  const formatScore = (value: number) => `${value.toFixed(0)}%`;

  const tiles = [
    {
      label: "Documents",
      value: totalDocuments,
      hint: "Total stocké",
      tone: "neutral",
    },
    {
      label: "Non lus",
      value: unreadDocuments,
      hint: "En attente de revue",
      tone: "priority",
    },
    {
      label: "Score IA moyen",
      value: formatScore(aiAverage),
      hint: "Utilisation moyenne",
      tone: "neutral",
    },
    {
      label: "IA intense",
      value: highAiDocuments,
      hint: ">= 75% d'usage IA",
      tone: "focus",
    },
    {
      label: "En retard",
      value: lateDocuments,
      hint: "Dossiers à relancer",
      tone: "alert",
    },
    {
      label: "Dossiers créés",
      value: pendingFolders,
      hint: "Espaces dédiés",
      tone: "neutral",
    },
  ];

  const toneClasses: Record<string, string> = {
    neutral: "border border-white/10 bg-white/5",
    priority: "border border-cyan-400/35 bg-cyan-500/12",
    focus: "border border-blue-400/30 bg-blue-500/12",
    alert: "border border-red-400/35 bg-red-500/12",
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
      {tiles.map((tile) => (
        <Card
          key={tile.label}
          className={cn(
            "relative overflow-hidden rounded-2xl text-white shadow-lg shadow-black/25 backdrop-blur-sm",
            toneClasses[tile.tone] ?? toneClasses.neutral,
          )}
        >
          <CardContent className="relative flex h-full flex-col justify-between gap-6 p-6">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/55">{tile.label}</p>
              <p className="text-3xl font-semibold tracking-tight text-white">{tile.value}</p>
            </div>
            <p className="inline-flex w-fit rounded-full bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.3em] text-white/70">
              {tile.hint}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

