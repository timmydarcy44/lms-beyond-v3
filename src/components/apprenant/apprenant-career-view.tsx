"use client";

import Link from "next/link";
import {
  Briefcase,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  Pencil,
  Share2,
  Sparkles,
} from "lucide-react";
import {
  ApprenantAssessmentResults,
  type DiscScores,
} from "@/components/apprenant/apprenant-assessment-results";
import type { AxisKey } from "@/components/idmc/IdmcRadarChart";
import {
  APPRENANT_CARD_CLASS,
  APPRENANT_PAGE_KICKER,
  APPRENANT_PAGE_LEAD,
  APPRENANT_PAGE_SHELL,
  APPRENANT_PAGE_TITLE,
  CONNECT_BTN_OUTLINE,
  CONNECT_BTN_PRIMARY,
  CONNECT_BTN_SECONDARY,
  CONNECT_PROGRESS_FILL,
  CONNECT_PROGRESS_TRACK,
} from "@/lib/apprenant/connect-nav";
import { getProfileSituationLabel } from "@/lib/apprenant/profile-situation";

type ProfileDetail = { label: string; value: string };

type ExperiencePro = {
  id?: string;
  employeur?: string | null;
  type_contrat?: string | null;
  date_debut?: string | null;
  date_fin?: string | null;
  missions?: string | null;
};

type Diplome = {
  id?: string;
  intitule?: string | null;
  ecole?: string | null;
  annee_obtention?: number | null;
  mode?: string | null;
};

type Props = {
  fullName: string;
  firstName: string;
  email: string;
  phone: string;
  city: string;
  birthDateLabel: string;
  situationLabel: string;
  avatarUrl?: string | null;
  presentation: string;
  isRegeneratingBio: boolean;
  onRegenerateBio: () => void;
  onEditProfile: () => void;
  onShareProfile: () => void;
  profileCompletion: {
    score: number;
    level: string;
    checklist: ReadonlyArray<{ key: string; label: string; weight: number; done: boolean }>;
  };
  isProfileGaugeExpanded: boolean;
  onToggleGauge: () => void;
  testStatus: { comportemental: boolean; idmc: boolean; softSkills: boolean };
  discScores: DiscScores | null;
  idmcAxes: Record<AxisKey, number> | null;
  softSkillsRadar: Array<{ skill: string; score: number }>;
  profileDetails: ProfileDetail[];
  experiencesPro: ExperiencePro[];
  diplomes: Diplome[];
  formatRange: (start?: string | null, end?: string | null) => string;
  qualificationMissing: boolean;
  onOpenQualification: () => void;
};

