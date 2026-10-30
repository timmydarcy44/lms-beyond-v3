import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgePublicShell } from "@/components/openbadges/badge-public-shell";
import { loadPublicBadgeClass } from "@/lib/openbadges/public-badge-class";
import { loadPublicIssuer } from "@/lib/openbadges/public-issuer";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ badgeClassId: string }> };

export async function generateMetadata({ params }: RouteParams): Promise<Metadata> {
  const { badgeClassId } = await params;
  const badge = await loadPublicBadgeClass(badgeClassId);
  if (!badge) return { title: "Badge introuvable | Byound", robots: { index: false, follow: false } };
  return { title: `${badge.name} | Byound`, description: badge.description };
}

export default async function BadgeClassPage({ params }: RouteParams) {
  const { badgeClassId } = await params;
  const badge = await loadPublicBadgeClass(badgeClassId);
  if (!badge) notFound();

  const issuer = loadPublicIssuer("byound");
  const db = getServiceRoleClient();
  const { count } = db
    ? await db
        .from("badge_assertions")
        .select("id", { count: "exact", head: true })
        .eq("badge_class_id", badge.id)
        .eq("is_public", true)
        .is("revoked_at", null)
    : { count: 0 };
  const holders = typeof count === "number" ? count : 0;

  return (
    <BadgePublicShell>
      <main className="mx-auto max-w-6xl px-5 pb-24 sm:px-8">
        <section className="mx-auto max-w-3xl space-y-6 pt-10">
          <p className="text-sm text-[#A99BFF]">Open Badge Byound</p>
          <h1 className="text-[40px] font-bold leading-[0.95] tracking-[-0.045em] sm:text-[72px]">{badge.name}</h1>
          {badge.level != null ? (
            <p className="text-[rgba(242,242,244,0.6)]">Niveau {badge.level}</p>
          ) : null}
          <p className="text-[28px] font-medium leading-snug tracking-[-0.03em]">
            {badge.description || "Compétence délivrée par Byound."}
          </p>
          {holders > 0 ? (
            <p className="text-[rgba(242,242,244,0.6)]">
              {holders} {holders > 1 ? "personnes l'ont obtenu" : "personne l'a obtenu"}.
            </p>
          ) : null}
        </section>

        <div className="mt-16 grid gap-16 lg:grid-cols-[minmax(0,1fr)_400px]">
          <section className="space-y-6">
            <h2 className="text-2xl font-bold tracking-[-0.04em]">Critères d'obtention</h2>
            {badge.structuredCriteria.length > 0 ? (
              <ol className="space-y-5">
                {badge.structuredCriteria.map((criterion, index) => (
                  <li key={criterion.id} className="flex gap-4 border-t border-white/10 pt-5">
                    <span className="w-10 shrink-0 text-lg font-light text-[#A99BFF]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <p className="font-semibold">{criterion.label}</p>
                      {criterion.description ? (
                        <p className="mt-1 text-[rgba(242,242,244,0.6)]">{criterion.description}</p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-[rgba(242,242,244,0.6)]">
                {badge.criteriaMarkdown || "Les critères seront publiés avec la classe."}
              </p>
            )}
            <p className="text-sm text-[rgba(242,242,244,0.5)]">
              <Link href={`/badgeclasses/${badge.id}/criteria`} className="text-[#A99BFF]">
                Voir le détail des critères
              </Link>
            </p>
          </section>

          <aside id="verification" className="space-y-4">
            <section className="rounded-3xl border border-white/10 p-6">
              <h2 className="text-xl font-bold tracking-[-0.04em]">{issuer?.name ?? "Byound"}</h2>
              <p className="mt-3 text-sm leading-relaxed text-[rgba(242,242,244,0.65)]">{issuer?.description}</p>
              <a className="mt-4 inline-block text-sm text-[#A99BFF]" href="https://www.byound.fr">
                byound.fr
              </a>
            </section>
            <p className="text-sm leading-relaxed text-[rgba(242,242,244,0.5)]">
              Les résultats des tests ne sont jamais publiés. Chaque badge obtenu a sa propre page, vérifiée à chaque affichage.
            </p>
          </aside>
        </div>
      </main>
    </BadgePublicShell>
  );
}
