import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { edgeMarketingHref } from "@/lib/edge-site/edge-marketing-path";
import { BadgePublicActions } from "@/components/openbadges/badge-public-actions";
import { BadgePublicShell } from "@/components/openbadges/badge-public-shell";
import { BadgeCard3D } from "@/components/openbadges/badge-card-3d";
import { BadgeVerificationPanel } from "@/components/openbadges/badge-verification-panel";
import { loadPublicIssuer } from "@/lib/openbadges/public-issuer";
import { loadDeliverableAccess, type DeliverableCard } from "@/lib/openbadges/v3/badge-deliverable-access";
import {
  criteriaShareOneDate,
  formatBadgeCardDate,
  formatBadgeLongDate,
  formatPersonName,
} from "@/lib/openbadges/v3/badge-page-display";
import { viewerIsCompanyAccount } from "@/lib/openbadges/v3/company-viewer";
import { BADGE_PUBLIC_ORIGIN } from "@/lib/openbadges/v3/credential";
import { loadPublicBadgeDocument, type BadgeVerificationState } from "@/lib/openbadges/v3/public-badge";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ assertionId: string }> };

const STATUS: Record<BadgeVerificationState, { label: string; tone: string }> = {
  verified: { label: "Authenticité vérifiée · signé par Byound", tone: "border-[#2FD08A]/40 bg-[#2FD08A]/10 text-[#8FF2C4]" },
  expired: { label: "Expiré", tone: "border-amber-300/40 bg-amber-300/10 text-amber-100" },
  revoked: { label: "Révoqué", tone: "border-red-400/40 bg-red-400/10 text-red-200" },
  invalid: { label: "Signature invalide", tone: "border-red-400/40 bg-red-400/10 text-red-200" },
};

function verificationStatus(state: BadgeVerificationState, expiredAt: string | null, revokedAt: string | null) {
  if (state === "revoked") return `Révoqué le ${formatBadgeLongDate(revokedAt ?? "")}`;
  if (state === "expired") return `Expiré le ${formatBadgeLongDate(expiredAt ?? "")}`;
  if (state === "invalid") return "Signature invalide";
  return "Actif, non révoqué";
}

