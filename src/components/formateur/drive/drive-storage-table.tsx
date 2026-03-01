"use client";

import { useEffect, useMemo, useState } from "react";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ConsigneModal } from "@/components/formateur/drive/formateur-consigne-modal";
import { cn } from "@/lib/utils";
import { FormateurDriveDocument, getFormateurLearners, getFormateurGroups, type FormateurLearner, type FormateurGroup } from "@/lib/queries/formateur";

import { LayoutGrid, List } from "lucide-react";
import { SourceChip } from "@/components/ui/source-chip";

const aiLevelConfig = [
  { threshold: 25, label: "Très faible", tone: "text-white/65" },
  { threshold: 50, label: "Modérée", tone: "text-white/70" },
  { threshold: 75, label: "Élevée", tone: "border-cyan-400/40 text-white" },
  { threshold: 100, label: "Très élevée", tone: "border-amber-400/45 text-white" },
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
  const [workflowNotice, setWorkflowNotice] = useState<{ resource?: string | null } | null>(null);

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
  const normalizedNoticeResource = workflowNotice?.resource?.toLowerCase() ?? null;

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

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = sessionStorage.getItem("trainerWorkflow:lastCompletedSource");
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as { key?: string; resource?: string; at?: number };
      if (parsed?.key === "drive" && typeof parsed.at === "number" && Date.now() - parsed.at < 5 * 60 * 1000) {
        setWorkflowNotice({ resource: parsed.resource ?? null });
        sessionStorage.removeItem("trainerWorkflow:lastCompletedSource");
      }
    } catch (error) {
      console.warn("[drive] Cannot read completion source", error);
    }
  }, []);

  return (
    <>
      <Card className="border border-white/12 bg-slate-950/80 text-white">
        <CardContent className="space-y-10 p-6">
          <p className="text-sm text-white/70">
            Cet espace vous permet de consulter les productions des apprenants, d’en analyser le contenu et de fournir des retours
            pédagogiques ciblés. Les indicateurs IA sont fournis à titre indicatif et doivent être nuancés par votre jugement.
          </p>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher par titre ou auteur..."
            className="max-w-md border border-white/12 bg-slate-900/70 text-white placeholder:text-white/40 focus-visible:ring-2 focus-visible:ring-cyan-300"
          />
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex rounded-full border border-white/12 bg-slate-900/70 p-1">
              <Button
                type="button"
                variant={viewMode === "table" ? "default" : "ghost"}
                onClick={() => setViewMode("table")}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em]",
                  viewMode === "table"
                    ? "bg-cyan-500/25 text-white shadow-[0_0_0_1px_rgba(34,211,238,0.35)]"
                    : "text-white/55 hover:text-white",
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
                    ? "bg-cyan-500/25 text-white shadow-[0_0_0_1px_rgba(34,211,238,0.35)]"
                    : "text-white/55 hover:text-white",
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
                  "rounded-full border border-white/12 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em]",
                  aiFilter === option || (option === "Tous" && aiFilter === null)
                    ? "bg-cyan-500/22 text-white shadow-[0_0_0_1px_rgba(34,211,238,0.35)]"
                    : "text-white/55 hover:text-white",
                )}
                onClick={() => setAiFilter(option === "Tous" ? null : option)}
              >
                {option}
              </Button>
            ))}
          </div>
        </div>

        {folders.length ? (
          <div className="space-y-3 rounded-3xl border border-white/12 bg-slate-950/70 p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">Dossiers consignés</p>
              <span className="text-[11px] uppercase tracking-[0.3em] text-white/40">{folders.length} dossiers</span>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/15">
              {folders.map((folder) => (
                <div
                  key={folder.name}
                  className="min-w-[220px] rounded-2xl border border-white/12 bg-slate-950/75 p-4 text-sm text-white shadow-md shadow-black/25"
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
          className="w-full rounded-3xl border border-cyan-400/30 bg-cyan-500/18 px-5 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:border-cyan-300/40 hover:bg-cyan-500/28 focus-visible:ring-2 focus-visible:ring-cyan-300"
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
              <tbody className="divide-y divide-white/12 bg-slate-950/60">
                {filteredDocuments.map((doc) => {
                  const needsAttention = !doc.isRead || doc.isLate || doc.aiUsageScore >= 75;
                  const priorityLabel = doc.isLate ? "À traiter aujourd’hui" : !doc.isRead ? "À lire" : doc.aiUsageScore >= 75 ? "Surveiller IA" : "À consulter";
                  const matchesResource =
                    normalizedNoticeResource !== null &&
                    [doc.title, doc.folderName ?? ""].some(
                      (candidate) => candidate?.toLowerCase() === normalizedNoticeResource,
                    );
                  return (
                  <tr
                    key={doc.id}
                    className={cn(
                      "transition-colors",
                      needsAttention ? "bg-white/6 hover:bg-white/10" : "hover:bg-white/6",
                    )}
                  >
                    <td className="px-5 py-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <div className={cn("h-1.5 w-10 rounded-full", needsAttention ? "bg-cyan-400/50" : "bg-white/15")} />
                          <p className="text-sm font-semibold text-white">{doc.title}</p>
                          {!doc.isRead ? (
                            <Badge className="rounded-full border border-amber-400/30 bg-amber-500/15 px-2 py-0.5 text-[10px] uppercase tracking-[0.3em] text-amber-100">
                              Non lu
                            </Badge>
                          ) : null}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <SourceChip label="Document" />
                          {matchesResource ? (
                            <span className="text-xs text-white/50">Tâche clôturée dans To-Do</span>
                          ) : null}
                        </div>
                        <p className="text-xs text-white/45 line-clamp-1">{doc.summary}</p>
                        <p className="text-[11px] uppercase tracking-[0.3em] text-white/40">{priorityLabel}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8 border border-white/12 bg-white/10">
                          <AvatarFallback className="text-xs font-semibold text-white/70">
                            {getInitials(doc.author)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-1 text-xs text-white/60">
                          <p className="font-medium text-white">{doc.author}</p>
                          <p className="text-white/45">{doc.authorRole}</p>
                        </div>
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
                      <div className="space-y-2 text-center">
                        <AiUsageBadge value={doc.aiUsageScore} />
                        <span
                          className={cn(
                            "block text-[10px] uppercase tracking-[0.3em]",
                            doc.isLate ? "text-rose-200" : "text-white/45",
                          )}
                        >
                          {doc.isLate ? "En retard" : "À l'heure"}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <Button
                          asChild
                          className="rounded-full border border-cyan-400/25 bg-cyan-500/18 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white transition hover:border-cyan-300/40 hover:bg-cyan-500/28 focus-visible:ring-2 focus-visible:ring-cyan-300"
                        >
                          <Link href={`/dashboard/formateur/drive/${doc.id}`}>Valider</Link>
                        </Button>
                        <button
                          type="button"
                          className="rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/55 transition hover:text-white focus-visible:ring-2 focus-visible:ring-white/20"
                        >
                          Commenter
                        </button>
                      </div>
                    </td>
                  </tr>
                );})}
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
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredDocuments.map((doc) => {
              const needsAttention = !doc.isRead || doc.isLate || doc.aiUsageScore >= 75;
              const priorityLabel = doc.isLate ? "À traiter aujourd’hui" : !doc.isRead ? "À lire" : doc.aiUsageScore >= 75 ? "Surveiller IA" : "À consulter";
              const matchesResource =
                normalizedNoticeResource !== null &&
                [doc.title, doc.folderName ?? ""].some(
                  (candidate) => candidate?.toLowerCase() === normalizedNoticeResource,
                );
              return (
              <div
                key={doc.id}
                className={cn(
                  "flex h-full flex-col justify-between rounded-3xl border border-white/12 bg-slate-950/75 p-6 shadow-lg shadow-black/25 transition-transform duration-200 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(4,9,20,0.45)] motion-reduce:transition-none motion-reduce:hover:transform-none",
                  needsAttention ? "ring-1 ring-cyan-400/30" : "",
                )}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <AiUsageBadge value={doc.aiUsageScore} />
                      <span
                        className={cn("block text-[10px] uppercase tracking-[0.3em]", doc.isLate ? "text-rose-200" : "text-white/45")}
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
                        <Badge className="rounded-full border border-amber-400/30 bg-amber-500/15 px-2 py-0.5 text-[10px] uppercase tracking-[0.3em] text-amber-100">
                          Non lu
                        </Badge>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2">
                      <SourceChip label="Document" />
                      {matchesResource ? (
                        <span className="text-xs text-white/50">Tâche clôturée dans To-Do</span>
                      ) : null}
                    </div>
                    <p className="text-sm text-white/60 line-clamp-3">{doc.summary}</p>
                    <p className="text-[11px] uppercase tracking-[0.3em] text-white/40">{priorityLabel}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-xs text-white/60">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 border border-white/12 bg-white/10">
                        <AvatarFallback className="text-xs font-semibold text-white/70">{getInitials(doc.author)}</AvatarFallback>
                      </Avatar>
                      <div className="space-y-1">
                        <p className="font-semibold text-white">{doc.author}</p>
                        <p className="text-white/45">{doc.authorRole}</p>
                      </div>
                    </div>
                    {doc.wordCount ? <p className="mt-1">Volume · {doc.wordCount.toLocaleString("fr-FR")}&nbsp;mots</p> : null}
                    {doc.dueAt ? <p className="mt-1 text-[11px] uppercase tracking-[0.3em]">Attendu · {doc.dueAt}</p> : null}
                  </div>
                </div>
                <div className="mt-6 flex items-center justify-between gap-3">
                  <Button
                    asChild
                    className="rounded-full border border-cyan-400/25 bg-cyan-500/18 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white transition hover:border-cyan-300/35 hover:bg-cyan-500/26 focus-visible:ring-2 focus-visible:ring-cyan-300"
                  >
                    <Link href={`/dashboard/formateur/drive/${doc.id}`}>Valider</Link>
                  </Button>
                  <button
                    type="button"
                    className="rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/55 transition hover:text-white focus-visible:ring-2 focus-visible:ring-white/20"
                  >
                    Commenter
                  </button>
                </div>
              </div>
            );})}
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
    <div className="space-y-2 text-center">
      <span className="block text-[10px] uppercase tracking-[0.3em] text-white/45">Indication automatisée — non déterminante</span>
      <Badge
        className={cn(
          "inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-3 py-1 text-[11px] font-medium text-white/75",
          level.tone,
        )}
      >
        <span className="text-white">{value.toFixed(0)}%</span>
        <span className="text-white/60">{level.label}</span>
      </Badge>
    </div>
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

function getInitials(name: string) {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase())
    .slice(0, 2)
    .join("") || "?";
}


