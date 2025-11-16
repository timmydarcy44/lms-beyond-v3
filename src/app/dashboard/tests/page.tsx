import Image from "next/image";
import Link from "next/link";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { SectionSlider } from "@/components/dashboard/section-slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getApprenantDashboardData } from "@/lib/queries/apprenant";

import LatestTestResults from "./latest-results";

const FOCUS_TAGS = [
  { label: "Diagnostic", keywords: ["diagnostic", "assessment", "évaluation", "score"] },
  { label: "Neurosciences", keywords: ["neuro", "neurosciences", "cerveau", "attention"] },
  { label: "Expérience", keywords: ["design", "experience", "emotion", "engagement"] },
];

const matchKeywords = (title: string, keywords: string[]) => {
  const haystack = title.toLowerCase();
  return keywords.some((keyword) => haystack.includes(keyword));
};

export default async function LearnerTestsPage() {
  const data = await getApprenantDashboardData();
  const tests = data.tests.map((card) => ({
    ...card,
    href: `/dashboard/tests/${card.slug}`,
  }));

  const spotlight = tests[0];
  const secondary = tests.slice(1, 4);
  const recommended = tests.slice(0, 8);
  const exampleSlug = spotlight?.slug ?? tests[0]?.slug ?? "";

  const focusGroups = FOCUS_TAGS.map((tag) => {
    const matches = tests.filter((card) => matchKeywords(card.title, tag.keywords));
    return {
      label: tag.label,
      cards: matches.length ? matches : recommended,
    };
  });

  return (
    <DashboardShell
      title="Tests"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard/apprenant" },
        { label: "Tests" },
      ]}
    >
      <div className="space-y-12">
        {spotlight ? (
          <section className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
            <article className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#1C1C1C] via-[#101010] to-[#050505] p-10 shadow-[0_60px_140px_-60px_rgba(0,114,255,0.55)]">
              <div className="absolute inset-0">
                <div className="absolute inset-0 bg-gradient-to-br from-black/75 via-black/50 to-transparent" />
                {spotlight.image ? (
                  <Image
                    src={spotlight.image}
                    alt={spotlight.title}
                    fill
                    className="object-cover object-center opacity-40"
                    sizes="(min-width: 1024px) 60vw, 100vw"
                  />
                ) : null}
              </div>

              <div className="relative flex h-full flex-col justify-between gap-12">
                <div className="space-y-4">
                  <Badge className="w-fit rounded-full bg-gradient-to-r from-[#00C6FF] to-[#0072FF] px-4 py-1 text-[10px] uppercase tracking-[0.35em] text-white">
                    Test du moment
                  </Badge>
                  <h1 className="text-3xl font-semibold leading-tight text-white md:text-4xl">
                    {spotlight.title}
                  </h1>
                  {spotlight.meta ? <p className="text-sm text-white/70">{spotlight.meta}</p> : null}
                  <p className="max-w-2xl text-base text-white/70">
                    Explorez votre profil pédagogique avec une expérience immersive inspirée de Typeform : transitions fluides, focus plein écran, feedback immédiat. Chaque réponse nourrit votre tableau de bord personnel.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    asChild
                    className="rounded-full bg-gradient-to-r from-[#FF512F] to-[#DD2476] px-6 text-xs font-semibold uppercase tracking-[0.35em] text-white hover:opacity-90"
                  >
                    <Link href={spotlight.href}>Démarrer le test</Link>
                  </Button>
                  <Button
                    variant="ghost"
                    asChild
                    className="rounded-full border border-white/25 bg-white/10 px-6 text-xs font-semibold uppercase tracking-[0.35em] text-white/80 hover:border-white/40 hover:text-white"
                  >
                    <Link href="/dashboard/drive">Prendre des notes</Link>
                  </Button>
                </div>
              </div>
            </article>

            <aside className="space-y-4">
              {secondary.map((item) => (
                <Link
                  key={item.slug}
                  href={item.href}
                  className="group flex min-h-[150px] flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-5 transition duration-300 hover:border-white/30 hover:bg-white/10"
                >
                  <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.35em] text-white/40">
                    <span>Flash</span>
                    <span>{item.meta ?? "Eval"}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-white group-hover:text-white">{item.title}</h3>
                  <p className="text-xs text-white/50">Interface ping immersive • Résultat immédiat</p>
                </Link>
              ))}
            </aside>
          </section>
        ) : null}

        <LatestTestResults />

        <SectionSlider title="Tests recommandés" cards={recommended} accent="learner" />

        <div className="space-y-8">
          {focusGroups.map((group) => (
            <SectionSlider key={group.label} title={`Focus ${group.label}`} cards={group.cards} accent="learner" />
          ))}
        </div>

        <Card className="overflow-hidden border-white/10 bg-gradient-to-r from-[#1E2A78] via-[#2C0F73] to-[#4A00E0] text-white">
          <CardContent className="flex flex-col gap-6 p-8 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl space-y-2">
              <p className="text-xs uppercase tracking-[0.35em] text-white/60">Pro tip</p>
              <h2 className="text-2xl font-semibold">Vos scores alimentent les tableaux de bord formateur, admin et tuteur</h2>
              <p className="text-sm text-white/80">
                Chaque test complété sera bientôt synchronisé avec Supabase. Vous pourrez le retrouver dans votre futur espace "Mon compte" ainsi que dans les dashboards des accompagnants pour piloter l&apos;expérience apprenant.
              </p>
            </div>
            {exampleSlug ? (
              <Button
                asChild
                className="rounded-full bg-white px-6 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-[#4A00E0]"
              >
                <Link href={`/dashboard/tests/${exampleSlug}`}>Voir un exemple</Link>
              </Button>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}

