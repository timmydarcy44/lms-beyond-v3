"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Award, CheckCircle2, Sparkles } from "lucide-react";
import type { DiscScores } from "@/components/apprenant/apprenant-assessment-results";
import { buildDiscObservation } from "@/lib/apprenant/assessment-observations";
import { resolveDiscProfile } from "@/lib/disc/disc-scoring";
import { EDGE_PARTICULIER_COACHING, FREE_RESOURCES_PLACEHOLDERS } from "@/lib/particulier/coaching-config";
import {
  buildProgressionPriorities,
  computeObjectiveCompatibility,
} from "@/lib/particulier/objective-compatibility";
import {
  normalizeParticulierObjectiveType,
  objectiveDetailsSummary,
  type ParticulierObjectiveType,
} from "@/lib/particulier/objective-detail-fields";
import {
  APPRENANT_CARD_BODY,
  APPRENANT_CARD_KICKER,
  CONNECT_BTN_PRIMARY,
  CONNECT_BTN_SECONDARY,
} from "@/lib/apprenant/connect-nav";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const DISC_VIGILANCE: Record<keyof DiscScores, string> = {
  D: "Attention à la pression sur les autres et à l'impatience décisionnelle.",
  I: "Attention à la dispersion et à la sous-estimation des détails.",
  S: "Attention à la difficulté à trancher rapidement en situation tendue.",
  C: "Attention à l'exigence excessive et à la lenteur de décision.",
};

const LEARNING_STYLES: Record<keyof DiscScores, string> = {
  D: "Apprentissage par l'action, les défis concrets et les retours directs.",
  I: "Apprentissage par l'échange, la pratique en groupe et la mise en scène.",
  S: "Apprentissage progressif, avec cadre stable et temps de réflexion.",
  C: "Apprentissage structuré, avec méthodes, checklists et preuves.",
};

