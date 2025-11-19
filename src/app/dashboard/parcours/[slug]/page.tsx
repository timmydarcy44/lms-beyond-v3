import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getApprenantDashboardData, getLearnerPathDetail } from "@/lib/queries/apprenant";
import type { LearnerCard } from "@/lib/queries/apprenant";
import { PathContentDebug } from "@/components/apprenant/path-content-debug";
import { getServerClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { LearningSessionTracker } from "@/components/learning-session-tracker";

type ColumnItem = {
  title: string;
  href: string;
  meta: string;
  progress: number;
  accent: "formations" | "tests" | "ressources";
};

const gradients: Record<ColumnItem["accent"], string> = {
  formations: "from-[#FF512F]/18 via-[#DD2476]/10 to-transparent",
  tests: "from-[#00C6FF]/18 via-[#0072FF]/10 to-transparent",
  ressources: "from-[#8E2DE2]/18 via-[#4A00E0]/10 to-transparent",
};

const accentHeader: Record<ColumnItem["accent"], string> = {
  formations: "text-[#FF7A45]",
  tests: "text-[#3BA0FF]",
  ressources: "text-[#B388FF]",
};

const accentBorder: Record<ColumnItem["accent"], string> = {
  formations: "border-[#FF512F]/40",
  tests: "border-[#00C6FF]/40",
  ressources: "border-[#8E2DE2]/40",
};

const progressGradient: Record<ColumnItem["accent"], string> = {
  formations: "from-[#FF6A3A] via-[#DD2476] to-[#FF9A44]",
  tests: "from-[#00C6FF] via-[#0072FF] to-[#40A1FF]",
  ressources: "from-[#8E2DE2] via-[#C471ED] to-[#4A00E0]",
};

const clampProgress = (value: number) => Math.min(100, Math.max(0, Math.round(value)));

const buildColumnItems = (cards: LearnerCard[], accent: ColumnItem["accent"], fallbackMeta: string): ColumnItem[] =>
  cards.slice(0, 4).map((card) => ({
    title: card.title,
    href: (card as any).href || `/dashboard/parcours/${card.slug}`,
    meta: card.meta ?? fallbackMeta,
    progress: clampProgress(card.progress ?? 0),
    accent,
  }));

export default async function LearnerParcoursDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const resolvedSlug = await slug;
  
  console.log("[apprenant] Parcours detail page - slug:", resolvedSlug);
  
  const data = await getApprenantDashboardData();
  console.log("[apprenant] Available parcours:", data.parcours.map(p => ({ id: p.id, slug: p.slug, title: p.title })));

  const parcoursCard = data.parcours.find((item) => item.slug === resolvedSlug);
  if (!parcoursCard) {
    console.error("[apprenant] Parcours not found for slug:", resolvedSlug);
    notFound();
  }

  console.log("[apprenant] Found parcours card:", {
    id: parcoursCard.id,
    title: parcoursCard.title,
    slug: parcoursCard.slug,
  });

  // Extraire l'ID du parcours depuis le card
  // Le card contient l'ID dans son champ id (récupéré depuis path_progress)
  let pathId = parcoursCard.id;
  console.log("[apprenant] Initial pathId from card:", pathId);

  // Si l'ID n'est pas dans le card, le récupérer depuis la base
  if (!pathId) {
    const supabase = await getServerClient();
    if (supabase) {
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user?.id) {
        // Récupérer le path_id depuis path_progress en utilisant le titre
        const { data: pathProgress } = await supabase
          .from("path_progress")
          .select("path_id")
          .eq("user_id", authData.user.id)
          .single();
        
        if (pathProgress) {
          pathId = pathProgress.path_id;
        } else {
          // Alternative: chercher directement dans paths par le titre
          const { data: path } = await supabase
            .from("paths")
            .select("id")
            .eq("title", parcoursCard.title)
            .eq("status", "published")
            .single();
          
          if (path) {
            pathId = path.id;
          }
        }
      }
    }
  }

  // Récupérer les contenus spécifiques du parcours
  let pathContent = null;
  if (pathId) {
    console.log("[apprenant] Fetching path detail for pathId:", pathId);
    pathContent = await getLearnerPathDetail(pathId);
    console.log("[apprenant] Path content retrieved:", {
      courses: pathContent?.courses.length ?? 0,
      tests: pathContent?.tests.length ?? 0,
      resources: pathContent?.resources.length ?? 0,
      pathContent: pathContent, // Log complet pour debug
    });
  } else {
    console.warn("[apprenant] No pathId found for parcours:", {
      title: parcoursCard.title,
      id: parcoursCard.id,
      slug: parcoursCard.slug,
    });
  }

  // Utiliser les contenus du parcours si disponibles
  // Important : ne pas fallback sur les contenus généraux si pathContent existe mais est vide
  // Cela permet de distinguer "aucun contenu associé" de "erreur de récupération"
  console.log("[apprenant] Building content items from pathContent:", {
    pathContentExists: !!pathContent,
    coursesCount: pathContent?.courses.length ?? 0,
    testsCount: pathContent?.tests.length ?? 0,
    resourcesCount: pathContent?.resources.length ?? 0,
  });

  const formationItems = pathContent && pathContent.courses.length > 0
    ? pathContent.courses.map((course) => ({
      title: course.title,
      href: (course as any).href || `/catalog/formations/${course.slug}`,
      meta: "Formation en ligne",
      progress: 0, // TODO: récupérer la progression depuis course_progress
      accent: "formations" as const,
    }))
    : [];

  const testItems = pathContent && pathContent.tests.length > 0
    ? pathContent.tests.map((test) => ({
      title: test.title,
      href: (test as any).href || `/catalog/tests/${test.slug}`,
      meta: (test as any).description || "Évaluation",
      progress: 0, // TODO: récupérer la progression depuis test_attempts
      accent: "tests" as const,
    }))
    : [];

  const resourceItems = pathContent && pathContent.resources.length > 0
    ? pathContent.resources.map((resource) => ({
      title: resource.title,
      href: (resource as any).href || `/catalog/ressources/${resource.slug}`,
      meta: (resource as any).type ? `Ressource ${(resource as any).type}` : "Ressource complémentaire",
      progress: 0, // TODO: récupérer la progression depuis resource_views
      accent: "ressources" as const,
    }))
    : [];

  console.log("[apprenant] Final items count:", {
    formations: formationItems.length,
    tests: testItems.length,
    resources: resourceItems.length,
  });

  const heroCover = parcoursCard.image;

  // Utiliser pathId si disponible, sinon utiliser parcoursCard.id
  const trackingPathId = pathId || parcoursCard.id;

  return (
    <LearningSessionTracker
      contentType="path"
      contentId={trackingPathId}
      showIndicator={false}
    >
      <DashboardShell
        title={parcoursCard.title}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard/apprenant" },
          { label: "Parcours", href: "/dashboard/parcours" },
          { label: parcoursCard.title },
        ]}
        initialCollapsed
      >
      <div className="space-y-12">
        <PathContentDebug pathContent={pathContent} />
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <article className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#1d4ed8]/30 via-[#0f172a]/70 to-transparent p-8 shadow-[0_40px_120px_-40px_rgba(29,78,216,0.45)]">
            <div className="absolute inset-0">
              <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/55 to-transparent" />
              {heroCover && (
                <Image
                  src={heroCover}
                  alt={parcoursCard.title}
                  fill
                  className="object-cover object-center opacity-60"
                  sizes="(min-width: 1024px) 60vw, 100vw"
                />
              )}
            </div>

            <div className="relative flex h-full flex-col justify-between gap-8">
              <div className="space-y-4">
                {(parcoursCard as any).badge ? (
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white/80">
                    <span>{(parcoursCard as any).badge}</span>
                  </div>
                ) : null}
                <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">{parcoursCard.title}</h1>
                <p className="max-w-2xl text-base text-white/75">
                  Consultez la présentation du programme, les formations à suivre, les évaluations et les ressources à mobiliser
                  pour valider ce parcours.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  asChild
                  className="rounded-full bg-gradient-to-r from-[#00C6FF] to-[#0072FF] px-6 text-xs font-semibold uppercase tracking-[0.35em] text-white hover:opacity-90"
                >
                  <Link href="#composition">Voir les contenus</Link>
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  className="rounded-full border border-white/25 bg-white/10 px-6 text-xs font-semibold uppercase tracking-[0.35em] text-white/80 hover:border-white/40 hover:text-white"
                >
                  <Link href={parcoursCard.href}>Reprendre le parcours</Link>
                </Button>
              </div>
            </div>
          </article>

          <aside className="flex flex-col gap-4 overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-white/55">Informations clés</p>
            <ul className="space-y-3 text-sm text-white/75">
              <li className="flex items-start gap-3">
                <span className="mt-1 block h-2 w-2 rounded-full bg-sky-400" />
                <span>Nombre de formations&nbsp;: {formationItems.length}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 block h-2 w-2 rounded-full bg-blue-400" />
                <span>Tests de validation&nbsp;: {testItems.length}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 block h-2 w-2 rounded-full bg-indigo-400" />
                <span>Ressources associées&nbsp;: {resourceItems.length}</span>
              </li>
            </ul>
            <div className="mt-auto rounded-2xl border border-white/15 bg-white/5 p-4 text-sm text-white/70">
              <p className="font-semibold text-white">Badge à l’issue</p>
              <p className="mt-1 text-white/60">Un badge de complétion est obtenu lorsque toutes les formations et tests sont validés.</p>
            </div>
          </aside>
        </section>

        <section id="composition" className="space-y-12">
          <header className="space-y-2">
            <h2 className="text-2xl font-semibold text-white">Composition du parcours</h2>
            <p className="text-sm text-white/55">Accédez aux formations, tests et ressources inclus dans ce programme.</p>
          </header>

          <div className="space-y-12">
            {formationItems.length > 0 && renderContentSection("Formations", "formations", formationItems)}
            {testItems.length > 0 && renderContentSection("Tests", "tests", testItems)}
            {resourceItems.length > 0 && renderContentSection("Ressources", "ressources", resourceItems)}
          </div>
        </section>
      </div>
    </DashboardShell>
    </LearningSessionTracker>
  );
}

