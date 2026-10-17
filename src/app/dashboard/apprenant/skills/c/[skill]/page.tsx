"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { FileText, Link2, Trash2 } from "lucide-react";

import { EdgePageAmbiance } from "@/components/apprenant/edge-page-ambiance";
import { SkillsEmptyHint } from "@/components/apprenant/skills/skills-ui";
import { useEdgeSkillsCenter } from "@/hooks/use-edge-skills-center";
import { decodeSkillParam, encodeSkillParam } from "@/lib/apprenant/edge-skills-center";
import {
  APPRENANT_PAGE_SHELL,
  CONNECT_BTN_PRIMARY,
  CONNECT_BTN_SECONDARY,
} from "@/lib/apprenant/connect-nav";
import { getSkillDeclarationStatus, listSkillProofs } from "@/lib/hard-skills/hard-skills-portfolio";
import { foldSkillKey } from "@/lib/hard-skills/skill-catalog-policy";

const HELP =
  "Vos preuves constituent votre portfolio. Certaines compétences peuvent aussi être certifiées par un Open Badge.";

export default function SkillsSkillDetailPage() {
  const params = useParams();
  const raw = typeof params.skill === "string" ? params.skill : "";
  const skillName = decodeSkillParam(raw);
  const { loading, records, meta, earnedBadgeNames, visibleBadges, removeSkillProof } = useEdgeSkillsCenter();
  const [removing, setRemoving] = useState<string | null>(null);

  const record = records.find((item) => foldSkillKey(item.name) === foldSkillKey(skillName)) ?? null;
  const stored = record ? meta[record.name] : undefined;
  const badgeEarned = earnedBadgeNames.some((name) => foldSkillKey(name) === foldSkillKey(record?.name ?? skillName));
  const status = getSkillDeclarationStatus(stored, { badgeEarned });
  const proofs = listSkillProofs(stored);
  const availableBadge = visibleBadges.find((badge) => foldSkillKey(badge.name) === foldSkillKey(record?.name ?? skillName));
  const target = stored?.trainingTargetLevel;

  const remove = async (proofId: string) => {
    if (!record) return;
    setRemoving(proofId);
    try {
      await removeSkillProof(record.name, proofId);
    } finally {
      setRemoving(null);
    }
  };

  return (
    <EdgePageAmbiance ambiance="skills">
      <div className={`${APPRENANT_PAGE_SHELL} max-w-2xl pb-24`}>
        <Link href="/dashboard/apprenant/skills/competences" className="text-[13px] text-white/40 transition hover:text-white">
          ← Mes compétences
        </Link>

        {loading && (
          <div className="mt-8">
            <SkillsEmptyHint>Chargement…</SkillsEmptyHint>
          </div>
        )}

        {!loading && !record && (
          <div className="mt-8 space-y-4">
            <h1 className="text-[28px] font-bold text-white">{skillName || "Compétence"}</h1>
            <SkillsEmptyHint>Cette compétence n’est pas encore dans votre capital.</SkillsEmptyHint>
            <Link href={`/dashboard/apprenant/skills/develop?skill=${encodeSkillParam(skillName)}`} className={CONNECT_BTN_PRIMARY}>
              Déclarer cette compétence
            </Link>
          </div>
        )}

        {!loading && record && (
          <>
            <header className="mt-6 space-y-3">
              <p className="text-[13px] text-white/55">{record.category}</p>
              <h1 className="text-[32px] font-bold tracking-[-0.03em] text-white sm:text-[40px]">{record.name}</h1>
              <span className="inline-flex rounded-full border border-white/20 px-2.5 py-0.5 text-[12px] text-white">
                {status.label}
              </span>
              <p className="text-[15px] text-white/80">
                Auto-évaluation : {record.level}
                {target ? ` · Objectif : ${target}` : ""}
              </p>
            </header>

            <section className="mt-10 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-[18px] font-semibold text-white">Mes preuves</h2>
                <Link href={`/dashboard/apprenant/skills/prove?skill=${encodeSkillParam(record.name)}`} className={CONNECT_BTN_SECONDARY}>
                  Ajouter une preuve
                </Link>
              </div>
              {proofs.length === 0 ? (
                <SkillsEmptyHint>Aucune preuve déposée pour cette compétence.</SkillsEmptyHint>
              ) : (
                <ul className="space-y-3">
                  {proofs.map((proof) => {
                    const href = proof.url?.startsWith("http") ? proof.url : undefined;
                    const isImage = Boolean(href && /\.(png|jpe?g|webp|gif)(\?|$)/i.test(href));
                    const isPdf = Boolean(href && /\.pdf(\?|$)/i.test(href));
                    const isVideo = Boolean(href && /\.(mp4|webm|mov)(\?|$)/i.test(href));
                    return (
                      <li key={proof.id} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
                        {isImage && href ? <img src={href} alt="" className="max-h-56 w-full bg-black object-contain" /> : null}
                        {isPdf && href ? <iframe title={proof.title} src={href} className="h-64 w-full bg-white" /> : null}
                        {isVideo && href ? <video src={href} controls className="max-h-56 w-full bg-black" /> : null}
                        <div className="flex items-start justify-between gap-3 px-4 py-3">
                          <div className="min-w-0">
                            <p className="flex items-center gap-2 text-[14px] font-medium text-white">
                              {proof.type === "link" ? <Link2 className="h-4 w-4 text-white/40" /> : <FileText className="h-4 w-4 text-white/40" />}
                              {proof.title}
                            </p>
                            {proof.createdAt ? (
                              <p className="mt-1 text-[12px] text-white/40">
                                {new Date(proof.createdAt).toLocaleDateString("fr-FR")}
                              </p>
                            ) : null}
                            {href ? (
                              <a href={href} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-[12px] text-[#9EC0FF] hover:underline">
                                Ouvrir
                              </a>
                            ) : null}
                          </div>
                          <button
                            type="button"
                            disabled={removing === proof.id}
                            onClick={() => void remove(proof.id)}
                            className="rounded-full border border-white/15 p-2 text-white/70 hover:text-white"
                            aria-label="Supprimer la preuve"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            {availableBadge ? (
              <section className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <h2 className="text-[16px] font-semibold text-white">Open Badge disponible</h2>
                <p className="mt-2 text-[14px] text-white/60">{availableBadge.name}</p>
                <Link href={availableBadge.presentationHref} className={`${CONNECT_BTN_PRIMARY} mt-4 inline-flex`}>
                  Voir le badge
                </Link>
              </section>
            ) : null}

            <p className="mt-10 text-[14px] leading-relaxed text-white/55">{HELP}</p>
          </>
        )}
      </div>
    </EdgePageAmbiance>
  );
}
