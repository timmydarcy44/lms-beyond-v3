"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MoveDown, MoveUp, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { competencies, proofResults } from "@/components/beyond-no-school/competences-data";
import {
  addProof,
  clearTrajectory,
  getTrajectory,
  moveProof,
  removeProof,
  setTrajectory,
} from "@/lib/bns/trajectory";

type ProofStatus = "À démarrer" | "En cours" | "En validation" | "Validée";
type IntentionId =
  | "decider"
  | "influencer"
  | "piloter"
  | "critique"
  | "mesurer"
  | "structurer";
type Sector = "Sport" | "Immobilier" | "Automobile" | "Business / Ops" | "Public";

const intentions: {
  id: IntentionId;
  title: string;
  prompt: string;
  resultId: string;
}[] = [
  {
    id: "decider",
    title: "Décider avec des données",
    prompt: "Transformer des données en décisions opposables.",
    resultId: "data-driven",
  },
  {
    id: "influencer",
    title: "Influencer une décision",
    prompt: "Mettre une négociation sous preuve.",
    resultId: "negociation-complexe",
  },
  {
    id: "piloter",
    title: "Piloter une organisation",
    prompt: "Structurer un pilotage qui tient dans le réel.",
    resultId: "supply-chain",
  },
  {
    id: "critique",
    title: "Gérer une situation critique",
    prompt: "Assumer des décisions sous pression, preuves à l’appui.",
    resultId: "communication-crise",
  },
  {
    id: "mesurer",
    title: "Mesurer un impact réel",
    prompt: "Rendre visible un impact RSE mesurable.",
    resultId: "impact-rse",
  },
  {
    id: "structurer",
    title: "Structurer une action mesurable",
    prompt: "Passer d’une intention à un livrable opposable.",
    resultId: "marketing-sportif",
  },
];

const sectorOptions: Sector[] = [
  "Sport",
  "Immobilier",
  "Automobile",
  "Business / Ops",
  "Public",
];

// proofResults are used only as targets for intentions

const exampleTrajectories = [
  {
    id: "data-driven",
    name: "Décider avec des données vérifiables",
    profile: "Cadre en poste",
    problem:
      "Tu prends des décisions chiffrées mais tu ne peux pas encore les rendre opposables.",
    proofs: ["data-driven-decision", "etude-comportementale"],
    result:
      "On peut affirmer publiquement que tu décides avec des preuves mesurables.",
  },
  {
    id: "complex-projects",
    name: "Piloter des projets complexes sans friction",
    profile: "Freelance / indépendant",
    problem:
      "Tu pilotes des projets difficiles mais personne ne voit la méthode et l’impact.",
    proofs: ["pilotage-projet-complexe", "negociation-complexe"],
    result: "On voit que tu fais avancer des projets sans friction.",
  },
  {
    id: "marketing-impact",
    name: "Influencer avec un marketing mesurable",
    profile: "Jeune actif",
    problem:
      "Tu actives des campagnes mais tu ne peux pas encore prouver l’impact réel.",
    proofs: ["marketing-digital", "marketing-sportif"],
    result: "On peut relier tes actions à des résultats visibles.",
  },
  {
    id: "rse-mesurable",
    name: "Piloter un impact RSE mesurable",
    profile: "Repositionnement professionnel",
    problem:
      "Tu portes des actions RSE mais tu ne peux pas encore les mesurer publiquement.",
    proofs: ["rse-impact", "communication-crise"],
    result: "On peut prouver l’impact RSE de tes décisions.",
  },
  {
    id: "ops-leader",
    name: "Piloter l’opérationnel de bout en bout",
    profile: "Cadre en poste",
    problem:
      "Tu pilotes l’opérationnel mais tu ne peux pas encore rendre tes gains visibles.",
    proofs: ["supply-chain", "pilotage-projet-complexe"],
    result: "On voit que tu sécurises l’exécution et la performance.",
  },
];