function renderContentSection(title: string, accent: ColumnItem["accent"], items: ColumnItem[]) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className={cn("text-xl font-semibold", accentHeader[accent])}>{title}</h3>
          <Badge className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-white/60">
            {items.length} {items.length === 1 ? 'élément' : 'éléments'}
          </Badge>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <Link
            key={`${title}-${item.title}`}
            href={item.href}
            className="group"
          >
            <Card className={cn(
              "h-full overflow-hidden border transition duration-300",
              accentBorder[accent],
              "bg-gradient-to-br from-black/40 via-black/20 to-transparent",
              "hover:border-white/40 hover:shadow-lg hover:shadow-black/20"
            )}>
              <div className="relative h-48 w-full overflow-hidden">
                <div className={cn(
                  "absolute inset-0 bg-gradient-to-br opacity-60",
                  accent === "formations" && "from-[#FF512F]/30 via-[#DD2476]/20 to-transparent",
                  accent === "tests" && "from-[#00C6FF]/30 via-[#0072FF]/20 to-transparent",
                  accent === "ressources" && "from-[#8E2DE2]/30 via-[#4A00E0]/20 to-transparent",
                )} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-white line-clamp-2 group-hover:text-white/90 transition">
                        {item.title}
                      </h4>
                      <p className="mt-1 text-xs uppercase tracking-[0.3em] text-white/60">
                        {item.meta}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <CardContent className="p-5 space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-white/60">
                    <span>Progression</span>
                    <span className="font-semibold text-white/80">{item.progress}%</span>
                  </div>
                  <div className="relative h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className={cn(
                        "absolute inset-y-0 left-0 rounded-full transition-all duration-500",
                        `bg-gradient-to-r ${progressGradient[accent]}`
                      )}
                      style={{ width: `${clampProgress(item.progress)}%` }}
                    />
                  </div>
                </div>
                
                <div className="pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "w-full rounded-full border text-xs font-semibold uppercase tracking-[0.3em] transition",
                      accent === "formations" && "border-[#FF512F]/40 text-[#FF7A45] hover:border-[#FF512F]/60 hover:bg-[#FF512F]/10",
                      accent === "tests" && "border-[#00C6FF]/40 text-[#3BA0FF] hover:border-[#00C6FF]/60 hover:bg-[#00C6FF]/10",
                      accent === "ressources" && "border-[#8E2DE2]/40 text-[#B388FF] hover:border-[#8E2DE2]/60 hover:bg-[#8E2DE2]/10",
                    )}
                  >
                    Accéder
                  </Button>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}


