"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
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
import { EDGE_LOGO_PATH } from "@/lib/edge-site/premium-constants";
import { sortSoftSkillsDescending } from "@/lib/soft-skills/resolve-soft-skills-result";
import { cn } from "@/lib/utils";

const DARK_CARD =
  "rounded-2xl border border-white/[0.08] bg-white/[0.04] shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-sm";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  viewport: { once: true, amount: 0.15 },
};

const motionPrintSafe = "print:!opacity-100 print:!translate-y-0";

const LINKEDIN_SHARE_INTRO =
  "Bien plus qu'un CV, découvrez mon profil certifié Byound";

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

  const topSoftSkills = useMemo(() => {
    const sorted = sortSoftSkillsDescending(softSkillsRadar);
    return sorted.slice(0, 3).map((row) => ({
      ...row,
      percent: Math.min(100, Math.round((row.score / 15) * 100)),
    }));
  }, [softSkillsRadar]);

  const shareBtn =
    "inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3.5 py-2 text-xs font-medium text-white/75 transition hover:border-[#3D7BFF]/40 hover:bg-white/[0.1] hover:text-white";

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
      <p className="text-sm text-white/45">Aucune compétence renseignée.</p>
    ) : (
      <>
        {stackTools.length ? (
          <div className="flex flex-wrap gap-2">
            {stackTools.map((tool) => (
              <span
                key={tool}
                className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.05] px-3 py-1.5 text-xs font-medium text-white/70"
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
            <PublicSkillList skills={skillCards} onSelect={setAnalysisSkill} theme="dark" />
          </div>
        ) : null}
      </>
    );

  const experiencesSection = experiences.length ? (
    <div className="space-y-4">
      {experiences.map((exp) => (
        <div
          key={`${exp.title}-${exp.company}`}
          className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4"
        >
          <p className="text-xs text-white/40">
            {exp.start} — {exp.end}
          </p>
          <p className="mt-1 font-medium text-white">{exp.title}</p>
          <p className="text-sm text-white/55">{exp.company}</p>
          {exp.missions ? <p className="mt-2 text-sm text-white/50">{exp.missions}</p> : null}
        </div>
      ))}
    </div>
  ) : (
    <p className="text-sm text-white/45">Aucune expérience renseignée.</p>
  );

  const diplomesSection = diplomas.length ? (
    <div className="space-y-4">
      {diplomas.map((dip) => (
        <div
          key={`${dip.title}-${dip.school}`}
          className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4"
        >
          <p className="text-xs text-white/40">{dip.start}</p>
          <p className="mt-1 font-medium text-white">{dip.title}</p>
          <p className="text-sm text-white/55">{dip.school}</p>
        </div>
      ))}
    </div>
  ) : (
    <p className="text-sm text-white/45">Aucun diplôme renseigné.</p>
  );

  return (
    <div
      id="public-profile-print-root"
      className="min-h-screen bg-[#060912] font-['Inter',system-ui,sans-serif] text-white print:bg-white print:text-[#0a0a0a]"
    >
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(61,123,255,0.22),transparent)] print:hidden" />
      <div className="pointer-events-none fixed inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent print:hidden" />

      <div className="relative mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-12 print:max-w-none print:px-6 print:py-4">
        <motion.header
          {...fadeUp}
          className="mb-8 flex flex-wrap items-center justify-between gap-4 print:hidden"
        >
          <div className="flex items-center gap-3">
            <Image src={EDGE_LOGO_PATH} alt="Byound" width={120} height={32} className="h-7 w-auto" />
            <span className="rounded-full border border-[#3D7BFF]/30 bg-[#3D7BFF]/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9EC0FF]">
              Profil certifié
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={onCopyLink} className={shareBtn}>
              <Share2 className="h-3.5 w-3.5" />
              Copier le lien
            </button>
            <button type="button" onClick={() => void handleLinkedInShare()} className={shareBtn}>
              <ExternalLink className="h-3.5 w-3.5" />
              LinkedIn
            </button>
            <a
              href={`mailto:?subject=${encodeURIComponent("Profil Byound")}&body=${encodeURIComponent(`${LINKEDIN_SHARE_INTRO}\n\n${publicUrl}`)}`}
              className={shareBtn}
            >
              <Mail className="h-3.5 w-3.5" />
              Email
            </a>
            <button type="button" onClick={handleDownloadPdf} className={shareBtn}>
              <Download className="h-3.5 w-3.5" />
              PDF
            </button>
          </div>
        </motion.header>

        <div className="grid gap-8 lg:grid-cols-[1fr_320px] print:block print:space-y-6">
          <div className="space-y-6">
            <motion.section
              {...fadeUp}
              className={cn(`overflow-hidden sm:p-8 p-6 ${motionPrintSafe}`, DARK_CARD, "print:border-black/10 print:bg-white")}
            >
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                {displayAvatar ? (
                  <img
                    src={displayAvatar}
                    alt={nameLine}
                    className="h-24 w-24 shrink-0 rounded-2xl border border-white/10 object-cover shadow-lg ring-2 ring-[#3D7BFF]/20"
                  />
                ) : (
                  <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-white/35">
                    <User className="h-10 w-10" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h1 className="text-2xl font-bold tracking-tight text-white sm:text-[32px]">{nameLine}</h1>
                  <p className="mt-1 text-sm text-white/50">{displayTitle}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-200">
                      <BadgeCheck className="h-3.5 w-3.5" />
                      Vérifié par Byound
                    </span>
                    {edgeReliabilityIndex > 0 ? (
                      <span className="inline-flex items-center rounded-full border border-[#3D7BFF]/25 bg-[#3D7BFF]/10 px-3 py-1 text-[11px] font-semibold text-[#9EC0FF]">
                        Fiabilité · {edgeReliabilityIndex} %
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-2.5 border-t border-white/[0.06] pt-6 sm:grid-cols-2">
                {phone ? (
                  <a
                    href={`tel:${phone.replace(/\s/g, "")}`}
                    className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm text-white/80 transition hover:border-[#3D7BFF]/30"
                  >
                    <Phone className="h-4 w-4 shrink-0 text-[#7BA7FF]" />
                    <span className="truncate">{phone}</span>
                  </a>
                ) : null}
                {email ? (
                  <a
                    href={`mailto:${email}`}
                    className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm text-white/80 transition hover:border-[#3D7BFF]/30"
                  >
                    <Mail className="h-4 w-4 shrink-0 text-[#7BA7FF]" />
                    <span className="truncate">{email}</span>
                  </a>
                ) : null}
                {birthDateLabel && birthDateLabel !== "—" ? (
                  <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm text-white/75">
                    <span className="text-white/40">Naissance</span>
                    <span>{birthDateLabel}</span>
                  </div>
                ) : null}
                {displayTitle ? (
                  <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm text-white/75">
                    <span className="text-white/40">Situation</span>
                    <span>{displayTitle}</span>
                  </div>
                ) : null}
              </div>
            </motion.section>

            <motion.section
              {...fadeUp}
              className={cn(`p-6 sm:p-8 ${motionPrintSafe}`, DARK_CARD, "print:bg-white")}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#7BA7FF]/90">
                    Présentation
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-white">Synthèse du profil</h2>
                </div>
                <button
                  type="button"
                  onClick={onRegeneratePresentation}
                  className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-white/55 hover:border-[#3D7BFF]/40 hover:text-white print:hidden"
                >
                  Régénérer
                </button>
              </div>
              {isLoadingPresentation ? (
                <p className="mt-4 text-sm text-white/45">Génération en cours…</p>
              ) : sanitizedPresentation ? (
                <p className="mt-4 text-sm leading-relaxed text-white/70">{sanitizedPresentation}</p>
              ) : (
                <p className="mt-4 text-sm text-white/45">Présentation indisponible pour le moment.</p>
              )}
            </motion.section>

            {showBadges && earnedOpenBadges.length > 0 ? (
              <motion.section
                {...fadeUp}
                className={cn(`p-6 sm:p-8 ${motionPrintSafe}`, DARK_CARD, "print:bg-white")}
              >
                <div className="mb-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#7BA7FF]/90">
                    Certifications
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-white">Open Badges obtenus</h2>
                </div>
                <ul className="flex flex-wrap gap-4">
                  {earnedOpenBadges.map((badge) => (
                    <li key={badge.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedBadge(badge)}
                        className="group flex flex-col items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 transition hover:border-[#3D7BFF]/35 hover:bg-white/[0.06]"
                      >
                        {badge.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={badge.imageUrl}
                            alt=""
                            className="h-24 w-24 object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.45)]"
                          />
                        ) : (
                          <div className="flex h-24 w-24 items-center justify-center rounded-lg bg-[#3D7BFF]/10">
                            <Award className="h-9 w-9 text-[#9EC0FF]" />
                          </div>
                        )}
                        <span className="max-w-[140px] text-center text-xs font-medium text-white/75 group-hover:text-[#9EC0FF]">
                          {badge.name}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </motion.section>
            ) : null}

            {topSoftSkills.length > 0 ? (
              <motion.section {...fadeUp} className={cn(`p-6 sm:p-8 ${motionPrintSafe}`, DARK_CARD)}>
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#7BA7FF]/90">
                  Soft skills
                </p>
                <h2 className="mt-1 text-lg font-semibold text-white">Top 3 — forces mesurées</h2>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  {topSoftSkills.map((row, index) => (
                    <div
                      key={row.skill}
                      className={cn(
                        "rounded-xl border p-4",
                        index === 0
                          ? "border-[#3D7BFF]/35 bg-gradient-to-br from-[#3D7BFF]/20 to-white/[0.04]"
                          : "border-white/[0.08] bg-white/[0.03]",
                      )}
                    >
                      <p className="text-[11px] font-semibold text-white/40">#{index + 1}</p>
                      <p className="mt-1 text-[15px] font-semibold text-white">{row.skill}</p>
                      <p className="mt-2 text-2xl font-bold tabular-nums text-[#9EC0FF]">{row.percent} %</p>
                    </div>
                  ))}
                </div>
              </motion.section>
            ) : null}

            <motion.section {...fadeUp} className={motionPrintSafe}>
              <div className="mb-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#7BA7FF]/90">
                  Bilans
                </p>
                <h2 className="mt-1 text-lg font-semibold text-white">Tests & compétences</h2>
              </div>
              <ApprenantAssessmentResults
                variant="compact"
                publicMode
                publicProfileDark
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
                className={cn(`p-6 sm:p-8 ${motionPrintSafe}`, DARK_CARD, "print:bg-white")}
              >
                <h2 className="text-lg font-semibold text-white">Profil professionnel</h2>
                <ProfileSectionStack
                  className="mt-5 [&_button]:text-white/70 [&_button[data-state=active]]:text-white"
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
            <div className={cn("p-6", DARK_CARD)}>
              {edgeReliabilityIndex > 0 ? (
                <EdgeReliabilityBadge
                  score={edgeReliabilityIndex}
                  theme="dark"
                  className="mb-5 border-0 bg-transparent p-0 shadow-none"
                />
              ) : null}
              <h3 className="text-base font-semibold text-white">Vous recrutez ?</h3>
              <p className="mt-2 text-sm text-white/50">
                Découvrez le matching Byound et contactez ce profil en toute confiance.
              </p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-200">
                <BadgeCheck className="h-4 w-4" />
                Profil vérifié par Byound
              </div>
              <div className="mt-5 flex flex-col gap-2">
                <Link
                  href="/entreprises/connexion"
                  className="inline-flex w-full items-center justify-center rounded-full bg-[#3D7BFF] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#356ee0]"
                >
                  Créer un compte
                </Link>
                <Link
                  href="/entreprises/connexion"
                  className="inline-flex w-full items-center justify-center rounded-full border border-white/15 px-4 py-2.5 text-sm font-semibold text-white/85 hover:bg-white/[0.06]"
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
