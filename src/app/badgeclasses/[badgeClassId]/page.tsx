import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadPublicBadgeClass } from "@/lib/openbadges/public-badge-class";
import { getServiceRoleClient } from "@/lib/supabase/server";

type RouteParams = { params: Promise<{ badgeClassId: string }> };

export async function generateMetadata({ params }: RouteParams): Promise<Metadata> {
  const { badgeClassId } = await params;
  const badge = await loadPublicBadgeClass(badgeClassId);
  if (!badge) return { title: "Badge introuvable | Byound" };
  return { title: `${badge.name} | Byound`, description: badge.description };
}

export default async function BadgeClassPage({ params }: RouteParams) {
  const { badgeClassId } = await params;
  const badge = await loadPublicBadgeClass(badgeClassId);
  if (!badge) notFound();

  const db = getServiceRoleClient();
  const { count } = db
    ? await db
        .from("badge_assertions")
        .select("id", { count: "exact", head: true })
        .eq("badge_class_id", badge.id)
        .eq("is_public", true)
        .is("revoked_at", null)
    : { count: 0 };

  return (
    <main className="min-h-screen bg-[#050608] px-6 py-16 text-[#F2F2F4]">
      <article className="mx-auto max-w-3xl space-y-8">
        <p className="text-sm text-[#A99BFF]">Open Badge Byound</p>
        <h1 className="text-4xl font-semibold tracking-tight">{badge.name}</h1>
        {badge.description ? <p className="text-lg text-white/80">{badge.description}</p> : null}
        {typeof count === "number" && count > 0 ? (
          <p className="text-sm text-white/60">
            {count} {count > 1 ? "personnes l'ont obtenu" : "personne l'a obtenu"}.
          </p>
        ) : null}
        {badge.structuredCriteria.length > 0 ? (
          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Critères d'obtention</h2>
            <ol className="list-decimal space-y-2 pl-6 text-white/80">
              {badge.structuredCriteria.map((criterion) => (
                <li key={criterion.id}>
                  <span className="font-medium text-white">{criterion.label}</span>
                  {criterion.description ? <span className="block text-white/60">{criterion.description}</span> : null}
                </li>
              ))}
            </ol>
          </section>
        ) : null}
        <p className="text-sm text-white/60">
          Émetteur :{" "}
          <Link className="text-[#A99BFF]" href="https://www.byound.fr">
            Byound
          </Link>
        </p>
      </article>
    </main>
  );
}
