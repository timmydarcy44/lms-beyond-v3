"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Brain,
  Briefcase,
  ClipboardCheck,
  Compass,
  Flame,
  Heart,
  Lightbulb,
  MessageCircle,
  Puzzle,
  Rocket,
  Scale,
  Shield,
  Sparkles,
  Target,
  Timer,
  Users,
  Wrench,
  Zap,
  Star,
  Focus,
} from "lucide-react";

const THEMES = [
  { label: "Communication", icon: MessageCircle },
  { label: "Leadership", icon: Rocket },
  { label: "Empathie", icon: Heart },
  { label: "Créativité", icon: Lightbulb },
  { label: "Esprit critique", icon: Brain },
  { label: "Adaptabilité", icon: Compass },
  { label: "Gestion du stress", icon: Flame },
  { label: "Organisation", icon: ClipboardCheck },
  { label: "Proactivité", icon: Zap },
  { label: "Collaboration", icon: Users },
  { label: "Persévérance", icon: Target },
  { label: "Résolution de problèmes", icon: Puzzle },
  { label: "Écoute active", icon: Sparkles },
  { label: "Confiance en soi", icon: Shield },
  { label: "Intelligence émotionnelle", icon: Star },
  { label: "Prise de décision", icon: Scale },
  { label: "Gestion du temps", icon: Timer },
  { label: "Sens des responsabilités", icon: Briefcase },
  { label: "Résolution de conflits", icon: Wrench },
  { label: "Focus", icon: Focus },
];

export default function SoftSkillsLandingPage() {
  const router = useRouter();
  const [transitioning, setTransitioning] = useState(false);
  const devPayload = useMemo(
    () => ({
      scores: {
        Leadership: 14,
        Empathie: 12,
        Créativité: 15,
        "Gestion du stress": 8,
        Communication: 13,
        "Esprit critique": 11,
        Adaptabilité: 10,
        Collaboration: 9,
        "Écoute active": 12,
        "Confiance en soi": 13,
        "Intelligence émotionnelle": 11,
        "Prise de décision": 10,
        "Gestion du temps": 9,
        "Sens des responsabilités": 12,
        "Résolution de conflits": 8,
        Organisation: 10,
        Proactivité: 9,
        Persévérance: 12,
        "Résolution de problèmes": 11,
        Focus: 10,
      },
    }),
    [],
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    const message = sessionStorage.getItem("softSkillsError");
    if (message) {
      setErrorMessage(message);
      sessionStorage.removeItem("softSkillsError");
    }
  }, []);

  const staggeredSkills = useMemo(
    () =>
      THEMES.map((item, index) => ({
        ...item,
        delay: index * 0.03,
      })),
    [],
  );

  const handleStart = () => {
    setTransitioning(true);
    setTimeout(() => router.push("/soft-skills/test"), 420);
  };

  const handleDevSimulation = () => {
    localStorage.setItem("softSkillsDevResults", JSON.stringify(devPayload));
    router.push("/soft-skills/resultats");
  };

  return (
    <div className="fixed inset-0 z-[9999] h-screen w-screen overflow-y-auto bg-black font-['Inter'] text-white">
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap");
      `}</style>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-8 py-20"
      >
        <section className="space-y-6">
          {errorMessage ? (
            <div className="rounded-full border border-[#FF9900]/40 bg-[#1C1C1E] px-4 py-2 text-[12px] text-[#FF9900]">
              {errorMessage}
            </div>
          ) : null}
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-7xl lg:text-8xl">
            <span className="bg-gradient-to-r from-white via-white to-[#FF9900] bg-clip-text text-transparent">
              Révèle ton potentiel invisible.
            </span>
          </h1>
          <p className="text-lg text-gray-300 sm:text-xl">
            Au-delà des diplômes, découvre qui tu es vraiment.
          </p>
          <motion.button
            onClick={handleStart}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className="group inline-flex items-center justify-center rounded-full bg-[#FF9900] px-8 py-4 text-[15px] font-semibold text-black shadow-[0_0_30px_rgba(255,153,0,0.35)] transition"
          >
            <span className="relative z-10">Démarrer l&apos;expérience</span>
            <span className="absolute inset-0 rounded-full bg-white/20 opacity-0 blur-xl transition group-hover:opacity-100" />
          </motion.button>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-white/5 bg-[#1C1C1E] p-6">
              <h3 className="text-lg font-semibold">Pourquoi ?</h3>
              <p className="mt-3 text-sm text-gray-400">
                Tes soft skills représentent ton avantage compétitif. Elles montrent ta capacité à apprendre, à
                collaborer et à résoudre des problèmes complexes.
              </p>
            </div>
            <div className="rounded-3xl border border-white/5 bg-[#1C1C1E] p-6">
              <h3 className="text-lg font-semibold">Impact</h3>
              <p className="mt-3 text-sm text-gray-400">
                Les recruteurs utilisent ces signaux pour prédire la performance future bien plus que les notes.
              </p>
            </div>
            <div className="rounded-3xl border border-white/5 bg-[#1C1C1E] p-6">
              <h3 className="text-lg font-semibold">Clarté</h3>
              <p className="mt-3 text-sm text-gray-400">
                Obtiens un diagnostic actionnable et partageable pour ton dossier professionnel.
              </p>
            </div>
            <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-[#1C1C1E] p-0">
              <Image
                src="https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1200&q=80"
                alt="Neural"
                width={1200}
                height={900}
                className="h-full w-full object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-black/60 via-black/10 to-transparent" />
              <div className="absolute bottom-4 left-4 rounded-full border border-white/10 bg-black/40 px-3 py-1 text-[12px] backdrop-blur-[20px]">
                Connexions neuronales
              </div>
            </div>
          </div>

          <div className="space-y-6 rounded-3xl border border-white/5 bg-[#1C1C1E] p-6">
            <h3 className="text-lg font-semibold">Comment ça marche ?</h3>
            <div className="space-y-4 text-gray-400">
              {[
                {
                  number: "1.",
                  title: "Immersif",
                  text: "Une question à la fois.",
                },
                {
                  number: "2.",
                  title: "Rapide",
                  text: "60 questions, 15 minutes.",
                },
                {
                  number: "3.",
                  title: "Intuitif",
                  text: "Réponse au clavier (1-5).",
                },
              ].map((item) => (
                <div key={item.number} className="flex gap-4">
                  <div className="text-3xl font-light text-white">{item.number}</div>
                  <div>
                    <div className="text-sm font-semibold text-white">{item.title}</div>
                    <div className="text-sm">{item.text}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section>
          <h3 className="mb-6 text-lg font-semibold">Wall of Fame · 20 compétences</h3>
          <div className="flex flex-wrap gap-3">
            {staggeredSkills.map((item) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: item.delay, duration: 0.4 }}
                className="flex items-center gap-2 rounded-full border border-white/10 bg-[#1C1C1E] px-4 py-2 text-[12px] text-gray-200"
              >
                <item.icon className="h-4 w-4 text-[#FF9900]" />
                {item.label}
              </motion.div>
            ))}
          </div>
        </section>

        <div className="text-center">
          <button
            onClick={handleDevSimulation}
            className="text-[11px] uppercase tracking-[0.25em] text-white/20 transition hover:text-white"
          >
            [DEV] Simuler des résultats
          </button>
        </div>
      </motion.div>

      {transitioning ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1.2 }}
          className="pointer-events-none fixed inset-0 z-[10000] bg-black"
        />
      ) : null}
    </div>
  );
}
