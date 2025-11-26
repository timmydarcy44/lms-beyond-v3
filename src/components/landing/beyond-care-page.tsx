"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Heart, Brain, TrendingUp, Bell, BarChart3, Users, Shield, Sparkles, ArrowUp, ArrowDown, Minus, Sparkles as SparklesIcon, Play, Zap, Target, Award } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Navigation } from "@/components/landing/navigation";
import Image from "next/image";

export function BeyondCarePage() {
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const benefitsRef = useRef(null);
  const heroInView = useInView(heroRef, { once: true, amount: 0.3 });
  const featuresInView = useInView(featuresRef, { once: true, amount: 0.2 });
  const benefitsInView = useInView(benefitsRef, { once: true, amount: 0.2 });

  // Couleurs Beyond Care - Style Revolut (moderne, dynamique)
  const primaryColor = "#0070F3"; // Bleu vif Revolut
  const secondaryColor = "#0051CC";
  const accentColor = "#00D9FF";
  const bgColor = "#FFFFFF";
  const surfaceColor = "#FAFAFA";

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      {/* Hero Section - Style Revolut avec vidéo/image cinématographique */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black">
        {/* Background Video/Image - Style cinématographique */}
        <div className="absolute inset-0 z-0">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop')`,
            }}
          >
            {/* Overlay dynamique */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
            
            {/* Effet de lumière animé */}
            <motion.div
              animate={{
                opacity: [0.3, 0.6, 0.3],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute top-1/4 right-1/4 w-[600px] h-[600px] bg-gradient-radial from-blue-500/30 via-blue-400/20 to-transparent rounded-full blur-3xl"
            />
          </div>
        </div>

        {/* Contenu Hero */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={heroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="mb-6"
          >
            <span 
              className="inline-block px-4 py-2 rounded-full text-sm font-medium mb-8 backdrop-blur-sm border"
              style={{ 
                backgroundColor: 'rgba(0, 112, 243, 0.1)',
                borderColor: 'rgba(0, 112, 243, 0.3)',
                color: '#00D9FF'
              }}
            >
              The place to be
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={heroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="text-6xl md:text-7xl lg:text-8xl font-bold text-white mb-8 leading-[1.1] tracking-tight"
            style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}
          >
            Une école
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-500 bg-clip-text text-transparent">
              sans en être une
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={heroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="text-xl md:text-2xl text-gray-200 mb-12 max-w-3xl mx-auto font-light leading-relaxed"
            style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}
          >
            Beyond Care révolutionne l'apprentissage. Un espace où la psychopédagogie rencontre l'innovation pour transformer votre développement personnel et professionnel.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={heroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 1, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button
              asChild
              size="lg"
              className="bg-white text-black hover:bg-gray-100 text-lg px-8 py-6 h-auto rounded-full font-semibold transition-all duration-300 shadow-2xl hover:shadow-blue-500/50 hover:scale-105"
              style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}
            >
              <Link href="/login">
                Commencer maintenant
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-2 border-white/40 text-white hover:bg-white/10 backdrop-blur-md text-lg px-8 py-6 h-auto rounded-full font-semibold transition-all duration-300"
              style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}
            >
              <Link href="#decouvrir">
                <Play className="mr-2 h-5 w-5" />
                Découvrir
              </Link>
            </Button>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={heroInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1, delay: 1 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center"
          >
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-1 h-3 bg-white/70 rounded-full mt-2"
            />
          </motion.div>
        </motion.div>
      </section>

      {/* Section "The Place to Be" - Style Revolut */}
      <section id="decouvrir" className="py-32 bg-white relative overflow-hidden">
        {/* Pattern de fond subtil */}
        <div className="absolute inset-0 opacity-[0.02]">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, black 1px, transparent 0)`,
            backgroundSize: '50px 50px'
          }}></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-[1.1] tracking-tight" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
              The place to be
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto font-light leading-relaxed" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
              Un espace où l'apprentissage devient une expérience. Où la psychopédagogie rencontre l'innovation technologique pour créer quelque chose d'unique.
            </p>
          </motion.div>

          {/* Grid de features - Style Revolut */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Brain,
                title: "Questionnaires intelligents",
                description: "Des parcours adaptatifs qui s'ajustent à vos réponses en temps réel, créant une expérience unique pour chaque apprenant.",
                gradient: "from-blue-500 to-cyan-500",
              },
              {
                icon: TrendingUp,
                title: "Analyses prédictives",
                description: "Comprenez votre évolution avec des insights basés sur l'IA et la psychologie cognitive.",
                gradient: "from-purple-500 to-pink-500",
              },
              {
                icon: Zap,
                title: "Feedback instantané",
                description: "Recevez des recommandations personnalisées dès la fin de chaque questionnaire.",
                gradient: "from-orange-500 to-red-500",
              },
            ].map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: index * 0.15, ease: [0.22, 1, 0.36, 1] }}
                  className="group relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl blur-xl"
                    style={{
                      background: `linear-gradient(135deg, var(--tw-gradient-stops))`,
                      '--tw-gradient-from': feature.gradient.split(' ')[1],
                      '--tw-gradient-to': feature.gradient.split(' ')[3],
                    } as React.CSSProperties}
                  />
                  <div className="relative bg-white rounded-3xl p-8 border border-gray-100 hover:border-transparent transition-all duration-500 group-hover:shadow-2xl">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500`}>
                      <Icon className="h-8 w-8 text-white" />
                  </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed font-light" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
                    {feature.description}
                  </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Section Image/Video Cinématographique */}
      <section className="py-0 relative">
        <div className="relative h-[600px] md:h-[800px] overflow-hidden">
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2070&auto=format&fit=crop')`,
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-transparent" />
          </div>
          <div className="relative z-10 h-full flex items-center max-w-7xl mx-auto px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-2xl"
            >
              <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-[1.1] tracking-tight" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
                Une expérience
                <br />
                <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-500 bg-clip-text text-transparent">
                  cinématographique
                </span>
              </h2>
              <p className="text-xl text-gray-200 mb-8 font-light leading-relaxed" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
                Chaque interaction est pensée pour être engageante, chaque visuel est soigné, chaque animation a un sens. Beyond Care, c'est l'apprentissage réinventé.
              </p>
              <Button
                asChild
                size="lg"
                className="bg-white text-black hover:bg-gray-100 text-lg px-8 py-6 h-auto rounded-full font-semibold transition-all duration-300 shadow-2xl hover:shadow-blue-500/50"
                style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}
              >
                <Link href="/login">
                  Découvrir l'expérience
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Section Bénéfices - Style moderne */}
      <section ref={benefitsRef} className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={benefitsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-[1.1] tracking-tight" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
              Pour qui ?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto font-light" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
              Beyond Care s'adresse à tous ceux qui veulent transformer leur façon d'apprendre.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Users,
                title: "Pour les apprenants",
                description: "Un espace sécurisé pour exprimer votre état mental, suivre votre évolution et recevoir des recommandations personnalisées.",
                color: primaryColor,
              },
              {
                icon: Shield,
                title: "Pour les formateurs",
                description: "Des outils pour identifier les apprenants en difficulté, adapter votre approche pédagogique et proposer un accompagnement adapté.",
                color: secondaryColor,
              },
              {
                icon: Sparkles,
                title: "Pour les organisations",
                description: "Une vision globale de la santé mentale de vos équipes, avec des insights pour améliorer le bien-être collectif.",
                color: accentColor,
              },
            ].map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 30 }}
                  animate={benefitsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                  transition={{ duration: 1.2, delay: index * 0.15, ease: [0.22, 1, 0.36, 1] }}
                  className="text-center group"
                >
                  <div 
                    className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-500"
                    style={{ 
                      backgroundColor: `${benefit.color}15`,
                    }}
                  >
                    <Icon className="h-10 w-10" style={{ color: benefit.color }} />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
                    {benefit.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed font-light" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
                    {benefit.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Section Stats - Style Revolut */}
      <section className="py-32 bg-gradient-to-br from-blue-50 via-cyan-50 to-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { number: "85%", label: "de réduction du stress", sublabel: "après 3 mois" },
              { number: "92%", label: "de satisfaction", sublabel: "utilisateurs" },
              { number: "78%", label: "d'amélioration", sublabel: "du bien-être" },
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-7xl md:text-8xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
                  {stat.number}
                </div>
                <div className="text-xl font-semibold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
                  {stat.label}
                </div>
                <div className="text-sm text-gray-600 font-light" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
                  {stat.sublabel}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final - Style Revolut */}
      <section className="py-32 bg-black relative overflow-hidden">
        {/* Effet de lumière animé */}
          <motion.div
          animate={{
            opacity: [0.2, 0.4, 0.2],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-1/2 left-1/2 w-[800px] h-[800px] bg-gradient-radial from-blue-500/20 via-cyan-400/10 to-transparent rounded-full blur-3xl"
          style={{ transform: 'translate(-50%, -50%)' }}
        />

        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          >
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-8 leading-[1.1] tracking-tight" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
              Prêt à transformer
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-500 bg-clip-text text-transparent">
                votre apprentissage ?
              </span>
            </h2>
            <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto font-light" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
              Rejoignez Beyond Care et découvrez une nouvelle façon d'apprendre, de grandir et de réussir.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                asChild
                size="lg"
                className="bg-white text-black hover:bg-gray-100 text-lg px-10 py-7 h-auto rounded-full font-semibold transition-all duration-300 shadow-2xl hover:shadow-blue-500/50 hover:scale-105"
                style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}
              >
                <Link href="/login">
                  Commencer maintenant
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-2 border-white/40 text-white hover:bg-white/10 backdrop-blur-md text-lg px-10 py-7 h-auto rounded-full font-semibold transition-all duration-300"
                style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}
              >
                <Link href="/pages/fonctionnalites">
                  En savoir plus
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
