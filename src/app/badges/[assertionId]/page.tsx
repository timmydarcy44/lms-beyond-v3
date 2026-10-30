import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadPublicBadgeDocument } from "@/lib/openbadges/v3/public-badge";
import { getServiceRoleClient } from "@/lib/supabase/server";

type RouteParams = { params: Promise<{ assertionId: string }> };

const STATUS_LABEL = {
  verified: "Authenticité vérifiée · signé par Byound",
  expired: "Expiré",
  revoked: "Révoqué",
  invalid: "Signature invalide",
} as const;

export async function generateMetadata({ params }: RouteParams): Promise<Metadata> {
  const { assertionId } = await params;
  const db = getServiceRoleClient();
  const badge = db ? await loadPublicBadgeDocument(db, assertionId) : null;
  if (!badge) return { title: "Badge introuvable | Byound", robots: { index: false, follow: false } };
  return {
    title: `${badge.recipientName} · ${badge.name} | Byound`,
    description: badge.description,
    robots: { index: true, follow: true },
  };
}

export default async function PublicBadgePage({ params }: RouteParams) {
  const { assertionId } = await params;
  const db = getServiceRoleClient();
  const badge = db ? await loadPublicBadgeDocument(db, assertionId) : null;
  if (!badge) notFound();

  const issued = new Date(badge.issuedAt).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const revokedOn = badge.revokedAt
    ? new Date(badge.revokedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <main className="min-h-screen bg-[#050608] px-6 py-16 text-[#F2F2F4]">
      <article className="mx-auto max-w-3xl space-y-6">
        <p className={badge.state === "verified" ? "text-[#2FD08A]" : "text-[#ff8b7b]"}>
          {STATUS_LABEL[badge.state]}
          {badge.state === "revoked" && revokedOn ? ` le ${revokedOn}` : ""}
          {badge.state === "revoked" && badge.revocationReason ? ` — ${badge.revocationReason}` : ""}
        </p>
        <h1 className="text-4xl font-semibold tracking-tight">{badge.name}</h1>
        <p className="text-lg text-white/80">
          Délivré à {badge.recipientName} par Byound, le {issued}.
        </p>
        {badge.description ? <p className="text-white/70">{badge.description}</p> : null}
        <div className="flex flex-wrap gap-3 text-sm">
          <Link className="rounded-full border border-white/15 px-4 py-2" href={`/badges/${badge.assertionId}.json`}>
            Credential JSON
          </Link>
          <Link className="rounded-full border border-white/15 px-4 py-2" href={`/badges/${badge.assertionId}/credential.jwt`}>
            credential.jwt
          </Link>
          <Link className="rounded-full border border-white/15 px-4 py-2" href={`/badges/${badge.assertionId}/badge.png`}>
            Badge signé
          </Link>
        </div>
        <p className="text-sm text-white/50">Les résultats des tests ne sont jamais publiés.</p>
      </article>
    </main>
  );
}