export function ApprenantCareerView({
  fullName,
  firstName,
  email,
  phone,
  city,
  birthDateLabel,
  situationLabel,
  avatarUrl,
  presentation,
  isRegeneratingBio,
  onRegenerateBio,
  onEditProfile,
  onShareProfile,
  profileCompletion,
  isProfileGaugeExpanded,
  onToggleGauge,
  testStatus,
  discScores,
  idmcAxes,
  softSkillsRadar,
  profileDetails,
  experiencesPro,
  diplomes,
  formatRange,
  qualificationMissing,
  onOpenQualification,
}: Props) {
  return (
    <div className={APPRENANT_PAGE_SHELL}>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className={APPRENANT_PAGE_KICKER}>Carrière</p>
          <h1 className={APPRENANT_PAGE_TITLE}>Ma carrière</h1>
          <p className={`mt-2 ${APPRENANT_PAGE_LEAD}`}>
            Votre identité, vos bilans et votre parcours — prêts à être partagés avec les recruteurs.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onEditProfile} className={CONNECT_BTN_SECONDARY}>
            <Pencil className="mr-1.5 inline h-3.5 w-3.5" />
            Modifier mon profil
          </button>
          <button type="button" onClick={onShareProfile} className={CONNECT_BTN_OUTLINE}>
            <Share2 className="mr-1.5 inline h-3.5 w-3.5" />
            Partager
          </button>
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        {[
          { label: "DISC", done: testStatus.comportemental, href: "/dashboard/apprenant/test-comportemental-intro" },
          { label: "IDMC", done: testStatus.idmc, href: "/dashboard/apprenant/idmc-intro" },
          { label: "Soft skills", done: testStatus.softSkills, href: "/dashboard/apprenant/soft-skills-intro" },
        ].map((item) => (
          <span
            key={item.label}
            className={`rounded-full border px-3 py-1 text-[11px] font-medium ${
              item.done
                ? "border-[#FF3B30]/25 bg-[#FF3B30]/10 text-[#FF3B30]"
                : "border-black/10 bg-white text-black/50"
            }`}
          >
            {item.label} · {item.done ? "Réalisé" : "À faire"}
          </span>
        ))}
      </div>

      {qualificationMissing ? (
        <div className="rounded-xl border border-amber-400/40 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-medium">Complétez votre fiche carrière</p>
          <p className="mt-1 text-amber-800/90">
            Certaines informations liées à votre situation professionnelle sont manquantes.
          </p>
          <button type="button" onClick={onOpenQualification} className={`${CONNECT_BTN_PRIMARY} mt-3`}>
            Compléter maintenant
          </button>
        </div>
      ) : null}

      <section className={APPRENANT_CARD_CLASS}>
        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#FF3B30]">
            Progression du profil
          </p>
          <button
            type="button"
            onClick={onToggleGauge}
            className="inline-flex items-center gap-1 rounded-full border border-black/10 px-3 py-1 text-[11px] text-black/60"
          >
            {isProfileGaugeExpanded ? "Réduire" : "Détails"}
            {isProfileGaugeExpanded ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
        <div className="mt-3 flex items-end justify-between gap-4">
          <span className="text-3xl font-semibold text-[#0a0a0a]">{profileCompletion.score}%</span>
          <span className="text-xs font-medium text-[#FF3B30]">{profileCompletion.level}</span>
        </div>
        <div className={`mt-3 ${CONNECT_PROGRESS_TRACK}`}>
          <div className={CONNECT_PROGRESS_FILL} style={{ width: `${profileCompletion.score}%` }} />
        </div>
        {isProfileGaugeExpanded ? (
          <ul className="mt-4 space-y-2 text-[11px] text-black/65">
            {profileCompletion.checklist.map((item) => (
              <li key={item.key} className="flex items-center justify-between gap-3">
                <span>{item.label}</span>
                <span className={item.done ? "font-medium text-[#FF3B30]" : "text-black/40"}>
                  {item.done ? `+${item.weight}` : "0"}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className={APPRENANT_CARD_CLASS}>
        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#FF3B30]">Identité</p>
        <div className="mt-4 flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-black/[0.08] bg-[#f5f5f3] text-2xl font-semibold text-[#FF3B30]">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              (firstName || fullName).charAt(0).toUpperCase()
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-semibold text-[#0a0a0a]">{fullName}</h2>
            <ol className="mt-4 space-y-2 text-sm text-black/75">
              <li>
                <span className="text-black/45">E-mail · </span>
                {email}
              </li>
              <li>
                <span className="text-black/45">Téléphone · </span>
                {phone}
              </li>
              <li>
                <span className="text-black/45">Date de naissance · </span>
                {birthDateLabel}
              </li>
              <li>
                <span className="text-black/45">Ville · </span>
                {city}
              </li>
              <li>
                <span className="text-black/45">Situation · </span>
                {situationLabel}
              </li>
            </ol>
            {profileDetails.length ? (
              <div className="mt-4 rounded-xl border border-black/[0.06] bg-white p-4">
                <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-[#FF3B30]">
                  Détails professionnels
                </p>
                <dl className="mt-2 grid gap-2 sm:grid-cols-2">
                  {profileDetails.map((item) => (
                    <div key={item.label}>
                      <dt className="text-xs text-black/45">{item.label}</dt>
                      <dd className="text-sm font-medium text-[#0a0a0a]">{item.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className={APPRENANT_CARD_CLASS}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#FF3B30]">
              Présentation
            </p>
            <h2 className="mt-1 text-base font-semibold text-[#0a0a0a]">Synthèse IA</h2>
          </div>
          <button
            type="button"
            onClick={onRegenerateBio}
            disabled={isRegeneratingBio}
            className={CONNECT_BTN_SECONDARY}
          >
            <Sparkles className="mr-1.5 inline h-3.5 w-3.5" />
            {isRegeneratingBio ? "Génération…" : "Régénérer"}
          </button>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-black/70">{presentation}</p>
      </section>

      <ApprenantAssessmentResults
        variant="full"
        firstName={firstName}
        discScores={discScores}
        idmcAxes={idmcAxes}
        softSkillsRadar={softSkillsRadar}
      />

      <section className="space-y-4">
        <div>
          <p className={APPRENANT_PAGE_KICKER}>Parcours</p>
          <h2 className="text-lg font-semibold text-[#0a0a0a]">Expériences & formations</h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <article className={APPRENANT_CARD_CLASS}>
            <div className="flex items-center gap-2 text-sm font-semibold text-[#0a0a0a]">
              <Briefcase className="h-4 w-4 text-[#FF3B30]" />
              Expériences professionnelles
            </div>
            {experiencesPro.length ? (
              <ul className="mt-4 space-y-3">
                {experiencesPro.map((exp) => {
                  const missions = String(exp.missions ?? "")
                    .split("\n")
                    .map((m) => m.trim())
                    .filter(Boolean);
                  return (
                    <li
                      key={exp.id ?? `${exp.employeur}-${exp.date_debut}`}
                      className="rounded-xl border border-black/[0.06] bg-white p-4"
                    >
                      <p className="font-medium text-[#0a0a0a]">{exp.employeur || "Entreprise"}</p>
                      <p className="mt-1 text-xs text-black/50">
                        {exp.type_contrat || "Contrat"} · {formatRange(exp.date_debut, exp.date_fin)}
                      </p>
                      {missions.length ? (
                        <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-black/65">
                          {missions.map((m, i) => (
                            <li key={i}>{m}</li>
                          ))}
                        </ul>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-black/50">Aucune expérience renseignée.</p>
            )}
            <Link
              href="/dashboard/apprenant/profil"
              className="mt-4 inline-block text-xs font-medium text-[#FF3B30] hover:underline"
            >
              Gérer sur mon profil →
            </Link>
          </article>

          <article className={APPRENANT_CARD_CLASS}>
            <div className="flex items-center gap-2 text-sm font-semibold text-[#0a0a0a]">
              <GraduationCap className="h-4 w-4 text-[#FF3B30]" />
              Diplômes & formations
            </div>
            {diplomes.length ? (
              <ul className="mt-4 space-y-3">
                {diplomes.map((dip) => (
                  <li
                    key={dip.id ?? `${dip.intitule}-${dip.ecole}`}
                    className="rounded-xl border border-black/[0.06] bg-white p-4"
                  >
                    <p className="font-medium text-[#0a0a0a]">{dip.intitule || "Diplôme"}</p>
                    <p className="mt-1 text-xs text-black/50">
                      {dip.ecole || "École"} · {dip.annee_obtention ?? "—"}
                      {dip.mode ? ` · ${dip.mode}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-black/50">Aucun diplôme renseigné.</p>
            )}
            <Link
              href="/dashboard/apprenant/profil"
              className="mt-4 inline-block text-xs font-medium text-[#FF3B30] hover:underline"
            >
              Gérer sur mon profil →
            </Link>
          </article>
        </div>
      </section>
    </div>
  );
}
