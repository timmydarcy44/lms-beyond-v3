import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BadgePublicActions } from "@/components/openbadges/badge-public-actions";
import { BadgePublicShell } from "@/components/openbadges/badge-public-shell";
import { MetalBadgeCard } from "@/components/openbadges/metal-badge-card";
import { buildLinkedInAddCertificationUrl } from "@/lib/openbadges/linkedin-share";
import { loadPublicIssuer } from "@/lib/openbadges/public-issuer";
import { BADGE_PUBLIC_ORIGIN } from "@/lib/openbadges/v3/credential";
import { badgeStatGridClass, loadPublicBadgeDocument, visibleBadgeStatLabels, type BadgeVerificationState } from "@/lib/openbadges/v3/public-badge";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ assertionId: string }> };

const STATUS: Record<BadgeVerificationState, { label: string; tone: string }> = {
  verified: { label: "Authenticité vérifiée · signé par Byound", tone: "border-[#2FD08A]/40 bg-[#2FD08A]/10 text-[#8FF2C4]" },
  expired: { label: "Expiré", tone: "border-amber-300/40 bg-amber-300/10 text-amber-100" },
  revoked: { label: "Révoqué", tone: "border-red-400/40 bg-red-400/10 text-red-200" },
  invalid: { label: "Signature invalide", tone: "border-red-400/40 bg-red-400/10 text-red-200" },
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export async function generateMetadata({ params }: RouteParams): Promise<Metadata> {
  const { assertionId } = await params;
  const db = getServiceRoleClient();
  const badge = db ? await loadPublicBadgeDocument(db, assertionId) : null;
  if (!badge) return { title: "Badge introuvable | Byound", robots: { index: false, follow: false } };
  const title = `${badge.recipientName} · ${badge.name} | Byound`;
  const url = `${BADGE_PUBLIC_ORIGIN}/badges/${badge.assertionId}`;
  return {
    title,
    description: badge.description,
    robots: badge.indexable ? { index: true, follow: true } : { index: false, follow: false },
    openGraph: { title, description: badge.description, url, type: "website" },
  };
}

export default async function PublicBadgePage({ params }: RouteParams) {
  const { assertionId } = await params;
  const db = getServiceRoleClient();
  const badge = db ? await loadPublicBadgeDocument(db, assertionId) : null;
  if (!badge) notFound();

  const issuer = loadPublicIssuer("byound");
  const pageUrl = `${BADGE_PUBLIC_ORIGIN}/badges/${badge.assertionId}`;
  const issued = formatDate(badge.issuedAt);
  const status = STATUS[badge.state];
  const revokedOn = badge.revokedAt ? formatDate(badge.revokedAt) : null;
  const filled = badge.criteria.length;
  const stats = visibleBadgeStatLabels({
    level: badge.level,
    criteriaCount: badge.criteria.length,
    evidenceCount: badge.evidence.length,
    hasExpiry: Boolean(badge.validUntil),
  }).map((label) => {
    if (label === "Niveau") return { label, value: String(badge.level) };
    if (label === "Critères") return { label, value: `${filled} / ${filled}` };
    if (label === "Livrables") return { label, value: String(badge.evidence.length) };
    return { label, value: formatDate(badge.validUntil ?? badge.issuedAt) };
  });

  return (
    <BadgePublicShell>
      <main className="mx-auto max-w-6xl px-5 pb-24 sm:px-8">
        <section className="mx-auto flex max-w-3xl flex-col items-center gap-8 pt-6 text-center">
          <p className={`rounded-full border px-4 py-2 text-sm ${status.tone}`}>
            {badge.state === "verified" ? "✓ " : ""}
            {status.label}
            {badge.state === "revoked" && revokedOn ? ` le ${revokedOn}` : ""}
          </p>
          <MetalBadgeCard
            name={badge.name}
            recipientName={badge.recipientName}
            issuedLabel={issued}
            level={badge.level}
          />
          <div className="space-y-4">
            <h1 className="max-w-full text-[40px] font-bold leading-[1.05] tracking-[-0.045em] sm:text-[72px] sm:leading-[0.95]" style={{ textWrap: "balance" }}>
              {badge.name.split(" - ").map((part, index) => (
                <span key={part}>
                  {index > 0 ? (
                    <>
                      <br className="sm:hidden" />
                      <span className="hidden sm:inline">{" - "}</span>
                    </>
                  ) : null}
                  {part}
                </span>
              ))}
            </h1>
            <p className="text-lg text-[rgba(242,242,244,0.6)]">
              Délivré à {badge.recipientName} par Byound, le {issued}.
            </p>
          </div>
          <BadgePublicActions
            linkedInUrl={buildLinkedInAddCertificationUrl({
              badgeName: badge.name,
              issuedAt: badge.issuedAt,
              certUrl: pageUrl,
              certId: badge.assertionId,
            })}
            pdfUrl={`/badges/${badge.assertionId}/certificate.pdf`}
            pageUrl={pageUrl}
          />
          {stats.length > 0 ? (
          <dl className={`grid w-full gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 ${badgeStatGridClass(stats.length)}`}>
            {stats.map((item) => (
              <div key={item.label} className="bg-[#050608] px-4 py-5">
                <dt className="text-sm text-[rgba(242,242,244,0.5)]">{item.label}</dt>
                <dd className="mt-1 text-2xl font-bold tracking-[-0.04em]">{item.value}</dd>
              </div>
            ))}
          </dl>
          ) : null}
        </section>

        <div className="mt-16 grid gap-16 lg:grid-cols-[minmax(0,1fr)_400px]">
          <div className="space-y-16 text-left">
            <section className="space-y-4">
              <h2 className="text-2xl font-bold tracking-[-0.04em]">Ce que ce badge atteste</h2>
              <p className="text-[28px] font-medium leading-snug tracking-[-0.03em] text-[rgba(242,242,244,0.92)]">
                {badge.description || "Ce badge atteste une compétence délivrée par Byound."}
              </p>
            </section>

            <section className="space-y-6">
              <div className="flex items-end justify-between gap-4">
                <h2 className="text-2xl font-bold tracking-[-0.04em]">Critères d'obtention</h2>
                <p className="text-sm text-[rgba(242,242,244,0.55)]">{filled} / {filled} remplis</p>
              </div>
              {badge.criteria.length > 0 ? (
                <ol className="space-y-5">
                  {badge.criteria.map((criterion, index) => (
                    <li key={`${criterion.label}-${index}`} className="flex gap-4 border-t border-white/10 pt-5">
                      <span className="w-10 shrink-0 text-lg font-light text-[#A99BFF]">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <p className="font-semibold">{criterion.label}</p>
                        {criterion.description ? (
                          <p className="mt-1 text-[rgba(242,242,244,0.6)]">{criterion.description}</p>
                        ) : null}
                        {criterion.validatedAt ? (
                          <p className="mt-2 text-sm text-[rgba(242,242,244,0.5)]">Validé le {formatDate(criterion.validatedAt)}</p>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-[rgba(242,242,244,0.6)]">Les critères sont publiés sur la page de la classe.</p>
              )}
            </section>

            {badge.evidence.length > 0 ? (
              <section className="space-y-4">
                <h2 className="text-2xl font-bold tracking-[-0.04em]">Livrables</h2>
                <ul className="grid gap-4">
                  {badge.evidence.map((item) => (
                    <li
                      key={item.name}
                      className="rounded-3xl border border-white/[0.07] p-5"
                      style={{ background: "linear-gradient(180deg, #14151B, #0D0E13)" }}
                    >
                      <p className="font-semibold">{item.name}</p>
                      {item.description ? <p className="mt-2 text-[rgba(242,242,244,0.6)]">{item.description}</p> : null}
                      {item.url ? (
                        <a href={item.url} className="mt-3 inline-block text-sm text-[#A99BFF]">
                          Ouvrir le livrable
                        </a>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {badge.alignments.length > 0 ? (
              <section className="space-y-4">
                <h2 className="text-2xl font-bold tracking-[-0.04em]">Compétences visées</h2>
                <div className="flex flex-wrap gap-2">
                  {badge.alignments.map((item) => (
                    <span key={item.targetName} className="rounded-full border border-white/15 px-3 py-1 text-sm">
                      {item.targetName}
                    </span>
                  ))}
                </div>
                <ul className="space-y-3">
                  {badge.alignments.map((item) => (
                    <li key={`${item.targetFramework}-${item.targetName}`} className="text-[rgba(242,242,244,0.75)]">
                      {[item.targetFramework, item.targetCode].filter(Boolean).join(" · ")}
                      {item.targetFramework || item.targetCode ? " — " : ""}
                      {item.targetUrl ? (
                        <a href={item.targetUrl} className="text-[#A99BFF]">{item.targetName}</a>
                      ) : (
                        item.targetName
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-8 lg:self-start">
            <section id="verification" className="rounded-3xl border border-white/10 p-6">
              <h2 className="text-xl font-bold tracking-[-0.04em]">Vérification</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-[rgba(242,242,244,0.5)]">Signature</dt>
                  <dd>{badge.state === "invalid" ? "Invalide" : "Valide"}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-[rgba(242,242,244,0.5)]">Statut</dt>
                  <dd>{status.label}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-[rgba(242,242,244,0.5)]">Émis le</dt>
                  <dd>{issued}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-[rgba(242,242,244,0.5)]">Standard</dt>
                  <dd>Open Badges 3.0</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-[rgba(242,242,244,0.5)]">Identifiant</dt>
                  <dd className="truncate">{badge.assertionId}</dd>
                </div>
              </dl>
              <div className="mt-5 flex flex-col gap-2">
                <a className="rounded-full bg-white px-4 py-2.5 text-center text-sm font-semibold text-[#050608]" href={`/badges/${badge.assertionId}/badge.png`}>
                  Télécharger le badge signé
                </a>
                <a className="text-center text-sm text-[#A99BFF]" href={`/badges/${badge.assertionId}/credential.jwt`}>
                  credential.jwt
                </a>
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 p-6">
              <h2 className="text-xl font-bold tracking-[-0.04em]">{issuer?.name ?? "Byound"}</h2>
              <p className="mt-3 text-sm leading-relaxed text-[rgba(242,242,244,0.65)]">{issuer?.description}</p>
              <div className="mt-4 flex flex-col gap-2 text-sm">
                <a className="text-[#A99BFF]" href="https://www.byound.fr">byound.fr</a>
                <a className="text-[#A99BFF]" href={`/badgeclasses/${badge.badgeClassId}`}>Page de la classe</a>
                <a className="text-[#A99BFF]" href={`${BADGE_PUBLIC_ORIGIN}/issuers/byound`}>Profil émetteur</a>
              </div>
            </section>

            <p className="px-1 text-sm leading-relaxed text-[rgba(242,242,244,0.5)]">
              Les résultats des tests ne sont jamais publiés. Seuls le nom du badge, le nom du titulaire et les livrables qu'il a choisis apparaissent ici.
            </p>

            <a
              href="https://www.byound.fr/business"
              className="block rounded-3xl p-6 text-[#F2F2F4]"
              style={{ background: "linear-gradient(135deg, #6E5BFF, #A99BFF)" }}
            >
              <p className="text-xl font-bold tracking-[-0.04em]">Vous recrutez ?</p>
              <p className="mt-2 text-sm text-white/80">Vérifiez les compétences de vos équipes avec Byound Business.</p>
            </a>
          </aside>
        </div>
      </main>
    </BadgePublicShell>
  );
}
