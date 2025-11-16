"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { FileText, Lock, Share2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { DriveDocument, useDriveDocuments } from "@/hooks/use-drive-documents";

const FILTERS = [
  { key: "all", label: "Tous" },
  { key: "draft", label: "Brouillons" },
  { key: "shared", label: "Partagés" },
] as const;

export default function DriveWorkspace() {
  const documents = useDriveDocuments((state) => state.documents);
  const toggleShare = useDriveDocuments((state) => state.toggleShare);
  const updateDocument = useDriveDocuments((state) => state.updateDocument);
  const loadDocuments = useDriveDocuments((state) => state.loadDocuments);
  const [activeFilter, setActiveFilter] = useState<(typeof FILTERS)[number]["key"]>("all");

  // Charger les documents depuis la base de données au montage
  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const filteredDocuments = useMemo(() => {
    if (activeFilter === "all") return documents;
    return documents.filter((doc) => doc.status === activeFilter);
  }, [documents, activeFilter]);
  
  // Séparer les documents de consignes des autres documents
  const consignesDocuments = useMemo(() => {
    return filteredDocuments.filter((doc) => doc.consigneId || doc.folderId);
  }, [filteredDocuments]);
  
  const otherDocuments = useMemo(() => {
    return filteredDocuments.filter((doc) => !doc.consigneId && !doc.folderId);
  }, [filteredDocuments]);

  return (
    <div className="space-y-10">
      <Card className="overflow-hidden border-white/10 bg-gradient-to-br from-[#1A1A1A] via-[#111111] to-[#070707] text-white">
        <CardHeader className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1 text-xs uppercase tracking-[0.4em] text-white/60">
            <Sparkles className="h-3 w-3" />
            <span>Créatif & sécurisé</span>
          </div>
          <CardTitle className="text-3xl font-semibold sm:text-4xl">Votre studio de rédaction</CardTitle>
          <p className="max-w-2xl text-sm text-white/60">
            Rédigez vos scripts, fiches ou briefs directement dans Beyond LMS. Sauvegardez vos brouillons, partagez-les à un formateur quand vous êtes prêt, restez concentré sur votre progression sans changer d&apos;outil.
          </p>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Button
            asChild
            className="rounded-full bg-gradient-to-r from-[#00C6FF] to-[#0072FF] px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-white hover:opacity-90"
          >
            <Link href="/dashboard/drive/new">Nouveau fichier</Link>
          </Button>
          <Badge variant="secondary" className="rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.3em] text-white/60">
            Stockage illimité
          </Badge>
          <Badge variant="secondary" className="rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.3em] text-white/60">
            Sauvegarde automatique
          </Badge>
        </CardContent>
      </Card>

      <Tabs value={activeFilter} onValueChange={(value) => setActiveFilter(value as typeof activeFilter)}>
        <TabsList className="bg-white/5">
          {FILTERS.map((filter) => (
            <TabsTrigger key={filter.key} value={filter.key} className="uppercase tracking-[0.25em]">
              {filter.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {FILTERS.map((filter) => {
          // Filtrer selon le filtre actif
          const filtered = filter.key === "all" 
            ? filteredDocuments 
            : filteredDocuments.filter((doc) => doc.status === filter.key);

          // Grouper par dossier (Consignes vs autres) dans le filtre actif
          const consignesDocs = filtered.filter((doc) => doc.consigneId || doc.folderId);
          const otherDocs = filtered.filter((doc) => !doc.consigneId && !doc.folderId);

          return (
            <TabsContent key={filter.key} value={filter.key} className="outline-none space-y-6">
              {/* Section Consignes */}
              {consignesDocs.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-[#00C6FF]" />
                    <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-white/80">
                      Consignes
                    </h3>
                  </div>
                  <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {consignesDocs.map((doc) => (
                      <DocumentCard key={doc.id} document={doc} onToggleShare={toggleShare} onSave={updateDocument} />
                    ))}
                  </div>
                </div>
              )}

              {/* Section Mes documents */}
              {otherDocs.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-white/40" />
                    <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-white/60">
                      Mes documents
                    </h3>
                  </div>
                  <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {otherDocs.map((doc) => (
                      <DocumentCard key={doc.id} document={doc} onToggleShare={toggleShare} onSave={updateDocument} />
                    ))}
                  </div>
                </div>
              )}

              {/* Message vide */}
              {filtered.length === 0 && (
                <Card className="col-span-full border-dashed border-white/20 bg-transparent text-white/50">
                  <CardContent className="flex h-40 flex-col items-center justify-center text-center text-sm">
                    <p>Aucun document dans cette section.</p>
                    <p className="text-xs text-white/40">Créez-en un nouveau pour démarrer.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}

function DocumentCard({
  document,
  onToggleShare,
  onSave,
}: {
  document: DriveDocument;
  onToggleShare: (id: string) => void;
  onSave: (id: string, changes: Partial<DriveDocument>) => void;
}) {
  const [openEditor, setOpenEditor] = useState(false);
  const [titleDraft, setTitleDraft] = useState(document.title);
  const [contentDraft, setContentDraft] = useState(document.content);

  const isShared = document.status === "shared";

  const handleOpen = (value: boolean) => {
    setOpenEditor(value);
    if (value) {
      setTitleDraft(document.title);
      setContentDraft(document.content);
    }
  };

  const handleSave = () => {
    onSave(document.id, { title: titleDraft, content: contentDraft });
    setOpenEditor(false);
  };

  return (
    <Card className="flex h-full flex-col justify-between border-white/10 bg-white/5 text-white">
      <CardHeader className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-white/10 p-2">
            <FileText className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold">{document.title}</CardTitle>
            <p className="text-xs uppercase tracking-[0.25em] text-white/50">
              Mis à jour {formatDistanceToNow(document.updatedAt, { addSuffix: true, locale: fr })}
            </p>
          </div>
        </div>
        <Badge className={cn(
          "w-fit rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.35em]",
          isShared ? "bg-emerald-500/20 text-emerald-200" : "bg-white/10 text-white/60",
        )}
        >
          {isShared ? "Partagé" : "Brouillon"}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-white/70">
        <p className="line-clamp-3 leading-6">{document.content || "Contenu vide pour le moment."}</p>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="ghost"
            className="rounded-full border border-white/20 px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/80 hover:border-white/40 hover:text-white"
            onClick={() => handleOpen(true)}
          >
            {isShared ? "Consulter" : "Modifier"}
          </Button>
          <Button
            variant="ghost"
            onClick={async () => {
              try {
                await onToggleShare(document.id);
              } catch (error) {
                console.error("[DocumentCard] Error toggling share:", error);
              }
            }}
            className={cn(
              "rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition",
              isShared
                ? "border border-white/20 text-white/70 hover:border-white/40 hover:text-white"
                : "border border-emerald-400/40 text-emerald-200 hover:border-emerald-300 hover:text-emerald-100",
            )}
          >
            {isShared ? (
              <span className="inline-flex items-center gap-2"><Lock className="h-3.5 w-3.5" /> Retirer le partage</span>
            ) : (
              <span className="inline-flex items-center gap-2"><Share2 className="h-3.5 w-3.5" /> Partager</span>
            )}
          </Button>
        </div>
      </CardContent>

      <Dialog open={openEditor} onOpenChange={handleOpen}>
        <DialogContent className="max-w-4xl border-white/15 bg-[#0B0B0B] text-white">
          <DialogHeader>
            <DialogTitle>{isShared ? "Lecture du document" : "Éditer le document"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={`title-${document.id}`}>Titre</Label>
              <Input
                id={`title-${document.id}`}
                value={titleDraft}
                onChange={(event) => setTitleDraft(event.target.value)}
                disabled={isShared}
                className="border-white/20 bg-white/5 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`content-${document.id}`}>Contenu</Label>
              <Textarea
                id={`content-${document.id}`}
                value={contentDraft}
                onChange={(event) => setContentDraft(event.target.value)}
                disabled={isShared}
                rows={14}
                className="border-white/20 bg-white/5 text-white"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              className="rounded-full border border-white/20 px-6 py-2.5 text-xs uppercase tracking-[0.2em] text-white/70"
              onClick={() => handleOpen(false)}
            >
              Fermer
            </Button>
            {!isShared ? (
              <Button
                onClick={handleSave}
                className="rounded-full bg-gradient-to-r from-[#FF512F] to-[#DD2476] px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-white hover:opacity-90"
              >
                Sauvegarder
              </Button>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}


