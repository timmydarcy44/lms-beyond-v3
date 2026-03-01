"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  BadgeCheck,
  CheckCircle2,
  Layers,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  competencies,
  type CompetenceData,
} from "@/components/beyond-no-school/competences-data";
import { getDraft } from "@/lib/bns-trajectory-draft";
import { useSupabase } from "@/components/providers/supabase-provider";

type DraftSummary = {
  items: { slug: string; name: string; proof: string }[];
};

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function BeyondNoSchoolAbonnementPage() {
  const router = useRouter();
  const supabase = useSupabase();
  const [draftSummary, setDraftSummary] = useState<DraftSummary>({ items: [] });

  useEffect(() => {
    const draft = getDraft();
    if (!draft.items.length) {
      setDraftSummary({ items: [] });
      return;
    }
    const items = draft.items
      .map((slug) => competencies.find((competence) => competence.slug === slug))
      .filter((competence): competence is CompetenceData => Boolean(competence))
      .map((competence) => ({
        slug: competence.slug,
        name: competence.name,
        proof: competence.proof.type,
      }));
    setDraftSummary({ items });
  }, []);

  const hasDraft = draftSummary.items.length > 0;
  const checkoutHref = "/beyond-no-school/checkout";
  const activationHref = `/beyond-no-school/activation?next=${encodeURIComponent(
    checkoutHref,
  )}`;

  const handlePrimaryCta = async () => {
    console.info("[BNS] abonnement CTA clicked");
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      router.push(checkoutHref);
      return;
    }
    router.push(activationHref);
  };

  const reassuranceItems = useMemo(
    () => [
      "Annulable à tout moment.",
      "Open Badges vérifiables.",
      "Preuves concrètes, pas de blabla.",
    ],
    [],
  );

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0b0b10] pb-28 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(255,88,61,0.18),transparent_50%),radial-gradient(circle_at_85%_20%,rgba(80,130,255,0.12),transparent_50%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(180deg,rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:2px_2px]" />

      <section className="relative px-6 pb-20 pt-24 sm:px-12 lg:px-24">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <motion.div initial="hidden" animate="show" variants={fadeUp} className="space-y-6">
            <p className="text-xs uppercase tracking-[0.4em] text-white/50">
              Beyond No School
            </p>
            <h1 className="text-pretty text-4xl font-semibold sm:text-5xl lg:text-6xl">
              Abonnement & engagement.
            </h1>
            <p className="text-lg text-white/70">
              Paiement aujourd’hui pour activer l’accès.
            </p>
            <p className="text-sm text-white/70">
              Formations en ligne, neuro-adaptées, contenus transformables, stratégie
              d’apprentissage personnalisée.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-4">
              <Button
                className="rounded-full bg-white px-6 text-xs uppercase tracking-[0.3em] text-black hover:bg-white/90"
                onClick={handlePrimaryCta}
              >
                Activer l’accès (30 €/mois)
              </Button>
              <Button
                asChild
                variant="ghost"
                className="rounded-full border border-white/15 px-6 text-xs uppercase tracking-[0.3em] text-white/70 hover:text-white"
              >
                <Link href="/beyond-no-school/preuves">Retour aux preuves</Link>
              </Button>
            </div>
            <p className="text-sm text-white/60">
              Open Badges obtenus après validation de tes preuves.
            </p>
            <p className="text-sm text-white/60">Annulable à tout moment.</p>
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">
              30 € / mois · Annulable à tout moment.
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs uppercase tracking-[0.3em] text-white/50">
              {reassuranceItems.map((item) => (
                <span key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-white/60" />
                  {item}
                </span>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.45)]"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.35em] text-white/50">
                Résumé de tes preuves
              </p>
              <span className="rounded-full border border-white/15 px-3 py-1 text-xs uppercase tracking-[0.3em] text-white/70">
                {draftSummary.items.length} preuve
                {draftSummary.items.length > 1 ? "s" : ""}
              </span>
            </div>
            <div className="mt-6 space-y-4">
              {hasDraft ? (
                draftSummary.items.map((item) => (
                  <div
                    key={item.slug}
                    className="rounded-2xl border border-white/10 bg-black/40 p-4"
                  >
                    <p className="text-xs uppercase tracking-[0.3em] text-white/50">Badge</p>
                    <h3 className="mt-2 text-lg font-semibold text-white">{item.name}</h3>
                    <p className="mt-2 text-sm text-white/70">{item.proof}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-white/15 bg-black/30 p-6 text-sm text-white/60">
                  Tu n’as rien sélectionné.
                  <div className="mt-4">
                    <Link
                      href="/beyond-no-school/preuves"
                      className="text-xs uppercase tracking-[0.3em] text-white/80 hover:text-white"
                    >
                      Retour aux preuves
                    </Link>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/70">
              <p className="text-sm text-white/80">
                Paiement aujourd’hui pour activer l’accès.
              </p>
              <p className="mt-2 text-xs uppercase tracking-[0.3em] text-white/50">
                Open Badges obtenus après validation.
              </p>
              <div className="mt-4">
                <Link
                  href="/beyond-no-school/preuves"
                  className="inline-flex rounded-full border border-white/15 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/70 hover:border-white/40 hover:text-white"
                >
                  Modifier mes preuves
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="px-6 pb-20 sm:px-12 lg:px-24">
        <div className="mx-auto max-w-6xl space-y-8">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">
            Open Badge = preuve + validation.
          </p>
          <h2 className="text-2xl font-semibold text-white">Ce que tu débloques</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Layers,
                title: "Accès aux formations en ligne",
                copy: "Pour produire des preuves concrètes.",
                bullets: ["Modules ciblés", "Exécution guidée"],
              },
              {
                icon: ShieldCheck,
                title: "Contenu neuro-adapté",
                copy: "Formats multiples, transformables.",
                bullets: ["Schéma, mind map", "Flashcards, audio"],
              },
              {
                icon: BadgeCheck,
                title: "Validation + Open Badge",
                copy: "Preuve vérifiée, badge public.",
                bullets: ["Critères clairs", "Badge opposable"],
              },
            ].map((item) => (
              <motion.div
                key={item.title}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                variants={fadeUp}
                className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.4)]"
              >
                <item.icon className="h-6 w-6 text-white/80" />
                <h3 className="mt-4 text-lg font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-sm text-white/70">{item.copy}</p>
                <ul className="mt-4 space-y-2 text-sm text-white/60">
                  {item.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-white/50" />
                      {bullet}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 pb-20 sm:px-12 lg:px-24">
        <div className="mx-auto max-w-5xl space-y-6 rounded-3xl border border-white/10 bg-white/[0.02] p-10">
          <div className="flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-white/50">
            <Sparkles className="h-4 w-4" />
            Neuro-adapté
          </div>
          <h2 className="text-2xl font-semibold text-white">Une formation qui s’adapte.</h2>
          <div className="grid gap-4 text-sm text-white/70 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
              Tu peux transformer un module en : schéma, mind map, flashcards, résumé
              audio/texte.
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
              On s’adapte à ton mode d’apprentissage : visuel, auditif, kinesthésique,
              TDAH, DYS, HPI…
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/30 p-5 text-sm text-white/70">
            Objectif : compréhension + exécution terrain, pas du blabla.
          </div>
          <p className="text-sm text-white/60">
            Stratégie d’apprentissage personnalisée pour progresser vite et durablement.
          </p>
        </div>
      </section>

      <section className="px-6 pb-28 sm:px-12 lg:px-24">
        <div className="mx-auto max-w-5xl space-y-8">
          <h2 className="text-2xl font-semibold text-white">Engagement mensuel</h2>
          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8">
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">
              Un cadre clair, sans surprise
            </p>
            <div className="mt-4 flex flex-wrap items-baseline gap-3">
              <span className="text-3xl font-semibold text-white">30 €</span>
              <span className="text-sm text-white/60">/ mois</span>
            </div>
            <p className="mt-4 text-sm text-white/70">
              Paiement aujourd’hui pour activer l’accès.
            </p>
            <div className="mt-6 grid gap-3 text-sm text-white/70 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                Accès aux formations en ligne.
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                Contenu neuro-adapté.
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                Validation + Open Badge vérifiable.
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                Arrêt possible à tout moment.
              </div>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button
                className="rounded-full bg-white px-6 text-xs uppercase tracking-[0.3em] text-black hover:bg-white/90"
                onClick={handlePrimaryCta}
              >
                Activer l’accès (30 €/mois)
              </Button>
              <Button
                asChild
                variant="ghost"
                className="rounded-full border border-white/15 px-6 text-xs uppercase tracking-[0.3em] text-white/70 hover:text-white"
              >
                <Link href="/beyond-no-school/preuves">Modifier mes preuves</Link>
              </Button>
            </div>
            <p className="mt-4 text-sm text-white/60">
              Open Badges obtenus après validation de tes preuves.
            </p>
          </div>
        </div>
      </section>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="fixed bottom-4 left-0 right-0 z-[90] px-4"
      >
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-4 rounded-full border border-white/15 bg-black/80 px-5 py-3 shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur">
          <div className="text-xs uppercase tracking-[0.32em] text-white/70">
            Tes preuves · {draftSummary.items.length} sélectionnée
            {draftSummary.items.length > 1 ? "s" : ""}
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            <Button
              className="w-full rounded-full bg-white px-6 text-xs uppercase tracking-[0.3em] text-black hover:bg-white/90 sm:w-auto"
              onClick={hasDraft ? handlePrimaryCta : () => router.push("/beyond-no-school/preuves")}
            >
              {hasDraft ? "Activer l’accès (30 €/mois)" : "Retour aux preuves"}
            </Button>
          </div>
        </div>
      </motion.div>
    </main>
  );
}

