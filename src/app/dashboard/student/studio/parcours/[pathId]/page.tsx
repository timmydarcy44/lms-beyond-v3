import Link from "next/link";
import { notFound } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getServerClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{ pathId: string }>;
};

type CompositionEntry = {
  id: string;
  title: string;
  status?: string | null;
  order: number;
};

type CombinedEntry = CompositionEntry & { kind: "course" | "test" | "resource" };

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(value);

const parseSnapshot = (snapshot: unknown): any => {
  if (!snapshot) {
    return null;
  }

  if (typeof snapshot === "string") {
    try {
      return JSON.parse(snapshot);
    } catch {
      return null;
    }
  }

  if (typeof snapshot === "object") {
    return snapshot;
  }

  return null;
};

export default async function FormateurPathPreviewPage({ params }: PageProps) {
  const { pathId } = await params;

  if (!pathId) {
    notFound();
  }

  const supabase = await getServerClient();
  if (!supabase) {
    notFound();
  }

  const { data: authData } = await supabase.auth.getUser();
  if (!authData?.user?.id) {
    notFound();
  }

  const { data: path, error: pathError } = await supabase
    .from("paths")
    .select("*")
    .eq("id", pathId)
    .single();

  if (pathError || !path) {
    notFound();
  }

  if (path.creator_id !== authData.user.id && path.owner_id !== authData.user.id) {
    notFound();
  }

  const snapshot = parseSnapshot(path.builder_snapshot);
  const title = snapshot?.title ?? path.title ?? "Parcours sans titre";
  const accroche =
    snapshot?.subtitle ??
    snapshot?.accroche ??
    snapshot?.heroSubtitle ??
    (path as any)?.accroche ??
    path.description ??
    "";
  const objective = snapshot?.objective ?? (path as any)?.objective ?? "";

  const pathPriceValue = (path as any)?.price;
  const normalizedPathPrice =
    typeof pathPriceValue === "number"
      ? pathPriceValue
      : typeof pathPriceValue === "string"
        ? Number.parseFloat(pathPriceValue)
        : null;

  const rawPrice =
    normalizedPathPrice ??
    (typeof snapshot?.price === "number"
      ? snapshot.price
      : typeof snapshot?.pricing?.amount === "number"
        ? snapshot.pricing.amount
        : typeof snapshot?.pricing?.price === "number"
          ? snapshot.pricing.price
          : typeof snapshot?.pricing?.amount === "string"
            ? Number.parseFloat(snapshot.pricing.amount)
            : typeof snapshot?.pricing?.price === "string"
              ? Number.parseFloat(snapshot.pricing.price)
              : null);

  const [coursesJoin, testsJoin, resourcesJoin] = await Promise.all([
    supabase
      .from("path_courses")
      .select("course_id, order")
      .eq("path_id", pathId)
      .order("order", { ascending: true }),
    supabase
      .from("path_tests")
      .select("test_id, order")
      .eq("path_id", pathId)
      .order("order", { ascending: true }),
    supabase
      .from("path_resources")
      .select("resource_id, order")
      .eq("path_id", pathId)
      .order("order", { ascending: true }),
  ]);

  const courseIds =
    coursesJoin.data?.map((item) => (item.course_id ? String(item.course_id) : null)).filter(Boolean) ??
    [];
  const testIds =
    testsJoin.data?.map((item) => (item.test_id ? String(item.test_id) : null)).filter(Boolean) ?? [];
  const resourceIds =
    resourcesJoin.data
      ?.map((item) => (item.resource_id ? String(item.resource_id) : null))
      .filter(Boolean) ?? [];

  const [coursesDetails, testsDetails, resourcesDetails] = await Promise.all([
    courseIds.length > 0
      ? supabase.from("courses").select("id, title, status").in("id", courseIds)
      : Promise.resolve({ data: [], error: null }),
    testIds.length > 0
      ? supabase.from("tests").select("id, title, status").in("id", testIds)
      : Promise.resolve({ data: [], error: null }),
    resourceIds.length > 0
      ? supabase.from("resources").select("id, title, status").in("id", resourceIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const courseMap = new Map(
    (coursesDetails.data ?? []).map((item) => [String(item.id), item.title ?? "Formation"]),
  );
  const testMap = new Map((testsDetails.data ?? []).map((item) => [String(item.id), item.title ?? "Test"]));
  const resourceMap = new Map(
    (resourcesDetails.data ?? []).map((item) => [String(item.id), item.title ?? "Ressource"]),
  );

  const orderedCourses: CompositionEntry[] =
    coursesJoin.data
      ?.map((item) => ({
        id: String(item.course_id),
        title: courseMap.get(String(item.course_id)) ?? "Formation",
        order: item.order ?? 0,
      }))
      .sort((a, b) => a.order - b.order) ?? [];

  const orderedTests: CompositionEntry[] =
    testsJoin.data
      ?.map((item) => ({
        id: String(item.test_id),
        title: testMap.get(String(item.test_id)) ?? "Évaluation",
        order: item.order ?? 0,
      }))
      .sort((a, b) => a.order - b.order) ?? [];

  const orderedResources: CompositionEntry[] =
    resourcesJoin.data
      ?.map((item) => ({
        id: String(item.resource_id),
        title: resourceMap.get(String(item.resource_id)) ?? "Ressource",
        order: item.order ?? 0,
      }))
      .sort((a, b) => a.order - b.order) ?? [];

  const combinedEntries: CombinedEntry[] = [
    ...orderedCourses.map((item) => ({ ...item, kind: "course" as const })),
    ...orderedTests.map((item) => ({ ...item, kind: "test" as const })),
    ...orderedResources.map((item) => ({ ...item, kind: "resource" as const })),
  ].sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order;
    const priority = { course: 0, test: 1, resource: 2 } as const;
    return priority[a.kind] - priority[b.kind];
  });

  return (
    <DashboardShell
      title="Aperçu du parcours apprenant"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard/student/studio" },
        { label: "Formateur", href: "/dashboard/student/studio" },
        { label: "Parcours", href: "/dashboard/student/studio/parcours" },
        { label: title },
      ]}
    >
      <div className="space-y-10">
        <Card className="border-white/6 bg-white/[0.02] text-white">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl font-semibold text-white">{title}</CardTitle>
            <p className="text-sm text-white/65">
              Voici comment l’apprenant vivra ce parcours, étape par étape.
            </p>
            {accroche ? (
              <p className="text-sm text-white/70">{accroche}</p>
            ) : (
              <p className="text-sm text-white/40">Aucune accroche renseignée.</p>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-5 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-5 shadow-sm shadow-black/20">
                <p className="text-xs uppercase tracking-[0.28em] text-white/45">Statut</p>
                <div className="mt-3">
                  <Badge
                    className="rounded-full border border-white/12 bg-white/[0.08] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-white/75"
                    variant="outline"
                  >
                    {path.status ?? "draft"}
                  </Badge>
                </div>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-5 shadow-sm shadow-black/20">
                <p className="text-xs uppercase tracking-[0.28em] text-white/45">Prix</p>
                <div className="mt-3 text-sm font-semibold text-white/80">
                  {typeof rawPrice === "number" && Number.isFinite(rawPrice)
                    ? formatCurrency(rawPrice)
                    : "Non défini"}
                </div>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-5 shadow-sm shadow-black/20">
                <p className="text-xs uppercase tracking-[0.28em] text-white/45">Identifiant</p>
                <div className="mt-3 text-sm font-semibold text-white/80">{path.id}</div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/8 bg-white/[0.035] p-6 shadow-sm shadow-black/20">
              <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-white/45">
                Objectif pédagogique
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-white/75">
                {objective || "Aucun objectif renseigné pour ce parcours pour le moment."}
              </p>
            </div>
          </CardContent>
        </Card>

        <section className="space-y-6 rounded-3xl border border-white/6 bg-white/[0.018] p-8 text-white shadow-sm shadow-black/25">
          <header className="space-y-2">
            <h2 className="text-lg font-semibold text-white">Séquençage du parcours</h2>
            <p className="text-sm text-white/60">
              L’apprenant progresse étape par étape. Chaque séquence se débloque automatiquement à mesure
              qu’il avance.
            </p>
          </header>

          {combinedEntries.length > 0 ? (
            <ol className="space-y-6">
              {combinedEntries.map((item, index) => {
                const stepNumber = index + 1;
                let stepLabel = `Étape ${stepNumber}`;
                if (index === 0) stepLabel = "Étape 1 – Démarrage";
                else if (index === 1) stepLabel = "Étape 2 – Progression";
                else if (index === 2) stepLabel = "Étape 3 – Consolidation";

                return (
                  <li
                    key={`${item.kind}-${item.id}-${index}`}
                    className="relative overflow-hidden rounded-3xl border border-white/8 bg-white/[0.04] px-6 py-5 shadow-sm shadow-black/20"
                  >
                    <div className="flex items-start gap-4">
                      <div className="mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-white/12 bg-white/[0.1] text-sm font-semibold text-white/80">
                        {stepNumber}
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/40">
                          {stepLabel}
                        </p>
                        <p className="text-base font-semibold text-white/90">{item.title}</p>
                        <p className="text-xs text-white/50">
                          Se débloque une fois l’étape précédente terminée.
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="rounded-2xl border border-white/8 bg-white/[0.035] px-6 py-5 text-sm text-white/60">
              Ce parcours n’a pas encore de séquençage défini.
            </p>
          )}
        </section>

        <section className="space-y-4 rounded-3xl border border-white/6 bg-white/[0.018] p-8 text-white shadow-sm shadow-black/20">
          <header className="space-y-2">
            <h2 className="text-lg font-semibold text-white">
              🧩 Scénarios pédagogiques (bientôt disponibles)
            </h2>
            <p className="text-sm text-white/60">
              Les scénarios permettent d’automatiser le parcours de l’apprenant selon ses actions :
              fin de formation, score à un test, inactivité, ouverture d’une ressource…
            </p>
          </header>

          <div className="space-y-2 rounded-2xl border border-white/6 bg-white/[0.02] p-6 text-white/70">
            <div className="flex items-center justify-between text-sm">
              <span>Quand la formation est terminée</span>
              <span className="text-white/55">→ ouvrir le test</span>
            </div>
            <Separator className="bg-white/8" />
            <div className="flex items-center justify-between text-sm">
              <span>Si score ≥ 80%</span>
              <span className="text-white/55">→ débloquer la ressource premium</span>
            </div>
            <Separator className="bg-white/8" />
            <div className="flex items-center justify-between text-sm">
              <span>Après 7 jours sans activité</span>
              <span className="text-white/55">→ envoyer un message</span>
            </div>
          </div>
        </section>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button
            asChild
            className="rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/30 transition hover:shadow-cyan-500/40 focus-visible:ring-2 focus-visible:ring-cyan-300"
          >
            <Link href={`/dashboard/student/studio/parcours/${path.id}/edit`}>Modifier le parcours</Link>
          </Button>
          <Button
            asChild
            className="rounded-full border border-white/12 px-6 py-3 text-sm font-semibold text-white/75 hover:text-white hover:border-white/20"
            variant="ghost"
          >
            <Link href={`/dashboard/student/studio/parcours/${path.id}/scenarios`}>Configurer des scénarios</Link>
          </Button>
        </div>
      </div>
    </DashboardShell>
  );
}


