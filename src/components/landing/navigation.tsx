"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  ChevronDown, Users, ShieldCheck, Zap, Gamepad2, 
  BarChart3, Target, HeartPulse, BrainCircuit,
  ArrowUpRight, CheckCircle2, Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Icône LMS : Flèche avec label LMS au-dessus
const LmsIcon = () => (
  <div className="flex flex-col items-center justify-center">
    <span className="text-[9px] font-black leading-none mb-0.5 text-purple-600">LMS</span>
    <ArrowUpRight className="w-5 h-5 text-purple-600" />
  </div>
);

const menuVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2 },
  },
};

const suiteData = [
  {
    title: "Beyond LMS",
    icon: <LmsIcon />,
    desc: "Efficience Cognitive.",
    path: "/produits/lms",
    bullets: ["Adaptation Neurologique", "Ancrage Mémoriel +90%", "Réduction temps formation"]
  },
  {
    title: "Beyond Connect",
    icon: <Users className="w-6 h-6 text-blue-600" />,
    desc: "Recrutement Prédictif.",
    path: "/produits/connect",
    bullets: ["Matching Culturel", "Détection Soft Skills", "Zéro erreur de casting"]
  },
  {
    title: "Beyond Care",
    icon: <ShieldCheck className="w-6 h-6 text-red-600" />,
    desc: "Rétention Stratégique.",
    path: "/produits/care",
    bullets: ["Signaux Faibles", "Prévention Burnout", "Météo Humaine temps réel"]
  },
  {
    title: "Beyond Note",
    icon: <Zap className="w-6 h-6 text-orange-500" />,
    desc: "Intelligence Collective.",
    path: "/produits/note",
    bullets: ["Capitalisation Savoir", "Recherche Sémantique", "Synthèse IA intelligente"]
  }
];

const solutionsData = [
  {
    title: "Performance RH",
    icon: <Target className="w-5 h-5 text-orange-600" />,
    items: [
      { t: "ROI Formation", d: "Maximisez l'impact de chaque minute de formation via la neuro-adaptation." },
      { t: "Sécurisation Recrutement", d: "Divisez par deux vos coûts d'acquisition en sécurisant le fit humain." }
    ]
  },
  {
    title: "Culture & Rétention",
    icon: <HeartPulse className="w-5 h-5 text-red-600" />,
    items: [
      { t: "Protection Capital Humain", d: "Identifiez les risques de désengagement 3 mois avant le départ." },
      { t: "Météo Humaine", d: "Pilotez le climat social avec des données objectives et anonymisées." }
    ]
  },
  {
    title: "Intelligence & Flux",
    icon: <BrainCircuit className="w-5 h-5 text-purple-600" />,
    items: [
      { t: "Capitalisation du Savoir", d: "Transformez vos échanges informels en actifs de connaissance." },
      { t: "Engagement par le Flux", d: "Atteignez l'état de performance collective par la gamification." }
    ]
  }
];

type NavigationProps = {
  primaryCtaLabel?: string;
  primaryCtaHref?: string;
  onPrimaryCtaClick?: () => void;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  showSecondaryCta?: boolean;
  variant?: "default" | "clean";
};

