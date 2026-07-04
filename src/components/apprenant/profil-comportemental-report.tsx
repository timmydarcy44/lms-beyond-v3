"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Award, CheckCircle2, Lock, Sparkles } from "lucide-react";
import type { DiscScores } from "@/components/apprenant/apprenant-assessment-results";
import { CareerProfilePicker } from "@/components/apprenant/career-profile-picker";
import { buildDiscObservation } from "@/lib/apprenant/assessment-observations";
import { analyzeCareerFit } from "@/lib/career-profiles/career-profile-analysis";
import {
  getCareerProfileBySlug,
  type CareerProfile,
} from "@/lib/career-profiles/career-profiles-data";
import { resolveDiscProfile } from "@/lib/disc/disc-scoring";
import { EDGE_PARTICULIER_COACHING } from "@/lib/particulier/coaching-config";
import { buildProgressionPriorities } from "@/lib/particulier/objective-compatibility";
import {
  buildProfilEdgeExplorations,
  countCompletedExplorations,
  isProfilEdgeComplete,
  profilEdgeProgressLabel,
} from "@/lib/particulier/profil-edge-progress";
import {
  APPRENANT_CARD_BODY,
  APPRENANT_CARD_KICKER,
  CONNECT_BTN_PRIMARY,
  CONNECT_BTN_SECONDARY,
  CONNECT_PROGRESS_FILL,
  CONNECT_PROGRESS_TRACK,
} from "@/lib/apprenant/connect-nav";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const DISC_VIGILANCE: Record<keyof DiscScores, string> = {
  D: "Attention à la pression sur les autres et à l'impatience décisionnelle.",
  I: "Attention à la dispersion et à la sous-estimation des détails.",
  S: "Attention à la difficulté à trancher rapidement en situation tendue.",
  C: "Attention à l'exigence excessive et à la lenteur de décision.",
};

