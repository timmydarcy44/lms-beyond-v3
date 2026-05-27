import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  buildPublicBadgeShareDescription,
  loadPublicBadgeClass,
  resolvePublicBadgeImageUrl,
} from "@/lib/openbadges/public-badge-class";
import { getPublicShareBaseUrl } from "@/lib/openbadges/urls";
import { buildOpenBadgeLinkedInShareMessage } from "@/lib/openbadges/linkedin-share";

export const revalidate = 600;

type RouteParams = { params: Promise<{ badgeClassId: string }> | { badgeClassId: string } };

async function resolveRouteParams(params: RouteParams["params"]) {
  return typeof (params as { then?: unknown }).then === "function"
    ? await (params as Promise<{ badgeClassId: string }>)
    : (params as { badgeClassId: string });
}

export async function generateMetadata({ params }: RouteParams): Promise<Metadata> {
  const { badgeClassId } = await resolveRouteParams(params);
  const badge = await loadPublicBadgeClass(badgeClassId);
  if (!badge) {
    return { title: "Badge introuvable | EDGE" };
  }

  const shareBase = getPublicShareBaseUrl();
  const pageUrl = `${shareBase}/badgeclasses/${badge.id}/criteria`;
  const description = buildPublicBadgeShareDescription(badge);
  const ogImage =
    resolvePublicBadgeImageUrl(badge.imageUrl, shareBase) ??
    `${shareBase}/favicon.ico`;

  return {
    title: `${badge.name} | Open Badge EDGE`,
    description,
    openGraph: {
      type: "website",
      url: pageUrl,
      siteName: "EDGE",
      title: badge.name,
      description,
      locale: "fr_FR",
      ...(ogImage
        ? {
            images: [
              {
                url: ogImage,
                width: 1200,
                height: 630,
                alt: badge.name,
              },
            ],
          }
        : {}),
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title: badge.name,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
}

export default async function BadgeCriteriaPage({ params }: RouteParams) {
  const { badgeClassId } = await resolveRouteParams(params);
  const badge = await loadPublicBadgeClass(badgeClassId);
  if (!badge) notFound();

  const shareBase = getPublicShareBaseUrl();
  const imageUrl = resolvePublicBadgeImageUrl(badge.imageUrl, shareBase);
  const linkedInPreview = buildOpenBadgeLinkedInShareMessage({
    badgeName: badge.name,
    level: badge.level,
  });

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      <section className="border-b border-white/10 bg-gradient-to-b from-[#1a1010] to-[#0a0a0a] px-6 py-12">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
          {imageUrl ? (
            <div className="relative h-48 w-48 overflow-hidden rounded-2xl border border-white/15 bg-white shadow-[0_0_48px_rgba(255,59,48,0.25)] sm:h-56 sm:w-56">
              <Image
                src={imageUrl}
                alt={badge.name}
                fill
                className="object-contain p-3"
                sizes="224px"
                priority
              />
            </div>
          ) : (
            <div className="flex h-48 w-48 items-center justify-center rounded-2xl border border-[#FF3B30]/30 bg-[#FF3B30]/10 text-4xl font-bold text-[#FF3B30]">
              EDGE
            </div>
          )}
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.35em] text-[#FF3B30]">Open Badge EDGE</p>
            <h1 className="text-3xl font-semibold sm:text-4xl">{badge.name}</h1>
            {badge.level != null ? (
              <p className="text-sm text-white/60">Niveau {badge.level}</p>
            ) : null}
            {badge.description ? (
              <p className="mx-auto max-w-xl text-base text-white/75">{badge.description}</p>
            ) : null}
          </div>
          <blockquote className="max-w-lg rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-left text-sm italic leading-relaxed text-white/80">
            {linkedInPreview}
          </blockquote>
        </div>
      </section>

      <section className="mx-auto max-w-3xl space-y-8 px-6 py-10 text-slate-200">
        <div className="space-y-1 text-sm text-white/70">
          <div>
            Émetteur :{" "}
            {badge.issuerUrl ? (
              <Link className="text-[#FF3B30] underline" href={badge.issuerUrl} target="_blank">
                {badge.issuerName}
              </Link>
            ) : (
              badge.issuerName
            )}
          </div>
          {badge.organizationName ? <div>Organisation : {badge.organizationName}</div> : null}
        </div>

        {badge.criteriaMarkdown.trim() ? (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">Critères</h2>
            <pre className="whitespace-pre-wrap rounded-lg border border-white/10 bg-white/[0.04] p-4 text-sm text-white/85">
              {badge.criteriaMarkdown}
            </pre>
          </section>
        ) : null}

        {badge.structuredCriteria.length > 0 ? (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">Critères structurés</h2>
            <ol className="list-decimal space-y-2 pl-6 text-sm text-white/85">
              {badge.structuredCriteria.map((criterion) => (
                <li key={criterion.id}>
                  <div className="font-medium">{criterion.label}</div>
                  {criterion.description ? (
                    <div className="text-white/60">{criterion.description}</div>
                  ) : null}
                </li>
              ))}
            </ol>
          </section>
        ) : null}
      </section>
    </main>
  );
}