export default function Navigation({
  primaryCtaLabel = "DEMANDER UNE DÉMO",
  primaryCtaHref = "/demo",
  onPrimaryCtaClick,
  secondaryCtaLabel = "CRÉER UN COMPTE",
  secondaryCtaHref = "/signup",
  showSecondaryCta = true,
  variant = "default",
}: NavigationProps) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const navBase =
    "fixed top-0 w-full z-[1000] h-20 flex items-center";
  return (
    <nav className="fixed top-0 w-full z-[1000] bg-white border-b border-gray-100 h-20 flex items-center shadow-sm">
      <div className="max-w-[1440px] mx-auto px-10 w-full flex items-center justify-between font-inter">
        
        <Link href="/" className="text-2xl font-black tracking-tighter text-black">BEYOND</Link>

        <div className="flex items-center gap-8">
          <div className="flex items-center gap-6">
                      <button
              onMouseEnter={() => setActiveMenu('suite')}
              className="flex items-center gap-1 text-[14px] font-bold py-8 text-black drop-shadow-[0_1px_0_rgba(255,255,255,0.6)] hover:text-orange-600 transition-colors"
            >
              Beyond Suite <ChevronDown className="w-3 h-3" />
            </button>
            <button
              onMouseEnter={() => setActiveMenu('solutions')}
              className="flex items-center gap-1 text-[14px] font-bold py-8 text-black drop-shadow-[0_1px_0_rgba(255,255,255,0.6)] hover:text-orange-600 transition-colors"
            >
              Solutions <ChevronDown className="w-3 h-3" />
            </button>
            <Link
              href="/tarifications"
              className="text-[14px] font-bold text-black drop-shadow-[0_1px_0_rgba(255,255,255,0.6)] hover:text-orange-600 transition-colors"
            >
              Tarifications
            </Link>
          </div>

          <div className="flex items-center gap-4 border-l pl-8 border-gray-100">
            {onPrimaryCtaClick ? (
          <button
                type="button"
                onClick={onPrimaryCtaClick}
                className="bg-[#FF6B00] text-white px-6 py-3 rounded-full text-[12px] font-black hover:bg-black transition-all shadow-lg shadow-orange-100"
              >
                {primaryCtaLabel}
              </button>
            ) : (
              <Link
                href={primaryCtaHref}
                className="bg-[#FF6B00] text-white px-6 py-3 rounded-full text-[12px] font-black hover:bg-black transition-all shadow-lg shadow-orange-100"
              >
                {primaryCtaLabel}
              </Link>
            )}
            {showSecondaryCta ? (
              <Link
                href={secondaryCtaHref}
                className="border-2 border-black text-black px-6 py-3 rounded-full text-[12px] font-black hover:bg-black hover:text-white transition-all"
              >
                {secondaryCtaLabel}
              </Link>
            ) : null}
          </div>
      </div>

      <AnimatePresence>
          {activeMenu && (
          <motion.div
              variants={menuVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              onMouseLeave={() => setActiveMenu(null)}
              className="absolute top-[80px] left-1/2 -translate-x-1/2 w-[90%] bg-white shadow-[0_25px_50px_-12px_rgba(0,0,0,0.1)] rounded-3xl border border-gray-100 overflow-hidden"
              style={{ backgroundColor: "#ffffff" }}
            >
              <div className="p-12 bg-white">
                {activeMenu === 'suite' ? (
                  <div className="grid grid-cols-4 gap-12 bg-white">
                    {suiteData.map((item, idx) => (
                      <Link key={idx} href={item.path} className="group block">
                        <div className="mb-4 p-3 bg-white shadow-sm border border-gray-100 rounded-xl w-fit group-hover:scale-110 transition-transform">
                          {item.icon}
                      </div>
                        <h4 className="font-black text-[16px] mb-2 uppercase tracking-tight text-black">
                          {item.title}
                        </h4>
                        <p className="text-[13px] text-gray-700 font-medium mb-4">
                          {item.desc}
                        </p>
                        <ul className="space-y-2">
                          {item.bullets.map((b, i) => (
                            <li
                              key={i}
                              className="flex items-center gap-2 text-[12px] text-gray-700 font-semibold"
                            >
                              <CheckCircle2 className="w-3 h-3 text-[#FF6B00]" /> {b}
                            </li>
                          ))}
                        </ul>
                      </Link>
                    ))}
                              </div>
                ) : (
                  <div className="grid grid-cols-3 gap-16">
                    {solutionsData.map((sol, idx) => (
                      <div key={idx}>
                        <div className="flex items-center gap-2 mb-8 border-b border-gray-50 pb-3">
                          {sol.icon}
                          <h3 className="font-black text-black uppercase text-[11px] tracking-[0.2em]">
                            {sol.title}
                                </h3>
                        </div>
                        <div className="space-y-8">
                          {sol.items.map((sub, i) => (
                            <div key={i} className="group cursor-pointer">
                              <h4 className="font-bold text-[17px] group-hover:text-orange-600 transition-colors mb-2 flex items-center gap-2">
                                {sub.t} <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </h4>
                              <p className="text-[13px] text-gray-700 leading-relaxed">{sub.d}</p>
                            </div>
                          ))}
                              </div>
                      </div>
                    ))}
                    </div>
                )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </nav>
  );
}
