"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Trophy, Target, Zap, Sparkles, CheckCircle2, Gamepad2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { EcosystemHeader } from "@/components/beyond-center/ecosystem-header";

// Questions de l'IA pour la vidéo interactive
const aiQuestions = [
  {
    id: 1,
    question: "Quel est votre objectif principal d'apprentissage ?",
    options: ["Développer une compétence technique", "Améliorer mes soft skills", "Préparer une certification", "Explorer un nouveau domaine"]
  },
  {
    id: 2,
    question: "Comment préférez-vous apprendre ?",
    options: ["Par la pratique", "En regardant des vidéos", "En lisant", "En jouant"]
  },
  {
    id: 3,
    question: "Quel est votre niveau actuel ?",
    options: ["Débutant", "Intermédiaire", "Avancé", "Expert"]
  }
];

export function BeyondPlayPage() {
  const blue = "#006CFF";
  const white = "#FFFFFF";
  const black = "#000000";
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [showVideo, setShowVideo] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  const handleAnswer = (answer: string) => {
    setAnswers({ ...answers, [currentQuestion]: answer });
    if (currentQuestion < aiQuestions.length - 1) {
      setTimeout(() => setCurrentQuestion(currentQuestion + 1), 500);
    } else {
      setTimeout(() => setShowVideo(true), 500);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <EcosystemHeader ecosystem="play" title="Beyond Play" />
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#FFE66D]/10 via-white to-white">
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2071&auto=format&fit=crop"
            alt="Beyond Play"
            fill
            className="object-cover opacity-20"
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <div 
                className="text-sm font-light text-[#FFE66D] uppercase tracking-wider"
                style={{ 
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
                }}
              >
                Gamification pédagogique
              </div>
              <h1 
                className="text-6xl md:text-7xl font-light leading-tight text-black"
                style={{ 
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                  letterSpacing: '-0.03em',
                  fontWeight: 300
                }}
              >
                Beyond Play
              </h1>
              <p 
                className="text-2xl md:text-3xl font-light text-gray-700 leading-relaxed italic"
                style={{ 
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
                }}
              >
                "Parce que l'apprentissage, c'est jouer, se tromper et recommencer"
              </p>
              <p 
                className="text-lg font-light text-gray-600 leading-relaxed"
                style={{ 
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
                }}
              >
                Transformez votre parcours de formation en expérience ludique et engageante. 
                Défis, badges, récompenses et progression gamifiée pour apprendre en s'amusant.
              </p>
              <Link href="/beyond-center/pre-inscription">
                <Button 
                  size="lg"
                  className="rounded-full px-10 py-7 text-lg font-light"
                  style={{ 
                    backgroundColor: black,
                    color: white
                  }}
                >
                  Commencer à jouer
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative h-[600px] rounded-3xl overflow-hidden shadow-2xl"
            >
              <Image
                src="https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2071&auto=format&fit=crop"
                alt="Beyond Play"
                fill
                className="object-cover"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Interactive Video Section */}
      <section className="py-32 bg-black">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h2 
              className="text-4xl md:text-5xl font-light mb-6 text-white"
              style={{ 
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                letterSpacing: '-0.02em',
                fontWeight: 300
              }}
            >
              Découvrez comment ça fonctionne
            </h2>
            <p 
              className="text-xl text-white/70 font-light"
              style={{ 
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
              }}
            >
              Répondez à quelques questions pour voir Beyond Play en action
            </p>
          </motion.div>

          {/* Interactive Q&A */}
          <div className="relative bg-white rounded-3xl p-8 md:p-12 min-h-[500px]">
            {!showVideo ? (
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentQuestion}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-8"
                >
                  {/* AI Avatar */}
                  <div className="flex items-center gap-4 mb-8">
                    <div 
                      className="w-16 h-16 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${blue}15` }}
                    >
                      <Sparkles className="h-8 w-8" style={{ color: blue }} />
                    </div>
                    <div>
                      <div 
                        className="text-sm font-medium text-gray-500"
                        style={{ 
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
                        }}
                      >
                        IA Beyond Play
                      </div>
                      <div 
                        className="text-xs text-gray-400"
                        style={{ 
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
                        }}
                      >
                        Question {currentQuestion + 1} sur {aiQuestions.length}
                      </div>
                    </div>
                  </div>

                  {/* Question */}
                  <h3 
                    className="text-2xl md:text-3xl font-light text-black mb-8"
                    style={{ 
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                      letterSpacing: '-0.02em'
                    }}
                  >
                    {aiQuestions[currentQuestion].question}
                  </h3>

                  {/* Options */}
                  <div className="space-y-4">
                    {aiQuestions[currentQuestion].options.map((option, index) => (
                      <motion.button
                        key={index}
                        onClick={() => handleAnswer(option)}
                        whileHover={{ scale: 1.02, x: 8 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full text-left p-6 rounded-xl border-2 border-gray-200 hover:border-black transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <span 
                            className="text-lg font-light text-black"
                            style={{ 
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
                            }}
                          >
                            {option}
                          </span>
                          <ArrowRight className="h-5 w-5 text-gray-400" />
                        </div>
                      </motion.button>
                    ))}
                  </div>

                  {/* Progress */}
                  <div className="pt-8">
                    <div className="flex gap-2">
                      {aiQuestions.map((_, index) => (
                        <div
                          key={index}
                          className={`h-1 flex-1 rounded-full transition-all ${
                            index <= currentQuestion ? 'bg-black' : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-6"
              >
                <div 
                  className="w-24 h-24 rounded-full flex items-center justify-center mx-auto"
                  style={{ backgroundColor: `${blue}15` }}
                >
                  <CheckCircle2 className="h-12 w-12" style={{ color: blue }} />
                </div>
                <h3 
                  className="text-3xl font-light text-black"
                  style={{ 
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
                  }}
                >
                  Parfait !
                </h3>
                <p 
                  className="text-lg text-gray-600 font-light"
                  style={{ 
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
                  }}
                >
                  Basé sur vos réponses, nous avons préparé un parcours personnalisé pour vous.
                </p>
                <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-900 mt-8">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div 
                      className="w-20 h-20 rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
                      style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
                    >
                      <Play className="h-10 w-10 text-white ml-1" fill="white" />
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                    <p className="text-white text-sm font-light">Vidéo de démonstration Beyond Play</p>
                  </div>
                </div>
                <Link href="/beyond-center/pre-inscription">
                  <Button 
                    size="lg"
                    className="rounded-full px-10 py-7 text-lg font-light mt-6"
                    style={{ 
                      backgroundColor: black,
                      color: white
                    }}
                  >
                    Commencer mon parcours
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Trophy, title: "Badges et récompenses", description: "Débloquez des achievements et collectionnez des badges" },
              { icon: Target, title: "Défis personnalisés", description: "Relevez des challenges adaptés à votre niveau" },
              { icon: Zap, title: "Progression gamifiée", description: "Visualisez votre évolution avec des niveaux et des points" }
            ].map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="text-center p-8 rounded-2xl border border-gray-200 hover:border-[#FFE66D] transition-colors"
                >
                  <Icon className="h-12 w-12 mx-auto mb-4" style={{ color: blue }} />
                  <h3 className="text-xl font-light mb-3 text-black">{feature.title}</h3>
                  <p className="text-gray-600 font-light">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Beyond FC Card */}
      <section className="py-32 bg-[#050910]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 via-white/[0.03] to-white/5 p-10 md:p-14 shadow-[0_60px_160px_-70px_rgba(0,0,0,0.8)]">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-5 text-white">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-1 text-xs uppercase tracking-[0.3em] text-white/60">
                  Nouveau module
                </span>
                <h2 className="text-3xl md:text-4xl font-light">Beyond FC — Serious Game Business Club</h2>
                <p className="text-sm md:text-base text-white/70 font-light max-w-2xl">
                  Simulation tour par tour pilotée par IA autour du marketing d’un club de football. Chaque tour mêle narration,
                  incidents, négociations et décisions tarifaires validées par un moteur de règles.
                </p>
                <ul className="space-y-2 text-sm text-white/60">
                  <li className="flex items-center gap-2">
                    <Gamepad2 className="h-4 w-4 text-[#FFE66D]" />
                    IA Game Master + Rules Engine garantissant cohérence économique
                  </li>
                  <li className="flex items-center gap-2">
                    <Gamepad2 className="h-4 w-4 text-[#FFE66D]" />
                    10 tours pédagogiques (pricing, sponsors, communication, crise)
                  </li>
                  <li className="flex items-center gap-2">
                    <Gamepad2 className="h-4 w-4 text-[#FFE66D]" />
                    Compatible HUD vidéo‑ludique (dialogues, sliders, scènes, négociations)
                  </li>
                </ul>
              </div>
              <div className="rounded-[28px] border border-white/15 bg-black/40 p-8 text-white shadow-[0_40px_140px_-90px_rgba(255,230,109,0.35)]">
                <p className="text-sm uppercase tracking-[0.35em] text-white/50">Super Admin</p>
                <h3 className="mt-3 text-2xl font-light text-white">Console Beyond FC</h3>
                <p className="mt-4 text-sm text-white/60">
                  Accès à l’architecture, au JSON schema, aux seeds de tours et au pipeline IA / Rules Engine.
                </p>
                <Link href="/super/beyond-play/architecture" className="mt-6 inline-flex">
                  <Button className="rounded-full bg-[#FFE66D] px-6 py-3 text-sm font-semibold text-black hover:bg-[#FAD84F]">
                    Ouvrir Beyond FC
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
