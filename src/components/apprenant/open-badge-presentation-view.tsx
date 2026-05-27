"use client";

import { useState } from "react";
import Link from "next/link";
import { Award, Linkedin, Share2, UserCheck, Wallet } from "lucide-react";
import type { LearnerBadgePresentation } from "@/lib/openbadges/learner-badge-presentation";
import { OpenBadgeMethodChip } from "@/components/apprenant/open-badge-method-icon";
import { CONNECT_BTN_PRIMARY } from "@/lib/apprenant/connect-nav";

type TabId = "badge" | "validator";

export function OpenBadgePresentationView({
  badge,
  backHref = "/dashboard/apprenant",
}: {
  badge: LearnerBadgePresentation;
  backHref?: string;
}) {
  const [tab, setTab] = useState<TabId>("badge");
  const epreuveHref = `/dashboard/apprenant/open-badges/${badge.id}/epreuve`;
  const methodCount = Math.max(badge.evaluationMethodIds.length, 1);

  return (
    <div className="min-h-screen bg-[#030303] text-white">
      <div className="border-b border-white/[0.06] px-5 py-4 sm:px-8">
        <Link
          href={backHref}
          className="text-xs font-medium uppercase tracking-[0.2em] text-white/45 transition hover:text-white"
        >
          ← Retour au dashboard
        </Link>
      </div>

      <section className="relative overflow-hidden border-b border-white/[0.04] bg-[#030303]">
        <div
          className="pointer-events-none absolute inset-0 bg-[#030303]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-[min(100%,520px)] opacity-90"
          style={{
            background:
              "radial-gradient(ellipse 70% 80% at 70% 50%, rgba(30,58,120,0.35) 0%, rgba(3,3,3,0.95) 55%, #030303 100%)",
          }}
          aria-hidden
        />
        <div className="relative mx-auto grid max-w-6xl gap-6 px-5 py-10 sm:px-8 lg:grid-cols-[1fr_1fr] lg:items-center lg:gap-10 lg:py-12">
          <div className="order-2 lg:order-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.5em] text-[#FF3B30]">
              Open Badge EDGE
              {badge.level != null ? ` · Niveau ${badge.level}` : ""}
            </p>
            <h1 className="mt-3 text-pretty text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
              {badge.name}
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/65 sm:text-base">
              {badge.description.trim() || "—"}
            </p>
            {badge.eligible ? (
              <Link
                href={epreuveHref}
                className={`${CONNECT_BTN_PRIMARY} mt-6 inline-flex px-8 py-3 text-xs uppercase tracking-[0.16em]`}
              >
                Commencer l&apos;épreuve
              </Link>
            ) : (
              <p className="mt-6 text-sm text-amber-200/85">
                Formation requise avant de commencer l&apos;épreuve.
              </p>
            )}
          </div>
          <div className="order-1 flex items-center justify-center lg:order-2 lg:justify-end">
            {badge.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={badge.imageUrl}
                alt=""
                className="h-auto w-full max-h-[min(52vw,280px)] max-w-[min(90vw,320px)] object-contain object-center lg:max-h-[320px] lg:max-w-[380px]"
                style={{ filter: "drop-shadow(0 24px 48px rgba(0,0,0,0.45))" }}
              />
            ) : (
              <Award className="h-32 w-32 text-[#FF3B30]/80 sm:h-40 sm:w-40" strokeWidth={1.1} />
            )}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="mt-8 flex gap-1 border-b border-white/10">
          <button
            type="button"
            onClick={() => setTab("badge")}
            className={`px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] transition ${
              tab === "badge"
                ? "border-b-2 border-[#FF3B30] text-white"
                : "text-white/40 hover:text-white/70"
            }`}
          >
            Le badge
          </button>
          <button
            type="button"
            onClick={() => setTab("validator")}
            className={`inline-flex items-center gap-2 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] transition ${
              tab === "validator"
                ? "border-b-2 border-[#FF3B30] text-white"
                : "text-white/40 hover:text-white/70"
            }`}
          >
            <UserCheck className="h-3.5 w-3.5" />
            Validateur
          </button>
        </div>

        {tab === "badge" ? (
          <div className="space-y-6 py-8">
            <div className="rounded-xl border border-white/10 bg-[#0a0a0a] p-6 sm:p-8">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.25em] text-white/50">
                Critères d&apos;évaluation
              </h2>
              {badge.criteria.length > 0 ? (
                <ol className="mt-5 space-y-4">
                  {badge.criteria.map((criterion, index) => (
                    <li key={`${criterion.label}-${index}`} className="flex gap-4">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/15 text-xs font-semibold text-white/70">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-medium text-white">{criterion.label}</p>
                        {criterion.description?.trim() ? (
                          <p className="mt-1 text-sm leading-relaxed text-white/55">
                            {criterion.description}
                          </p>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ol>
              ) : badge.criteriaMarkdown?.trim() ? (
                <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-white/70">
                  {badge.criteriaMarkdown}
                </p>
              ) : (
                <p className="mt-4 text-sm text-white/45">Critères communiqués pendant l&apos;épreuve.</p>
              )}
            </div>

            <div className="rounded-xl border border-[#FF3B30]/20 bg-[#0a0a0a] p-6 sm:p-8">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#FF3B30]/90">
                Épreuves
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-white/70">
                Ce badge comporte {methodCount} mode{methodCount > 1 ? "s" : ""} d&apos;évaluation.
                Vous les réalisez l&apos;une après l&apos;autre, dans l&apos;ordre de votre choix.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {badge.evaluationMethodIds.map((methodId) => (
                  <OpenBadgeMethodChip key={methodId} methodId={methodId} />
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#0a0a0a] p-6 sm:p-8">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.25em] text-white/50">
                Valeur du badge
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-white/70">
                Obtenir ce badge atteste d&apos;une compétence mesurable et vérifiable auprès de votre
                organisation. Une fois validé, votre Open Badge peut être partagé sur LinkedIn et
                conservé dans votre EDGE Wallet — un lien public que vous pouvez transmettre à un
                recruteur ou un partenaire.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/55">
                  <Linkedin className="h-3.5 w-3.5" />
                  LinkedIn
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/55">
                  <Wallet className="h-3.5 w-3.5" />
                  EDGE Wallet
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/55">
                  <Share2 className="h-3.5 w-3.5" />
                  Lien vérifiable
                </span>
              </div>
            </div>

            <div className="flex justify-center pt-2 pb-12">
              {badge.eligible ? (
                <Link
                  href={epreuveHref}
                  className={`${CONNECT_BTN_PRIMARY} px-10 py-3.5 text-xs uppercase tracking-[0.16em]`}
                >
                  Commencer l&apos;épreuve
                </Link>
              ) : (
                <p className="text-center text-sm text-amber-200/90">
                  Inscrivez-vous à la formation requise avant de commencer.
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="py-8 pb-16">
            {badge.validator ? (
              <div className="rounded-xl border border-white/10 bg-[#0a0a0a] p-6 sm:p-8">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                  {badge.validator.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={badge.validator.avatarUrl}
                      alt=""
                      className="h-20 w-20 shrink-0 rounded-full object-cover ring-2 ring-white/10"
                    />
                  ) : (
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-white/5 ring-2 ring-white/10">
                      <UserCheck className="h-9 w-9 text-[#FF3B30]/80" />
                    </div>
                  )}
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-white/40">
                      Validateur désigné
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold text-white">{badge.validator.fullName}</h2>
                    {badge.validator.professionalTitle ? (
                      <p className="mt-1 text-sm text-[#FF3B30]/90">{badge.validator.professionalTitle}</p>
                    ) : null}
                    {badge.validator.description?.trim() ? (
                      <p className="mt-4 text-sm leading-relaxed text-white/65">
                        {badge.validator.description}
                      </p>
                    ) : (
                      <p className="mt-4 text-sm text-white/45">
                        Cette personne relit vos preuves et valide l&apos;obtention du badge selon les
                        critères définis.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-white/10 bg-[#0a0a0a] p-8 text-center">
                <UserCheck className="mx-auto h-10 w-10 text-white/25" />
                <p className="mt-4 text-sm text-white/55">
                  Aucun validateur n&apos;est encore associé à ce badge.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
