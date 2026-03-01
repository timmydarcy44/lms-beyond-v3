"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, BadgeCheck, BookOpen, CheckCircle2, Layers, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BnsPrivateHeader } from "@/components/beyond-no-school/bns-private-header";
import { competencies, proofResults, type CompetenceData } from "@/components/beyond-no-school/competences-data";
import { addProof, getTrajectory } from "@/lib/bns/trajectory";
import { toast } from "sonner";

type DraftItem = { slug: string; name: string; proof: string };
type EnrollmentItem = {
  id: string;
  status: string;
  current_step_index: number;
  bns_proofs: { id: string; slug: string; title: string; description?: string | null };
};
type IntentId =
  | "decider"
  | "influencer"
  | "piloter"
  | "critique"
  | "mesurer"
  | "structurer";

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const intentions: { id: IntentId; title: string; resultId: string }[] = [
  { id: "decider", title: "Analyser des données décisionnelles", resultId: "data-driven" },
  { id: "influencer", title: "Maîtriser la négociation complexe", resultId: "negociation-complexe" },
  { id: "piloter", title: "Piloter une supply chain performante", resultId: "supply-chain" },
  { id: "critique", title: "Gérer une situation critique", resultId: "communication-crise" },
  { id: "mesurer", title: "Structurer un impact RSE mesurable", resultId: "impact-rse" },
  { id: "structurer", title: "Piloter un projet complexe de bout en bout", resultId: "pilotage-projet-complexe" },
];

