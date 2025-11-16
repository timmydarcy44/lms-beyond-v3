import { Card, CardContent } from "@/components/ui/card";

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
      gradient: "from-[#0f172a] via-[#0b1120] to-[#1f2937]",
    },
    {
      label: "Non lus",
      value: unreadDocuments,
      hint: "En attente de revue",
      gradient: "from-[#111827] via-[#1e293b] to-[#2563eb]/30",
    },
    {
      label: "Score IA moyen",
      value: formatScore(aiAverage),
      hint: "Utilisation moyenne",
      gradient: "from-[#0b1120] via-[#4f46e5]/40 to-[#8b5cf6]/40",
    },
    {
      label: "IA intense",
      value: highAiDocuments,
      hint: ">= 75% d'usage IA",
      gradient: "from-[#0f172a] via-[#db2777]/40 to-[#f472b6]/30",
    },
    {
      label: "En retard",
      value: lateDocuments,
      hint: "Dossiers à relancer",
      gradient: "from-[#1f2937] via-[#ef4444]/40 to-[#f59e0b]/20",
    },
    {
      label: "Dossiers créés",
      value: pendingFolders,
      hint: "Espaces dédiés",
      gradient: "from-[#101828] via-[#22d3ee]/40 to-[#2563eb]/20",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
      {tiles.map((tile) => (
        <Card
          key={tile.label}
          className={`relative overflow-hidden border border-white/10 bg-gradient-to-br ${tile.gradient} text-white shadow-lg shadow-black/30`}
        >
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10/5 via-transparent to-transparent" />
          <CardContent className="relative flex h-full flex-col justify-between gap-6 p-6">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">{tile.label}</p>
              <p className="text-3xl font-semibold tracking-tight text-white">{tile.value}</p>
            </div>
            <p className="inline-flex w-fit rounded-full bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.3em] text-white/80">
              {tile.hint}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}


