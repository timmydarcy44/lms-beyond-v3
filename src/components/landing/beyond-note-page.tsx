"use client";

import { motion } from "framer-motion";
import { FileText, Camera, Sparkles, Languages, FileCheck, Volume2, Image as ImageIcon, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navigation } from "@/components/landing/navigation";
import Link from "next/link";

export function BeyondNoteMarketingPage() {
  const features = [
    {
      icon: <Camera className="h-6 w-6" />,
      title: "Scan intelligent",
      description: "Prenez une photo ou uploadez un document depuis votre téléphone ou ordinateur",
    },
    {
      icon: <Sparkles className="h-6 w-6" />,
      title: "Transformations IA",
      description: "6 transformations disponibles : fiche de révision, reformulation, traduction, schéma, nettoyage, audio",
    },
    {
      icon: <FileText className="h-6 w-6" />,
      title: "Extraction de texte",
      description: "Reconnaissance optique de caractères (OCR) pour extraire le texte de vos documents",
    },
    {
      icon: <Volume2 className="h-6 w-6" />,
      title: "Mode neuro adapté",
      description: "Intégration du mode neuro adapté pour une meilleure accessibilité",
    },
  ];

  const transformations = [
    {
      icon: <FileText className="h-5 w-5" />,
      title: "Fiche de révision",
      description: "Génère une fiche de révision structurée avec points clés, définitions et questions",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: <Sparkles className="h-5 w-5" />,
      title: "Reformuler",
      description: "Reformule le texte pour améliorer la clarté et la compréhension",
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: <Languages className="h-5 w-5" />,
      title: "Traduire",
      description: "Traduit le document dans une autre langue avec précision",
      color: "from-green-500 to-emerald-500",
    },
    {
      icon: <ImageIcon className="h-5 w-5" />,
      title: "Créer un schéma",
      description: "Génère une description détaillée d'un schéma visuel",
      color: "from-orange-500 to-red-500",
    },
    {
      icon: <FileCheck className="h-5 w-5" />,
      title: "Remettre au propre",
      description: "Nettoie et structure le texte, corrige les erreurs",
      color: "from-indigo-500 to-blue-500",
    },
    {
      icon: <Volume2 className="h-5 w-5" />,
      title: "Transformer en audio",
      description: "Adapte le texte pour une conversion en fichier audio",
      color: "from-rose-500 to-pink-500",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative min-h-[600px] flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-black/60" />
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
              Beyond Note
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-2xl mx-auto" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
              Scannez vos documents et transformez-les avec l'intelligence artificielle
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                asChild
                size="lg"
                className="bg-violet-600 hover:bg-violet-700 text-white px-8 py-6 text-lg"
              >
                <Link href="/beyond-note-app">
                  Essayer gratuitement
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 px-8 py-6 text-lg"
              >
                <Link href="#fonctionnalites">
                  Découvrir les fonctionnalités
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="fonctionnalites" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
              Fonctionnalités principales
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
              Une solution complète pour scanner, extraire et transformer vos documents
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white p-6 rounded-xl shadow-sm hover:shadow-lg transition-shadow"
              >
                <div className="text-violet-600 mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
                  {feature.title}
                </h3>
                <p className="text-gray-600" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Transformations Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
              6 transformations disponibles
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
              Transformez votre document selon vos besoins avec l'intelligence artificielle
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {transformations.map((transformation, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`bg-gradient-to-br ${transformation.color} p-6 rounded-xl text-white hover:scale-105 transition-transform`}
              >
                <div className="mb-4">{transformation.icon}</div>
                <h3 className="text-xl font-semibold mb-2" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
                  {transformation.title}
                </h3>
                <p className="text-white/90 text-sm" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
                  {transformation.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-violet-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-bold text-white mb-6" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
              Prêt à transformer vos documents ?
            </h2>
            <p className="text-xl text-white/90 mb-8" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
              Commencez dès maintenant avec Beyond Note
            </p>
            <Button
              asChild
              size="lg"
              className="bg-white text-violet-600 hover:bg-gray-100 px-8 py-6 text-lg"
            >
              <Link href="/beyond-note-app">
                Accéder à l'application
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}


