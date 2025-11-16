import Image from "next/image";
import Link from "next/link";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Button } from "@/components/ui/button";
import { getApprenantDashboardData } from "@/lib/queries/apprenant";
import { ResourcePreviewButton } from "@/components/resources/resource-preview-button";

const RESOURCE_TABS = [
  { key: "guide", label: "Guides" },
  { key: "fiche", label: "Fiches d'apprentissage" },
  { key: "audio", label: "Audios" },
  { key: "video", label: "Vidéos" },
];

const guessResourceType = (title: string, meta?: string, explicit?: string) => {
  if (explicit) return explicit;
  const haystack = `${title} ${meta ?? ""}`.toLowerCase();
  if (haystack.includes("audio") || haystack.includes("podcast")) return "audio";
  if (haystack.includes("video") || haystack.includes("masterclass") || haystack.includes("replay")) return "video";
  if (haystack.includes("fiche") || haystack.includes("checklist") || haystack.includes("playbook")) return "fiche";
  if (haystack.includes("guide") || haystack.includes("ebook")) return "guide";
  return "guide";
};

export default async function LearnerResourcesPage() {
  const data = await getApprenantDashboardData();
  const resourcesByType = RESOURCE_TABS.reduce<Record<string, typeof data.ressources>>((acc, tab) => {
    acc[tab.key] = [];
    return acc;
  }, {} as Record<string, typeof data.ressources>);

  data.ressources.forEach((resource) => {
    const type = guessResourceType(resource.title, resource.meta, resource.contentType);
    resourcesByType[type] = [...(resourcesByType[type] ?? []), resource];
  });

  const firstResource = data.ressources[0];

  return (
    <DashboardShell
      title="Ressources"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard/apprenant" },
        { label: "Ressources" },
      ]}
    >
      <div className="space-y-12">
        {firstResource ? (
          <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <article className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#FF512F]/25 via-[#DD2476]/20 to-transparent p-8 shadow-[0_40px_120px_-40px_rgba(221,36,118,0.45)]">
              <div className="absolute inset-0">
                <div className="absolute inset-0 bg-gradient-to-br from-black/75 via-black/55 to-transparent" />
                {firstResource.image ? (
                  <Image
                    src={firstResource.image}
                    alt={firstResource.title}
                    fill
                    className="object-cover object-center opacity-60"
                    sizes="(min-width: 1024px) 60vw, 100vw"
                  />
                ) : null}
              </div>
              <div className="relative flex h-full flex-col justify-between gap-6">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white/80">
                    <span>Focus ressource</span>
                    <span className="h-1 w-1 rounded-full bg-white/70" />
                    <span>Timmy Darcy</span>
                  </div>
                  <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
                    {firstResource.title}
                  </h1>
                  {firstResource.meta ? (
                    <p className="text-sm text-white/75">{firstResource.meta}</p>
                  ) : null}
                  <p className="max-w-2xl text-base text-white/70">
                    Accédez immédiatement aux ressources premium pour scénariser vos sessions, prototyper vos rituels et
                    défendre vos projets face aux décisionnaires.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button
                    asChild
                    className="rounded-full bg-gradient-to-r from-[#FF512F] to-[#DD2476] px-6 text-xs font-semibold uppercase tracking-[0.35em] text-white hover:opacity-90"
                  >
                    <Link href={firstResource.href}>Ouvrir</Link>
                  </Button>
                  <Button
                    variant="ghost"
                    className="rounded-full border border-white/25 bg-white/10 px-6 text-xs font-semibold uppercase tracking-[0.35em] text-white/80 hover:border-white/40 hover:text-white"
                  >
                    Télécharger
                  </Button>
                </div>
              </div>
            </article>
            <aside className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6 text-white/75">
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">Comment utiliser</p>
              <ul className="space-y-3 text-sm">
                <li>Consultez en streaming ou téléchargez pour vos ateliers hors ligne.</li>
                <li>Ajoutez la ressource à votre playlist personnelle pour la retrouver rapidement.</li>
                <li>Partagez l&apos;usage dans la communauté pour améliorer vos scénarios.</li>
              </ul>
            </aside>
          </section>
        ) : null}

        {RESOURCE_TABS.map(({ key, label }) => {
          const items = resourcesByType[key];
          if (!items || items.length === 0) return null;
          return (
            <section key={key} className="space-y-6">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-2xl font-semibold text-white">{label}</h2>
                <Button
                  variant="ghost"
                  className="rounded-full border border-white/20 bg-transparent px-5 text-xs font-semibold uppercase tracking-[0.3em] text-white/70 hover:border-white/40 hover:text-white"
                >
                  Voir tout
                </Button>
              </div>
              <div className="grid gap-6 md:grid-cols-3 xl:grid-cols-4">
                {items.map((resource) => (
                  <article
                    key={resource.slug ?? resource.title}
                    className="group flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/5 transition duration-300 hover:border-white/30 hover:bg-white/10"
                  >
                    <div className="relative h-48 overflow-hidden">
                      {resource.image ? (
                        <Image
                          src={resource.image}
                          alt={resource.title}
                          fill
                          className="object-cover object-center transition duration-500 group-hover:scale-105"
                          sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 100vw"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#1E1E1E] via-[#252525] to-[#121212] text-white/40">
                          {label}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                    </div>
                    <div className="flex flex-1 flex-col gap-3 p-4">
                      <div className="space-y-1">
                        <h3 className="text-base font-semibold text-white">{resource.title}</h3>
                        {resource.meta ? (
                          <p className="text-xs uppercase tracking-[0.3em] text-white/50">{resource.meta}</p>
                        ) : null}
                      </div>
                      <div className="mt-auto grid grid-cols-2 gap-3">
                        <ResourcePreviewButton
                          title={resource.title}
                          contentType={guessResourceType(resource.title, resource.meta, resource.contentType)}
                          contentUrl={resource.contentUrl}
                        />
                        <Button
                          asChild
                          variant="outline"
                          className="rounded-full border-white/25 bg-white/5 px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-white/70 hover:border-white/40 hover:text-white"
                        >
                          <a href={resource.downloadUrl ?? resource.contentUrl ?? resource.href} target="_blank" rel="noreferrer">
                            Télécharger
                          </a>
                        </Button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </DashboardShell>
  );
}
