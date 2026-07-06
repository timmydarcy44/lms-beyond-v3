"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Award,
  BadgeCheck,
  Download,
  ExternalLink,
  Mail,
  Phone,
  Share2,
  User,
} from "lucide-react";
import type { PublicProfileEarnedBadge } from "@/lib/openbadges/public-profile-earned-badges";
import { PublicProfileBadgeOverlay } from "@/components/public-profile/public-profile-badge-overlay";
import { PublicSkillList } from "@/components/public-profile/public-skill-list";
import { PublicSkillAnalysisModal } from "@/components/public-profile/public-skill-analysis-modal";
import { EdgeReliabilityBadge } from "@/components/public-profile/edge-reliability-badge";
import type { PublicSkillCardData } from "@/lib/hard-skills/skill-validation-analysis";
import { ProfileSectionStack } from "@/components/profile/profile-section-stack";
import { sanitizeProfileAnalysisTone } from "@/lib/learner/profile-analysis-tone";
import {
  ApprenantAssessmentResults,
  type DiscScores,
} from "@/components/apprenant/apprenant-assessment-results";
import type { AxisKey } from "@/components/idmc/IdmcRadarChart";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  viewport: { once: true, amount: 0.15 },
};

const motionPrintSafe = "print:!opacity-100 print:!translate-y-0";

const LINKEDIN_SHARE_INTRO =
  "Bien plus qu'un CV, découvrez mon profil complet avec EDGE";

type Experience = {
  start: string;
  end: string;
  title: string;
  company: string;
  missions: string;
};

type Diploma = {
  start: string;
  end: string;
  title: string;
  school: string;
  status: string;
};

type HardSkillEntry = {
  name: string;
  level: string;
  validated: boolean;
};

type Props = {
  displayName: string;
  displayFirstName: string;
  displayLastName: string;
  displayTitle: string;
  displayAvatar: string;
  phone: string;
  email: string;
  birthDateLabel: string;
  presentation: string;
  isLoadingPresentation: boolean;
  onRegeneratePresentation: () => void;
  discScores: DiscScores | null;
  idmcAxes: Record<AxisKey, number> | null;
  softSkillsRadar: Array<{ skill: string; score: number }>;
  correlatedAnalysis?: string | null;
  publicUrl: string;
  onCopyLink: () => void;
  experiences: Experience[];
  diplomas: Diploma[];
  hardSkillEntries?: HardSkillEntry[];
  publicSkillCards?: PublicSkillCardData[];
  edgeReliabilityIndex?: number;
  stackTools: string[];
  toolLogoResolver: (label: string) => string | null;
  earnedOpenBadges?: PublicProfileEarnedBadge[];
  showBadges?: boolean;
};

