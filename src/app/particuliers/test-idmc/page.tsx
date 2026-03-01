"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type AxisKey = "A1" | "A2" | "A3" | "A4" | "A5" | "A6" | "A7" | "A8";
type LikertValue = 0 | 1 | 2 | 3;

const LIKERT_OPTIONS: Array<{ label: string; value: LikertValue }> = [
  { label: "Jamais", value: 0 },
  { label: "Parfois", value: 1 },
  { label: "Souvent", value: 2 },
  { label: "Toujours", value: 3 },
];

const AXES_LABELS: Record<AxisKey, string> = {
  A1: "Connaissance de soi",
  A2: "Maîtrise des méthodes",
  A3: "Adaptation au contexte",
  A4: "Organisation et anticipation",
  A5: "Traitement de l'information",
  A6: "Résolution de difficultés",
  A7: "Suivi de progression",
  A8: "Auto-évaluation finale",
};

type QuestionItem = {
  axis: AxisKey;
  order: number;
  text: string;
  reversed?: boolean;
};

const IDMC_QUESTIONS: QuestionItem[] = [
  { axis: "A1", order: 1, text: "Quand je reçois un résultat décevant, je suis capable d'identifier précisément les points sur lesquels j'ai perdu des points." },
  { axis: "A1", order: 2, text: "Je connais les moments de la journée où je suis le plus concentré(e) et j'organise mon travail en conséquence." },
  { axis: "A1", order: 3, text: "Avant d'aborder un nouveau sujet, je suis capable d'évaluer si j'ai les bases suffisantes pour le comprendre." },
  { axis: "A1", order: 4, text: "Je commence souvent une tâche sans avoir vérifié que j'avais bien compris ce qu'on attendait de moi.", reversed: true },
  { axis: "A1", order: 5, text: "Je sais distinguer ce que j'ai vraiment compris de ce que j'ai simplement mémorisé sans comprendre." },
  { axis: "A2", order: 1, text: "Mes prises de notes sont organisées de façon à pouvoir les réutiliser facilement lors des révisions." },
  { axis: "A2", order: 2, text: "J'ai une méthode de révision que j'adapte selon la matière et dont je mesure l'efficacité." },
  { axis: "A2", order: 3, text: "Je connais et applique les critères d'évaluation attendus par mes formateurs avant de rendre un travail." },
  { axis: "A2", order: 4, text: "J'utilise des techniques concrètes (associations, schémas, répétition espacée) pour mémoriser des informations clés." },
  { axis: "A2", order: 5, text: "Je construis mes plans ou argumentaires de façon structurée avant de commencer à rédiger." },
  { axis: "A3", order: 1, text: "Quand j'aborde un nouveau cours, je cherche spontanément à faire le lien avec ce que je vis ou ai déjà vécu." },
  { axis: "A3", order: 2, text: "Je change de méthode de travail selon qu'il s'agit d'un cas pratique, d'un exercice théorique ou d'un projet." },
  { axis: "A3", order: 3, text: "Je mobilise mes points forts dans certaines matières pour surmonter mes difficultés dans d'autres." },
  { axis: "A3", order: 4, text: "J'adapte ma vitesse de lecture selon que le passage est central ou secondaire dans le sujet." },
  { axis: "A3", order: 5, text: "Je choisis mes outils de travail (tableau, schéma, fiche, tableur) en fonction du problème à résoudre, pas par habitude." },
  { axis: "A4", order: 1, text: "Je planifie mes échéances suffisamment à l'avance pour ne pas me retrouver en situation de rush." },
  { axis: "A4", order: 2, text: "Avant de démarrer une tâche, je rassemble tout ce dont j'ai besoin pour ne pas être interrompu(e) en cours de route." },
  { axis: "A4", order: 3, text: "Je définis clairement ce que je veux avoir accompli avant de commencer à travailler." },
  { axis: "A4", order: 4, text: "J'ai tendance à démarrer directement sans planifier les étapes, ce qui me fait parfois perdre du temps.", reversed: true },
  { axis: "A4", order: 5, text: "J'estime le temps nécessaire pour chaque partie de mon travail avant de me lancer." },
  { axis: "A5", order: 1, text: "Quand un passage est complexe, je ralentis volontairement ma lecture plutôt que de le survoler." },
  { axis: "A5", order: 2, text: "Je cherche d'abord à comprendre l'idée générale d'un texte avant de me concentrer sur les détails." },
  { axis: "A5", order: 3, text: "Pour comprendre un concept abstrait, je construis spontanément un exemple concret lié à ma vie ou à mon secteur." },
  { axis: "A5", order: 4, text: "Je suis capable de reformuler avec mes propres mots ce que je viens d'apprendre, sans regarder mes notes." },
  { axis: "A5", order: 5, text: "J'utilise des supports visuels (schémas, tableaux, cartes mentales) pour organiser et retenir l'information." },
  { axis: "A6", order: 1, text: "Quand je suis bloqué(e), je demande de l'aide à un formateur ou un pair plutôt que de rester seul(e) face au problème." },
  { axis: "A6", order: 2, text: "Quand je vois qu'une méthode ne fonctionne pas, je change d'approche sans attendre d'être complètement bloqué(e)." },
  { axis: "A6", order: 3, text: "Quand je perds le fil d'une explication, je reviens au début plutôt que de continuer sans comprendre." },
  { axis: "A6", order: 4, text: "Je décompose les problèmes complexes en sous-questions simples pour les traiter une par une." },
  { axis: "A6", order: 5, text: "Après une erreur, j'identifie précisément ce qui l'a causée pour éviter de la reproduire." },
  { axis: "A7", order: 1, text: "Pendant un travail long, je fais des pauses régulières pour vérifier que je suis toujours sur la bonne voie." },
  { axis: "A7", order: 2, text: "Je contrôle la qualité de ce que je produis au fur et à mesure, pas seulement à la fin." },
  { axis: "A7", order: 3, text: "Avant de rendre un travail, je vérifie que j'ai bien répondu à tous les points de la consigne." },
  { axis: "A7", order: 4, text: "Il m'arrive de terminer un exercice sans vérifier si ma méthode était vraiment la plus adaptée.", reversed: true },
  { axis: "A7", order: 5, text: "Quand je vois que le temps me manque, j'ajuste mes objectifs pour terminer l'essentiel plutôt que de tout bâcler." },
  { axis: "A8", order: 1, text: "Juste après un exercice ou un examen, je suis capable d'estimer mon niveau de performance de façon réaliste." },
  { axis: "A8", order: 2, text: "Une fois une tâche terminée, je prends le temps de résumer ce que j'en ai appris." },
  { axis: "A8", order: 3, text: "Je suis capable de dire honnêtement si j'ai vraiment donné le meilleur de moi-même sur un travail." },
  { axis: "A8", order: 4, text: "J'analyse mes erreurs passées pour en tirer des règles concrètes applicables à mes prochains travaux." },
  { axis: "A8", order: 5, text: "Je termine souvent un travail sans vraiment réfléchir à ce que j'aurais pu faire différemment.", reversed: true },
];