export function ProfilComportementalReport() {
  const supabase = createSupabaseBrowserClient();
  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState("");
  const [discScores, setDiscScores] = useState<DiscScores | null>(null);
  const [objectiveType, setObjectiveType] = useState<ParticulierObjectiveType>("autre");
  const [objectiveDetails, setObjectiveDetails] = useState<Record<string, string>>({});
  const [badgeName, setBadgeName] = useState("Profil comportemental EDGE");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const uid = userData.user?.id;
        if (!uid) return;

        const [profileRes, discRes] = await Promise.all([
          supabase
            .from("profiles")
            .select("first_name, type_profil, objective_details, cross_profile_completion")
            .eq("id", uid)
            .maybeSingle(),
          supabase.from("disc_resultats").select("scores").eq("profile_id", uid).maybeSingle(),
        ]);

        if (cancelled) return;

        const profile = profileRes.data;
        setFirstName(String(profile?.first_name ?? "").trim());
        setObjectiveType(normalizeParticulierObjectiveType(profile?.type_profil));
        setObjectiveDetails((profile?.objective_details as Record<string, string>) ?? {});

        const completion = profile?.cross_profile_completion as { badge_id?: string } | null;
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
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const discProfile = useMemo(
    () => (discScores ? resolveDiscProfile(discScores) : null),
    [discScores],
  );

  const compatibility = useMemo(() => {
    if (!discScores) return null;
    return computeObjectiveCompatibility({
      discScores,
      objectiveType,
      objectiveDetails,
    });
  }, [discScores, objectiveDetails, objectiveType]);

  const priorities = useMemo(
    () => (discScores ? buildProgressionPriorities(discScores) : []),
    [discScores],
  );

  if (loading) {
    return <p className="text-sm text-white/50">Chargement de votre Profil EDGE…</p>;
  }

  if (!discScores || !discProfile) {
    return (
      <div className={APPRENANT_CARD_BODY}>
        <p className="text-white/70">Complétez d&apos;abord le test comportemental pour accéder à votre rapport.</p>
        <Link href="/dashboard/apprenant/test-comportemental-intro" className={`${CONNECT_BTN_PRIMARY} mt-4 w-fit`}>
          Passer le test
        </Link>
      </div>
    );
  }

  const dominant = discProfile.dominant;

  return (
    <div className="space-y-6">
      <header>
        <p className={APPRENANT_CARD_KICKER}>EDGE Particulier</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-white md:text-3xl">
          Votre Profil comportemental EDGE
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-white/50">
          {firstName ? `${firstName}, voici` : "Voici"} une lecture de votre fonctionnement et de vos leviers de progression
          {objectiveDetailsSummary(objectiveType, objectiveDetails)
            ? ` pour ${objectiveDetailsSummary(objectiveType, objectiveDetails).toLowerCase()}`
            : ""}
          .
        </p>
      </header>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className={APPRENANT_CARD_BODY}>
          <h2 className="text-base font-semibold text-white">Forces</h2>
          <p className="mt-3 text-sm leading-relaxed text-white/70">{buildDiscObservation(discScores)}</p>
        </article>
        <article className={APPRENANT_CARD_BODY}>
          <h2 className="text-base font-semibold text-white">Points de vigilance</h2>
          <p className="mt-3 text-sm leading-relaxed text-white/70">{DISC_VIGILANCE[dominant]}</p>
        </article>
        <article className={APPRENANT_CARD_BODY}>
          <h2 className="text-base font-semibold text-white">Style de communication</h2>
          <p className="mt-3 text-sm text-white/70">
            Profil {discProfile.profileLabel} — vous communiquez de façon{" "}
            {dominant === "D" ? "directe et orientée résultats" : dominant === "I" ? "expressive et mobilisatrice" : dominant === "S" ? "écoute et progressive" : "précise et structurée"}.
          </p>
        </article>
        <article className={APPRENANT_CARD_BODY}>
          <h2 className="text-base font-semibold text-white">Style d&apos;apprentissage</h2>
          <p className="mt-3 text-sm text-white/70">{LEARNING_STYLES[dominant]}</p>
        </article>
      </section>

      <section className={APPRENANT_CARD_BODY}>
        <h2 className="text-base font-semibold text-white">Leviers de motivation</h2>
        <ul className="mt-4 space-y-2">
          {priorities.slice(0, 3).map((item) => (
            <li key={item} className="flex gap-2 text-sm text-white/75">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#3D7BFF]" />
              {item}
            </li>
          ))}
        </ul>
      </section>

      {compatibility ? (
        <section className={APPRENANT_CARD_BODY}>
          <h2 className="text-base font-semibold text-white">Ce que cela signifie pour votre objectif</h2>
          <p className="mt-3 text-sm leading-relaxed text-white/70">{compatibility.objectiveMeaning}</p>
          <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs uppercase tracking-wider text-white/40">Compatibilité avec votre objectif</p>
            <p className="mt-2 text-sm text-white/60">
              Votre objectif : <span className="font-medium text-white">{compatibility.objectiveLabel}</span>
            </p>
            <p className="mt-1 text-2xl font-bold text-white">{compatibility.score} %</p>
            <p className="mt-2 text-xs text-white/45">
              Estimation de progression basée sur vos réponses et l&apos;objectif déclaré — pas un diagnostic médical ou psychologique.
            </p>
            {compatibility.axesToReinforce.length ? (
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-white/45">Axes à renforcer</p>
                <ul className="mt-2 space-y-1">
                  {compatibility.axesToReinforce.map((axis) => (
                    <li key={axis} className="text-sm text-white/75">
                      · {axis}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      <section className={APPRENANT_CARD_BODY}>
        <div className="flex items-center gap-3">
          <Award className="h-8 w-8 text-[#FF3B30]" />
          <div>
            <p className="text-xs uppercase tracking-wider text-white/40">Badge obtenu</p>
            <p className="font-semibold text-white">{badgeName}</p>
          </div>
        </div>
        <Link href="/dashboard/apprenant/badges" className={`${CONNECT_BTN_SECONDARY} mt-4 w-fit`}>
          Voir mon Wallet
        </Link>
      </section>

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
        <p className="mt-4 text-sm text-white/55">
          Nous avons sélectionné plusieurs pistes pour vous aider à progresser.
        </p>
      </section>

      <section className={APPRENANT_CARD_BODY}>
        <h2 className="text-base font-semibold text-white">Ressources recommandées pour vous</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {FREE_RESOURCES_PLACEHOLDERS.map((res) => (
            <div key={res.title} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#60a5fa]">{res.type}</p>
              <p className="mt-2 text-sm font-medium text-white">{res.title}</p>
              <p className="mt-1 text-xs text-white/50">{res.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={APPRENANT_CARD_BODY}>
        <h2 className="text-lg font-semibold text-white">Aller plus loin avec un coach EDGE</h2>
        <p className="mt-2 text-sm leading-relaxed text-white/60">
          Votre profil met en évidence plusieurs axes de progression. Un coach EDGE peut vous aider à interpréter votre
          profil, clarifier votre objectif et construire un plan d&apos;action réaliste.
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

      <section className={APPRENANT_CARD_BODY}>
        <h2 className="text-base font-semibold text-white">Compléter votre Profil EDGE</h2>
        <p className="mt-2 text-sm text-white/55">
          Deux explorations restent disponibles pour affiner vos recommandations : Soft skills et Fonctionnement /
          motivation.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/dashboard/apprenant/idmc-intro" className={CONNECT_BTN_SECONDARY}>
            Fonctionnement / motivation
          </Link>
          <Link href="/dashboard/apprenant/soft-skills-intro" className={CONNECT_BTN_SECONDARY}>
            Soft skills
          </Link>
        </div>
      </section>
    </div>
  );
}
