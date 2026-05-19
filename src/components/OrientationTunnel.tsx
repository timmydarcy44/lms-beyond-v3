"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  buildOrientationResult,
  ORIENTATION_FORMATS,
  ORIENTATION_OBJECTIFS,
  ORIENTATION_PROFILS,
  onlineThemesForOrientation,
  type FormatId,
  type ObjectifId,
  type OrientationResult,
  type ProfilId,
} from "@/lib/orientation-tunnel";
import { EDGE_CTA_LABELS, EDGE_HREFS } from "@/lib/edge-site/constants";
import { EDGE_ONLINE_APP_SURFACE_PATH } from "@/lib/galaxy-branding";

type Props = {
  onComplete?: (result: OrientationResult) => void;
  defaultStep?: number;
};

const STEPS = ["Objectif", "Profil", "Format"] as const;

export function OrientationTunnel({ onComplete, defaultStep = 1 }: Props) {
  const [step, setStep] = useState(defaultStep);
  const [objectifs, setObjectifs] = useState<ObjectifId[]>([]);
  const [profil, setProfil] = useState<ProfilId | null>(null);
  const [format, setFormat] = useState<FormatId | null>(null);
  const [showResult, setShowResult] = useState(false);

  const result = useMemo(() => {
    if (!profil || !format || objectifs.length === 0) return null;
    return buildOrientationResult(objectifs, profil, format);
  }, [objectifs, profil, format]);

  const primaryObjectif = objectifs[0] ?? "management";

  const toggleObjectif = (id: ObjectifId) => {
    setObjectifs((prev) => (prev.includes(id) ? prev.filter((o) => o !== id) : [...prev, id]));
  };

  const goNext = () => {
    if (step === 1 && objectifs.length === 0) return;
    if (step === 2 && !profil) return;
    if (step === 3) {
      if (!format || !profil || objectifs.length === 0) return;
      const r = buildOrientationResult(objectifs, profil, format);
      setShowResult(true);
      onComplete?.(r);
      return;
    }
    setStep((s) => Math.min(3, s + 1) as 1 | 2 | 3);
  };

  const goBack = () => {
    if (showResult) {
      setShowResult(false);
      return;
    }
    setStep((s) => Math.max(1, s - 1) as 1 | 2 | 3);
  };

  if (showResult && result) {
    return (
      <div className="mx-auto flex w-full max-w-3xl min-h-0 flex-1 flex-col px-5 py-8 sm:px-8">
        <ResultView result={result} primaryObjectif={primaryObjectif} onBack={goBack} />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl min-h-0 flex-1 flex-col px-5 py-8 sm:px-8">
      <ProgressBar currentStep={step} />
      <div className="mt-10 flex min-h-0 flex-1 flex-col">
        {step === 1 ? (
          <StepObjectifs selected={objectifs} onToggle={toggleObjectif} />
        ) : null}
        {step === 2 ? <StepProfil selected={profil} onSelect={setProfil} /> : null}
        {step === 3 ? <StepFormat selected={format} onSelect={setFormat} /> : null}
      </div>
      <div className="mt-10 flex gap-3">
        {step > 1 ? (
          <button
            type="button"
            onClick={goBack}
            className="rounded-full border border-black/20 px-6 py-2.5 text-[13px] font-medium text-edge-black transition-colors hover:border-black/35"
          >
            Retour
          </button>
        ) : null}
        <button
          type="button"
          onClick={goNext}
          disabled={
            (step === 1 && objectifs.length === 0) ||
            (step === 2 && !profil) ||
            (step === 3 && !format)
          }
          className="ml-auto rounded-full bg-edge-red px-8 py-2.5 text-[13px] font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {step === 3 ? "Voir mes recommandations" : "Continuer"}
        </button>
      </div>
    </div>
  );
}

function ProgressBar({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex gap-2">
      {STEPS.map((label, i) => {
        const n = i + 1;
        const active = currentStep === n;
        const done = currentStep > n;
        return (
          <div key={label} className="flex-1">
            <div
              className={`h-0.5 w-full ${done ? "bg-edge-red/30" : active ? "bg-edge-red" : "bg-black/[0.08]"}`}
            />
            <p
              className={`mt-2 text-[10px] uppercase tracking-[0.15em] ${
                active ? "text-edge-red" : "text-black/30"
              }`}
            >
              {label}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function StepObjectifs({
  selected,
  onToggle,
}: {
  selected: ObjectifId[];
  onToggle: (id: ObjectifId) => void;
}) {
  return (
    <div>
      <h2 className="text-2xl font-medium tracking-[-0.02em] text-edge-black">
        Quels sont tes objectifs ?
      </h2>
      <p className="mt-2 text-[15px] text-black/40">Tu peux en sélectionner plusieurs.</p>
      <ul className="mt-8 space-y-3">
        {ORIENTATION_OBJECTIFS.map((o) => {
          const checked = selected.includes(o.id);
          return (
            <li key={o.id}>
              <label
                className={`flex cursor-pointer items-start gap-4 rounded-lg border p-4 transition-colors ${
                  checked
                    ? "border-edge-red bg-edge-red/[0.04]"
                    : "border-black/[0.08] bg-[#f8f8f6]"
                }`}
              >
                <input
                  type="checkbox"
                  className="mt-1 accent-edge-red"
                  checked={checked}
                  onChange={() => onToggle(o.id)}
                />
                <span>
                  <span className="block text-[15px] font-medium text-edge-black">{o.label}</span>
                  <span className="mt-1 block text-[13px] text-black/40">{o.description}</span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function StepProfil({
  selected,
  onSelect,
}: {
  selected: ProfilId | null;
  onSelect: (id: ProfilId) => void;
}) {
  return (
    <div>
      <h2 className="text-2xl font-medium tracking-[-0.02em] text-edge-black">Ton profil</h2>
      <p className="mt-2 text-[15px] text-black/40">Choisis l&apos;option qui te correspond le mieux.</p>
      <ul className="mt-8 space-y-3">
        {ORIENTATION_PROFILS.map((o) => (
          <OptionRadio key={o.id} checked={selected === o.id} onSelect={() => onSelect(o.id)} label={o.label} description={o.description} />
        ))}
      </ul>
    </div>
  );
}

function StepFormat({
  selected,
  onSelect,
}: {
  selected: FormatId | null;
  onSelect: (id: FormatId) => void;
}) {
  return (
    <div>
      <h2 className="text-2xl font-medium tracking-[-0.02em] text-edge-black">Ton format idéal</h2>
      <p className="mt-2 text-[15px] text-black/40">Comment veux-tu apprendre ?</p>
      <ul className="mt-8 space-y-3">
        {ORIENTATION_FORMATS.map((o) => (
          <OptionRadio key={o.id} checked={selected === o.id} onSelect={() => onSelect(o.id)} label={o.label} description={o.description} />
        ))}
      </ul>
    </div>
  );
}

function OptionRadio({
  checked,
  onSelect,
  label,
  description,
}: {
  checked: boolean;
  onSelect: () => void;
  label: string;
  description: string;
}) {
  return (
    <li>
      <label
        className={`flex cursor-pointer items-start gap-4 rounded-lg border p-4 transition-colors ${
          checked ? "border-edge-red bg-edge-red/[0.04]" : "border-black/[0.08] bg-[#f8f8f6]"
        }`}
      >
        <input type="radio" name="orientation-option" className="mt-1 accent-edge-red" checked={checked} onChange={onSelect} />
        <span>
          <span className="block text-[15px] font-medium text-edge-black">{label}</span>
          <span className="mt-1 block text-[13px] text-black/40">{description}</span>
        </span>
      </label>
    </li>
  );
}

function ResultView({
  result,
  primaryObjectif,
  onBack,
}: {
  result: OrientationResult;
  primaryObjectif: ObjectifId;
  onBack: () => void;
}) {
  return (
    <div className="w-full max-w-3xl">
      <button type="button" onClick={onBack} className="text-[13px] text-black/40 transition-colors hover:text-edge-black">
        ← Modifier mes réponses
      </button>
      {result.format === "rythme" ? <ResultRythme primaryObjectif={primaryObjectif} /> : null}
      {result.format === "entreprise" ? <ResultEntreprise /> : null}
      {result.format === "bootcamp" ? <ResultBootcamp parcours={result.parcours} /> : null}
    </div>
  );
}

function ResultRythme({ primaryObjectif }: { primaryObjectif: ObjectifId }) {
  const themes = onlineThemesForOrientation(primaryObjectif).slice(0, 6);

  return (
    <div className="mt-8">
      <div className="rounded-lg bg-edge-black px-8 py-10 text-center">
        <h2 className="text-2xl font-medium tracking-[-0.02em] text-white">Apprendre vite. Appliquer immédiatement.</h2>
        <p className="mt-4 text-[32px] font-medium text-white">
          19€<span className="text-[15px] font-normal text-white/45">/mois</span>
        </p>
        <Link
          href={EDGE_ONLINE_APP_SURFACE_PATH}
          className="mt-6 inline-flex rounded-full bg-edge-red px-8 py-2.5 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
        >
          Essayer 7 jours gratuit
        </Link>
      </div>
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {themes.map((t) => (
          <div
            key={t.slug}
            className={`rounded-[4px] border bg-[#f8f8f6] p-4 ${
              t.highlighted ? "border-edge-red" : "border-black/[0.08]"
            }`}
          >
            <p className="text-[10px] uppercase tracking-[0.15em] text-edge-red">Thématique</p>
            <p className="mt-1 text-sm font-medium text-edge-black">{t.label}</p>
            <p className="mt-1 text-xs text-black/40">{t.modules} modules</p>
          </div>
        ))}
      </div>
      <p className="mt-8 text-center text-[14px] text-black/40">
        Tu peux upgrader vers un parcours certifiant à tout moment.
      </p>
      <p className="mt-4 text-center">
        <Link href={EDGE_HREFS.parcours} className="text-[13px] font-medium text-edge-red transition-opacity hover:opacity-80">
          Voir les parcours certifiants →
        </Link>
      </p>
    </div>
  );
}

function ResultEntreprise() {
  const offers = [
    { title: "Diagnostic Beyond", description: "Cartographie psychométrique de vos équipes et leviers de performance." },
    { title: "Parcours sur-mesure ou catalogue multi-users", description: "Co-construction intra ou déploiement à l'échelle de vos collaborateurs." },
    { title: "Open Badges collectifs IMS Global", description: "Certifications vérifiables pour vos équipes, pilotables par les RH." },
  ];

  return (
    <div className="mt-8 space-y-4">
      {offers.map((o) => (
        <article key={o.title} className="border border-black/[0.08] bg-[#f8f8f6] p-6">
          <h3 className="text-lg font-medium text-edge-black">{o.title}</h3>
          <p className="mt-2 text-[14px] leading-relaxed text-black/40">{o.description}</p>
        </article>
      ))}
      <Link
        href={EDGE_HREFS.entreprises}
        className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-edge-red py-3 text-[13px] font-medium text-white transition-opacity hover:opacity-90 sm:w-auto sm:px-10"
      >
        Demander un devis
      </Link>
    </div>
  );
}

function ResultBootcamp({ parcours }: { parcours: import("@/lib/parcours").Parcours[] }) {
  return (
    <div className="mt-8 space-y-4">
      <h2 className="text-2xl font-medium tracking-[-0.02em] text-edge-black">Tes parcours recommandés</h2>
      <p className="text-[15px] text-black/40">Sélectionnés selon ton objectif principal.</p>
      <ul className="mt-6 space-y-4">
        {parcours.map((p) => (
          <li key={p.slug} className="border border-black/[0.08] bg-[#f8f8f6] p-6">
            <p className="text-[10px] uppercase tracking-[0.15em] text-edge-red">{p.familleLabel}</p>
            <h3 className="mt-2 text-lg font-medium text-edge-black">{p.titre}</h3>
            <p className="mt-2 text-[14px] text-black/40">{p.description}</p>
            <p className="mt-4 text-sm text-black/40">
              <span className="font-medium text-edge-black">{p.prix}€</span> · {p.duree} · Open Badge
            </p>
            <Link
              href={EDGE_HREFS.parcoursSlug(p.slug)}
              className="mt-4 inline-block text-[13px] font-medium text-edge-red transition-opacity hover:opacity-80"
            >
              {EDGE_CTA_LABELS.apply} →
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