const PROFESSIONAL_REPLACEMENTS: Array<{ pattern: RegExp; replacement: string }> = [
  { pattern: /\bcours\b/gi, replacement: "projets" },
  { pattern: /\brévisions\b/gi, replacement: "missions" },
  { pattern: /\bexamen\b/gi, replacement: "livrables" },
  { pattern: /\bexamens\b/gi, replacement: "livrables" },
  { pattern: /\bformateur\b/gi, replacement: "manager/client" },
  { pattern: /\bformateurs\b/gi, replacement: "managers/clients" },
];

const ResultChart = ({
  scores,
  labels,
}: {
  scores: Record<AxisKey, number>;
  labels: Record<AxisKey, string>;
}) => {
  const items = (Object.keys(labels) as AxisKey[]).map((key) => ({
    key,
    label: labels[key],
    value: scores[key],
  }));

  return (
    <div className="rounded-2xl border border-black/10 bg-white p-5">
      <div className="text-[12px] text-black/60">Histogramme des axes</div>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={item.key} className="space-y-1">
            <div className="text-[12px] font-semibold text-black/70">
              {item.label} — {item.value}%
            </div>
            <div className="h-2 w-full rounded-full bg-black/10">
              <div
                className="h-2 rounded-full bg-black"
                style={{ width: `${item.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

function ParticuliersIdmcTestInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [profileId, setProfileId] = useState<string | null>(null);
  const [isProfessional, setIsProfessional] = useState(false);
  const [index, setIndex] = useState(0);
  const [selectedValue, setSelectedValue] = useState<LikertValue | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [savingResults, setSavingResults] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [responses, setResponses] = useState<
    Array<{
      axis: AxisKey;
      question_index: number;
      text: string;
      value: LikertValue;
      score: number;
      reversed: boolean;
    }>
  >([]);

  useEffect(() => {
    const paramId = searchParams.get("profileId");
    if (paramId) {
      setProfileId(paramId);
      try {
        sessionStorage.setItem("particulierProfileId", paramId);
      } catch {
        // ignore
      }
      return;
    }
    try {
      const storedId = sessionStorage.getItem("particulierProfileId");
      if (storedId) setProfileId(storedId);
    } catch {
      // ignore
    }
  }, [searchParams]);

  useEffect(() => {
    const loadRole = async () => {
      if (!profileId) return;
      const supabase = createSupabaseBrowserClient();
      if (!supabase) return;
      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", profileId)
        .maybeSingle();
      setIsProfessional(String(data?.role || "").toLowerCase() === "professional");
    };
    loadRole();
  }, [profileId]);

  const current = IDMC_QUESTIONS[index];
  const progress = completed
    ? 100
    : Math.round(((index + 1) / IDMC_QUESTIONS.length) * 100);

  const axisPoints = useMemo(() => {
    const base: Record<AxisKey, number> = {
      A1: 0,
      A2: 0,
      A3: 0,
      A4: 0,
      A5: 0,
      A6: 0,
      A7: 0,
      A8: 0,
    };
    for (const response of responses) {
      base[response.axis] += response.score;
    }
    return base;
  }, [responses]);

  const axisPercentages = useMemo(() => {
    const base = {} as Record<AxisKey, number>;
    (Object.keys(axisPoints) as AxisKey[]).forEach((key) => {
      base[key] = Math.round((axisPoints[key] / 15) * 100);
    });
    return base;
  }, [axisPoints]);

  const totalScore = useMemo(() => {
    const total = Object.values(axisPoints).reduce((sum, value) => sum + value, 0);
    return (total / 120) * 100;
  }, [axisPoints]);

  const level = useMemo(() => {
    if (totalScore < 40) return "Maîtrise à construire";
    if (totalScore < 60) return "Maîtrise en développement";
    if (totalScore < 80) return "Maîtrise opérationnelle";
    return "Maîtrise experte";
  }, [totalScore]);

  const adaptText = (text: string) => {
    if (!isProfessional) return text;
    return PROFESSIONAL_REPLACEMENTS.reduce(
      (acc, rule) => acc.replace(rule.pattern, rule.replacement),
      text
    );
  };

  const handleSelect = (value: LikertValue) => {
    if (selectedValue !== null || submitting || analyzing || completed) return;
    setSelectedValue(value);
    const isReversed = Boolean(current.reversed);
    const score = isReversed ? 3 - value : value;

    setResponses((prev) => [
      ...prev.filter((item) => item.question_index !== index + 1),
      {
        axis: current.axis,
        question_index: index + 1,
        text: adaptText(current.text),
        value,
        score,
        reversed: isReversed,
      },
    ]);

    setTimeout(() => {
      if (index < IDMC_QUESTIONS.length - 1) {
        setIndex((prev) => prev + 1);
        setSelectedValue(null);
        return;
      }

      setSubmitting(true);
      setAnalyzing(true);
      setTimeout(() => {
        setAnalyzing(false);
        setSubmitting(false);
        setCompleted(true);
        setSelectedValue(null);
      }, 900);
    }, 250);
  };

  const handleSaveResults = async () => {
    if (responses.length < IDMC_QUESTIONS.length) {
      setSavedMessage("Merci de répondre à toutes les questions.");
      return;
    }

    setSavingResults(true);
    setSavedMessage("");

    try {
      const supabase = createSupabaseBrowserClient();
      if (!supabase) {
        throw new Error("Supabase non configuré.");
      }

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        console.error("Session introuvable:", authError);
        alert("Erreur de session. Reconnecte-toi.");
        return;
      }

      console.log("Tentative de sauvegarde IDMC pour l'ID:", user.id);
      console.log("UUID envoyé à la table IDMC :", user.id);

      const payload = {
        profile_id: user.id,
        scores: {
          axes: axisPercentages,
          points: axisPoints,
          global_score: Number(totalScore.toFixed(2)),
          level,
        },
        updated_at: new Date().toISOString(),
      };

      console.log("ID de session:", user.id);
      console.log("ID envoyé à la base:", payload.profile_id);
      if (payload.profile_id !== user.id) {
        setSavedMessage("Erreur : identifiant de session invalide.");
        return;
      }

      console.log("Payload envoyé :", payload);
      const { error: dbError } = await supabase
        .from("idmc_resultats")
        .upsert(payload, {
          onConflict: "profile_id",
        });

      if (dbError) {
        console.error("Détails de l'erreur DB:", dbError);
        console.error("Erreur Supabase :", dbError);
        console.error("[idmc] idmc_resultats error:", dbError);
        alert(`Erreur lors de l'enregistrement IDMC: ${dbError.message}`);
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", user.id)
          .single();
        if (!profile) {
          console.error("ALERTE : Le profil n'existe pas dans la table public.profiles !");
        }
        return;
      }

      console.log("Sauvegarde IDMC réussie !");
      window.location.href = "/dashboard/apprenant";
    } catch (error) {
      setSavedMessage(
        error instanceof Error ? error.message : "Erreur lors de l'enregistrement."
      );
    } finally {
      setSavingResults(false);
    }
  };

  if (!profileId) {
    return (
      <div className="min-h-screen bg-white text-black">
        <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center px-6 text-center font-['Inter']">
          <h1 className="text-2xl font-semibold">Session expirée, merci de recommencer votre inscription</h1>
          <a
            href="/particuliers"
            className="mt-4 rounded-full border border-black px-5 py-2 text-sm font-semibold text-black"
          >
            Retour à l&apos;inscription
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black">
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap");
      `}</style>
      <div className="mx-auto grid min-h-screen w-full max-w-6xl grid-cols-1 gap-10 px-6 py-16 font-['Inter'] lg:grid-cols-2">
        <div className="flex flex-col justify-center">
          <div className="mb-8">
            <div className="h-[2px] w-full rounded-full bg-black/10">
              <div className="h-[2px] rounded-full bg-[#F97316]" style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-3 text-[12px] text-black/50">
              {completed ? "Test terminé" : `Question ${index + 1} sur ${IDMC_QUESTIONS.length}`}
            </div>
          </div>

          {!completed ? (
            <>
              <h1 className="text-3xl font-semibold tracking-tight text-black sm:text-4xl">
                Test IDMC
              </h1>
              <p className="mt-2 text-[14px] text-black/70">{adaptText(current.text)}</p>

              <div className="mt-6 flex flex-row gap-3">
                {LIKERT_OPTIONS.map((option) => (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    disabled={submitting || analyzing}
                    className={`flex-1 rounded-2xl border px-3 py-3 text-center text-[12px] font-medium text-black transition ${
                      selectedValue === option.value
                        ? "border-[#F97316] shadow-[0_0_25px_rgba(249,115,22,0.35)]"
                        : "border-black/10 bg-white hover:border-[#F97316]"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              {analyzing ? (
                <div className="mt-8 flex items-center gap-2 text-[12px] text-black/60">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-black/70" />
                  Analyse en cours...
                </div>
              ) : null}
            </>
          ) : (
            <div className="space-y-4">
              <h1 className="text-3xl font-semibold tracking-tight text-black sm:text-4xl">
                Ton profil IDMC est prêt.
              </h1>
              <p className="text-[14px] text-black/70">
                Score global IDMC :{" "}
                <span className="font-semibold">{Number(totalScore.toFixed(1))}%</span>
              </p>
              <p className="text-[14px] text-black/70">
                Niveau : <span className="font-semibold">{level}</span>
              </p>
              <ResultChart scores={axisPercentages} labels={AXES_LABELS} />
              <div className="space-y-1 text-[12px] text-black/60">
                {(Object.keys(AXES_LABELS) as AxisKey[]).map((key) => (
                  <div key={key}>
                    {AXES_LABELS[key]} : {axisPercentages[key]}%
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={handleSaveResults}
                disabled={savingResults}
                className="w-full rounded-full border border-black bg-white px-6 py-3 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingResults ? "Enregistrement..." : "Enregistrer mes résultats"}
              </button>
              {savedMessage ? (
                <div className="text-[12px] text-black/60">{savedMessage}</div>
              ) : null}
            </div>
          )}
        </div>

        <div className="hidden items-center justify-center lg:flex">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            whileHover={{ y: -8 }}
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-black/10 bg-white"
          >
            <img
              src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80"
              alt="Equipe"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-white/10" />
          </motion.div>
        </div>
      </div>
      <AnimatePresence>
        {showToast && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/10" />
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-md rounded-2xl border border-black/10 bg-white/80 p-6 shadow-2xl backdrop-blur-md"
            >
              <div className="text-center text-[14px] text-black">
                Profil complet ! Découvrez votre dashboard carrière.
              </div>
              <div className="mt-5 flex">
                <button
                  type="button"
                  onClick={() => {
                    setShowToast(false);
                    setTimeout(() => router.push("/dashboard/apprenant"), 0);
                  }}
                  className="w-full rounded-full border border-black bg-black px-4 py-2 text-xs font-semibold text-white"
                >
                  Accéder au Dashboard
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ParticuliersIdmcTestPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <ParticuliersIdmcTestInner />
    </Suspense>
  );
}
