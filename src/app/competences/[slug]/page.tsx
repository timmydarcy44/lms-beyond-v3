import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgePublicShell } from "@/components/openbadges/badge-public-shell";
import { readCompetencies } from "@/lib/openbadges/badge-builder";
import { listLibraryCompetencies } from "@/lib/openbadges/competency-library";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ slug: string }> };

async function loadCompetency(slug: string) {
  const library = await listLibraryCompetencies();
  let competency = library.find((item) => item.slug === slug && !item.archivedAt) ?? null;
  const supabase = getServiceRoleClient();
  const certifying: Array<{ id: string; name: string }> = [];
  if (supabase) {
    const { data } = await supabase.from("open_badges").select("id, name, title, status, evaluation_config").limit(400);
    for (const row of data ?? []) {
      const config = row.evaluation_config && typeof row.evaluation_config === "object" ? row.evaluation_config as Record<string, unknown> : {};
      const builder = config.builder && typeof config.builder === "object" ? config.builder as { competencies?: unknown; skills?: unknown } : {};
      const hit = readCompetencies(builder).find((item) => item.slug === slug);
      if (!hit) continue;
      competency = competency ?? hit;
      if (String(row.status ?? "").toLowerCase() === "active") {
        certifying.push({ id: String(row.id), name: String(row.name ?? row.title ?? "Badge") });
      }
    }
  }
  return { competency, certifying };
}

export async function generateMetadata({ params }: RouteParams): Promise<Metadata> {
  const { slug } = await params;
  const { competency } = await loadCompetency(slug);
  return { title: competency ? `${competency.name} · Compétence Byound` : "Compétence Byound" };
}

export default async function CompetencyPage({ params }: RouteParams) {
  const { slug } = await params;
  const { competency, certifying } = await loadCompetency(slug);
  if (!competency || competency.status !== "validated") notFound();

  return (
    <BadgePublicShell>
      <main className="mx-auto max-w-3xl px-5 py-16 sm:px-8">
        <p className="text-sm text-white/60">Référentiel de compétences Byound</p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-0.04em]">{competency.name}</h1>
        <p className="mt-6 text-lg leading-relaxed text-white/80">{competency.definition}</p>
        <p className="mt-6 text-sm text-white/60">
          Validée par {competency.validatedBy || "Byound"}
          {competency.validatedAt ? ` · ${new Date(competency.validatedAt).toLocaleDateString("fr-FR")}` : ""}
        </p>
        <section className="mt-10">
          <h2 className="text-xl font-semibold">Badges qui la certifient</h2>
          {certifying.length === 0 ? (
            <p className="mt-3 text-sm text-white/60">Aucun badge publié ne certifie encore cette compétence.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {certifying.map((badge) => (
                <li key={badge.id}>
                  <Link href={`/badgeclasses/${badge.id}`} className="text-[#C4B5FD] underline">{badge.name}</Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </BadgePublicShell>
  );
}
