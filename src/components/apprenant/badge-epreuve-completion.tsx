"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import type { BadgeEarnerResultPayload } from "@/lib/openbadges/badge-earner-evaluation";
import type { BadgeRemediationCourse } from "@/lib/openbadges/badge-remediation";
import { LinkedInBadgeShareButton } from "@/components/apprenant/linkedin-badge-share-button";
import { getBadgeCriteriaUrl } from "@/lib/openbadges/urls";

type EarnerAuth = {
  userId: string;
  orgId: string;
  role: string;
};

type ResultPayload = {
  result: BadgeEarnerResultPayload;
  badgeClass: { id: string; name: string; level: number | null; imageUrl: string | null };
  remediation: BadgeRemediationCourse | null;
};

export function BadgeEpreuveCompletion({
  badgeClassId,
  badgeName,
  auth,
}: {
  badgeClassId: string;
  badgeName: string;
  auth: EarnerAuth;
}) {
  const router = useRouter();
  const [data, setData] = useState<ResultPayload | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [evaluating, setEvaluating] = useState(true);

  useEffect(() => {
    const run = async () => {
      setEvaluating(true);
      const headers = {
        "x-user-id": auth.userId,
        "x-org-id": auth.orgId,
        "x-user-role": auth.role,
      };

      const res = await fetch(`/api/earner/badges/${badgeClassId}/result`, {
        method: "POST",
        credentials: "include",
        headers,
      });

      setEvaluating(false);

      if (!res.ok) {
        setLoadError("Impossible d'évaluer votre session.");
        return;
      }

      const json = (await res.json()) as ResultPayload;
      setData(json);

      if (json.result.awarded) {
        await fetch(`/api/earner/badges/${badgeClassId}/award`, {
          method: "POST",
          credentials: "include",
          headers,
        });
      }
    };
    void run();
  }, [auth, badgeClassId]);

  if (evaluating) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#030303] text-white">
        <Loader2 className="h-10 w-10 animate-spin text-[#FF3B30]" />
        <p className="text-sm text-white/55">Évaluation de votre session en cours…</p>
        <p className="max-w-sm text-center text-xs text-white/35">
          Analyse du QCM et de votre travail sur le playground.
        </p>
      </div>
    );
  }

  if (loadError || !data) {
    return (
      <div className="min-h-screen bg-[#030303] px-6 py-16 text-center text-white">
        <p>{loadError ?? "Erreur inconnue"}</p>
        <button
          type="button"
          onClick={() => router.push("/dashboard/apprenant")}
          className="mt-8 rounded-full bg-[#FF3B30] px-6 py-2.5 text-sm font-semibold uppercase tracking-wide text-white"
        >
          Retour au dashboard
        </button>
      </div>
    );
  }

  const { result, badgeClass, remediation } = data;
  const displayName = badgeClass.name || badgeName;
  const levelLabel =
    badgeClass.level != null ? `niveau ${badgeClass.level}` : "certification EDGE";
  const imageUrl = badgeClass.imageUrl ?? result.badgeImageUrl;

  if (result.awarded) {
    return (
      <div className="min-h-screen bg-[#030303] px-6 py-16 text-white">
        <div className="mx-auto max-w-lg text-center">
          <motion.div
            className="mx-auto mb-8 flex h-36 w-36 items-center justify-center"
            initial={{ rotateY: 0, scale: 0.85, opacity: 0 }}
            animate={{ rotateY: 360, scale: 1, opacity: 1 }}
            transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
            style={{ perspective: 800 }}
          >
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt=""
                className="h-32 w-32 rounded-2xl object-cover shadow-[0_0_60px_rgba(255,59,48,0.35)] ring-2 ring-[#FF3B30]/40"
              />
            ) : (
              <div className="flex h-32 w-32 items-center justify-center rounded-2xl bg-[#FF3B30]/15 ring-2 ring-[#FF3B30]/40">
                <Check className="h-16 w-16 text-[#FF3B30]" strokeWidth={2} />
              </div>
            )}
          </motion.div>

          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#FF3B30]/20">
            <Check className="h-7 w-7 text-[#FF3B30]" strokeWidth={2.5} />
          </div>

          <h1 className="text-3xl font-bold tracking-tight">Bravo</h1>
          <p className="mt-4 text-lg text-white/85">
            Vous obtenez votre badge{" "}
            <span className="font-semibold text-white">{displayName}</span> de{" "}
            <span className="text-[#FF3B30]">{levelLabel}</span>.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-white/60">
            Vous pouvez désormais l&apos;utiliser sur LinkedIn et dans le wallet EDGE. Ce badge a
            pour objectif de prouver votre compétence auprès des recruteurs, des écoles ou de vos
            clients.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <LinkedInBadgeShareButton
              badgeName={displayName}
              level={data?.badgeClass.level ?? result.badgeLevel ?? null}
              shareUrl={result.shareUrl || getBadgeCriteriaUrl(badgeClassId)}
              variant="completion"
            />
            <Link
              href="/dashboard/apprenant/badges"
              className="inline-flex rounded-full border border-white/20 px-6 py-2.5 text-sm font-semibold text-white/80 hover:bg-white/5"
            >
              Wallet EDGE
            </Link>
          </div>

          <button
            type="button"
            onClick={() => {
              router.push("/dashboard/apprenant");
              router.refresh();
            }}
            className="mt-8 rounded-full bg-[#FF3B30] px-8 py-3 text-sm font-semibold uppercase tracking-wide text-white"
          >
            Retour au dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030303] px-6 py-16 text-white">
      <div className="mx-auto max-w-lg text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.45em] text-[#FF3B30]/90">
          EDGE
        </p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight">
          C&apos;est ici que commence l&apos;apprentissage
        </h1>
        <p className="mt-5 text-lg text-white/80">
          Vous n&apos;obtenez pas votre badge{" "}
          <span className="font-semibold text-white">{displayName}</span> et{" "}
          <span className="text-white/70">{levelLabel}</span>.
        </p>

        {remediation ? (
          <p className="mt-4 text-sm leading-relaxed text-white/55">
            Pour vous permettre d&apos;obtenir votre badge, EDGE vous offre le parcours{" "}
            <span className="font-medium text-white">{remediation.courseName}</span>, vous
            permettant de repasser le badge quand vous le souhaitez.
          </p>
        ) : (
          <p className="mt-4 text-sm leading-relaxed text-white/55">
            Reprenez la formation associée pour consolider vos acquis, puis retentez l&apos;épreuve
            quand vous vous sentez prêt.
          </p>
        )}

        {result.qcmScore && result.qcmScore.total > 0 ? (
          <p className="mt-4 text-sm text-white/55">
            QCM : {result.qcmScore.correct}/{result.qcmScore.total} bonnes réponses
            {result.playgroundAnalysis ? " · Playground évalué" : ""}
          </p>
        ) : null}

        {result.message?.trim() ? (
          <div className="mt-6 rounded-xl border border-white/15 bg-white/[0.06] px-5 py-4 text-left">
            <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[#FF3B30]/90">
              Pourquoi vous n&apos;obtenez pas le badge
            </p>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-white/85">
              {result.message}
            </p>
          </div>
        ) : null}

        {result.playgroundAnalysis?.trim() ? (
          <div className="mt-4 rounded-xl border border-cyan-500/25 bg-cyan-950/30 px-5 py-4 text-left">
            <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-cyan-400/90">
              Complément playground
            </p>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-white/75">
              {result.playgroundAnalysis}
            </p>
          </div>
        ) : null}

        <div className="mt-10 flex flex-col gap-3">
          {remediation ? (
            <Link
              href={remediation.courseHref}
              className="rounded-full bg-[#FF3B30] px-8 py-3 text-sm font-semibold uppercase tracking-wide text-white"
            >
              Faire la formation
            </Link>
          ) : null}
          <button
            type="button"
            onClick={() => router.push("/dashboard/apprenant")}
            className={
              remediation
                ? "text-sm text-white/50 underline-offset-2 hover:text-white/75 hover:underline"
                : "rounded-full bg-[#FF3B30] px-8 py-3 text-sm font-semibold uppercase tracking-wide text-white"
            }
          >
            Revenir au dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
