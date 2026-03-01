"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Slide = {
  id: number;
  title: string;
  subtitle?: string;
  imageAlt?: string;
  imageUrl?: string;
  imageCaption?: string;
  videoUrl?: string;
  body?: React.ReactNode;
};

const ACCENT = "#FF9900";

const SLIDES: Slide[] = [
  {
    id: 1,
    title: "BEYOND : Piloter la Valeur Humaine",
    subtitle: "Sécuriser et Valoriser le Capital Talent en 2026.",
    imageAlt: "Connexions numériques lumineuses et cerveau stylisé",
    imageUrl:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=2000&q=80",
    videoUrl:
      "https://fqqqejpakbccwvrlolpc.supabase.co/storage/v1/object/public/Center/video_header%20(2).mp4",
    imageCaption:
      "Visuel abstrait : connexions lumineuses, lignes de code vers un arbre de compétences / cerveau stylisé.",
    body: (
      <div className="mt-6 space-y-4 text-[18px] text-white/85">
        <p className="text-white">Anticiper et gérer la ressource la plus précieuse : l’Humain.</p>
      </div>
    ),
  },
  {
    id: 2,
    title: "Le Coût Caché du Capital Humain (P&L Impact)",
    subtitle: "Le contexte : l’invisible qui coûte cher",
    imageAlt: "Iceberg des coûts cachés",
    imageUrl:
      "https://images.unsplash.com/photo-1476610182048-b716b8518aae?auto=format&fit=crop&w=2000&q=80",
    imageCaption:
      "Graphique iceberg sombre : salaire visible, coûts de désengagement/turnover sous la surface.",
    body: (
      <ul className="mt-6 space-y-4 text-[18px] text-white/85">
        <li>
          <span className="font-semibold text-white">Désengagement :</span> 13 250 € / salarié / an (Gallup 2025).
        </li>
        <li>
          <span className="font-semibold text-white">Erreur de Recrutement :</span> 1,5x à 2x le salaire annuel
          (Deloitte).
        </li>
        <li>
          <span className="font-semibold text-white">Turnover Alternance :</span> 28% de ruptures (CEREQ).
        </li>
        <li className="pt-2 text-white/70 italic">Ne pas mesurer, c’est perdre de la valeur.</li>
      </ul>
    ),
  },
  {
    id: 3,
    title: "Une Architecture Circulaire pour la Performance Humaine",
    subtitle: "La Solution : L’Écosystème BEYOND",
    imageAlt: "Diagramme circulaire des 3 piliers",
    imageUrl:
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=2000&q=80",
    imageCaption:
      "Diagramme circulaire minimaliste : Care, Connect, Center autour d’une icône centrale.",
    body: (
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {[
          {
            title: "Beyond Care",
            text: "Prévention & Rétention.",
            color: "text-[#D65151]",
            dot: "bg-[#D65151]",
          },
          {
            title: "Beyond Connect",
            text: "Matching & Employabilité.",
            color: "text-[#3B82F6]",
            dot: "bg-[#3B82F6]",
          },
          {
            title: "Beyond Center",
            text: "Pilotage & Valorisation.",
            color: "text-white",
            dot: "bg-white",
          },
        ].map((card) => (
          <div
            key={card.title}
            className={`rounded-[24px] border border-white/10 bg-white/5 p-6 shadow-[0_20px_40px_rgba(0,0,0,0.3)] ${
              card.title === "Beyond Care"
                ? "ring-1 ring-[#D65151]/50"
                : card.title === "Beyond Connect"
                  ? "ring-1 ring-[#3B82F6]/50"
                  : ""
            }`}
          >
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${card.dot}`} />
              <h3 className={`text-[18px] font-semibold ${card.color}`}>{card.title}</h3>
            </div>
            <p className="mt-3 text-[14px] text-white/70">{card.text}</p>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 4,
    title: "L’IA au service du Bien-être et de la Performance",
    subtitle: "Le Cœur de l’Intelligence : Beyond Care & IA",
    imageAlt: "Interface d’analyse avec radar chart stylisé",
    imageUrl:
      "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=2000&q=80",
    imageCaption:
      "Interface d’analyse : radar de soft skills, lignes de code vers une silhouette humaine.",
    body: (
      <div className="mt-6 space-y-4 text-[18px] text-white/85">
        <p>Radar de 20 compétences comportementales clés.</p>
        <p>Diagnostic prédictif : détection des signaux faibles (stress, désengagement) par IA.</p>
        <p className="text-white">Impact : réduction des coûts sociaux et augmentation de la rétention.</p>
      </div>
    ),
  },
  {
    id: 5,
    title: "Les Open Badges : Actifs Immatériels Certifiés",
    subtitle: "La Preuve de Compétence : Beyond Connect",
    imageAlt: "Badges numériques sur écrans",
    imageUrl:
      "https://images.unsplash.com/photo-1517433456452-f9633a875f6f?auto=format&fit=crop&w=2000&q=80",
    imageCaption:
      "Badges numériques lumineux sur écran, icônes variées (Tech, Leadership, Créativité).",
    body: (
      <div className="mt-6 space-y-4 text-[18px] text-white/85">
        <p>Standard Mondial : +320 millions de badges émis (1EdTech 2025).</p>
        <p>Vérifiable & Partageable : fin du CV déclaratif, place à la preuve.</p>
        <p>Impact Recrutement : 88% des recruteurs préfèrent le badge (VirtualBadge Survey).</p>
        <p className="text-white">Message clé : transformer chaque compétence en un actif vérifiable.</p>
      </div>
    ),
  },
  {
    id: 6,
    title: "Rentabilité Immédiate (Exemple pour 50 salariés).",
    subtitle: "Business Case : Le ROI pour une PME",
    imageAlt: "Tableau financier abstrait",
    imageUrl:
      "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=2000&q=80",
    body: (
      <div className="mt-6 overflow-hidden rounded-[20px] border border-white/10">
        <div className="grid grid-cols-1 divide-y divide-white/10 text-[16px] text-white/85">
          {[
            "Réduction du Turnover (-10%) : + 45 000 € / an.",
            "Optimisation Recrutement : - 15 000 € / an.",
            "Reporting CSRD automatisé : Gain de temps expert-comptable.",
          ].map((row) => (
            <div key={row} className="px-6 py-4">
              {row}
            </div>
          ))}
        </div>
        <div className="bg-white/5 px-6 py-4 text-[15px] text-white/80">
          Conclusion : Un outil autofinancé dès la première année.
        </div>
      </div>
    ),
  },
  {
    id: 7,
    title: "Répondre aux Nouvelles Obligations (CSRD 2026).",
    subtitle: "Conformité et RSE",
    imageAlt: "Architecture et conformité",
    imageUrl:
      "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=2000&q=80",
    body: (
      <div className="mt-6 space-y-4 text-[18px] text-white/85">
        <p>Auditabilité : Fournir des preuves concrètes du capital humain pour les rapports extra-financiers.</p>
        <p>Souveraineté : Données sécurisées et conformes RGPD.</p>
        <p>Impact Social : Valorisation des parcours de formation continue.</p>
      </div>
    ),
  },
  {
    id: 8,
    title: "Un Outil au service du Conseil Stratégique.",
    subtitle: "Synergie avec TALENZ",
    imageAlt: "Conseil stratégique en entreprise",
    imageUrl:
      "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=2000&q=80",
    body: (
      <div className="mt-6 space-y-4 text-[18px] text-white/85">
        <p>Audit de Cession/Reprise : Évaluer la force de l'équipe avant rachat.</p>
        <p>Accompagnement Créateur : Bâtir des équipes équilibrées dès le départ.</p>
        <p>Expertise RH : Proposer une solution innovante à vos clients PME.</p>
      </div>
    ),
  },
  {
    id: 9,
    title: "L'Avantage Compétitif.",
    subtitle: 'Pourquoi BEYOND ? (Le "Moat")',
    imageAlt: "Interface premium",
    imageUrl:
      "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=2000&q=80",
    body: (
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {[
          {
            title: "Design Premium",
            text: 'Expérience utilisateur "Apple-standard" (Adoption immédiate).',
          },
          {
            title: "Intelligence Métier",
            text: "Analyse prédictive des risques (Signaux faibles).",
          },
          {
            title: "Évolutivité",
            text: "Une plateforme qui grandit avec l'entreprise.",
          },
        ].map((card) => (
          <div
            key={card.title}
            className="rounded-[24px] border border-white/10 bg-white/5 p-6 shadow-[0_20px_40px_rgba(0,0,0,0.3)]"
          >
            <h3 className="text-[18px] font-semibold text-white">{card.title}</h3>
            <p className="mt-3 text-[14px] text-white/70">{card.text}</p>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 10,
    title: "Sécurisons l'Avenir de vos Clients.",
    subtitle: "Conclusion & Prochaine Étape",
    imageAlt: "Perspective futuriste",
    imageUrl:
      "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=2000&q=80",
    body: (
      <div className="mt-6 space-y-4 text-[18px] text-white/85">
        <p>Test de l'analyse IA sur votre équipe Talenz.</p>
        <p>Démonstration de la "Vue Décideur" (Center).</p>
        <p>Contact : [Ton Nom / Ton Email / QR Code vers la démo]</p>
      </div>
    ),
  },
];

export default function PresentationMode() {

  const [index, setIndex] = useState(0);
  const current = SLIDES[index];

  const goPrev = () => setIndex((prev) => (prev === 0 ? SLIDES.length - 1 : prev - 1));
  const goNext = () => setIndex((prev) => (prev === SLIDES.length - 1 ? 0 : prev + 1));

  return (
    <div className="relative min-h-screen bg-black text-white">
      <div className="mx-auto flex min-h-screen max-w-[1100px] flex-col px-6 py-12">
        <div className="flex items-center justify-between text-[12px] uppercase tracking-[2px] text-white/50">
          <span>Beyond Presentation</span>
          <span>
            Slide {index + 1} / {SLIDES.length}
          </span>
        </div>

        <div className="flex flex-1 items-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -60 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="w-full py-10"
            >
              <h1 className="text-balance text-4xl font-extrabold md:text-5xl">{current.title}</h1>
              {current.subtitle ? (
                <p className="mt-3 text-[18px] text-white/70">{current.subtitle}</p>
              ) : null}
              {current.videoUrl ? (
                <div className="mt-6 overflow-hidden rounded-[28px] border border-white/10 bg-white/5">
                  <video
                    src={current.videoUrl}
                    className="h-[260px] w-full object-cover"
                    autoPlay
                    muted
                    loop
                    playsInline
                  />
                </div>
              ) : current.imageUrl ? (
                <div className="mt-6 overflow-hidden rounded-[28px] border border-white/10 bg-white/5">
                  <img src={current.imageUrl} alt={current.imageAlt ?? "Slide"} className="h-[260px] w-full object-cover" />
                </div>
              ) : current.imageCaption ? (
                <div className="mt-6 rounded-[24px] border border-white/10 bg-white/5 p-5 text-[13px] text-white/60">
                  <span className="text-white/70">Visuel :</span> {current.imageCaption}
                </div>
              ) : null}
              {current.body}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={goPrev}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-[13px] font-semibold text-white/80 transition hover:border-white/40 hover:text-white"
          >
            <ChevronLeft size={18} />
            Précédent
          </button>
          <div className="h-[2px] flex-1 rounded-full bg-white/10 mx-6">
            <div
              className="h-full rounded-full"
              style={{ width: `${((index + 1) / SLIDES.length) * 100}%`, background: ACCENT }}
            />
          </div>
          <button
            onClick={goNext}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-[13px] font-semibold text-white/80 transition hover:border-white/40 hover:text-white"
          >
            Suivant
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