export default function BeyondNoSchoolProofsPage() {
  const router = useRouter();
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);
  const [selectedIntention, setSelectedIntention] = useState<IntentionId | null>(null);
  const [selectedSector, setSelectedSector] = useState<Sector | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const competenceBySlug = useMemo(() => {
    const map = new Map(competencies.map((competence) => [competence.slug, competence]));
    return (slug: string) => map.get(slug);
  }, []);

  useEffect(() => {
    const trajectory = getTrajectory();
    setSelectedSlugs(trajectory.items);
  }, []);

  const handleAddProof = (slug: string) => {
    addProof(slug);
    setSelectedSlugs(getTrajectory().items);
  };

  const handleRemoveProof = (slug: string) => {
    removeProof(slug);
    setSelectedSlugs(getTrajectory().items);
  };

  const handleMove = (slug: string, direction: "up" | "down") => {
    moveProof(slug, direction);
    setSelectedSlugs(getTrajectory().items);
  };

  const handleClearSelection = () => {
    clearTrajectory();
    setSelectedSlugs([]);
  };

  const handleCheckout = () => {
    router.push("/beyond-no-school/checkout");
  };

  const selectedResult = useMemo(() => {
    if (!selectedIntention) return null;
    const intent = intentions.find((item) => item.id === selectedIntention);
    return proofResults.find((result) => result.id === intent?.resultId) ?? null;
  }, [selectedIntention]);

  const associatedProofs = useMemo(() => {
    if (!selectedResult) return [];
    return selectedResult.competenceSlugs
      .map((slug) => competenceBySlug(slug))
      .filter((competence): competence is (typeof competencies)[number] => Boolean(competence))
      .slice(0, 5);
  }, [selectedResult, competenceBySlug]);

  const handleOpenIntent = (intentId: IntentionId) => {
    setSelectedIntention(intentId);
    setIsModalOpen(true);
  };

  const getStatusForIndex = (index: number): ProofStatus => {
    if (index === 0) return "En cours";
    if (index === 1) return "À démarrer";
    if (index === 2) return "En validation";
    return "Validée";
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0b0b10] pb-32 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(255,88,61,0.18),transparent_45%),radial-gradient(circle_at_80%_20%,rgba(80,130,255,0.12),transparent_45%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(180deg,rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:2px_2px]" />

      <section className="relative px-6 pb-12 pt-24 sm:px-12 lg:px-24">
        <div className="mx-auto max-w-6xl space-y-6">
          <p className="text-xs uppercase tracking-[0.4em] text-white/50">Beyond No School</p>
          <h1 className="text-pretty text-4xl font-semibold sm:text-5xl lg:text-6xl">
            Construire ta trajectoire
          </h1>
          <p className="text-lg text-white/70">
            Tu assembles des preuves. Chaque preuve est un livrable réel.
          </p>
          {selectedSlugs.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 text-sm text-white/70">
              Commence par 1 preuve. Tu peux ajuster ensuite.
            </div>
          ) : (
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 text-sm text-white/70">
              Bon. Tu peux t’engager quand tu es prêt.
            </div>
          )}
        </div>
      </section>

      <section className="relative px-6 pb-24 sm:px-12 lg:px-24">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4">
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
              <div className="flex items-center gap-3 text-xs uppercase tracking-[0.35em] text-white/50">
                Ma trajectoire
              </div>
              <div className="mt-6 space-y-4">
                {selectedSlugs.length ? (
                  selectedSlugs.map((slug, index) => {
                    const competence = competenceBySlug(slug);
                    if (!competence) return null;
                    return (
                      <div
                        key={slug}
                        className="rounded-3xl border border-white/10 bg-black/40 p-5"
                      >
                        <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-white/50">
                          <span>Étape {index + 1}</span>
                          <span>{getStatusForIndex(index)}</span>
                        </div>
                        <h3 className="mt-3 text-lg font-semibold text-white">
                          {competence.name}
                        </h3>
                        <p className="mt-2 text-sm text-white/70">
                          Livrable : {competence.proof.type}
                        </p>
                        <p className="mt-1 text-sm text-white/60">
                          Impact : {competence.identityLine ?? competence.meta.shortDescription}
                        </p>
                        <div className="mt-4 flex flex-wrap items-center gap-3">
                          <Button
                            type="button"
                            onClick={() => handleMove(slug, "up")}
                            className="rounded-full border border-white/15 bg-transparent px-3 text-xs uppercase tracking-[0.28em] text-white/70 hover:text-white"
                            disabled={index === 0}
                          >
                            <MoveUp className="mr-2 h-3 w-3" />
                            Monter
                          </Button>
                          <Button
                            type="button"
                            onClick={() => handleMove(slug, "down")}
                            className="rounded-full border border-white/15 bg-transparent px-3 text-xs uppercase tracking-[0.28em] text-white/70 hover:text-white"
                            disabled={index === selectedSlugs.length - 1}
                          >
                            <MoveDown className="mr-2 h-3 w-3" />
                            Descendre
                          </Button>
                          <Button
                            type="button"
                            onClick={() => handleRemoveProof(slug)}
                            className="rounded-full border border-white/15 bg-transparent px-3 text-xs uppercase tracking-[0.28em] text-white/70 hover:text-white"
                          >
                            Retirer
                          </Button>
                          <Link
                            href={`/beyond-no-school/preuves/${slug}`}
                            className="text-xs uppercase tracking-[0.3em] text-white/60 hover:text-white"
                          >
                            Voir le détail
                          </Link>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-3xl border border-dashed border-white/15 bg-black/30 p-6 text-sm text-white/60">
                    Ajoute une preuve pour démarrer.
                  </div>
                )}
                <button
                  type="button"
                  onClick={() =>
                    document.getElementById("library-zone")?.scrollIntoView({
                      behavior: "smooth",
                    })
                  }
                  className="w-full rounded-3xl border border-dashed border-white/15 bg-black/30 p-6 text-left text-sm text-white/70"
                >
                  + Ajouter une preuve
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
              <p className="text-xs uppercase tracking-[0.35em] text-white/50">
                Exemples de trajectoires
              </p>
              <p className="mt-2 text-sm text-white/70">
                Des points de départ possibles. Tu peux tout modifier.
              </p>
              <div className="mt-4 grid gap-4">
                {exampleTrajectories.map((trajectory) => {
                  const proofItems = trajectory.proofs
                    .map((slug) => competenceBySlug(slug))
                    .filter(
                      (proof): proof is (typeof competencies)[number] => Boolean(proof),
                    );
                  return (
                    <div
                      key={trajectory.id}
                      className="rounded-3xl border border-white/10 bg-black/40 p-5 text-sm text-white/70"
                    >
                      <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                        {trajectory.profile}
                      </p>
                      <h3 className="mt-2 text-lg font-semibold text-white">
                        {trajectory.name}
                      </h3>
                      <p className="mt-2 text-sm text-white/70">{trajectory.problem}</p>
                      <div className="mt-3 space-y-2 text-sm text-white/60">
                        {proofItems.map((proof) => (
                          <div key={proof.slug}>
                            <span className="text-white/90">{proof.name}</span> ·{" "}
                            {proof.proof.type}
                          </div>
                        ))}
                      </div>
                      <p className="mt-3 text-xs text-white/50">
                        {trajectory.result}
                      </p>
                      <div className="mt-4">
                        <Button
                          type="button"
                          onClick={() => {
                            setTrajectory(trajectory.proofs);
                            setSelectedSlugs(getTrajectory().items);
                          }}
                          className="rounded-full bg-white px-4 text-xs uppercase tracking-[0.28em] text-black hover:bg-white/90"
                        >
                          Pré-remplir ma trajectoire
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div id="library-zone" className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
              <p className="text-xs uppercase tracking-[0.35em] text-white/50">
                Briques de preuve disponibles
              </p>
              <p className="mt-2 text-sm text-white/70">
                Chaque preuve est un livrable réel, mesurable, opposable.
                Tu les assembles pour construire ta trajectoire.
              </p>
              <p className="mt-4 text-sm text-white/70">
                Qu’est-ce que tu veux être capable de faire concrètement ?
              </p>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {intentions.map((intent) => (
                  <button
                    key={intent.id}
                    type="button"
                    onClick={() => handleOpenIntent(intent.id)}
                    className={`rounded-3xl border px-4 py-4 text-left text-sm transition ${
                      selectedIntention === intent.id
                        ? "border-white/40 bg-white/10 text-white"
                        : "border-white/10 bg-black/40 text-white/70 hover:border-white/25"
                    }`}
                  >
                    <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                      Intention
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">{intent.title}</p>
                    <p className="mt-2 text-sm text-white/70">{intent.prompt}</p>
                  </button>
                ))}
              </div>
              <p className="mt-6 text-xs uppercase tracking-[0.3em] text-white/50">
                Adapter au secteur (optionnel)
              </p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                {sectorOptions.map((sector) => (
                  <button
                    key={sector}
                    type="button"
                    onClick={() => setSelectedSector(sector)}
                    className={`rounded-full border px-3 py-2 uppercase tracking-[0.25em] ${
                      selectedSector === sector
                        ? "border-white/40 bg-white/10 text-white"
                        : "border-white/10 text-white/50"
                    }`}
                  >
                    {sector}
                  </button>
                ))}
                {selectedSector ? (
                  <button
                    type="button"
                    onClick={() => setSelectedSector(null)}
                    className="rounded-full border border-white/10 px-3 py-2 uppercase tracking-[0.25em] text-white/50"
                  >
                    Réinitialiser
                  </button>
                ) : null}
              </div>
            </div>

            <div className="rounded-3xl border border-dashed border-white/15 bg-black/30 p-6 text-sm text-white/60">
              Clique sur une intention pour ouvrir les preuves associées.
            </div>
          </div>
        </div>
      </section>

      <IntentModal
        intent={
          selectedIntention
            ? intentions.find((item) => item.id === selectedIntention) ?? null
            : null
        }
        proofs={associatedProofs}
        selectedSlugs={selectedSlugs}
        onAddProof={handleAddProof}
        onClose={() => setIsModalOpen(false)}
        isOpen={isModalOpen}
      />

      <div className="fixed bottom-4 left-0 right-0 z-[90] px-4">
        <div className="mx-auto flex w-full max-w-4xl flex-wrap items-center justify-between gap-4 rounded-full border border-white/15 bg-black/80 px-5 py-3 shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur">
          <div className="text-xs uppercase tracking-[0.32em] text-white/70">
            {selectedSlugs.length > 0
              ? `Sélection : ${selectedSlugs.length} preuve${selectedSlugs.length > 1 ? "s" : ""}`
              : "Sélectionne tes preuves"}
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            <Button
              type="button"
              onClick={handleCheckout}
              disabled={selectedSlugs.length === 0}
              className="w-full rounded-full bg-white px-6 text-xs uppercase tracking-[0.3em] text-black hover:bg-white/90 disabled:opacity-60 sm:w-auto"
            >
              Rendre cette trajectoire réelle
            </Button>
            {selectedSlugs.length > 0 ? (
              <button
                type="button"
                onClick={handleClearSelection}
                className="text-xs uppercase tracking-[0.3em] text-white/60 hover:text-white"
              >
                Réinitialiser
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

type IntentModalProps = {
  intent: (typeof intentions)[number] | null;
  proofs: (typeof competencies)[number][];
  selectedSlugs: string[];
  onAddProof: (slug: string) => void;
  onClose: () => void;
  isOpen: boolean;
};

function IntentModal({
  intent,
  proofs,
  selectedSlugs,
  onAddProof,
  onClose,
  isOpen,
}: IntentModalProps) {
  if (!intent) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <DialogContent className="max-h-[85vh] overflow-y-auto border-white/10 bg-[#0b0b10] text-white sm:max-w-2xl">
        <DialogTitle className="sr-only">Intention</DialogTitle>
        <DialogDescription className="sr-only">
          Sélection des preuves à fournir pour l'intention choisie
        </DialogDescription>
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-white">
            Intention : {intent.title}
          </DialogTitle>
          <DialogDescription className="text-sm text-white/60">
            Voici les preuves concrètes que tu peux produire.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 grid gap-3">
          {proofs.map((item) => {
            const isSelected = selectedSlugs.includes(item.slug);
            return (
              <div
                key={item.slug}
                className="rounded-2xl border border-white/10 bg-black/40 p-4"
              >
                <h4 className="text-sm font-semibold text-white">{item.name}</h4>
                <p className="mt-1 text-xs text-white/60">Livrable : {item.proof.type}</p>
                <p className="mt-1 text-xs text-white/60">
                  Impact : {item.identityLine ?? item.meta.shortDescription}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <Button
                    type="button"
                    onClick={() => onAddProof(item.slug)}
                    className={`rounded-full px-3 text-xs uppercase tracking-[0.28em] ${
                      isSelected
                        ? "bg-white/15 text-white hover:bg-white/25"
                        : "bg-white text-black hover:bg-white/90"
                    }`}
                  >
                    {isSelected ? "Ajoutée ✓" : "Ajouter à ma trajectoire"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <DialogFooter className="mt-6">
          <button
            type="button"
            onClick={onClose}
            className="text-xs uppercase tracking-[0.3em] text-white/60 hover:text-white"
          >
            Fermer
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}



