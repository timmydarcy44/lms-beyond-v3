"use client";

import { useMemo, useState } from "react";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ConsigneModal } from "@/components/formateur/drive/formateur-consigne-modal";
import { cn } from "@/lib/utils";
import { FormateurDriveDocument, getFormateurLearners, getFormateurGroups, type FormateurLearner, type FormateurGroup } from "@/lib/queries/formateur";

import { LayoutGrid, List } from "lucide-react";

const aiLevelConfig = [
  { threshold: 25, label: "Très faible", tone: "bg-emerald-500/10 text-emerald-100" },
  { threshold: 50, label: "Modérée", tone: "bg-amber-500/10 text-amber-200" },
  { threshold: 75, label: "Élevée", tone: "bg-orange-500/10 text-orange-200" },
  { threshold: 100, label: "Très élevée", tone: "bg-rose-500/10 text-rose-200" },
];

type DriveStorageTableProps = {
  documents: FormateurDriveDocument[];
  learners: FormateurLearner[];
  groups: FormateurGroup[];
};

export function DriveStorageTable({ documents, learners, groups }: DriveStorageTableProps) {
  const [search, setSearch] = useState("");
  const [aiFilter, setAiFilter] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [consigneModalOpen, setConsigneModalOpen] = useState(false);

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const matchesSearch = search
        ? doc.title.toLowerCase().includes(search.toLowerCase()) || doc.author.toLowerCase().includes(search.toLowerCase())
        : true;
      const matchesAi = aiFilter ? filterByAiLevel(doc.aiUsageScore, aiFilter) : true;
      return matchesSearch && matchesAi;
    });
  }, [documents, search, aiFilter]);

  const aiFilterOptions = ["Tous", ...aiLevelConfig.map((level) => level.label)];

  const folders = useMemo(() => {
    const result = new Map<
      string,
      {
        name: string;
        total: number;
        unread: number;
        dueAt?: string | null;
      }
    >();

    documents.forEach((doc) => {
      const folderKey = doc.folderId ?? doc.folderName;
      if (!folderKey || !doc.folderName) return;
      if (!result.has(folderKey)) {
        result.set(folderKey, {
          name: doc.folderName,
          total: 0,
          unread: 0,
          dueAt: doc.dueAt,
        });
      }
      const entry = result.get(folderKey)!;
      entry.total += 1;
      if (!doc.isRead) entry.unread += 1;
      if (doc.dueAt && (!entry.dueAt || new Date(doc.dueAt) > new Date(entry.dueAt))) {
        entry.dueAt = doc.dueAt;
      }
    });

    return Array.from(result.values());
  }, [documents]);

  return (
    <>
      <Card className="border-white/10 bg-white/5 text-white">
        <CardContent className="space-y-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher par titre ou auteur..."
            className="max-w-md border-white/10 bg-black/30 text-white placeholder:text-white/40"
          />
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex rounded-full border border-white/10 bg-black/30 p-1">
              <Button
                type="button"
                variant={viewMode === "table" ? "default" : "ghost"}
                onClick={() => setViewMode("table")}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em]",
                  viewMode === "table"
                    ? "bg-gradient-to-r from-[#00C6FF] to-[#0072FF] text-white"
                    : "text-white/60 hover:text-white",
                )}
              >
                <List className="mr-1 h-3.5 w-3.5" /> Liste
              </Button>
              <Button
                type="button"
                variant={viewMode === "grid" ? "default" : "ghost"}
                onClick={() => setViewMode("grid")}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em]",
                  viewMode === "grid"
                    ? "bg-gradient-to-r from-[#00C6FF] to-[#0072FF] text-white"
                    : "text-white/60 hover:text-white",
                )}
              >
                <LayoutGrid className="mr-1 h-3.5 w-3.5" /> Grille
              </Button>
            </div>

            {aiFilterOptions.map((option) => (
              <Button
                key={option}
                variant={aiFilter === option || (option === "Tous" && aiFilter === null) ? "default" : "ghost"}
                className={cn(
                  "rounded-full border border-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em]",
                  aiFilter === option || (option === "Tous" && aiFilter === null)
                    ? "bg-gradient-to-r from-[#00C6FF] to-[#0072FF] text-white"
                    : "text-white/60 hover:text-white",
                )}
                onClick={() => setAiFilter(option === "Tous" ? null : option)}
              >
                {option}
              </Button>
            ))}
          </div>
        </div>

        {folders.length ? (
          <div className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">Dossiers consignés</p>
              <span className="text-[11px] uppercase tracking-[0.3em] text-white/40">{folders.length} dossiers</span>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/20">
              {folders.map((folder) => (
                <div
                  key={folder.name}
                  className="min-w-[220px] rounded-2xl border border-white/10 bg-gradient-to-br from-[#0f172a] via-[#111827] to-[#020617] p-4 text-sm text-white shadow-lg shadow-black/30"
                >
                  <p className="text-base font-semibold text-white">{folder.name}</p>
                  <div className="mt-3 space-y-1 text-xs text-white/60">
                    <p>
                      <span className="font-semibold text-white">{folder.total}</span> fichier(s)
                    </p>
                    <p>
                      <span className="font-semibold text-white">{folder.unread}</span> non lu(s)
                    </p>
                    {folder.dueAt ? (
                      <p className="text-[11px] uppercase tracking-[0.3em] text-white/40">Attendu · {folder.dueAt}</p>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <Button
          type="button"
          onClick={() => setConsigneModalOpen(true)}
          className="w-full rounded-3xl bg-gradient-to-r from-[#00C6FF] via-[#8E2DE2] to-[#FF6FD8] px-5 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-lg shadow-[#8E2DE2]/40"
        >
          Créer une consigne
        </Button>

        {viewMode === "table" ? (
          <div className="overflow-hidden rounded-2xl border border-white/10">
            <table className="min-w-full divide-y divide-white/10 text-sm">
              <thead className="bg-white/10 text-left uppercase tracking-[0.3em] text-xs text-white/50">
                <tr>
                  <th className="px-5 py-3 font-medium">Titre</th>
                  <th className="px-5 py-3 font-medium">Auteur</th>
                  <th className="px-5 py-3 font-medium">Déposé le</th>
                  <th className="px-5 py-3 font-medium text-center">Usage IA</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 bg-black/20">
                {filteredDocuments.map((doc) => (
                  <tr key={doc.id} className="transition hover:bg-white/5">
                    <td className="px-5 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-white">{doc.title}</p>
                          {!doc.isRead ? (
                            <Badge className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.3em] text-red-200">
                              Non lu
                            </Badge>
                          ) : null}
                        </div>
                        <p className="text-xs text-white/50 line-clamp-1">{doc.summary}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="space-y-1 text-xs text-white/60">
                        <p className="font-medium text-white">{doc.author}</p>
                        <p>{doc.authorRole}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs text-white/60">
                      <div className="space-y-1">
                        <p>{doc.depositedAt}</p>
                        {doc.dueAt ? (
                          <p className="text-[11px] uppercase tracking-[0.3em] text-white/40">Attendu · {doc.dueAt}</p>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="space-y-2">
                        <AiUsageBadge value={doc.aiUsageScore} />
                        <span
                          className={cn(
                            "block text-center text-[10px] uppercase tracking-[0.3em]",
                            doc.isLate ? "text-red-300" : "text-emerald-200",
                          )}
                        >
                          {doc.isLate ? "En retard" : "À l'heure"}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-3">
                        <Button asChild className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-white hover:bg-white/20">
                          <Link href={`/dashboard/formateur/drive/${doc.id}`}>Ouvrir</Link>
                        </Button>
                        <button
                          type="button"
                          className="rounded-full bg-transparent px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] bg-gradient-to-r from-[#00C6FF] via-[#8E2DE2] to-[#FF6FD8] bg-clip-text text-transparent hover:opacity-80"
                        >
                          Commenter
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredDocuments.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-6 py-12 text-center text-sm text-white/60">
                <p>Aucun document ne correspond à vos critères de recherche.</p>
                <p className="text-xs text-white/40">Ajustez votre filtre IA ou votre recherche par mots clés.</p>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredDocuments.map((doc) => (
              <div
                key={doc.id}
                className="flex h-full flex-col justify-between rounded-3xl border border-white/10 bg-gradient-to-br from-[#0f172a]/80 via-[#0b1120]/80 to-[#020617]/90 p-6 shadow-lg shadow-black/30"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <AiUsageBadge value={doc.aiUsageScore} />
                      <span
                        className={cn(
                          "block text-[10px] uppercase tracking-[0.3em]",
                          doc.isLate ? "text-red-300" : "text-emerald-200",
                        )}
                      >
                        {doc.isLate ? "En retard" : "À l'heure"}
                      </span>
                    </div>
                    <div className="text-right text-xs text-white/60">
                      <p>{doc.depositedAt}</p>
                      {doc.dueAt ? (
                        <p className="text-[11px] uppercase tracking-[0.3em] text-white/40">Attendu · {doc.dueAt}</p>
                      ) : null}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-white">{doc.title}</h3>
                      {!doc.isRead ? (
                        <Badge className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.3em] text-red-200">
                          Non lu
                        </Badge>
                      ) : null}
                    </div>
                    <p className="text-sm text-white/60 line-clamp-3">{doc.summary}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-xs text-white/60">
                    <p className="font-semibold text-white">{doc.author}</p>
                    <p>{doc.authorRole}</p>
                    {doc.wordCount ? <p className="mt-1">Volume · {doc.wordCount.toLocaleString("fr-FR")}&nbsp;mots</p> : null}
                    {doc.dueAt ? <p className="mt-1 text-[11px] uppercase tracking-[0.3em]">Attendu · {doc.dueAt}</p> : null}
                  </div>
                </div>
                <div className="mt-6 flex items-center justify-between gap-3">
                  <Button asChild className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white hover:bg-white/20">
                    <Link href={`/dashboard/formateur/drive/${doc.id}`}>Ouvrir</Link>
                  </Button>
                  <button
                    type="button"
                    className="rounded-full bg-transparent px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] bg-gradient-to-r from-[#00C6FF] via-[#8E2DE2] to-[#FF6FD8] bg-clip-text text-transparent hover:opacity-80"
                  >
                    Commenter
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        </CardContent>
      </Card>
      <ConsigneModal 
        open={consigneModalOpen} 
        onOpenChange={setConsigneModalOpen}
        learners={learners}
        groups={groups}
      />
    </>
  );
}

function AiUsageBadge({ value }: { value: number }) {
  const level = aiLevelConfig.find((item) => value <= item.threshold) ?? aiLevelConfig[aiLevelConfig.length - 1];
  return (
    <Badge className={cn("rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.3em]", level.tone)}>
      {value.toFixed(0)}% · {level.label}
    </Badge>
  );
}

function filterByAiLevel(value: number, label: string) {
  if (label === "Tous") return true;
  const level = aiLevelConfig.find((item) => item.label === label);
  if (!level) return true;
  const index = aiLevelConfig.indexOf(level);
  const minThreshold = index === 0 ? 0 : aiLevelConfig[index - 1].threshold;
  return value > minThreshold && value <= level.threshold;
}