function LockedDeliverables({ count, loginHref, signupHref }: { count: number; loginHref: string; signupHref: string }) {
  const ghosts = Array.from({ length: Math.min(count, 3) }, (_, index) => index);
  const label = count > 1 ? `${count} livrables réservés aux entreprises` : "1 livrable réservé aux entreprises";
  return (
    <section className="space-y-3">
      <h2 className="text-2xl font-bold tracking-[-0.04em]">Livrables</h2>
      <p className="text-sm text-[rgba(242,242,244,0.5)]">Les preuves de l&apos;épreuve sont réservées aux entreprises connectées.</p>
      <div className="relative overflow-hidden rounded-[28px] border border-white/10">
        <ul aria-hidden="true" className="pointer-events-none select-none space-y-3 p-4 blur-md">
          {ghosts.map((index) => (
            <li key={index} className="rounded-2xl border border-white/10 bg-[#14151B] p-5">
              <p className="font-semibold">Livrable</p>
              <p className="mt-2 text-sm text-[rgba(242,242,244,0.55)]">Contenu réservé aux entreprises</p>
            </li>
          ))}
        </ul>
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-black/50">
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
              <rect x="5" y="11" width="14" height="9" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
              <path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" strokeWidth="1.6" />
            </svg>
          </span>
          <p className="mt-4 text-lg font-semibold">{label}</p>
          <p className="mt-2 max-w-md text-sm text-[rgba(242,242,244,0.7)]">
            Connectez-vous avec votre compte entreprise pour les consulter. Les résultats des tests restent toujours privés.
          </p>
          <div className="mt-5 flex w-full max-w-sm flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href={loginHref} className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[#050608]">
              Se connecter
            </Link>
            <Link href={signupHref} className="rounded-full bg-[#2C2D36] px-5 py-2.5 text-sm font-semibold">
              Créer un compte entreprise
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function CompanyDeliverables({ assertionId, cards }: { assertionId: string; cards: DeliverableCard[] }) {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold tracking-[-0.04em]">Livrables</h2>
      <ul className="grid gap-4">
        {cards.map((item, index) => (
          <li key={`${item.title}-${index}`} className="rounded-3xl border border-white/[0.07] bg-[#101117] p-5">
            <p className="font-semibold">{item.title}</p>
            {item.description ? <p className="mt-2 whitespace-pre-wrap text-[rgba(242,242,244,0.75)]">{item.description}</p> : null}
            {item.dateLabel ? <p className="mt-2 text-sm text-[rgba(242,242,244,0.5)]">{item.dateLabel}</p> : null}
            {item.validatedBy ? <p className="mt-1 text-sm text-[rgba(242,242,244,0.5)]">Validé par {item.validatedBy}</p> : null}
            {item.fileIndex != null ? (
              <a className="mt-3 inline-block text-sm text-[#A99BFF]" href={`/api/badges/${assertionId}/deliverables/${item.fileIndex}`}>
                Consulter ›
              </a>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

export async function generateMetadata({ params }: RouteParams): Promise<Metadata> {
  const { assertionId } = await params;
  const db = getServiceRoleClient();
  const badge = db ? await loadPublicBadgeDocument(db, assertionId) : null;
  if (!badge) return { title: "Badge introuvable | Byound", robots: { index: false, follow: false } };
  const holder = formatPersonName(badge.recipientName) || badge.recipientName;
  const title = `${holder} · ${badge.name} | Byound`;
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

  const host = (await headers()).get("x-forwarded-host") ?? (await headers()).get("host");
  const companyAccountHref = (mode: "login" | "signup") =>
    edgeMarketingHref(
      `/entreprises/connexion?mode=${mode}&next=${encodeURIComponent(`/badges/${badge.assertionId}`)}`,
      host,
    );
  const companyViewer = await viewerIsCompanyAccount();
  const access = db ? await loadDeliverableAccess(db, assertionId) : null;
  const deliverableCount = access?.count ?? 0;
  const issuer = loadPublicIssuer("byound");
  const pageUrl = `${BADGE_PUBLIC_ORIGIN}/badges/${badge.assertionId}`;
  const holder = formatPersonName(badge.recipientName) || badge.recipientName;
  const issued = formatBadgeLongDate(badge.issuedAt);
  const cardDate = formatBadgeCardDate(badge.issuedAt);
  const status = STATUS[badge.state];
  const filled = badge.criteria.filter((item) => item.validatedAt).length;
  const total = badge.criteria.length;
  const sharedValidation = criteriaShareOneDate(badge.criteria.map((item) => item.validatedAt));
  const subtitle = [
    `Délivré à ${holder} par Byound, le ${issued}`,
    badge.level != null ? `Niveau ${badge.level}` : null,
    total > 0 ? `${filled} / ${total} critères` : null,
  ].filter(Boolean).join(" · ");

  return (
    <BadgePublicShell>
      <main className="mx-auto max-w-6xl overflow-x-clip px-5 pb-24 sm:px-8">
        <section className="mx-auto flex max-w-3xl flex-col items-center gap-6 pt-6 text-center">
          <p className={`rounded-full border px-4 py-2 text-sm ${status.tone}`}>
            {badge.state === "verified" ? "✓ " : ""}
            {status.label}
          </p>
          <BadgeCard3D
            name={badge.name}
            recipientName={holder}
            issuedLabel={cardDate}
            level={badge.level}
            imageUrl={badge.imageUrl}
            state={badge.state}
          />
          <div className="space-y-4">
            <h1 className="max-w-full break-words text-[40px] font-bold leading-[1.05] tracking-[-0.045em] sm:text-[72px] sm:leading-[0.95]" style={{ textWrap: "balance" }}>
              {badge.name}
            </h1>
            <p className="text-base text-[rgba(242,242,244,0.6)] sm:text-lg">{subtitle}</p>
          </div>
          <BadgePublicActions pdfUrl={`/badges/${badge.assertionId}/certificate.pdf`} pageUrl={pageUrl} />
        </section>

        <div className="mt-16 grid min-w-0 gap-16 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
          <div className="min-w-0 space-y-16 text-left">
            <section className="space-y-4">
              <h2 className="text-2xl font-bold tracking-[-0.04em]">Ce que ce badge atteste</h2>
              <p className="text-[28px] font-medium leading-snug tracking-[-0.03em] text-[rgba(242,242,244,0.92)]">
                {badge.description || "Ce badge atteste une compétence délivrée par Byound."}
              </p>
            </section>

            <section className="space-y-6">
              <div className="flex items-end justify-between gap-4">
                <h2 className="text-2xl font-bold tracking-[-0.04em]">Critères d&apos;obtention</h2>
                <p className="text-sm text-[rgba(242,242,244,0.55)]">{filled} / {total} remplis</p>
              </div>
              {sharedValidation ? (
                <p className="text-sm text-[rgba(242,242,244,0.55)]">Tous validés le {formatBadgeLongDate(sharedValidation)}</p>
              ) : null}
              {badge.criteria.length > 0 ? (
                <ol className="space-y-5">
                  {badge.criteria.map((criterion, index) => (
                    <li key={`${criterion.label}-${index}`} className="flex gap-4 border-t border-white/10 pt-5">
                      <span className="w-10 shrink-0 text-lg font-light text-[#A99BFF]">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold">{criterion.label}</p>
                        {criterion.description ? (
                          <p className="mt-1 text-[rgba(242,242,244,0.6)]">{criterion.description}</p>
                        ) : null}
                        {!sharedValidation && criterion.validatedAt ? (
                          <p className="mt-2 text-sm text-[rgba(242,242,244,0.5)]">Validé le {formatBadgeLongDate(criterion.validatedAt)}</p>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-[rgba(242,242,244,0.6)]">Les critères sont publiés sur la page de la classe.</p>
              )}
            </section>

            {!companyViewer && deliverableCount > 0 ? (
              <LockedDeliverables
                count={deliverableCount}
                loginHref={companyAccountHref("login")}
                signupHref={companyAccountHref("signup")}
              />
            ) : null}
            {companyViewer && access && access.cards.length > 0 ? (
              <CompanyDeliverables assertionId={badge.assertionId} cards={access.cards} />
            ) : null}
            {companyViewer && deliverableCount > 0 && (access?.cards.length ?? 0) === 0 ? (
              <section className="rounded-3xl border border-white/10 p-6">
                <h2 className="text-2xl font-bold tracking-[-0.04em]">Livrables</h2>
                <p className="mt-3 text-[rgba(242,242,244,0.7)]">Le titulaire n&apos;a pas autorisé le partage de ses livrables.</p>
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

          <aside className="min-w-0 space-y-4 lg:sticky lg:top-6 lg:self-start">
            <BadgeVerificationPanel
              signature={badge.state === "invalid" ? "Invalide" : "Valide · ES256"}
              status={verificationStatus(badge.state, badge.validUntil, badge.revokedAt)}
              issued={issued}
              assertionId={badge.assertionId}
              pngUrl={`/badges/${badge.assertionId}/badge.png`}
              jwtUrl={`/badges/${badge.assertionId}/credential.jwt`}
              jsonUrl={`/badges/${badge.assertionId}/credential.json`}
            />

            <section className="rounded-3xl border border-white/10 bg-[#101117] p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F2F2F4] text-lg font-extrabold text-[#121318]">B</span>
                <h2 className="text-xl font-bold tracking-[-0.04em]">{issuer?.name ?? "Byound"}</h2>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-[rgba(242,242,244,0.65)]">{issuer?.description}</p>
              <div className="mt-4 flex flex-col gap-2 text-sm">
                <a className="text-[#A99BFF]" href="https://www.byound.fr">byound.fr</a>
                <a className="text-[#A99BFF]" href={`/badgeclasses/${badge.badgeClassId}`}>Page de la classe</a>
                <a className="text-[#A99BFF]" href={`${BADGE_PUBLIC_ORIGIN}/issuers/byound`}>Profil émetteur</a>
              </div>
            </section>

            <p className="px-1 text-sm leading-relaxed text-[rgba(242,242,244,0.5)]">
              Les résultats des tests ne sont jamais publiés. Les livrables ne sont visibles que par les entreprises connectées.
            </p>

            <section className="rounded-3xl p-6 text-[#F2F2F4]" style={{ background: "linear-gradient(135deg, #6E5BFF, #A99BFF)" }}>
              <p className="text-xl font-bold tracking-[-0.04em]">Vous recrutez ?</p>
              <p className="mt-2 text-sm text-white/80">Vérifiez les compétences de vos équipes avec Byound Business.</p>
              <a href="https://www.byound.fr/business" className="mt-4 inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#2A215F]">
                Découvrir Byound Business ›
              </a>
            </section>
          </aside>
        </div>
      </main>
    </BadgePublicShell>
  );
}
