"use client";

import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { useState } from "react";
import { toast } from "sonner";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { type FormateurContentLibrary } from "@/lib/queries/formateur";

const typeStyles: Record<string, { label: string; tone: string }> = {
  guide: { label: "PDF", tone: "bg-white/10 text-white/80" },
  fiche: { label: "PDF", tone: "bg-white/10 text-white/80" },
  document: { label: "PDF", tone: "bg-white/10 text-white/80" },
  pdf: { label: "PDF", tone: "bg-white/10 text-white/80" },
  video: { label: "Vidéo", tone: "bg-sky-500/20 text-sky-100" },
  audio: { label: "Audio", tone: "bg-emerald-500/20 text-emerald-100" },
};

const statusTone: Record<string, string> = {
  published: "text-emerald-200",
  draft: "text-white/60",
};

const defaultCover = "https://images.unsplash.com/photo-1498050108023-6c3b1d94f18b?auto=format&fit=crop&w=1200&q=80";

type RessourcesPageClientProps = {
  initialResources: FormateurContentLibrary["resources"];
};

export function RessourcesPageClient({ initialResources }: RessourcesPageClientProps) {
  const [resources, setResources] = useState(initialResources);
  const [publishingIds, setPublishingIds] = useState<Set<string>>(new Set());

  const handlePublish = async (resourceId: string, currentPublished: boolean) => {
    const newPublished = !currentPublished;
    console.log("[ressources] Publication demandée:", { resourceId, newPublished, currentPublished });
    setPublishingIds((prev) => new Set(prev).add(resourceId));

    try {
      const response = await fetch("/api/resources", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resourceId,
          published: newPublished,
        }),
      });

      console.log("[ressources] Réponse API:", { ok: response.ok, status: response.status });

      const data = await response.json();
      console.log("[ressources] Données reçues:", data);

      if (!response.ok) {
        console.error("[ressources] Erreur API:", data);
        throw new Error(data.error || data.details || "Erreur lors de la publication");
      }

      // Mettre à jour l'état local
      setResources((prev) =>
        prev.map((resource) =>
          resource.id === resourceId
            ? { ...resource, published: newPublished, status: newPublished ? "published" : "draft" }
            : resource
        )
      );

      toast.success(newPublished ? "Ressource publiée !" : "Ressource retirée de la publication");
    } catch (error) {
      console.error("[ressources] Erreur lors de la publication:", error);
      toast.error("Erreur", {
        description: error instanceof Error ? error.message : "Une erreur est survenue lors de la publication.",
      });
    } finally {
      setPublishingIds((prev) => {
        const next = new Set(prev);
        next.delete(resourceId);
        return next;
      });
    }
  };

  return (
    <DashboardShell
      title="Ressources formateur"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard/formateur" },
        { label: "Formateur", href: "/dashboard/formateur" },
        { label: "Ressources" },
      ]}
    >
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-white md:text-3xl">Bibliothèque propriétaire</h1>
          <p className="max-w-3xl text-sm text-white/70">
            Centralisez vos supports premium (PDF, vidéos, audios) pour les intégrer facilement dans vos formations et parcours.
            Toutes les ressources déposées sont automatiquement datées et attribuées à votre compte.
          </p>
        </div>
        <Button
          asChild
          className="rounded-full bg-gradient-to-r from-[#00C6FF] to-[#0072FF] px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white"
        >
          <Link href="/dashboard/formateur/ressources/new">Ajouter une ressource</Link>
        </Button>
      </section>

      <Card className="border-white/10 bg-white/5 text-white">
        <CardHeader>
          <CardTitle className="text-sm font-semibold uppercase tracking-[0.3em] text-white/50">
            {resources.length} ressources disponibles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {resources.map((resource) => {
              const typeStyle = typeStyles[resource.type] ?? { label: resource.type ?? "Ressource", tone: "bg-white/10 text-white/80" };
              const isPublished = (resource as any).published || resource.status === "published";
              const statusClass = statusTone[resource.status] ?? "text-white/60";
              return (
                <article
                  key={resource.id}
                  className="group flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#101828]/80 via-[#0b1120]/80 to-[#020617]/90"
                >
                  <div className="relative h-48 w-full overflow-hidden">
                    <Image
                      src={resource.thumbnail ?? defaultCover}
                      alt={resource.title}
                      fill
                      className="object-cover transition duration-500 group-hover:scale-105 group-hover:saturate-125"
                      sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                    <div className="absolute left-4 right-4 top-4 flex items-center justify-between">
                      <Badge className={cn("rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.3em]", typeStyle.tone)}>
                        {typeStyle.label}
                      </Badge>
                      <span className="text-xs uppercase tracking-[0.3em] text-white/70">
                        {formatDistanceToNow(new Date((resource as any).updatedAt ?? Date.now()), { addSuffix: true, locale: fr })}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col gap-4 px-6 py-5">
                    <div className="space-y-2">
                      <h2 className="text-lg font-semibold text-white line-clamp-2">{resource.title}</h2>
                      <p className="text-sm text-white/60 line-clamp-3">{(resource as any).description ?? "Description en cours de rédaction."}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-white/50">
                      <span className="rounded-full border border-white/15 px-3 py-1">
                        Statut · <span className={statusClass}>{isPublished ? "publié" : "brouillon"}</span>
                      </span>
                      <span className="rounded-full border border-white/15 px-3 py-1">Type · {typeStyle.label}</span>
                      <span className="rounded-full border border-white/15 px-3 py-1">Auteur · Vous</span>
                    </div>
                    <div className="mt-auto flex flex-wrap gap-3">
                      <Button className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white hover:bg-white/20">
                        Configurer (bientôt)
                      </Button>
                      <Button
                        onClick={() => handlePublish(resource.id, isPublished)}
                        disabled={publishingIds.has(resource.id)}
                        className={cn(
                          "rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white",
                          isPublished
                            ? "bg-white/10 hover:bg-white/20"
                            : "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                        )}
                      >
                        {publishingIds.has(resource.id)
                          ? "Publication..."
                          : isPublished
                            ? "Dépublier"
                            : "Publier"}
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {resources.length === 0 ? (
        <Card className="border-white/10 bg-white/5 text-white">
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="text-lg font-semibold">Vous n'avez pas encore de ressources</p>
            <p className="text-sm text-white/60">
              Importez vos supports pédagogiques pour les partager dans vos formations et parcours.
            </p>
            <Button
              asChild
              className="rounded-full bg-gradient-to-r from-[#00C6FF] to-[#0072FF] px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white"
            >
              <Link href="/dashboard/formateur/ressources/new">Ajouter une ressource</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </DashboardShell>
  );
}

