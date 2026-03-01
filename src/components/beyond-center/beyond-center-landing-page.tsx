"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { env } from "@/lib/env";
import { EcosystemDropdown } from "./ecosystem-dropdown";
import {
  ArrowRight,
  Briefcase,
  Building2,
  Users,
  MapPin
} from "lucide-react";

// Fonction pour construire l'URL Supabase Storage
function getSupabaseStorageUrl(bucket: string, path: string): string {
  const supabaseUrl = 
    env.supabaseUrl || 
    (typeof window !== 'undefined' ? (window as any).__NEXT_DATA__?.env?.NEXT_PUBLIC_SUPABASE_URL : undefined) ||
    (typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_SUPABASE_URL : undefined);
  
  if (!supabaseUrl) {
    return "";
  }
  
  const encodedBucket = encodeURIComponent(bucket);
  const pathParts = path.split('/');
  const encodedPath = pathParts.map(part => encodeURIComponent(part)).join('/');
  
  return `${supabaseUrl}/storage/v1/object/public/${encodedBucket}/${encodedPath}`;
}

export function BeyondCenterLandingPage() {
  const [navbarOpacity, setNavbarOpacity] = useState(0.8);

  // Couleurs Beyond Center - Identité visuelle premium
  const black = "#000000";
  const white = "#FFFFFF";
  const blue = "#006CFF";
  const gold = "#D4AF37";
  const goldHover = "#C7A633";

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY;
      setNavbarOpacity(Math.min(0.95, 0.8 + scrolled / 500));
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar - Style Apple minimaliste avec effet scroll */}
      <header
        className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 backdrop-blur-xl transition-all duration-300"
        style={{
          backgroundColor: `rgba(0, 0, 0, ${navbarOpacity})`,
        }}
      >
        <div className="border-b border-white/10/40 bg-white/5/20">
          <div className="mx-auto hidden max-w-7xl items-center justify-between px-6 py-2 text-xs font-light text-white/70 md:flex">
            <span>Campus Beyond Center · Rouen (Bâtiment ProAgora)</span>
            <span>Rentrée · Septembre 2026</span>
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span
                className="text-xl tracking-tight text-white"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                  letterSpacing: '-0.02em',
                  fontWeight: 700,
                }}
              >
                BEYOND <span style={{ fontWeight: 300 }}>Center</span>
              </span>
            </div>
            <nav className="hidden items-center gap-8 md:flex">
              <EcosystemDropdown />
              <Link href="#formations" className="text-sm text-white/80 transition-colors hover:text-white">
                Parcours
              </Link>
              <Link href="#campus" className="text-sm text-white/80 transition-colors hover:text-white">
                Campus
              </Link>
              <Link href="#entreprises" className="text-sm text-white/80 transition-colors hover:text-white">
                Entreprises
              </Link>
            </nav>
            <div className="flex items-center gap-3">
              <Link href="/beyond-center/pre-inscription">
                <Button
                  variant="outline"
                  className="rounded-full border border-white/30 px-6 text-sm font-light text-white transition hover:bg-white/10"
                >
                  Pré-inscription
                </Button>
              </Link>
              <Link href="/beyond-center/pre-inscription">
                <Button
                  className="rounded-full px-6 text-sm font-light transition-all duration-300"
                  style={{
                    backgroundColor: gold,
                    color: black,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = goldHover;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = gold;
                  }}
                >
                  Candidater pour Rouen 2026
                </Button>
              </Link>
              <Link href="/beyond-center/pre-inscription">
                <Button
                  className="rounded-full px-6 text-sm font-light transition-all duration-300"
                  style={{
                    backgroundColor: blue,
                    color: white,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#0052CC';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = blue;
                  }}
                >
                  Espace étudiant
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* 1️⃣ Hero Section */}
      <section 
        className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black"
      >
        {/* Visuel de fond épuré */}
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=2000&q=80"
            alt="Campus Beyond Center"
            fill
            priority
            className="object-cover opacity-90"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/75 to-black/90" />
          <div className="absolute inset-0 bg-[#0b1c3f]/10" />
        </div>

        {/* Contenu Hero */}
        <div className="relative z-20 max-w-6xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] as const }}
            className="space-y-8"
          >
            <div className="flex items-center justify-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/80">
                Campus Rouen - Rentrée Septembre 2026
              </span>
            </div>
            <h1
              className="text-6xl md:text-7xl lg:text-8xl font-semibold leading-[1.05] tracking-tight text-white"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                letterSpacing: '-0.04em',
                fontWeight: 300,
              }}
            >
              Ta carrière. Ton diplôme.
              <br />
              Ton impact.
              <br />
              Rentrée Rouen Septembre 2026.
            </h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, delay: 0.3 }}
              className="text-xl md:text-2xl font-light leading-relaxed text-white/85"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                letterSpacing: '-0.01em',
              }}
            >
              Alternance premium, coaching humain et parcours certifiants RNCP pour intégrer les entreprises qui recrutent à Rouen.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, delay: 0.5 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link href="/beyond-center/pre-inscription">
                <Button
                  size="lg"
                  className="text-lg px-10 py-7 font-light rounded-full transition-all duration-300 hover:scale-105"
                  style={{
                    backgroundColor: gold,
                    color: black,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = goldHover;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = gold;
                  }}
                >
                  Candidater maintenant
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Section blanche de transition */}
      <section className="py-10 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
        </div>
      </section>

      {/* Section : Pourquoi Beyond Center (version minimaliste) */}
      <section id="pourquoi" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2
              className="text-4xl md:text-5xl font-light tracking-tight text-black"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                letterSpacing: "-0.02em",
              }}
            >
              L’essentiel pour réussir à Rouen
            </h2>
            <p className="mt-4 text-base md:text-lg text-black/60">
              Trois promesses claires, zéro superflu.
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                title: "Alternance 100% financée",
                description: "Tu te formes sans frais et tu es payé par l’entreprise.",
                icon: Briefcase,
              },
              {
                title: "Coaching humain",
                description: "Un coach dédié et un suivi personnalisé chaque semaine.",
                icon: Users,
              },
              {
                title: "Campus Rouen premium",
                description: "Un cadre immersif pour progresser vite et mieux.",
                icon: Building2,
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="rounded-3xl border border-black/10 bg-white p-8 text-center shadow-[0_30px_80px_-60px_rgba(0,0,0,0.25)]"
                >
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-black text-white">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-medium text-black">{item.title}</h3>
                  <p className="mt-2 text-sm text-black/60">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Section : Parcours majeurs */}
      <section id="formations" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2
              className="text-4xl md:text-5xl font-light tracking-tight text-black"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                letterSpacing: "-0.02em",
              }}
            >
              Les 2 parcours qui recrutent à Rouen
            </h2>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-2">
            {[
              {
                title: "Responsable de Projet Marketing & Communication",
                badge: "RNCP Niveau 6",
                duration: "12 à 18 mois",
                rythme: "Alternance 4j entreprise / 1j CFA",
                prochainesEntrees: "Septembre 2026",
                subtitle: "Marketing & communication 360°",
                link: "/beyond-center/formations/rpmc",
                image:
                  "https://images.unsplash.com/photo-1488489153587-4cba60f6b0c3?auto=format&fit=crop&w=1200&q=80",
              },
              {
                title: "Titre professionnel Négociateur Technico-Commercial",
                badge: "RNCP Niveau 5",
                secondaryBadge: "Option Sport-Business disponible",
                duration: "12 mois",
                rythme: "Alternance 3j entreprise / 2j CFA",
                prochainesEntrees: "Septembre 2026",
                subtitle: "Commerce & performance terrain",
                link: "/beyond-center/formations/ntc",
                image:
                  "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80",
              },
            ].map((parcours, index) => (
              <motion.div
                key={parcours.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="group overflow-hidden rounded-3xl border border-white/10 bg-black text-white shadow-[0_50px_120px_-80px_rgba(0,0,0,0.6)]"
              >
                <div className="relative h-56">
                  <Image
                    src={parcours.image}
                    alt={parcours.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="(min-width: 1024px) 520px, 100vw"
                    priority={index === 0}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                </div>
                <div className="space-y-4 p-8">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white/70">
                      {parcours.badge}
                    </span>
                    {parcours.secondaryBadge ? (
                      <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-white/60">
                        {parcours.secondaryBadge}
                      </span>
                    ) : null}
                  </div>
                  <h3 className="text-2xl md:text-3xl font-light">{parcours.title}</h3>
                  <p className="text-sm text-white/60">{parcours.subtitle}</p>
                  <p className="text-2xl md:text-3xl font-semibold uppercase text-white">
                    100% Financé par l&apos;alternance
                  </p>
                  <div className="grid gap-3 text-sm text-white/70">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.2em] text-white/40">Durée</p>
                      <p>{parcours.duration}</p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.2em] text-white/40">Rythme</p>
                      <p>{parcours.rythme}</p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.2em] text-white/40">Prochaine rentrée</p>
                      <p>{parcours.prochainesEntrees}</p>
                    </div>
                  </div>
                  <Link href={parcours.link}>
                    <Button
                      className="rounded-full px-8 py-6 font-light transition-all duration-300 hover:scale-[1.02]"
                      style={{ backgroundColor: gold, color: black }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = goldHover;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = gold;
                      }}
                    >
                      Candidater maintenant
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section : Campus de Rouen */}
      <section id="campus" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2
              className="text-4xl md:text-5xl font-light tracking-tight text-black"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                letterSpacing: "-0.02em",
              }}
            >
              Le Campus de Rouen
            </h2>
            <p className="mt-4 text-base md:text-lg text-black/60">
              Un lieu premium pour apprendre, pratiquer et décrocher ton alternance.
            </p>
          </div>
          <div className="relative overflow-hidden rounded-3xl border border-black/10">
            <Image
              src="https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=2000&q=80"
              alt="Campus Beyond Center Rouen"
              fill
              className="object-cover"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            <div className="absolute bottom-6 left-6 text-white">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/40 px-4 py-2 text-xs uppercase tracking-[0.25em]">
                <MapPin className="h-4 w-4" />
                Rouen · ProAgora
              </div>
              <h3 className="mt-4 text-2xl md:text-3xl font-light">
                Un campus pensé pour l&apos;alternance
              </h3>
            </div>
          </div>
        </div>
      </section>

      {/* 5️⃣ Section : "Ils nous font confiance" */}
      <section id="entreprises" className="py-24 bg-black border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 
              className="text-5xl md:text-6xl font-light mb-6 leading-[1.05] tracking-tight text-white"
              style={{ 
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                letterSpacing: '-0.03em',
                fontWeight: 300
              }}
            >
              Ils nous font confiance
            </h2>
          </motion.div>

          {/* Logos partenaires - Monochrome & discret */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 items-center opacity-40">
            {Array.from({ length: 6 }).map((_, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="flex items-center justify-center h-10"
              >
                <div className="h-5 w-24 rounded-full bg-white/30" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section id="candidature" className="bg-black py-24">
        <div className="max-w-4xl mx-auto px-6 text-white">
          <div className="text-center space-y-4">
            <h2
              className="text-4xl md:text-5xl font-light tracking-tight"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                letterSpacing: "-0.02em",
              }}
            >
              Prêt à passer au niveau supérieur ?
            </h2>
            <p className="text-base md:text-lg text-white/60">
              Laisse tes infos, on te recontacte rapidement pour ta rentrée à Rouen.
            </p>
          </div>
          <form
            action="/beyond-center/pre-inscription"
            method="get"
            className="mt-10 grid gap-4 sm:grid-cols-3"
          >
            <div className="sm:col-span-1">
              <label className="sr-only" htmlFor="lead-name">
                Nom complet
              </label>
              <Input
                id="lead-name"
                name="name"
                placeholder="Nom complet"
                required
                className="rounded-full border-white/20 bg-white/10 text-white placeholder:text-white/40 focus-visible:ring-white/40"
              />
            </div>
            <div className="sm:col-span-1">
              <label className="sr-only" htmlFor="lead-email">
                Email
              </label>
              <Input
                id="lead-email"
                name="email"
                type="email"
                placeholder="Email"
                required
                className="rounded-full border-white/20 bg-white/10 text-white placeholder:text-white/40 focus-visible:ring-white/40"
              />
            </div>
            <div className="sm:col-span-1">
              <label className="sr-only" htmlFor="lead-phone">
                Téléphone
              </label>
              <Input
                id="lead-phone"
                name="phone"
                type="tel"
                placeholder="Téléphone"
                className="rounded-full border-white/20 bg-white/10 text-white placeholder:text-white/40 focus-visible:ring-white/40"
              />
            </div>
            <div className="sm:col-span-3">
              <Button
                type="submit"
                className="w-full rounded-full px-8 py-6 font-light transition-all duration-300 hover:scale-[1.01]"
                style={{ backgroundColor: gold, color: black }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = goldHover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = gold;
                }}
              >
                Candidater maintenant
              </Button>
            </div>
          </form>
          <p className="mt-4 text-center text-xs text-white/45">
            Réponse sous 48h. Zéro spam, juste de l&apos;action.
          </p>
        </div>
      </section>

      {/* 7️⃣ Footer futuriste */}
      <footer className="border-t border-white/10 bg-black py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 mb-16">
            <div>
              <h4 
                className="font-light mb-6 text-white text-lg"
                style={{ 
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
                }}
              >
                Formation
              </h4>
              <ul className="space-y-3 text-sm text-white/60 font-light">
                <li>
                  <Link 
                    href="#formations" 
                    className="hover:text-[#006CFF] transition-colors"
                    style={{ 
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
                    }}
                  >
                    Parcours disponibles
                  </Link>
                </li>
                <li>
                  <Link 
                    href="#campus" 
                    className="hover:text-[#006CFF] transition-colors"
                    style={{ 
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
                    }}
                  >
                    Campus de Rouen
                  </Link>
                </li>
                <li>
                  <Link 
                    href="#candidature" 
                    className="hover:text-[#006CFF] transition-colors"
                    style={{ 
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
                    }}
                  >
                    Candidature
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 
                className="font-light mb-6 text-white text-lg"
                style={{ 
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
                }}
              >
                Campus
              </h4>
              <ul className="space-y-3 text-sm text-white/60 font-light">
                <li>
                  <Link 
                    href="#campus" 
                    className="hover:text-[#006CFF] transition-colors"
                    style={{ 
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
                    }}
                  >
                    Visite & infos pratiques
                  </Link>
                </li>
                <li>
                  <Link 
                    href="#entreprises" 
                    className="hover:text-[#006CFF] transition-colors"
                    style={{ 
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
                    }}
                  >
                    Entreprises partenaires
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/beyond-center/contact" 
                    className="hover:text-[#006CFF] transition-colors"
                    style={{ 
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
                    }}
                  >
                    Nous contacter
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 
                className="font-light mb-6 text-white text-lg"
                style={{ 
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
                }}
              >
                Candidature
              </h4>
              <ul className="space-y-3 text-sm text-white/60 font-light">
                <li>
                  <Link 
                    href="#candidature" 
                    className="hover:text-[#006CFF] transition-colors"
                    style={{ 
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
                    }}
                  >
                    Candidater maintenant
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/beyond-center/pre-inscription" 
                    className="hover:text-[#006CFF] transition-colors"
                    style={{ 
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
                    }}
                  >
                    Pré-inscription
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/beyond-center/contact" 
                    className="hover:text-[#006CFF] transition-colors"
                    style={{ 
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
                    }}
                  >
                    Nous contacter
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Ligne bleue animée */}
          <motion.div
            animate={{
              scaleX: [0, 1, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="h-px mb-8 origin-left"
            style={{ backgroundColor: blue, opacity: 0.3 }}
          />

          <div className="text-center">
            <p 
              className="text-sm text-white/40 font-light"
              style={{ 
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
              }}
            >
              &copy; {new Date().getFullYear()} Beyond Center. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

