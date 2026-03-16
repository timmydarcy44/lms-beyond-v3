"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  FileText,
  Sparkles,
  Languages,
  Image as ImageIcon,
  BookOpen,
  HelpCircle,
  Volume2,
  PenLine,
  Eye,
  Timer,
  Brain,
  MessageCircle,
} from "lucide-react";

const solutions = [
  {
    title: "Apprendre",
    items: [
      {
        icon: FileText,
        label: "Fiches de révision",
        desc: "Génère une fiche structurée en 1 clic",
        href: "/app-landing/features/fiches-revision",
      },
      {
        icon: Sparkles,
        label: "Reformulation IA",
        desc: "4 styles adaptés à ton niveau",
        href: "/app-landing/features/reformulation",
      },
      {
        icon: Languages,
        label: "Traduction",
        desc: "Traduis ton cours instantanément",
        href: "/app-landing/features/traduction",
      },
      {
        icon: ImageIcon,
        label: "Schémas visuels",
        desc: "Transforme le texte en schéma",
        href: "/app-landing/features/schemas",
      },
    ],
  },
  {
    title: "Mémoriser",
    items: [
      {
        icon: BookOpen,
        label: "Flashcards",
        desc: "Révision espacée intelligente",
        href: "/app-landing/features/flashcards",
      },
      {
        icon: HelpCircle,
        label: "Quiz adaptatif",
        desc: "QCM, Vrai/Faux, textes à trou",
        href: "/app-landing/features/quiz",
      },
      {
        icon: Volume2,
        label: "Audio du cours",
        desc: "Écoute ton cours en déplacement",
        href: "/app-landing/features/audio",
      },
      {
        icon: PenLine,
        label: "Notes enrichies",
        desc: "Prends des notes et transforme-les",
        href: "/app-landing/features/notes",
      },
    ],
  },
  {
    title: "Se concentrer",
    items: [
      {
        icon: Eye,
        label: "Mode Focus",
        desc: "Lecture sans distraction",
        href: "/app-landing/features/mode-focus",
      },
      {
        icon: Timer,
        label: "Pomodoro",
        desc: "Sessions de travail optimisées",
        href: "/app-landing/features/pomodoro",
      },
      {
        icon: Brain,
        label: "Neuro adapté",
        desc: "Interface DYS/TDAH friendly",
        href: "/app-landing/features/neuro-adapte",
      },
      {
        icon: MessageCircle,
        label: "Neo IA",
        desc: "Ton assistant personnel 24h/24",
        href: "/app-landing/decouvrez-neo",
      },
    ],
  },
];

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const pagesWithGradientHero = [
    "/app-landing",
    "/app-landing/particuliers",
    "/app-landing/decouvrez-neo",
    "/app-landing/tarifs",
    "/app-landing/solutions",
    "/app-landing/entreprise",
    "/app-landing/cfa",
  ];
  const hasGradientHero =
    pagesWithGradientHero.includes(pathname) || pathname.startsWith("/app-landing/features/");

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div style={{ marginTop: 0, paddingTop: 0 }} className="app-landing-wrapper">
      <nav
        style={{ top: 0, margin: 0, padding: 0 }}
        className={`fixed left-0 right-0 z-50 transition-all duration-300 ${
          hasGradientHero && !scrolled
            ? "bg-transparent py-4"
            : "bg-white/95 backdrop-blur-xl shadow-sm border-b border-[#E8E9F0] py-2"
        }`}
      >
        <div className="flex items-center justify-between px-8">
          <Link href="/app-landing" className="flex items-center">
            {/* Logo blanc — sur hero avant scroll */}
            <Image
              src="https://fqqqejpakbccwvrlolpc.supabase.co/storage/v1/object/public/nevo./Nevo_logo.png"
              alt="Nevo."
              width={120}
              height={40}
              className={`object-contain transition-all duration-300 ${
                hasGradientHero && !scrolled ? "block" : "hidden"
              }`}
            />
            {/* Logo coloré — au scroll ou pages blanches */}
            <Image
              src="https://fqqqejpakbccwvrlolpc.supabase.co/storage/v1/object/public/nevo./nevo.scroll2.png"
              alt="Nevo."
              width={80}
              height={28}
              className={`object-contain transition-all duration-300 ${
                hasGradientHero && !scrolled ? "hidden" : "block"
              }`}
            />
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium">
            <div className="relative group">
              <Link
                href="/app-landing/solutions"
                className={`text-sm font-medium transition-colors ${
                  hasGradientHero && !scrolled
                    ? "text-white hover:text-white/70"
                    : "text-[#0F1117] hover:text-[#be1354]"
                }`}
              >
                Solutions
              </Link>
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[860px] bg-white rounded-2xl shadow-2xl border border-[#E8E9F0] p-8 z-50 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all max-h-[480px] overflow-hidden">
                <div className="grid grid-cols-3 gap-x-8 gap-y-2">
                  {solutions.map((col) => (
                    <div key={col.title} className="space-y-2">
                      <p className="text-xs font-bold tracking-widest uppercase text-[#be1354] mb-3 px-3">
                        {col.title}
                      </p>
                      <div className="space-y-1">
                        {col.items.map((item) => {
                          const Icon = item.icon;
                          return (
                            <Link
                              key={item.label}
                              href={item.href}
                              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#F8F9FC] transition-colors group cursor-pointer"
                            >
                              <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                style={{ background: "linear-gradient(135deg, #be1354, #F97316)" }}
                              >
                                <Icon className="h-4 w-4 text-white" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-[#0F1117] group-hover:text-[#be1354] transition-colors">
                                  {item.label}
                                </p>
                                <p className="text-xs text-[#9CA3AF] leading-relaxed">{item.desc}</p>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <Link
              href="/app-landing/particuliers"
              className={`text-sm font-medium transition-colors ${
                hasGradientHero && !scrolled
                  ? "text-white hover:text-white/70"
                  : "text-[#0F1117] hover:text-[#be1354]"
              }`}
            >
              Particuliers
            </Link>
            <Link
              href="/app-landing/decouvrez-neo"
              className={`text-sm font-medium transition-colors ${
                hasGradientHero && !scrolled
                  ? "text-white hover:text-white/70"
                  : "text-[#0F1117] hover:text-[#be1354]"
              }`}
            >
              Découvrez Neo
            </Link>
            <Link
              href="/app-landing/tarifs"
              className={`text-sm font-medium transition-colors ${
                hasGradientHero && !scrolled
                  ? "text-white hover:text-white/70"
                  : "text-[#0F1117] hover:text-[#be1354]"
              }`}
            >
              Tarifs
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/app-landing/login"
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                hasGradientHero && !scrolled
                  ? "border-white/40 text-white hover:bg-white/10"
                  : "border-[#be1354] text-[#be1354] hover:bg-[#be1354]/5"
              }`}
            >
              Se connecter
            </Link>
            <Link
              href="/app-landing/signup"
              className="px-5 py-2.5 rounded-full text-white font-semibold shadow-2xl hover:scale-105 transition-transform"
              style={{ background: "linear-gradient(135deg, #be1354, #F97316)" }}
            >
              Essayer gratuitement
            </Link>
          </div>
        </div>
      </nav>

      {children}

      <footer className="bg-[#0F1117] text-white py-16">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-3 gap-8">
          <div>
            <Image
              src="https://fqqqejpakbccwvrlolpc.supabase.co/storage/v1/object/public/nevo./Nevo_logo.png"
              alt="Nevo."
              width={120}
              height={40}
              className="object-contain mb-4"
            />
            <p className="text-white/70">Nevo. L'intelligence au service de l'apprentissage.</p>
          </div>
          <div className="space-y-2 text-white/70 text-sm">
            <p>Mentions légales</p>
            <p>Politique de confidentialité</p>
            <p>Conditions d'utilisation</p>
          </div>
          <div className="space-y-2 text-white/70 text-sm">
            <p>LinkedIn</p>
            <p>Instagram</p>
            <p>Contact</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
