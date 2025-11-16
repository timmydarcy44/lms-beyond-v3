"use client";

import { motion } from "framer-motion";
import {
  BookOpen,
  Users,
  Brain,
  Shield,
  Zap,
  BarChart3,
  MessageSquare,
  Gamepad2,
} from "lucide-react";

const features = [
  {
    icon: BookOpen,
    title: "Formations Interactives",
    description:
      "Créez des formations engageantes avec du contenu multimédia, des vidéos, des quiz et des parcours personnalisés.",
  },
  {
    icon: Users,
    title: "Gestion Multi-Organisation",
    description:
      "Architecture multi-tenant sécurisée permettant à chaque organisation d'avoir son propre espace isolé.",
  },
  {
    icon: Brain,
    title: "Intelligence Artificielle",
    description:
      "Génération automatique de contenu, analyse des résultats et assistance pédagogique intelligente.",
  },
  {
    icon: Shield,
    title: "Sécurité Renforcée",
    description:
      "Row Level Security au niveau base de données garantissant une isolation totale des données.",
  },
  {
    icon: Zap,
    title: "Performance Optimale",
    description:
      "Interface ultra-rapide et responsive, optimisée pour tous les appareils et connexions.",
  },
  {
    icon: BarChart3,
    title: "Analytics Avancés",
    description:
      "Suivi détaillé de la progression, engagement et performance avec des tableaux de bord complets.",
  },
  {
    icon: MessageSquare,
    title: "Communication Intégrée",
    description:
      "Messagerie interne, notifications en temps réel et collaboration facilitée entre apprenants et formateurs.",
  },
  {
    icon: Gamepad2,
    title: "Gamification",
    description:
      "Simulations immersives, badges, récompenses et parcours gamifiés pour augmenter l'engagement.",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-32 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Tout ce dont vous avez besoin
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Une plateforme complète pour créer, gérer et suivre vos formations
            en ligne.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="p-6 rounded-2xl hover:bg-gray-50 transition-colors group"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}


