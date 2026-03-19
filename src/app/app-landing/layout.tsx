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

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

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
  const [mobileOpen, setMobileOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallHelp, setShowInstallHelp] = useState(false);
  const [installStep, setInstallStep] = useState<0 | 1 | 2>(0);
  const [phoneOS, setPhoneOS] = useState<"ios" | "android" | null>(null);
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

  useEffect(() => {
    const handleBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const handleInstalled = () => {
      setDeferredPrompt(null);
      setShowInstallHelp(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      setShowInstallHelp(false);
      return;
    }
    setShowInstallHelp(true);
    setInstallStep(0);
    setPhoneOS(null);
  };

  const closeInstallHelp = () => {
    setShowInstallHelp(false);
    setInstallStep(0);
    setPhoneOS(null);
  };

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
              priority
              style={{ height: "auto" }}
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
              priority
              style={{ height: "auto" }}
              className={`object-contain transition-all duration-300 ${
                hasGradientHero && !scrolled ? "hidden" : "block"
              }`}
            />
          </Link>

          <div className="md:hidden flex items-center gap-2">
            <Link
              href="/login"
              className={`px-2.5 py-1 text-xs font-semibold transition-colors ${
                hasGradientHero && !scrolled
                  ? "text-white hover:text-white/80"
                  : "text-[#0F1117] hover:text-[#be1354]"
              }`}
            >
              Se connecter
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
            className={`md:hidden inline-flex items-center justify-center h-10 w-10 rounded-full border transition-all ${
              hasGradientHero && !scrolled
                ? "border-white/40 text-white hover:bg-white/10"
                : "border-[#E8E9F0] text-[#0F1117] hover:bg-[#F8F9FC]"
            }`}
          >
            <span className="text-lg">{mobileOpen ? "✕" : "☰"}</span>
          </button>

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
              href="/login"
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
            <button
              type="button"
              onClick={handleInstallClick}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                hasGradientHero && !scrolled
                  ? "border-white/40 text-white hover:bg-white/10"
                  : "border-[#0F1117] text-[#0F1117] hover:bg-[#0F1117]/5"
              }`}
            >
              Télécharger l'app
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div
            className={`md:hidden border-t ${
              hasGradientHero && !scrolled
                ? "border-white/20 bg-black/30 backdrop-blur-xl"
                : "border-[#E8E9F0] bg-white/95 backdrop-blur-xl"
            }`}
          >
            <div className="px-6 py-5 space-y-6 text-sm font-medium">
              <div className="flex flex-col gap-3">
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className={`px-4 py-2 rounded-full text-center font-medium border transition-all ${
                    hasGradientHero && !scrolled
                      ? "border-white/40 text-white hover:bg-white/10"
                      : "border-[#be1354] text-[#be1354] hover:bg-[#be1354]/5"
                  }`}
                >
                  Se connecter
                </Link>
                <Link
                  href="/app-landing/signup"
                  onClick={() => setMobileOpen(false)}
                  className="px-5 py-2.5 rounded-full text-center text-white font-semibold shadow-2xl hover:scale-[1.02] transition-transform"
                  style={{ background: "linear-gradient(135deg, #be1354, #F97316)" }}
                >
                  Créer un compte
                </Link>
                <button
                  type="button"
                  onClick={handleInstallClick}
                  className={`px-5 py-2.5 rounded-full text-center font-semibold border transition-all ${
                    hasGradientHero && !scrolled
                      ? "border-white/40 text-white hover:bg-white/10"
                      : "border-[#0F1117] text-[#0F1117] hover:bg-[#0F1117]/5"
                  }`}
                >
                  Télécharger l'app
                </button>
                {showInstallHelp && (
                  <div
                    className={`rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                      hasGradientHero && !scrolled
                        ? "bg-white/10 text-white/80"
                        : "bg-[#F8F9FC] text-[#6B7280]"
                    }`}
                  >
                    <p className="font-semibold mb-1">Neo vous guide</p>
                    <p>
                      iPhone: bouton Partager → Ajouter à l’écran d’accueil.
                      <br />
                      Android: menu du navigateur → Installer l’application.
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <p
                  className={`text-xs font-bold tracking-widest uppercase ${
                    hasGradientHero && !scrolled ? "text-white/80" : "text-[#be1354]"
                  }`}
                >
                  Solutions
                </p>
                <div className="space-y-2">
                  {solutions.flatMap((col) => col.items).map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${
                        hasGradientHero && !scrolled
                          ? "text-white hover:bg-white/10"
                          : "text-[#0F1117] hover:bg-[#F8F9FC]"
                      }`}
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: "linear-gradient(135deg, #be1354, #F97316)" }}
                      >
                        <item.icon className="h-4 w-4 text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{item.label}</p>
                        <p
                          className={`text-xs ${
                            hasGradientHero && !scrolled ? "text-white/70" : "text-[#9CA3AF]"
                          }`}
                        >
                          {item.desc}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Link
                  href="/app-landing/particuliers"
                  onClick={() => setMobileOpen(false)}
                  className={`block px-3 py-2 rounded-xl transition-colors ${
                    hasGradientHero && !scrolled
                      ? "text-white hover:bg-white/10"
                      : "text-[#0F1117] hover:bg-[#F8F9FC]"
                  }`}
                >
                  Particuliers
                </Link>
                <Link
                  href="/app-landing/decouvrez-neo"
                  onClick={() => setMobileOpen(false)}
                  className={`block px-3 py-2 rounded-xl transition-colors ${
                    hasGradientHero && !scrolled
                      ? "text-white hover:bg-white/10"
                      : "text-[#0F1117] hover:bg-[#F8F9FC]"
                  }`}
                >
                  Découvrez Neo
                </Link>
                <Link
                  href="/app-landing/tarifs"
                  onClick={() => setMobileOpen(false)}
                  className={`block px-3 py-2 rounded-xl transition-colors ${
                    hasGradientHero && !scrolled
                      ? "text-white hover:bg-white/10"
                      : "text-[#0F1117] hover:bg-[#F8F9FC]"
                  }`}
                >
                  Tarifs
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {children}

      <div className="md:hidden fixed bottom-4 right-4 z-40">
        <button
          type="button"
          onClick={handleInstallClick}
          className="flex items-center gap-3 rounded-full bg-white/90 backdrop-blur-xl border border-white/70 px-4 py-2 shadow-xl"
        >
          <span
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
            style={{ background: "linear-gradient(135deg, #be1354, #F97316)" }}
          >
            N
          </span>
          <span className="text-sm font-semibold text-[#0F1117]">Neo installe l’app</span>
        </button>
      </div>

      {showInstallHelp && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeInstallHelp} />
          <div className="relative w-full max-w-sm rounded-3xl bg-white/95 backdrop-blur-xl border border-[#E8E9F0] px-5 py-4 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold"
                  style={{ background: "linear-gradient(135deg, #be1354, #F97316)" }}
                >
                  N
                </span>
                <div>
                  <p className="text-sm font-semibold text-[#0F1117]">Neo</p>
                  <p className="text-xs text-[#6B7280]">Assistant d’installation</p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeInstallHelp}
                className="text-xs text-[#9CA3AF] hover:text-[#0F1117]"
                aria-label="Fermer"
              >
                ✕
              </button>
            </div>

            {installStep === 0 && (
              <div className="mt-4 space-y-4">
                <p className="text-sm text-[#0F1117]">
                  Bonjour ! Vous voulez installer l’app sur votre téléphone ?
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setInstallStep(1)}
                    className="px-4 py-2 rounded-xl bg-[#0F1117] text-white text-sm font-semibold"
                  >
                    Oui
                  </button>
                  <button
                    type="button"
                    onClick={closeInstallHelp}
                    className="px-4 py-2 rounded-xl border border-[#E8E9F0] text-[#0F1117] text-sm font-semibold"
                  >
                    Plus tard
                  </button>
                </div>
              </div>
            )}

            {installStep === 1 && (
              <div className="mt-4 space-y-4">
                <p className="text-sm text-[#0F1117]">Vous êtes sur quel téléphone ?</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setPhoneOS("ios");
                      setInstallStep(2);
                    }}
                    className="px-4 py-2 rounded-xl border border-[#E8E9F0] text-[#0F1117] text-sm font-semibold hover:bg-[#F8F9FC]"
                  >
                    iOS
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPhoneOS("android");
                      setInstallStep(2);
                    }}
                    className="px-4 py-2 rounded-xl border border-[#E8E9F0] text-[#0F1117] text-sm font-semibold hover:bg-[#F8F9FC]"
                  >
                    Android
                  </button>
                </div>
              </div>
            )}

            {installStep === 2 && (
              <div className="mt-4 space-y-3">
                <p className="text-sm font-semibold text-[#0F1117]">
                  Super ! Voici les étapes pour {phoneOS === "ios" ? "iOS" : "Android"} :
                </p>
                {phoneOS === "ios" ? (
                  <p className="text-xs text-[#6B7280] leading-relaxed">
                    1. Touchez le bouton Partager.
                    <br />
                    2. Choisissez “Ajouter à l’écran d’accueil”.
                    <br />
                    3. Validez l’ajout.
                  </p>
                ) : (
                  <p className="text-xs text-[#6B7280] leading-relaxed">
                    1. Ouvrez le menu du navigateur.
                    <br />
                    2. Sélectionnez “Installer l’application”.
                    <br />
                    3. Confirmez.
                  </p>
                )}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setInstallStep(1)}
                    className="flex-1 px-4 py-2 rounded-xl border border-[#E8E9F0] text-[#0F1117] text-xs font-semibold"
                  >
                    Changer d’OS
                  </button>
                  <button
                    type="button"
                    onClick={closeInstallHelp}
                    className="flex-1 px-4 py-2 rounded-xl bg-[#0F1117] text-white text-xs font-semibold"
                  >
                    Ok merci
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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
