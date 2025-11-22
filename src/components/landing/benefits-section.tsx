"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";

const benefits = [
  {
    title: "Pour les Organisations",
    items: [
      "Isolation complète des données par organisation",
      "Branding personnalisé (logo, couleurs, identité)",
      "Gestion indépendante des utilisateurs et contenus",
      "Statistiques et analytics dédiés",
      "Support multi-organisations",
    ],
  },
  {
    title: "Pour les Formateurs",
    items: [
      "Builder visuel intuitif pour créer des formations",
      "Génération IA de contenu depuis texte ou PDF",
      "Gestion complète des apprenants et groupes",
      "Analytics détaillés sur l'engagement",
      "Système de tests et évaluations avancé",
    ],
  },
  {
    title: "Pour les Apprenants",
    items: [
      "Interface moderne et intuitive",
      "Parcours personnalisés selon les besoins",
      "Suivi de progression en temps réel",
      "Mode neuro-adapté (dyslexie, accessibilité)",
      "Gamification et récompenses",
    ],
  },
];

export function BenefitsSection() {
  return (
    <section id="benefits" className="py-32 bg-gray-50">
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
            Conçu pour tous
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Une solution adaptée à chaque rôle et besoin.
          </p>
        </motion.div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-lg transition-shadow"
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                {benefit.title}
              </h3>
              <ul className="space-y-4">
                {benefit.items.map((item, itemIndex) => (
                  <li key={itemIndex} className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mr-3 mt-0.5">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-gray-700 leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}







