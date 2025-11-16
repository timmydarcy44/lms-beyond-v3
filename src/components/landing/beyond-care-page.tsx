"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Heart, Brain, TrendingUp, Bell, BarChart3, Users, Shield, Sparkles, ArrowUp, ArrowDown, Minus, Sparkles as SparklesIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Navigation } from "@/components/landing/navigation";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

const features = [
  {
    icon: Brain,
    title: "Questionnaires intelligents",
    description: "Des questionnaires adaptatifs basés sur la théorie des jeux, où chaque réponse influence la suite du parcours.",
    color: "from-rose-500 to-pink-500",
  },
  {
    icon: TrendingUp,
    title: "Analyse des tendances",
    description: "Suivez l'évolution de la santé mentale de vos apprenants dans le temps avec des graphiques clairs et actionnables.",
    color: "from-blue-500 to-purple-500",
  },
  {
    icon: Bell,
    title: "Alertes préventives",
    description: "Recevez des notifications automatiques lorsque des signaux d'alerte sont détectés, pour agir rapidement.",
    color: "from-orange-500 to-red-500",
  },
  {
    icon: BarChart3,
    title: "Tableaux de bord personnalisés",
    description: "Visualisez les données agrégées par organisation, groupe ou individu avec des indicateurs clairs.",
    color: "from-indigo-500 to-blue-500",
  },
];

const benefits = [
  {
    icon: Users,
    title: "Pour les apprenants",
    description: "Un espace sécurisé pour exprimer leur état mental, suivre leur évolution et recevoir des recommandations personnalisées.",
  },
  {
    icon: Shield,
    title: "Pour les formateurs et coaches",
    description: "Des outils pour identifier les apprenants en difficulté, adapter leur approche pédagogique et proposer un accompagnement adapté.",
  },
  {
    icon: Sparkles,
    title: "Pour les organisations",
    description: "Une vision globale de la santé mentale de vos équipes, avec des insights pour améliorer le bien-être collectif.",
  },
];

