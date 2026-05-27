"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  BadgeCheck,
  Download,
  ExternalLink,
  Mail,
  Phone,
  Share2,
  User,
} from "lucide-react";
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
  hardSkillEntries: HardSkillEntry[];
  stackTools: string[];
  toolLogoResolver: (label: string) => string | null;
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
  hardSkillEntries,
  stackTools,
  toolLogoResolver,
}: Props) {
  const nameLine =
    displayFirstName || displayLastName
      ? `${displayFirstName} ${displayLastName ? displayLastName.toUpperCase() : ""}`.trim()
      : displayName;

  return (
    <div className="min-h-screen bg-[#fafafa] font-['Inter',system-ui,sans-serif] text-[#0a0a0a]">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-48 bg-gradient-to-b from-[#FF3B30]/[0.07] to-transparent" />

      <div className="relative mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
        <motion.header
          {...fadeUp}
          className="mb-8 flex flex-wrap items-center justify-between gap-4"
        >
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-[#FF3B30]">EDGE</p>
            <p className="mt-0.5 text-xs text-black/45">Profil certifié Beyond</p>
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
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(publicUrl)}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3.5 py-2 text-xs font-medium text-black/70 shadow-sm hover:border-[#FF3B30]/30"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              LinkedIn
            </a>
            <a
              href={`mailto:?subject=Profil EDGE&body=${encodeURIComponent(publicUrl)}`}
              className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3.5 py-2 text-xs font-medium text-black/70 shadow-sm hover:border-[#FF3B30]/30"
            >
              <Mail className="h-3.5 w-3.5" />
              Email
            </a>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3.5 py-2 text-xs font-medium text-black/70 shadow-sm"
            >
              <Download className="h-3.5 w-3.5" />
              PDF
            </button>
          </div>
        </motion.header>

        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            <motion.section
              {...fadeUp}
              className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white p-6 shadow-[0_8px_40px_rgba(0,0,0,0.04)] sm:p-8"
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
              className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-[0_8px_40px_rgba(0,0,0,0.04)] sm:p-8"
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
                  className="rounded-full border border-black/10 px-3 py-1.5 text-xs font-medium text-black/60 hover:border-[#FF3B30]/40 hover:text-[#FF3B30]"
                >
                  Régénérer
                </button>
              </div>
              {isLoadingPresentation ? (
                <p className="mt-4 text-sm text-black/50">Génération en cours…</p>
              ) : presentation ? (
                <p className="mt-4 text-sm leading-relaxed text-black/70">{presentation}</p>
              ) : (
                <p className="mt-4 text-sm text-black/50">
                  Présentation indisponible pour le moment.
                </p>
              )}
            </motion.section>

            <motion.section {...fadeUp}>
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
                correlatedAnalysis={correlatedAnalysis}
              />
            </motion.section>

            {(experiences.length > 0 || diplomas.length > 0) && (
              <motion.section
                {...fadeUp}
                className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-[0_8px_40px_rgba(0,0,0,0.04)] sm:p-8"
              >
                <h2 className="text-lg font-semibold text-[#0a0a0a]">Parcours & expérience</h2>
                <div className="mt-5 space-y-4">
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
                      {exp.missions ? (
                        <p className="mt-2 text-sm text-black/60">{exp.missions}</p>
                      ) : null}
                    </div>
                  ))}
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
              </motion.section>
            )}

            {(hardSkillEntries.length > 0 || stackTools.length > 0) && (
              <motion.section
                {...fadeUp}
                className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-[0_8px_40px_rgba(0,0,0,0.04)] sm:p-8"
              >
                <h2 className="text-lg font-semibold text-[#0a0a0a]">Hard skills & stack</h2>
                {stackTools.length ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {stackTools.map((tool) => (
                      <span
                        key={tool}
                        className="inline-flex items-center gap-2 rounded-full border border-black/[0.08] bg-[#fafafa] px-3 py-1.5 text-xs font-medium"
                      >
                        {toolLogoResolver(tool) ? (
                          <img
                            src={toolLogoResolver(tool)!}
                            alt=""
                            className="h-4 w-4 object-contain"
                          />
                        ) : null}
                        {tool}
                      </span>
                    ))}
                  </div>
                ) : null}
                {hardSkillEntries.length ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {hardSkillEntries.map((skill) => (
                      <span
                        key={skill.name}
                        className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                          skill.validated
                            ? "border border-[#FF3B30]/25 bg-[#FF3B30]/10 text-[#FF3B30]"
                            : "border border-black/10 bg-[#fafafa] text-black/65"
                        }`}
                      >
                        {skill.name} · {skill.level}
                      </span>
                    ))}
                  </div>
                ) : null}
              </motion.section>
            )}
          </div>

          <motion.aside
            {...fadeUp}
            className="h-fit space-y-4 lg:sticky lg:top-8"
          >
            <div className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-[0_12px_48px_rgba(255,59,48,0.08)]">
              <h3 className="text-base font-semibold text-[#0a0a0a]">Je suis recruteur</h3>
              <p className="mt-2 text-sm text-black/55">
                Découvrez notre système de matching et contactez ce profil.
              </p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#FF3B30]/20 bg-[#FF3B30]/5 px-3 py-2 text-xs font-medium text-[#FF3B30]">
                <BadgeCheck className="h-4 w-4" />
                Profil vérifié par Beyond
              </div>
              <div className="mt-5 flex flex-col gap-2">
                <Link
                  href="/signup"
                  className="inline-flex w-full items-center justify-center rounded-full bg-[#FF3B30] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
                >
                  Créer un compte
                </Link>
                <Link
                  href="/login"
                  className="inline-flex w-full items-center justify-center rounded-full border border-black/12 px-4 py-2.5 text-sm font-semibold text-[#0a0a0a] hover:bg-black/[0.03]"
                >
                  Me connecter
                </Link>
              </div>
            </div>
          </motion.aside>
        </div>
      </div>
    </div>
  );
}