function BeyondNoSchoolReprendreContent() {
  const searchParams = useSearchParams();
  const [draftItems, setDraftItems] = useState<DraftItem[]>([]);
  const [enrollments, setEnrollments] = useState<EnrollmentItem[]>([]);
  const [selectedIntent, setSelectedIntent] = useState<IntentId | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const competenceBySlug = useMemo(
    () => new Map(competencies.map((competence) => [competence.slug, competence])),
    [],
  );

  useEffect(() => {
    const trajectory = getTrajectory();
    if (!trajectory.items.length) {
      setDraftItems([]);
      return;
    }
    const items = trajectory.items
      .map((slug) => competencies.find((competence) => competence.slug === slug))
      .filter((competence): competence is CompetenceData => Boolean(competence))
      .map((competence) => ({
        slug: competence.slug,
        name: competence.name,
        proof: competence.proof.type,
      }));
    setDraftItems(items);
  }, []);

  useEffect(() => {
    const loadEnrollments = async () => {
      const response = await fetch("/api/bns/me/proofs");
      if (!response.ok) return;
      const result = await response.json();
      if (result.ok) {
        setEnrollments(result.enrollments ?? []);
      }
    };
    loadEnrollments();
  }, []);

  useEffect(() => {
    if (searchParams.get("welcome") === "1") {
      toast.success("Accès activé ✅ — ta bibliothèque est ouverte");
    }
  }, [searchParams]);

  const heroItem = enrollments.length
    ? {
        slug: enrollments[0].bns_proofs.slug,
        name: enrollments[0].bns_proofs.title,
        proof: enrollments[0].bns_proofs.description ?? "Preuve en cours",
      }
    : draftItems[0];

  const proofStatuses = useMemo(() => {
    if (enrollments.length) {
      return enrollments.map((enrollment, index) => ({
        slug: enrollment.bns_proofs.slug,
        name: enrollment.bns_proofs.title,
        proof: enrollment.bns_proofs.description ?? "Preuve en cours",
        status:
          enrollment.status === "validated"
            ? "Validée"
            : enrollment.status === "in_review"
              ? "En validation"
              : index === 0
                ? "En cours"
                : "À démarrer",
      }));
    }
    return draftItems.map((item, index) => ({
      ...item,
      status: index === 0 ? "En cours" : index === 1 ? "À démarrer" : "En validation",
    }));
  }, [draftItems, enrollments]);

  const handleAddProof = (slug: string) => {
    const competence = competenceBySlug.get(slug);
    if (!competence) return;
    addProof(slug);
    setDraftItems((prev) => {
      if (prev.some((item) => item.slug === slug)) return prev;
      return [...prev, { slug, name: competence.name, proof: competence.proof.type }];
    });
  };

  const handleScrollToProof = (slug: string) => {
    document.getElementById(`preuve-${slug}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleOpenIntent = (intentId: string) => {
    setSelectedIntent(intentId as IntentId);
    setIsModalOpen(true);
  };

  const selectedResult = useMemo(() => {
    if (!selectedIntent) return null;
    const intent = intentions.find((item) => item.id === selectedIntent);
    return proofResults.find((result) => result.id === intent?.resultId) ?? null;
  }, [selectedIntent]);

  const associatedProofs = useMemo(() => {
    if (!selectedResult) return [];
    return selectedResult.competenceSlugs
      .map((slug) => competenceBySlug.get(slug))
      .filter((competence): competence is CompetenceData => Boolean(competence))
      .slice(0, 5);
  }, [selectedResult, competenceBySlug]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0b0b10] pb-28 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_10%,rgba(255,88,61,0.18),transparent_45%),radial-gradient(circle_at_82%_20%,rgba(80,130,255,0.12),transparent_45%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(180deg,rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:2px_2px]" />

      <BnsPrivateHeader
        inProgressProofs={proofStatuses.map((item) => ({ id: item.slug, title: item.name }))}
        exploreIntents={intentions.map((intent) => ({ id: intent.id, title: intent.title }))}
        onScrollToProof={handleScrollToProof}
        onOpenIntent={handleOpenIntent}
      />

      <div className="mx-auto max-w-6xl space-y-12 px-6 pb-20 pt-12 sm:px-12 lg:px-24">
        <section className="relative space-y-8">
          <motion.div initial="hidden" animate="show" variants={fadeUp} className="space-y-4">
            <p className="text-xs uppercase tracking-[0.4em] text-white/50">Beyond No School</p>
            <h1 className="text-pretty text-4xl font-semibold sm:text-5xl lg:text-6xl">
              Reprendre
            </h1>
            <p className="text-lg text-white/70">
              Une preuve à la fois. Une progression visible.
            </p>
          </motion.div>
        </section>

        <section className="space-y-6">
          <Link
            href={heroItem ? `/beyond-no-school/preuves/${heroItem.slug}` : "/beyond-no-school/preuves"}
            className="block rounded-3xl border border-white/10 bg-white/[0.02] p-8 transition hover:border-white/25"
          >
            <div className="flex items-center gap-3 text-xs uppercase tracking-[0.35em] text-white/50">
              <ArrowRight className="h-4 w-4" />
              Ta prochaine action (2 min)
            </div>
            {heroItem ? (
              <div className="mt-6 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                    Preuve en cours
                  </p>
                  <h2 className="text-2xl font-semibold text-white">{heroItem.name}</h2>
                  <p className="text-sm text-white/70">{heroItem.proof}</p>
                  <p className="text-xs text-white/50">Étape 2/5 · Déposer le livrable</p>
                  <p className="text-sm text-white/70">Une action simple. Un pas concret.</p>
                  <div className="mt-4 h-2 w-full max-w-xs rounded-full bg-white/10">
                    <div className="h-2 w-[35%] rounded-full bg-white" />
                  </div>
                  <p className="text-xs text-white/50">Dernière action : brouillon enregistré</p>
                  <p className="text-xs uppercase tracking-[0.3em] text-white/60">
                    Validation humaine · mentor / communauté
                  </p>
                </div>
                <Button className="rounded-full bg-white px-6 text-xs uppercase tracking-[0.3em] text-black hover:bg-white/90">
                  Continuer
                </Button>
              </div>
            ) : (
              <div className="mt-6 rounded-3xl border border-dashed border-white/15 bg-black/30 p-6 text-sm text-white/60">
                Choisis une preuve pour commencer.
              </div>
            )}
          </Link>
        </section>

        <section id="preuves" className="space-y-4">
          <div className="flex items-center gap-3 text-xs uppercase tracking-[0.35em] text-white/50">
            <Layers className="h-4 w-4" />
            Mes preuves
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {proofStatuses.length ? (
              proofStatuses.slice(0, 6).map((item) => (
                <div
                  key={item.slug}
                  id={`preuve-${item.slug}`}
                  className="rounded-3xl border border-white/10 bg-white/[0.02] p-6"
                >
                  <p className="text-xs uppercase tracking-[0.3em] text-white/50">Badge</p>
                  <h3 className="mt-3 text-lg font-semibold text-white">{item.name}</h3>
                  <p className="mt-2 text-sm text-white/70">{item.proof}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.3em] text-white/60">
                    <CheckCircle2 className="h-3 w-3 text-white/60" />
                    {item.status}
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <Button className="rounded-full bg-white px-4 text-xs uppercase tracking-[0.28em] text-black hover:bg-white/90">
                      {item.status === "En cours" ? "Continuer" : "Commencer"}
                    </Button>
                    <Link
                      href={`/beyond-no-school/preuves/${item.slug}`}
                      className="text-xs uppercase tracking-[0.3em] text-white/60 hover:text-white"
                    >
                      Voir la preuve attendue
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-3xl border border-dashed border-white/15 bg-black/30 p-6 text-sm text-white/60">
                Ta liste de preuves apparaîtra ici.
              </div>
            )}
          </div>
        </section>

        <section id="explorer" className="space-y-6 pt-6">
          <div className="flex items-center gap-3 text-xs uppercase tracking-[0.35em] text-white/50">
            <Layers className="h-4 w-4" />
            Explorer d’autres preuves
          </div>
          <p className="text-sm text-white/70">
            Quand tu seras prêt, tu pourras aussi prouver…
          </p>
          <div className="grid gap-4 md:grid-cols-3">
            {proofResults.slice(0, 3).map((result) => {
              const sampleBadge = result.competenceSlugs
                .map((slug) => competenceBySlug.get(slug))
                .find(Boolean);
              const intentMatch = intentions.find((intent) => intent.resultId === result.id);
              return (
                <div
                  key={result.id}
                  className="rounded-3xl border border-white/10 bg-white/[0.02] p-6"
                >
                  <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                    Objectif clair
                  </p>
                  <h3 className="mt-3 text-lg font-semibold text-white">{result.title}</h3>
                  {sampleBadge ? (
                    <p className="mt-3 text-sm text-white/60">
                      Exemple de livrable : {sampleBadge.proof.type}
                    </p>
                  ) : null}
                  <div className="mt-4">
                    {intentMatch ? (
                      <button
                        type="button"
                        onClick={() => handleOpenIntent(intentMatch.id)}
                        className="text-xs uppercase tracking-[0.3em] text-white/60 hover:text-white"
                      >
                        Voir les preuves associées
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="space-y-6">
          <div className="space-y-6 rounded-3xl border border-white/10 bg-white/[0.02] p-8">
            <div className="flex items-center gap-3 text-xs uppercase tracking-[0.35em] text-white/50">
              <BookOpen className="h-4 w-4" />
              Formations & ressources
            </div>
            <p className="text-sm text-white/70">
              Ces ressources existent uniquement pour t’aider à produire la preuve attendue.
            </p>
            <div className="grid gap-4 md:grid-cols-3">
              {[
                { title: "Ateliers livrables" },
                { title: "Guides terrain" },
                { title: "Synthèses action" },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-white/10 bg-black/40 p-5 text-sm text-white/70"
                >
                  <p className="text-xs uppercase tracking-[0.3em] text-white/50">Ressource</p>
                  <h3 className="mt-2 text-lg font-semibold text-white">{item.title}</h3>
                  <p className="mt-3 text-xs text-white/60">
                    Liée à la preuve sélectionnée.
                  </p>
                  <div className="mt-4">
                    <Button className="rounded-full bg-white px-4 text-xs uppercase tracking-[0.28em] text-black hover:bg-white/90">
                      Accéder pour avancer
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="badges" className="space-y-6 pt-6">
          <div className="space-y-6">
            <div className="flex items-center gap-3 text-xs uppercase tracking-[0.35em] text-white/50">
              <BadgeCheck className="h-4 w-4" />
              Mes Open Badges
            </div>
            <p className="text-sm text-white/70">
              Quand une preuve est validée, ton badge devient public et vérifiable.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
                <p className="text-sm text-white/70">Badges obtenus</p>
                <p className="mt-3 text-xs text-white/50">Aucun badge validé pour l’instant.</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
                <p className="text-sm text-white/70">Badges en cours</p>
                <p className="mt-3 text-xs text-white/50">Ils apparaîtront ici au fur et à mesure.</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button className="rounded-full bg-white px-6 text-xs uppercase tracking-[0.3em] text-black hover:bg-white/90">
                Comprendre la validation
              </Button>
              <Button className="rounded-full border border-white/15 bg-transparent px-6 text-xs uppercase tracking-[0.3em] text-white/70 hover:text-white">
                Connecter mes preuves à Beyond Connect
              </Button>
            </div>
          </div>
        </section>

        <section id="compte" className="space-y-6 pt-6">
          <div className="space-y-6 rounded-3xl border border-white/10 bg-white/[0.02] p-8">
            <div className="flex items-center gap-3 text-xs uppercase tracking-[0.35em] text-white/50">
              <UserRound className="h-4 w-4" />
              Mon compte
            </div>
            <p className="text-sm text-white/70">
              Personnalise tes coordonnées et le suivi de ta progression.
            </p>
            <form className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="firstName">Prénom</Label>
                <Input id="firstName" placeholder="Prénom" className="border-white/20 bg-white/5 text-white" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lastName">Nom</Label>
                <Input id="lastName" placeholder="Nom" className="border-white/20 bg-white/5 text-white" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="email@exemple.com" className="border-white/20 bg-white/5 text-white" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Téléphone (optionnel)</Label>
                <Input id="phone" placeholder="+33 6..." className="border-white/20 bg-white/5 text-white" />
              </div>
              <div className="grid gap-2 md:col-span-2">
                <Label htmlFor="linkedin">LinkedIn (optionnel)</Label>
                <Input id="linkedin" placeholder="linkedin.com/in/..." className="border-white/20 bg-white/5 text-white" />
              </div>
            </form>
            <Button className="rounded-full bg-white px-6 text-xs uppercase tracking-[0.3em] text-black hover:bg-white/90">
              Compléter mon profil (60 sec)
            </Button>
          </div>
        </section>
      </div>

      <IntentModal
        intent={selectedIntent ? intentions.find((item) => item.id === selectedIntent) ?? null : null}
        proofs={associatedProofs}
        selectedSlugs={draftItems.map((item) => item.slug)}
        onAddProof={handleAddProof}
        onClose={() => setIsModalOpen(false)}
        isOpen={isModalOpen}
      />
    </main>
  );
}

export default function BeyondNoSchoolReprendrePage() {
  return (
    <Suspense fallback={null}>
      <BeyondNoSchoolReprendreContent />
    </Suspense>
  );
}

type IntentModalProps = {
  intent: { id: IntentId; title: string; resultId: string } | null;
  proofs: CompetenceData[];
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
              <div key={item.slug} className="rounded-2xl border border-white/10 bg-black/40 p-4">
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

