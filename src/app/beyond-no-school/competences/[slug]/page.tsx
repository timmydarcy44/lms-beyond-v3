"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  competencies,
  type CompetenceData,
  getCompetenceBySlug,
} from "@/components/beyond-no-school/competences-data";
import { useSupabase } from "@/components/providers/supabase-provider";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as const },
  viewport: { once: true, margin: "-120px" },
};

const titleStyle = {
  fontFamily:
    '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
  fontWeight: 900 as const,
  letterSpacing: "-0.04em",
};

const DEFAULT_HERO =
  "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=2200&q=80";

export default function CompetencePresentationPage() {
  const params = useParams<{ slug: string }>();
  const rawSlug = params?.slug;
  const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug ?? "";
  const router = useRouter();
  const supabase = useSupabase();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hasEnrollment, setHasEnrollment] = useState(false);

  const competence = slug ? getCompetenceBySlug(slug) : null;

  if (!competence) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-6 text-center text-white">
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.35em] text-white/50">Beyond No School</p>
          <h1 className="text-3xl font-semibold">Cet asset arrive bientôt.</h1>
          <Link
            href="/beyond-no-school/catalogue"
            className="inline-flex items-center justify-center rounded-full border border-white/20 px-6 py-3 text-xs uppercase tracking-[0.3em] text-white/70"
          >
            Retour aux assets
          </Link>
        </div>
      </main>
    );
  }

  const isAvailable = competence.available !== false;
  const ctaState = useMemo(() => {
    if (!isAuthenticated) {
      return {
        label: "DÉBLOQUER L'ASSET",
        href: "/beyond-no-school/checkout",
        locked: true,
      };
    }
    if (progress > 0) {
      return {
        label: "CONTINUER L'ASSET",
        href: `/beyond-no-school/reprendre?focus=${encodeURIComponent(slug)}`,
        locked: false,
      };
    }
    if (hasEnrollment) {
      return {
        label: "COMMENCER L'ASSET",
        href: `/beyond-no-school/competences/${slug}/commencer`,
        locked: false,
      };
    }
    return {
      label: "DÉBLOQUER L'ASSET",
      href: "/beyond-no-school/checkout",
      locked: true,
    };
  }, [hasEnrollment, isAuthenticated, progress, slug]);

  useEffect(() => {
    let isMounted = true;
    const loadSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!isMounted) return;
      const isLogged = Boolean(data.session);
      setIsAuthenticated(isLogged);
      if (!isLogged) {
        setHasEnrollment(false);
        setProgress(0);
        return;
      }
      const response = await fetch("/api/bns/me/proofs");
      if (!response.ok) return;
      const result = await response.json();
      if (!isMounted || !result?.ok) return;
      const enrollment =
        result.enrollments?.find((item: any) => item?.bns_proofs?.slug === slug) ?? null;
      if (!enrollment) {
        setHasEnrollment(false);
        setProgress(0);
        return;
      }
      setHasEnrollment(true);
      setProgress(Number(enrollment.current_step_index ?? 0));
    };
    loadSession();
    return () => {
      isMounted = false;
    };
  }, [slug, supabase]);

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="relative mt-6 min-h-[70vh] overflow-hidden bg-black text-white">
        <Image
          src={competence.coverImage ?? DEFAULT_HERO}
          alt={competence.name}
          fill
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-black/40 to-black" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <div className="relative mx-auto flex min-h-[70vh] max-w-6xl flex-col justify-end gap-6 px-6 pb-16 pt-24">
          <motion.p {...fadeUp} className="text-xs uppercase tracking-[0.4em] text-white/50">
            {competence.hero.eyebrow}
          </motion.p>
          <motion.h1
            {...fadeUp}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl"
            style={titleStyle}
          >
            {competence.name.toUpperCase()}
          </motion.h1>
          <motion.p {...fadeUp} className="max-w-2xl text-lg text-white/70">
            {competence.identityLine}
          </motion.p>
          <motion.div {...fadeUp} className="flex flex-wrap gap-3 text-xs uppercase tracking-[0.35em] text-white/60">
            <span>{competence.category}</span>
            <span>{competence.meta.duration}</span>
            <span>{competence.meta.format}</span>
            {competence.difficulty ? <span>Niveau : {competence.difficulty}</span> : null}
          </motion.div>
          <motion.div {...fadeUp} className="flex flex-wrap gap-4">
            <div className="group relative">
              <Link
                href={ctaState.href}
                className="inline-flex items-center justify-center rounded-full bg-[#FF3B30] px-8 py-3 text-xs font-semibold uppercase tracking-[0.35em] text-white"
              >
                ▶ {ctaState.label}
              </Link>
              {ctaState.locked ? (
                <span className="mt-2 block text-[11px] uppercase tracking-[0.3em] text-white/50 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  Inclus dans votre Pass Beyond
                </span>
              ) : null}
            </div>
            <Link
              href="/beyond-no-school/catalogue"
              className="inline-flex items-center justify-center rounded-full border border-white/20 px-7 py-3 text-xs font-semibold uppercase tracking-[0.35em] text-white/70 hover:text-white"
            >
              Retour aux assets
            </Link>
          </motion.div>
        </div>
      </section>

      <section className="bg-black py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8">
              <p className="text-xs uppercase tracking-[0.35em] text-white/50">Accès</p>
              <h2 className="mt-4 text-3xl font-semibold text-white">
                Accès complet à l'asset, sans engagement.
              </h2>
              <p className="mt-4 text-sm text-white/60">
                Tu avances à ton rythme, tu livres la preuve, tu repars avec ton Open Badge.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-8">
              <p className="text-xs uppercase tracking-[0.35em] text-white/50">Offre</p>
              <div className="mt-5 flex items-baseline gap-3">
                <span className="text-5xl font-semibold text-white">30€</span>
                <span className="text-xs uppercase tracking-[0.35em] text-white/60">/ mois</span>
              </div>
              <Link
                href="/beyond-no-school/abonnement"
                className="mt-6 inline-flex items-center justify-center rounded-full bg-white px-8 py-3 text-xs font-semibold uppercase tracking-[0.35em] text-black"
              >
                Démarrer maintenant
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-black py-24">
        <div className="mx-auto max-w-6xl space-y-12 px-6">
          <motion.h2 {...fadeUp} className="text-3xl sm:text-4xl md:text-5xl font-black" style={titleStyle}>
            LE PLAN D’EXÉCUTION.
          </motion.h2>
          <motion.p {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.08 }} className="text-lg text-white/70">
            {competence.hero.description}
          </motion.p>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {competence.actions.slice(0, 6).map((action, index) => (
              <motion.div
                key={action}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: 0.05 * index }}
                className="rounded-3xl border border-white/10 bg-white/[0.03] p-6"
              >
                <p className="text-xs uppercase tracking-[0.35em] text-white/50">Épisode {index + 1}</p>
                <p className="mt-4 text-lg font-semibold text-white">{action}</p>
                <p className="mt-3 text-sm text-white/60">
                  {competence.flow[index]?.copy ?? competence.meta.shortDescription}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-black py-24">
        <div className="mx-auto max-w-6xl space-y-10 px-6">
          <motion.h2 {...fadeUp} className="text-3xl sm:text-4xl md:text-5xl font-black" style={titleStyle}>
            LA PREUVE FINALE.
          </motion.h2>
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <motion.div {...fadeUp} className="space-y-6 text-white/80">
              <p className="text-xs uppercase tracking-[0.35em] text-white/50">Livrable</p>
              <p className="text-2xl font-semibold text-white">{competence.proof.type}</p>
              <p className="text-lg text-white/70">{competence.proof.context}</p>
              <ul className="space-y-3 text-sm text-white/60">
                {competence.proof.criteria.slice(0, 4).map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-1 h-1.5 w-8 rounded-full bg-[#FF3B30]" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
            <motion.div
              {...fadeUp}
              className="rounded-3xl border border-white/10 bg-white/[0.04] p-6"
            >
              <p className="text-xs uppercase tracking-[0.35em] text-white/50">Synopsis</p>
              <p className="mt-4 text-lg text-white/70">{competence.proof.manifesto}</p>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="bg-black py-24">
        <div className="mx-auto max-w-6xl space-y-12 px-6">
          <motion.h2 {...fadeUp} className="text-3xl sm:text-4xl md:text-5xl font-black" style={titleStyle}>
            OPEN BADGES DÉBLOQUÉS.
          </motion.h2>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {competence.badge.showcase.slice(0, 6).map((badge, index) => (
              <motion.div
                key={badge.label}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: 0.04 * index }}
                className="rounded-3xl border border-white/10 bg-white/[0.03] p-6"
              >
                <p className="text-xs uppercase tracking-[0.35em] text-white/50">Badge</p>
                <p className="mt-4 text-lg font-semibold text-white">{badge.label}</p>
                <p className="mt-3 text-sm text-white/60">{badge.detail}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