export function EdgePublicProfileView({
  displayName,
  displayFirstName,
  displayLastName,
  displayTitle,
  displayAvatar,
  phone,
  email,
  birthDateLabel,
  presentation,
  isLoadingPresentation,
  onRegeneratePresentation,
  discScores,
  idmcAxes,
  softSkillsRadar,
  correlatedAnalysis,
  publicUrl,
  onCopyLink,
  experiences,
  diplomas,
  hardSkillEntries = [],
  publicSkillCards = [],
  edgeReliabilityIndex = 0,
  stackTools,
  toolLogoResolver,
  earnedOpenBadges = [],
  showBadges = true,
}: Props) {
  const [selectedBadge, setSelectedBadge] = useState<PublicProfileEarnedBadge | null>(null);
  const [analysisSkill, setAnalysisSkill] = useState<PublicSkillCardData | null>(null);

  const skillCards =
    publicSkillCards.length > 0
      ? publicSkillCards
      : hardSkillEntries.map((s) => ({
          name: s.name,
          category: "Compétence",
          declaredLevel: s.level as PublicSkillCardData["declaredLevel"],
          estimatedLevel: s.level as PublicSkillCardData["estimatedLevel"],
          status: s.validated ? ("validated" as const) : ("declared" as const),
          statusLabel: s.validated ? "Validée" : "Déclarée",
          confidenceScore: null,
          hasAnalysis: false,
        }));

  const sanitizedPresentation = presentation ? sanitizeProfileAnalysisTone(presentation) : "";
  const sanitizedCorrelatedAnalysis = correlatedAnalysis
    ? typeof correlatedAnalysis === "string"
      ? sanitizeProfileAnalysisTone(correlatedAnalysis)
      : correlatedAnalysis
    : null;

  const nameLine =
    displayFirstName || displayLastName
      ? `${displayFirstName} ${displayLastName ? displayLastName.toUpperCase() : ""}`.trim()
      : displayName;

  const handleLinkedInShare = async () => {
    const shareText = `${LINKEDIN_SHARE_INTRO}\n\n${publicUrl}`;
    try {
      await navigator.clipboard.writeText(shareText);
      toast.success("Texte de partage copié — collez-le dans votre publication LinkedIn.");
    } catch {
      toast.message(LINKEDIN_SHARE_INTRO, { description: publicUrl });
    }
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(publicUrl)}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const handleDownloadPdf = () => {
    window.print();
  };

  const competencesSection =
    stackTools.length === 0 && skillCards.length === 0 ? (
      <p className="text-sm text-black/50">Aucune compétence renseignée.</p>
    ) : (
      <>
        {stackTools.length ? (
          <div className="flex flex-wrap gap-2">
            {stackTools.map((tool) => (
              <span
                key={tool}
                className="inline-flex items-center gap-2 rounded-full border border-black/[0.08] bg-[#fafafa] px-3 py-1.5 text-xs font-medium"
              >
                {toolLogoResolver(tool) ? (
                  <img src={toolLogoResolver(tool)!} alt="" className="h-4 w-4 object-contain" />
                ) : null}
                {tool}
              </span>
            ))}
          </div>
        ) : null}
        {skillCards.length ? (
          <div className={stackTools.length ? "mt-5" : ""}>
            <PublicSkillList skills={skillCards} onSelect={setAnalysisSkill} />
          </div>
        ) : null}
      </>
    );

  const experiencesSection = experiences.length ? (
    <div className="space-y-4">
      {experiences.map((exp) => (
        <div
          key={`${exp.title}-${exp.company}`}
          className="rounded-xl border border-black/[0.06] bg-[#fafafa] p-4"
        >
          <p className="text-xs text-black/45">
            {exp.start} — {exp.end}
          </p>
          <p className="mt-1 font-medium text-[#0a0a0a]">{exp.title}</p>
          <p className="text-sm text-black/55">{exp.company}</p>
          {exp.missions ? <p className="mt-2 text-sm text-black/60">{exp.missions}</p> : null}
        </div>
      ))}
    </div>
  ) : (
    <p className="text-sm text-black/50">Aucune expérience renseignée.</p>
  );

  const diplomesSection = diplomas.length ? (
    <div className="space-y-4">
      {diplomas.map((dip) => (
        <div
          key={`${dip.title}-${dip.school}`}
          className="rounded-xl border border-black/[0.06] bg-[#fafafa] p-4"
        >
          <p className="text-xs text-black/45">{dip.start}</p>
          <p className="mt-1 font-medium text-[#0a0a0a]">{dip.title}</p>
          <p className="text-sm text-black/55">{dip.school}</p>
        </div>
      ))}
    </div>
  ) : (
    <p className="text-sm text-black/50">Aucun diplôme renseigné.</p>
  );

  return (
    <div
      id="public-profile-print-root"
      className="min-h-screen bg-[#fafafa] font-['Inter',system-ui,sans-serif] text-[#0a0a0a] print:bg-white"
    >
      <div className="pointer-events-none fixed inset-x-0 top-0 h-48 bg-gradient-to-b from-[#FF3B30]/[0.07] to-transparent print:hidden" />

      <div className="relative mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-12 print:max-w-none print:px-6 print:py-4">
        <motion.header
          {...fadeUp}
          className="mb-8 flex flex-wrap items-center justify-between gap-4 print:hidden"
        >
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-[#FF3B30]">EDGE</p>
            <p className="mt-0.5 text-xs text-black/45">Profil certifié EDGE</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onCopyLink}
              className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3.5 py-2 text-xs font-medium text-black/70 shadow-sm hover:border-[#FF3B30]/30"
            >
              <Share2 className="h-3.5 w-3.5" />
              Copier le lien
            </button>
            <button
              type="button"
              onClick={() => void handleLinkedInShare()}
              className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3.5 py-2 text-xs font-medium text-black/70 shadow-sm hover:border-[#FF3B30]/30"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              LinkedIn
            </button>
            <a
              href={`mailto:?subject=${encodeURIComponent("Profil EDGE")}&body=${encodeURIComponent(`${LINKEDIN_SHARE_INTRO}\n\n${publicUrl}`)}`}
              className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3.5 py-2 text-xs font-medium text-black/70 shadow-sm hover:border-[#FF3B30]/30"
            >
              <Mail className="h-3.5 w-3.5" />
              Email
            </a>
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3.5 py-2 text-xs font-medium text-black/70 shadow-sm hover:border-[#FF3B30]/30"
            >
              <Download className="h-3.5 w-3.5" />
              PDF
            </button>
          </div>
        </motion.header>

        <div className="grid gap-8 lg:grid-cols-[1fr_320px] print:block print:space-y-6">
          <div className="space-y-6">
            <motion.section
              {...fadeUp}
              className={`overflow-hidden rounded-2xl border border-black/[0.06] bg-white p-6 shadow-[0_8px_40px_rgba(0,0,0,0.04)] sm:p-8 ${motionPrintSafe}`}
            >
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                {displayAvatar ? (
                  <img
                    src={displayAvatar}
                    alt={nameLine}
                    className="h-24 w-24 shrink-0 rounded-2xl border border-black/[0.08] object-cover shadow-md"
                  />
                ) : (
                  <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border border-black/[0.08] bg-[#f5f5f3] text-black/35">
                    <User className="h-10 w-10" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h1 className="text-2xl font-semibold tracking-tight text-[#0a0a0a] sm:text-3xl">
                    {nameLine}
                  </h1>
                  <p className="mt-1 text-sm text-black/50">{displayTitle}</p>
                  {edgeReliabilityIndex > 0 ? (
                    <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-[#FF3B30]/20 bg-[#FF3B30]/5 px-3 py-1.5 text-xs font-semibold text-[#FF3B30]">
                      Indice de fiabilité EDGE · {edgeReliabilityIndex} %
                    </p>
                  ) : null}
                </div>
              </div>

              <ol className="mt-6 space-y-2.5 border-t border-black/[0.06] pt-6 text-sm">
                {phone ? (
                  <li className="flex items-center gap-3 text-black/75">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#FF3B30]/10 text-[11px] font-semibold text-[#FF3B30]">
                      1
                    </span>
                    <Phone className="h-4 w-4 shrink-0 text-black/35" />
                    <a href={`tel:${phone.replace(/\s/g, "")}`} className="hover:text-[#FF3B30]">
                      {phone}
                    </a>
                  </li>
                ) : null}
                {email ? (
                  <li className="flex items-center gap-3 text-black/75">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#FF3B30]/10 text-[11px] font-semibold text-[#FF3B30]">
                      {phone ? 2 : 1}
                    </span>
                    <Mail className="h-4 w-4 shrink-0 text-black/35" />
                    <a href={`mailto:${email}`} className="hover:text-[#FF3B30]">
                      {email}
                    </a>
                  </li>
                ) : null}
                {birthDateLabel && birthDateLabel !== "—" ? (
                  <li className="flex items-center gap-3 text-black/75">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#FF3B30]/10 text-[11px] font-semibold text-[#FF3B30]">
                      {(phone ? 1 : 0) + (email ? 1 : 0) + 1}
                    </span>
                    <span>Date de naissance · {birthDateLabel}</span>
                  </li>
                ) : null}
                {displayTitle ? (
                  <li className="flex items-center gap-3 text-black/75">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#FF3B30]/10 text-[11px] font-semibold text-[#FF3B30]">
                      {(phone ? 1 : 0) + (email ? 1 : 0) + (birthDateLabel && birthDateLabel !== "—" ? 1 : 0) + 1}
                    </span>
                    <span>Situation · {displayTitle}</span>
                  </li>
                ) : null}
              </ol>
            </motion.section>

            <motion.section
              {...fadeUp}
              className={`rounded-2xl border border-black/[0.06] bg-white p-6 shadow-[0_8px_40px_rgba(0,0,0,0.04)] sm:p-8 ${motionPrintSafe}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-[#FF3B30]">
                    Présentation
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-[#0a0a0a]">Synthèse du profil</h2>
                </div>
                <button
                  type="button"
                  onClick={onRegeneratePresentation}
                  className="rounded-full border border-black/10 px-3 py-1.5 text-xs font-medium text-black/60 hover:border-[#FF3B30]/40 hover:text-[#FF3B30] print:hidden"
                >
                  Régénérer
                </button>
              </div>
              {isLoadingPresentation ? (
                <p className="mt-4 text-sm text-black/50">Génération en cours…</p>
              ) : sanitizedPresentation ? (
                <p className="mt-4 text-sm leading-relaxed text-black/70">{sanitizedPresentation}</p>
              ) : (
                <p className="mt-4 text-sm text-black/50">
                  Présentation indisponible pour le moment.
                </p>
              )}
            </motion.section>

            {showBadges && earnedOpenBadges.length > 0 ? (
              <motion.section
                {...fadeUp}
                className={`rounded-2xl border border-black/[0.06] bg-white p-6 shadow-[0_8px_40px_rgba(0,0,0,0.04)] sm:p-8 ${motionPrintSafe}`}
              >
                <div className="mb-4">
                  <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-[#FF3B30]">
                    Certifications
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-[#0a0a0a]">Open Badges obtenus</h2>
                </div>
                <ul className="flex flex-wrap gap-3">
                  {earnedOpenBadges.map((badge) => (
                    <li key={badge.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedBadge(badge)}
                        className="group flex flex-col items-center gap-2 rounded-xl border border-black/[0.08] bg-[#fafafa] p-3 transition hover:border-[#FF3B30]/35 hover:shadow-md"
                      >
                        {badge.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={badge.imageUrl}
                            alt=""
                            className="h-16 w-16 rounded-lg object-cover ring-1 ring-black/10"
                          />
                        ) : (
                          <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-[#FF3B30]/10">
                            <Award className="h-7 w-7 text-[#FF3B30]" />
                          </div>
                        )}
                        <span className="max-w-[120px] truncate text-center text-xs font-medium text-black/75 group-hover:text-[#FF3B30]">
                          {badge.name}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </motion.section>
            ) : null}

            <motion.section {...fadeUp} className={motionPrintSafe}>
              <div className="mb-4">
                <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-[#FF3B30]">
                  Bilans
                </p>
                <h2 className="mt-1 text-lg font-semibold text-[#0a0a0a]">Tests & compétences</h2>
              </div>
              <ApprenantAssessmentResults
                variant="compact"
                publicMode
                firstName={displayFirstName || displayName.split(" ")[0]}
                discScores={discScores}
                idmcAxes={idmcAxes}
                softSkillsRadar={softSkillsRadar}
                correlatedAnalysis={sanitizedCorrelatedAnalysis}
              />
            </motion.section>

            {(skillCards.length > 0 ||
              stackTools.length > 0 ||
              experiences.length > 0 ||
              diplomas.length > 0) && (
              <motion.section
                {...fadeUp}
                className={`rounded-2xl border border-black/[0.06] bg-white p-6 shadow-[0_8px_40px_rgba(0,0,0,0.04)] sm:p-8 ${motionPrintSafe}`}
              >
                <h2 className="text-lg font-semibold text-[#0a0a0a]">Profil professionnel</h2>
                <ProfileSectionStack
                  className="mt-5"
                  sections={[
                    { id: "competences", label: "Compétences", content: competencesSection },
                    { id: "experiences", label: "Expériences", content: experiencesSection },
                    { id: "diplomes", label: "Diplômes", content: diplomesSection },
                  ]}
                />
              </motion.section>
            )}
          </div>

          <motion.aside
            {...fadeUp}
            className="h-fit space-y-4 lg:sticky lg:top-8 print:hidden"
          >
            <div className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-[0_12px_48px_rgba(255,59,48,0.08)]">
              {edgeReliabilityIndex > 0 ? (
                <EdgeReliabilityBadge score={edgeReliabilityIndex} className="mb-5 border-0 bg-transparent p-0 shadow-none" />
              ) : null}
              <h3 className="text-base font-semibold text-[#0a0a0a]">Je suis recruteur</h3>
              <p className="mt-2 text-sm text-black/55">
                Découvrez notre système de matching et contactez ce profil.
              </p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#FF3B30]/20 bg-[#FF3B30]/5 px-3 py-2 text-xs font-medium text-[#FF3B30]">
                <BadgeCheck className="h-4 w-4" />
                Profil vérifié par EDGE
              </div>
              <div className="mt-5 flex flex-col gap-2">
                <Link
                  href="/entreprises/connexion"
                  className="inline-flex w-full items-center justify-center rounded-full bg-[#FF3B30] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
                >
                  Créer un compte
                </Link>
                <Link
                  href="/entreprises/connexion"
                  className="inline-flex w-full items-center justify-center rounded-full border border-black/12 px-4 py-2.5 text-sm font-semibold text-[#0a0a0a] hover:bg-black/[0.03]"
                >
                  Me connecter
                </Link>
              </div>
            </div>
          </motion.aside>
        </div>
      </div>

      {analysisSkill ? (
        <PublicSkillAnalysisModal skill={analysisSkill} onClose={() => setAnalysisSkill(null)} />
      ) : null}

      {selectedBadge ? (
        <PublicProfileBadgeOverlay badge={selectedBadge} onClose={() => setSelectedBadge(null)} />
      ) : null}

      <style jsx global>{`
        @media print {
          @page {
            margin: 12mm;
          }
          body {
            background: white !important;
          }
          #public-profile-print-root section,
          #public-profile-print-root .rounded-2xl {
            break-inside: avoid;
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}