export function ProfilComportementalReport() {
  const supabase = createSupabaseBrowserClient();
  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState("");
  const [discScores, setDiscScores] = useState<DiscScores | null>(null);
  const [hasIdmc, setHasIdmc] = useState(false);
  const [hasSoftSkills, setHasSoftSkills] = useState(false);
  const [softSkillsScores, setSoftSkillsScores] = useState<Record<string, number> | null>(null);
  const [badgeAwarded, setBadgeAwarded] = useState(false);
  const [badgeName, setBadgeName] = useState("Profil comportemental EDGE");
  const [targetCareerSlug, setTargetCareerSlug] = useState<string | null>(null);
  const [selectedCareer, setSelectedCareer] = useState<CareerProfile | null>(null);

  const load = useCallback(async () => {
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) return;

    const [profileRes, discRes, idmcRes, softRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("first_name, target_career_slug, cross_profile_completion")
        .eq("id", uid)
        .maybeSingle(),
      supabase.from("disc_resultats").select("scores").eq("profile_id", uid).maybeSingle(),
      supabase.from("idmc_resultats").select("scores").eq("profile_id", uid).maybeSingle(),
      supabase.from("soft_skills_resultats").select("scores").eq("learner_id", uid).maybeSingle(),
    ]);

    const profile = profileRes.data;
    setFirstName(String(profile?.first_name ?? "").trim());
    setHasIdmc(Boolean(idmcRes.data?.scores));
    const softScores = softRes.data?.scores as Record<string, number> | null;
    setHasSoftSkills(Boolean(softScores && Object.keys(softScores).length > 0));
    setSoftSkillsScores(softScores);

    const slug = profile?.target_career_slug ? String(profile.target_career_slug) : null;
    setTargetCareerSlug(slug);
    if (slug) {
      try {
        const careerRes = await fetch(`/api/career-profiles/search?slug=${encodeURIComponent(slug)}`);
        const careerJson = await careerRes.json();
        if (careerRes.ok && careerJson.profile) {
          setSelectedCareer(careerJson.profile as CareerProfile);
        } else {
          setSelectedCareer(getCareerProfileBySlug(slug) ?? null);
        }
      } catch {
        setSelectedCareer(getCareerProfileBySlug(slug) ?? null);
      }
    } else {
      setSelectedCareer(null);
    }

    const completion = profile?.cross_profile_completion as {
      badge_id?: string;
      badge_awarded_at?: string;
    } | null;
    setBadgeAwarded(Boolean(completion?.badge_awarded_at));

    if (completion?.badge_id) {
      const { data: badge } = await supabase
        .from("open_badges")
        .select("name")
        .eq("id", completion.badge_id)
        .maybeSingle();
      if (badge?.name) setBadgeName(String(badge.name));
    }

    const scores = discRes.data?.scores as DiscScores | null;
    if (scores?.D != null) setDiscScores(scores);
  }, [supabase]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await load();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  const explorations = useMemo(
    () =>
      buildProfilEdgeExplorations({
        hasDisc: Boolean(discScores),
        hasSoftSkills,
        hasIdmc,
      }),
    [discScores, hasIdmc, hasSoftSkills],
  );

  const completedCount = countCompletedExplorations(explorations);
  const profilComplete = isProfilEdgeComplete(explorations);

  const discProfile = useMemo(
    () => (discScores ? resolveDiscProfile(discScores) : null),
    [discScores],
  );

  const careerAnalysis = useMemo(() => {
    if (!discScores || !selectedCareer) return null;
    return analyzeCareerFit({
      career: selectedCareer,
      discScores,
      softSkillsScores,
    });
  }, [discScores, selectedCareer, softSkillsScores]);

  const priorities = useMemo(
    () => (discScores ? buildProgressionPriorities(discScores) : []),
    [discScores],
  );

  const handleCareerResolved = (slug: string, profile: CareerProfile) => {
    setTargetCareerSlug(slug);
    setSelectedCareer(profile);
  };

  if (loading) {
    return <p className="text-sm text-white/50">Chargement de votre Profil EDGE…</p>;
  }

  if (!discScores || !discProfile) {
    return (
      <div className={APPRENANT_CARD_BODY}>
        <p className="text-white/70">Complétez d&apos;abord le test comportemental pour accéder à votre Profil EDGE.</p>
        <Link href="/dashboard/apprenant/test-comportemental-intro" className={`${CONNECT_BTN_PRIMARY} mt-4 w-fit`}>
          Passer le test
        </Link>
      </div>
    );
  }

  const dominant = discProfile.dominant;
  const progressPct = Math.round((completedCount / 3) * 100);

  return (
    <div className="space-y-6">
      <header>
        <p className={APPRENANT_CARD_KICKER}>EDGE Particulier</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-white md:text-3xl">Mon Profil EDGE</h1>
        <p className="mt-2 text-sm text-white/50">{profilEdgeProgressLabel(completedCount)}</p>
        <div className={`mt-4 ${CONNECT_PROGRESS_TRACK}`}>
          <div className={CONNECT_PROGRESS_FILL} style={{ width: `${progressPct}%` }} />
        </div>
      </header>

      <section className={APPRENANT_CARD_BODY}>
        <h2 className="text-base font-semibold text-white">Progression des explorations</h2>
        <ul className="mt-4 space-y-3">
          {explorations.map((exp) => (
            <li key={exp.id} className="flex items-center justify-between gap-3 text-sm">
              <span className={exp.done ? "text-white/80" : "text-white/50"}>{exp.label}</span>
              {exp.done ? (
                <span className="flex items-center gap-1 text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" /> Complété
                </span>
              ) : (
                <Link href={exp.introHref} className="text-[#3D7BFF] hover:underline">
                  Compléter
                </Link>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className={APPRENANT_CARD_BODY}>
        <CareerProfilePicker
          value={targetCareerSlug}
          selectedTitle={selectedCareer?.title}
          onResolved={(slug, profile) => handleCareerResolved(slug, profile)}
        />
        {selectedCareer ? (
          <p className="mt-3 text-xs text-white/45">
            <Link href={`/metiers/${selectedCareer.slug}`} className="text-[#3D7BFF] hover:underline">
              Voir la fiche métier
            </Link>
          </p>
        ) : null}
      </section>

      {careerAnalysis && selectedCareer ? (
        <section className={APPRENANT_CARD_BODY}>
          <h2 className="text-base font-semibold text-white">Votre profil face au métier visé</h2>
          <p className="mt-2 text-sm text-white/55">
            Métier sélectionné : <span className="font-medium text-white">{selectedCareer.title}</span>
          </p>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-white/40">Hard skills — métier vs vous</p>
                <span className="text-xs font-medium text-white/60">{careerAnalysis.hardSkillsScore} %</span>
              </div>
              <p className="mt-1 text-xs text-white/40">Compétences techniques / métier comparées à votre profil DISC</p>
              <ul className="mt-3 space-y-2">
                {careerAnalysis.hardSkills.map((item) => (
                  <li key={item.skill} className="text-sm">
                    <span className={item.status === "aligned" ? "text-emerald-400" : "text-amber-300/90"}>
                      {item.status === "aligned" ? "✓" : "○"} {item.skill}
                    </span>
                    {item.detail ? <p className="mt-0.5 text-xs text-white/40">{item.detail}</p> : null}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-white/40">Soft skills — métier vs vous</p>
                <span className="text-xs font-medium text-white/60">
                  {careerAnalysis.softSkillsScore != null ? `${careerAnalysis.softSkillsScore} %` : "—"}
                </span>
              </div>
              <p className="mt-1 text-xs text-white/40">
                {careerAnalysis.softSkillsTestDone
                  ? "Comparatif basé sur votre test Soft Skills EDGE"
                  : "Complétez le test Soft Skills pour un comparatif chiffré"}
              </p>
              <ul className="mt-3 space-y-2">
                {careerAnalysis.softSkills.map((item) => (
                  <li key={item.skill} className="text-sm">
                    <span className={item.status === "aligned" ? "text-emerald-400" : "text-amber-300/90"}>
                      {item.status === "aligned" ? "✓" : "○"} {item.skill}
                    </span>
                    {item.detail ? <p className="mt-0.5 text-xs text-white/40">{item.detail}</p> : null}
                  </li>
                ))}
              </ul>
              {!careerAnalysis.softSkillsTestDone ? (
                <Link
                  href="/dashboard/apprenant/soft-skills-intro"
                  className="mt-3 inline-block text-xs text-[#3D7BFF] hover:underline"
                >
                  Passer le test Soft Skills
                </Link>
              ) : null}
            </div>
          </div>

          <div className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/40">Forces comportementales (DISC)</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {careerAnalysis.profileStrengths.map((s) => (
                <li
                  key={s}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/75"
                >
                  {s}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/40">Axes à renforcer</p>
            <ul className="mt-2 space-y-1">
              {careerAnalysis.axesToReinforce.map((s) => (
                <li key={s} className="text-sm text-white/75">
                  · {s}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs uppercase tracking-wider text-white/40">Score de cohérence global</p>
            <p className="mt-1 text-2xl font-bold text-white">{careerAnalysis.score} %</p>
            <p className="mt-2 text-xs text-white/45">
              Hard skills (DISC) + soft skills (test EDGE si complété) face au métier sélectionné — estimation
              pédagogique, pas un diagnostic médical ou psychologique.
            </p>
          </div>
        </section>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-2">
        <article className={APPRENANT_CARD_BODY}>
          <h2 className="text-base font-semibold text-white">Forces</h2>
          <p className="mt-3 text-sm leading-relaxed text-white/70">{buildDiscObservation(discScores)}</p>
        </article>
        <article className={APPRENANT_CARD_BODY}>
          <h2 className="text-base font-semibold text-white">Points de vigilance</h2>
          <p className="mt-3 text-sm leading-relaxed text-white/70">{DISC_VIGILANCE[dominant]}</p>
        </article>
      </section>

      <section className={APPRENANT_CARD_BODY}>
        <div className="flex items-center gap-3">
          {profilComplete && badgeAwarded ? (
            <Award className="h-8 w-8 text-[#FF3B30]" />
          ) : (
            <Lock className="h-8 w-8 text-white/35" />
          )}
          <div>
            <p className="text-xs uppercase tracking-wider text-white/40">Badge Profil comportemental EDGE</p>
            <p className="font-semibold text-white">
              {profilComplete && badgeAwarded ? badgeName : "Verrouillé — complétez les 3 explorations"}
            </p>
          </div>
        </div>
        {profilComplete && badgeAwarded ? (
          <Link href="/dashboard/apprenant/badges" className={`${CONNECT_BTN_SECONDARY} mt-4 w-fit`}>
            Voir mon Wallet
          </Link>
        ) : (
          <p className="mt-3 text-sm text-white/50">
            Le badge est délivré uniquement après les 3 tests : comportemental, soft skills et motivation /
            fonctionnement.
          </p>
        )}
      </section>

      {profilComplete ? (
        <section className={APPRENANT_CARD_BODY}>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#3D7BFF]" />
            <h2 className="text-base font-semibold text-white">Vos priorités de progression</h2>
          </div>
          <ul className="mt-4 flex flex-wrap gap-2">
            {priorities.map((p) => (
              <span
                key={p}
                className="rounded-full border border-[#3D7BFF]/30 bg-[#3D7BFF]/10 px-3 py-1 text-xs font-medium text-sky-100"
              >
                {p}
              </span>
            ))}
          </ul>
        </section>
      ) : null}

      {careerAnalysis && selectedCareer ? (
        <section className={APPRENANT_CARD_BODY}>
          <h2 className="text-lg font-semibold text-white">Aller plus loin avec un coach EDGE</h2>
          <p className="mt-2 text-sm leading-relaxed text-white/60">
            Un coach EDGE peut vous aider à interpréter votre profil, comprendre vos écarts de compétences et construire
            un plan d&apos;action adapté à votre métier cible.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {[EDGE_PARTICULIER_COACHING.restitution, EDGE_PARTICULIER_COACHING.accompagnement].map((offer) => (
              <div key={offer.title} className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
                <p className="font-semibold text-white">{offer.title}</p>
                <p className="mt-1 text-xs text-white/45">{offer.duration}</p>
                <ul className="mt-3 space-y-1.5">
                  {offer.features.map((f) => (
                    <li key={f} className="text-xs text-white/65">
                      · {f}
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-sm font-semibold text-white">{offer.priceLabel}</p>
                <Link href={offer.href} className={`${CONNECT_BTN_PRIMARY} mt-4 inline-flex`}>
                  {offer.ctaLabel}
                </Link>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