export function BeyondCarePage() {
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const benefitsRef = useRef(null);
  const heroInView = useInView(heroRef, { once: true, amount: 0.3 });
  const featuresInView = useInView(featuresRef, { once: true, amount: 0.2 });
  const benefitsInView = useInView(benefitsRef, { once: true, amount: 0.2 });

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      {/* Hero Section avec photo et texte */}
      <section ref={heroRef} className="relative h-[70vh] min-h-[600px] flex items-center justify-center overflow-hidden">
        {/* Background Image - Jeune fille qui sourit avec rayon de soleil */}
        <div className="absolute inset-0 z-0">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?q=80&w=2070&auto=format&fit=crop')`,
            }}
          >
            {/* Overlay léger pour le texte - préserver la lumière naturelle */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/40" />
            
            {/* Rayon de soleil naturel - accentue la lumière existante */}
            <motion.div
              animate={{
                opacity: [0.3, 0.5, 0.3],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-gradient-radial from-yellow-200/40 via-yellow-100/20 to-transparent rounded-full blur-3xl"
              style={{
                transform: 'translate(-50%, -50%)',
              }}
            />
          </div>
        </div>

        {/* Texte principal */}
        <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-8 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={heroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="text-4xl md:text-5xl lg:text-6xl font-semibold text-white mb-6 leading-[1.1] tracking-[-0.02em] drop-shadow-2xl"
            style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}
          >
            Agissez sur la santé mentale
            <br />
            <span className="text-3xl md:text-4xl lg:text-5xl font-medium text-white/95">
              de vos apprenants
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={heroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 1.2, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto font-light leading-relaxed"
            style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif', letterSpacing: '-0.01em' }}
          >
            Beyond Care vous permet de suivre, comprendre et agir sur le bien-être mental de vos équipes grâce à des questionnaires intelligents et des analyses prédictives.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={heroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 1.2, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button
              asChild
              size="lg"
              className="bg-white text-gray-900 hover:bg-white/90 text-base px-8 py-6 h-auto rounded-full font-medium transition-all duration-500 shadow-xl hover:shadow-2xl"
              style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}
            >
              <Link href="/login">
                Découvrir Beyond Care
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-2 border-white/30 text-white hover:bg-white/10 backdrop-blur-sm text-base px-8 py-6 h-auto rounded-full font-medium transition-all duration-500"
              style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}
            >
              <Link href="#fonctionnalites">
                En savoir plus
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Section Fonctionnalités */}
      <section ref={featuresRef} id="fonctionnalites" className="py-24 bg-gradient-to-b from-white to-[#F8F9FB]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={featuresInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-semibold text-gray-900 mb-6 leading-[1.1] tracking-[-0.02em]" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
              Des outils puissants pour
              <br />
              <span className="text-3xl md:text-4xl font-medium text-gray-700">
                prendre soin de vos équipes
              </span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto font-light" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
              Beyond Care combine intelligence artificielle et psychologie pour offrir une solution complète de suivi de la santé mentale.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  animate={featuresInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                  transition={{ duration: 1.2, delay: index * 0.15, ease: [0.22, 1, 0.36, 1] }}
                  className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-500 border border-gray-100"
                >
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6`}>
                    <Icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed font-light" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Section Bénéfices */}
      <section ref={benefitsRef} className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={benefitsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-semibold text-gray-900 mb-6 leading-[1.1] tracking-[-0.02em]" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
              Pour qui ?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto font-light" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
              Beyond Care s'adresse à tous les acteurs de l'apprentissage.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 30 }}
                  animate={benefitsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                  transition={{ duration: 1.2, delay: index * 0.15, ease: [0.22, 1, 0.36, 1] }}
                  className="text-center"
                >
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center mx-auto mb-6">
                    <Icon className="h-8 w-8 text-rose-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
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

      {/* Section Psychopédagogie - Première section sous la ligne de flottaison */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            >
              <h2 className="text-4xl md:text-5xl font-semibold text-gray-900 mb-6 leading-[1.1] tracking-[-0.02em]" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
                Fondé sur la psychopédagogie
              </h2>
              <p className="text-lg text-gray-700 mb-6 leading-relaxed font-light" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
                Beyond Care a été structuré par une psychopédagogue spécialisée en neuroéducation et santé mentale. Chaque questionnaire, chaque indicateur, chaque recommandation s'appuie sur des années de recherche et d'expérience clinique.
              </p>
              <p className="text-base text-gray-600 leading-relaxed font-light" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
                L'approche combine la théorie des jeux pour rendre les questionnaires engageants, la psychologie cognitive pour comprendre les mécanismes mentaux, et la pédagogie positive pour favoriser le bien-être durable.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              className="bg-gradient-to-br from-rose-50 to-pink-100 rounded-3xl p-8 border border-rose-200/50"
            >
              <div className="text-center">
                <Brain className="h-16 w-16 text-rose-600 mx-auto mb-6" />
                <h3 className="text-2xl font-semibold text-gray-900 mb-4" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
                  Expertise scientifique
                </h3>
                <p className="text-gray-700 leading-relaxed font-light" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
                  Chaque aspect de Beyond Care est validé par la recherche en psychologie cognitive, neurosciences et pédagogie positive.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Section Chiffres */}
      <section className="py-24 bg-gradient-to-b from-[#F8F9FB] to-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-semibold text-gray-900 mb-6 leading-[1.1] tracking-[-0.02em]" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
              Beyond Care en chiffres
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { number: "85%", label: "de réduction du stress perçu", description: "après 3 mois d'utilisation" },
              { number: "92%", label: "de satisfaction utilisateur", description: "parmi les apprenants" },
              { number: "78%", label: "d'amélioration du bien-être", description: "mesuré sur 6 mois" },
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, delay: index * 0.15, ease: [0.22, 1, 0.36, 1] }}
                className="text-center bg-white rounded-2xl p-8 shadow-lg border border-gray-100"
              >
                <div className="text-5xl md:text-6xl font-bold text-rose-600 mb-3" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
                  {stat.number}
                </div>
                <div className="text-lg font-semibold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
                  {stat.label}
                </div>
                <div className="text-sm text-gray-600 font-light" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
                  {stat.description}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section Exemples de questions */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-semibold text-gray-900 mb-6 leading-[1.1] tracking-[-0.02em]" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
              Des questionnaires intelligents
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto font-light" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
              Chaque question s'adapte en fonction des réponses précédentes, créant un parcours personnalisé et engageant.
            </p>
          </motion.div>

          <div className="space-y-6 max-w-3xl mx-auto">
            {[
              {
                question: "Comment vous sentez-vous aujourd'hui ?",
                type: "Échelle de Likert",
                options: ["Très bien", "Bien", "Neutre", "Mal", "Très mal"],
              },
              {
                question: "Avez-vous ressenti de l'anxiété cette semaine ?",
                type: "Choix multiple",
                options: ["Jamais", "Rarement", "Parfois", "Souvent", "Toujours"],
              },
              {
                question: "Quel est votre niveau d'énergie aujourd'hui ?",
                type: "Barre de progression",
                options: ["0%", "25%", "50%", "75%", "100%"],
              },
            ].map((example, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-xl p-6 border border-rose-200/50"
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
                    {example.question}
                  </h3>
                  <span className="text-xs text-rose-600 bg-rose-100 px-2 py-1 rounded-full font-medium" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
                    {example.type}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {example.options.map((option, optIndex) => (
                    <button
                      key={optIndex}
                      className="px-4 py-2 bg-white rounded-lg text-sm text-gray-700 hover:bg-rose-50 hover:text-rose-600 transition-colors border border-gray-200 font-light"
                      style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section Cross-canalité */}
      <section className="py-24 bg-gradient-to-b from-white to-[#F8F9FB]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-semibold text-gray-900 mb-6 leading-[1.1] tracking-[-0.02em]" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
              Accessible partout, sur tous vos appareils
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto font-light" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
              Beyond Care s'adapte à votre quotidien : suivez votre bien-être depuis votre ordinateur ou votre téléphone, vos données sont synchronisées en temps réel.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
            {/* Ordinateur - Dashboard complet */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              className="relative"
            >
              {/* Frame ordinateur */}
              <div className="bg-gray-800 rounded-t-lg p-2">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
              </div>
              <div className="bg-gray-100 rounded-b-lg p-4 shadow-2xl border-8 border-gray-800">
                {/* Contenu dashboard */}
                <div className="bg-white rounded-lg p-6 space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
                      Tableau de bord
                    </h3>
                    <span className="text-xs text-gray-500">Écran</span>
                  </div>
                  
                  {/* Radar Chart mini */}
                  <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
                      Profil de bien-être
                    </h4>
                    <ResponsiveContainer width="100%" height={200}>
                      <RadarChart data={[
                        { dimension: "Cog", value: 75, fullMark: 100 },
                        { dimension: "Émo", value: 82, fullMark: 100 },
                        { dimension: "Phy", value: 68, fullMark: 100 },
                        { dimension: "Soc", value: 79, fullMark: 100 },
                        { dimension: "Exi", value: 71, fullMark: 100 },
                      ]}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 10, fill: '#6B7280' }} />
                        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} />
                        <Radar name="Bien-être" dataKey="value" stroke="#EC4899" fill="#EC4899" fillOpacity={0.3} strokeWidth={2} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Indices - seulement 2 KPI */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs text-gray-600 mb-1" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>Effort</div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                      </div>
                      <div className="text-xs font-semibold text-gray-900 mt-1">75%</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs text-gray-600 mb-1" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>Discipline</div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full" style={{ width: '82%' }}></div>
                      </div>
                      <div className="text-xs font-semibold text-gray-900 mt-1">82%</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Téléphone - Vue mobile */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              className="relative flex justify-center"
            >
              {/* Frame téléphone */}
              <div className="w-64 bg-gray-900 rounded-[2.5rem] p-2 shadow-2xl">
                {/* Notch */}
                <div className="h-6 bg-gray-900 rounded-t-[2rem] flex items-center justify-center">
                  <div className="w-32 h-5 bg-black rounded-full"></div>
                </div>
                
                {/* Écran */}
                <div className="bg-white rounded-[2rem] overflow-hidden">
                  {/* Status bar */}
                  <div className="bg-gradient-to-br from-rose-500 to-pink-500 px-4 py-2 flex items-center justify-between">
                    <span className="text-white text-xs font-medium">9:41</span>
                    <div className="flex gap-1">
                      <div className="w-4 h-2 border border-white rounded-sm"></div>
                      <div className="w-1 h-1 bg-white rounded-full"></div>
                    </div>
                  </div>

                  {/* Contenu mobile - version simplifiée */}
                  <div className="p-4 space-y-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-semibold text-gray-900" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
                        Mon bien-être
                      </h3>
                      <Heart className="h-4 w-4 text-rose-500" />
                    </div>

                    {/* Score global mobile */}
                    <div className="bg-gradient-to-br from-rose-500 to-pink-500 rounded-xl p-4 text-white text-center">
                      <div className="text-xs opacity-90 mb-1" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
                        Score global
                      </div>
                      <div className="text-3xl font-bold mb-1" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
                        75
                      </div>
                      <div className="text-xs opacity-80" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
                        +3 cette semaine
                      </div>
                    </div>

                    {/* Dimensions - seulement 3 principales */}
                    <div className="space-y-2">
                      {[
                        { label: "Émotionnelle", value: 82, color: "bg-purple-500" },
                        { label: "Sociale", value: 79, color: "bg-orange-500" },
                        { label: "Physique", value: 68, color: "bg-green-500" },
                      ].map((dim, idx) => (
                        <div key={idx} className="bg-white rounded-lg p-2.5">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs text-gray-700" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
                              {dim.label}
                            </span>
                            <span className="text-xs font-semibold text-gray-900">{dim.value}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <motion.div
                              initial={{ width: 0 }}
                              whileInView={{ width: `${dim.value}%` }}
                              viewport={{ once: true }}
                              transition={{ duration: 1, delay: idx * 0.1 }}
                              className={`h-1.5 rounded-full ${dim.color}`}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Feedback IA mobile - version condensée */}
                    <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-xl p-3 border border-rose-200">
                      <div className="flex items-start gap-2">
                        <SparklesIcon className="h-3.5 w-3.5 text-rose-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-700 leading-relaxed" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
                            ✨ Excellente progression !
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Home indicator */}
                <div className="h-1 bg-gray-900 rounded-full w-32 mx-auto mt-2"></div>
              </div>
            </motion.div>
          </div>

          {/* Texte explicatif */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="text-center max-w-3xl mx-auto"
          >
            <p className="text-base text-gray-600 leading-relaxed font-light" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
              Vos données sont synchronisées en temps réel entre tous vos appareils. Commencez un questionnaire sur votre téléphone, consultez les analyses détaillées sur votre ordinateur, ou recevez des notifications sur les deux.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Section Schémas et Visualisations */}
      <section className="py-24 bg-gradient-to-b from-[#F8F9FB] to-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-semibold text-gray-900 mb-6 leading-[1.1] tracking-[-0.02em]" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
              Visualisez votre évolution
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto font-light" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
              Des indicateurs clairs et actionnables pour suivre votre bien-être sur 5 dimensions.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
            {/* Radar Chart - 5 branches */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100"
            >
              <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
                Profil de bien-être
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={[
                  { dimension: "Cognitive", value: 75, fullMark: 100 },
                  { dimension: "Émotionnelle", value: 82, fullMark: 100 },
                  { dimension: "Physique", value: 68, fullMark: 100 },
                  { dimension: "Sociale", value: 79, fullMark: 100 },
                  { dimension: "Existentielle", value: 71, fullMark: 100 },
                ]}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 12, fill: '#6B7280' }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                  <Radar name="Bien-être" dataKey="value" stroke="#EC4899" fill="#EC4899" fillOpacity={0.3} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Indice sportif - Barre horizontale */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100"
            >
              <h3 className="text-xl font-semibold text-gray-900 mb-6" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
                Indice Effort / Discipline
              </h3>
              <div className="space-y-6">
                {[
                  { label: "Effort", value: 75, color: "from-blue-500 to-cyan-500" },
                  { label: "Discipline", value: 82, color: "from-purple-500 to-pink-500" },
                ].map((item, index) => (
                  <div key={index}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
                        {item.label}
                      </span>
                      <span className="text-sm font-semibold text-gray-900" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
                        {item.value}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${item.value}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.5, delay: index * 0.2, ease: "easeOut" }}
                        className={`h-full bg-gradient-to-r ${item.color} rounded-full`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Tendances Semaine N vs N-1 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 mb-12"
          >
            <h3 className="text-xl font-semibold text-gray-900 mb-6" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
              Évolution hebdomadaire
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { label: "Cognitive", weekN: 75, weekN1: 72, trend: "up" },
                { label: "Émotionnelle", weekN: 82, weekN1: 78, trend: "up" },
                { label: "Physique", weekN: 68, weekN1: 70, trend: "down" },
                { label: "Sociale", weekN: 79, weekN1: 75, trend: "up" },
                { label: "Existentielle", weekN: 71, weekN1: 71, trend: "stable" },
              ].map((dimension, index) => (
                <div key={index} className="text-center p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200">
                  <div className="text-sm font-medium text-gray-700 mb-3" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
                    {dimension.label}
                  </div>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
                      {dimension.weekN}
                    </span>
                    {dimension.trend === "up" && <ArrowUp className="h-5 w-5 text-green-500" />}
                    {dimension.trend === "down" && <ArrowDown className="h-5 w-5 text-red-500" />}
                    {dimension.trend === "stable" && <Minus className="h-5 w-5 text-gray-400" />}
                  </div>
                  <div className="text-xs text-gray-500" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
                    Sem. précédente: {dimension.weekN1}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Feedback IA */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 rounded-2xl p-8 border border-rose-200/50"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                <SparklesIcon className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-semibold text-gray-900" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
                    Feedback IA
                  </span>
                  <span className="text-xs text-gray-500 bg-white/50 px-2 py-1 rounded-full" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
                    Généré automatiquement
                  </span>
                </div>
                <p className="text-base text-gray-800 mb-3 font-medium leading-relaxed" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
                  ✨ Votre profil de bien-être montre une belle progression cette semaine, particulièrement sur les dimensions émotionnelle et sociale.
                </p>
                <p className="text-sm text-gray-700 leading-relaxed font-light italic" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
                  💡 Conseil : Pour maintenir cette dynamique, essayez de prendre 10 minutes chaque matin pour méditer ou faire une activité qui vous ressource.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <Heart className="h-16 w-16 text-rose-500 mx-auto mb-6" />
            <h2 className="text-4xl md:text-5xl font-semibold text-gray-900 mb-6 leading-[1.1] tracking-[-0.02em]" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
              Prêt à prendre soin
              <br />
              <span className="text-3xl md:text-4xl font-medium text-gray-700">
                de la santé mentale de vos équipes ?
              </span>
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto font-light" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
              Découvrez comment Beyond Care peut transformer votre approche du bien-être en entreprise.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                asChild
                size="lg"
                className="bg-rose-600 text-white hover:bg-rose-700 text-base px-8 py-6 h-auto rounded-full font-medium transition-all duration-500 shadow-lg hover:shadow-xl"
                style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}
              >
                <Link href="/login">
                  Demander une démo
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-2 border-gray-300 text-gray-700 hover:bg-white text-base px-8 py-6 h-auto rounded-full font-medium transition-all duration-500"
                style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}
              >
                <Link href="/pages/fonctionnalites">
                  Voir toutes les fonctionnalités
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

