"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BadgeCheck, BarChart3, Link2, Shield } from "lucide-react";
import { EdgeButton } from "@/components/edge-site/edge-button";
import { ParticuliersSignupOverlay } from "@/components/edge-site/particuliers-signup-overlay";
import { EDGE_HERO_IMAGE_URL } from "@/lib/edge-site/constants";

const PHONE_SLIDES = [
  {
    src: "https://zmcefidiiqqppowymoqb.supabase.co/storage/v1/object/public/EDGE%20Lab/tel%20home%202.png",
    alt: "Résultats DISC et IDMC sur mobile",
  },
  {
    src: "https://zmcefidiiqqppowymoqb.supabase.co/storage/v1/object/public/EDGE%20Lab/Tel%20home.png",
    alt: "Accueil espace profil EDGE",
  },
  {
    src: "https://zmcefidiiqqppowymoqb.supabase.co/storage/v1/object/public/EDGE%20Lab/tel%20home%203%20(2).png",
    alt: "Open Badge EDGE sur mobile",
  },
] as const;

const INCLUDED = [
  "Test comportemental DISC complet",
  "Bilan IDMC et soft skills",
  "Profil public partageable",
  "Open Badges et certifications",
  "Matching opportunités",
] as const;

type FormState = {
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  objectif: string;
};

function SignupForm({
  formState,
  onChange,
  onSubmit,
  isLoading,
  errorMessage,
  compact,
}: {
  formState: FormState;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onSubmit: () => void;
  isLoading: boolean;
  errorMessage: string | null;
  compact?: boolean;
}) {
  const objectiveOptions = [
    { value: "alternance", label: "Alternance" },
    { value: "freelance", label: "Freelance" },
    { value: "emploi", label: "Emploi" },
    { value: "reconversion", label: "Reconversion" },
    { value: "autre", label: "Autre" },
  ];

  return (
    <div className={compact ? "" : "rounded-3xl border border-black/[0.06] bg-white p-6 shadow-[0_24px_80px_-40px_rgba(0,0,0,0.12)] sm:p-8"}>
      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            type="text"
            name="first_name"
            required
            value={formState.first_name}
            onChange={onChange}
            placeholder="Prénom"
            className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-[15px] outline-none transition focus:border-edge-black/30"
          />
          <input
            type="text"
            name="last_name"
            required
            value={formState.last_name}
            onChange={onChange}
            placeholder="Nom"
            className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-[15px] outline-none transition focus:border-edge-black/30"
          />
        </div>
        <input
          type="email"
          name="email"
          required
          value={formState.email}
          onChange={onChange}
          placeholder="Email"
          className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-[15px] outline-none transition focus:border-edge-black/30"
        />
        <select
          name="objectif"
          required
          value={formState.objectif}
          onChange={onChange}
          className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-[15px] text-black/80 outline-none transition focus:border-edge-black/30"
        >
          <option value="">Votre objectif</option>
          {objectiveOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={onSubmit}
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-edge-black px-6 py-3.5 text-[13px] font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isLoading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Préparation de votre espace…
            </>
          ) : (
            <>
              Créer mon espace gratuitement
              <ArrowRight className="h-4 w-4" aria-hidden />
            </>
          )}
        </button>
      </div>
      <p className="mt-4 text-[12px] leading-relaxed text-black/40">
        Inscription 100&nbsp;% gratuite · sans carte bancaire · sans engagement
      </p>
      <p className="mt-2 text-[12px] text-black/40">
        Déjà un compte ?{" "}
        <Link href="/particuliers/login" className="font-medium text-edge-black underline-offset-2 hover:underline">
          Se connecter
        </Link>
      </p>
      {errorMessage ? (
        <div className="mt-4 rounded-xl border border-black/10 bg-black/[0.03] px-4 py-3 text-[13px] text-edge-black">
          {errorMessage}
        </div>
      ) : null}
    </div>
  );
}

export default function ParticuliersPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formState, setFormState] = useState<FormState>({
    first_name: "",
    last_name: "",
    email: "",
    role: "PARTICULIER",
    objectif: "",
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSignupOverlay, setShowSignupOverlay] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authError = params.get("auth_error");
    if (!authError) return;

    const label =
      authError === "otp_expired"
        ? "Ce lien de confirmation a expiré (valable 24 h). Réinscrivez-vous ci-dessous pour recevoir un nouvel email."
        : "Le lien de confirmation est invalide ou a déjà été utilisé. Réinscrivez-vous pour recevoir un nouvel email.";

    setErrorMessage(label);
    setShowSignupOverlay(false);
    window.history.replaceState({}, "", "/particuliers#signup");
    requestAnimationFrame(() => {
      document.getElementById("signup")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  useEffect(() => {
    const items = Array.from(document.querySelectorAll<HTMLElement>("[data-animate]"));
    if (!items.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("opacity-100", "translate-y-0");
            entry.target.classList.remove("opacity-0", "translate-y-6");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 },
    );

    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    event?.stopPropagation();
    setIsLoading(true);
    setErrorMessage(null);
    setShowSignupOverlay(false);

    try {
      const response = await fetch("/api/particuliers/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: formState.first_name,
          last_name: formState.last_name,
          email: formState.email,
          objectif: formState.objectif,
        }),
      });

      const data = (await response.json()) as {
        error?: string;
        message?: string;
        success?: boolean;
        warning?: boolean;
      };

      if (!response.ok) {
        throw new Error(data.error || "Une erreur est survenue. Réessayez.");
      }

      setSubmittedEmail(formState.email);
      setShowSignupOverlay(true);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Une erreur est survenue. Réessayez.");
    } finally {
      setIsLoading(false);
    }
  };

  const features = useMemo(
    () => [
      {
        icon: BarChart3,
        title: "Tests & diagnostics",
        desc: "DISC, IDMC et soft skills — comprenez votre profil en quelques minutes.",
      },
      {
        icon: Link2,
        title: "Un lien, partout",
        desc: "Un profil public à partager sur LinkedIn, vos candidatures et votre CV.",
      },
      {
        icon: BadgeCheck,
        title: "Compétences prouvées",
        desc: "Open Badges et certifications rattachés à votre espace.",
      },
      {
        icon: Shield,
        title: "Gratuit, pour toujours",
        desc: "Votre espace est gratuit et le restera. Sans carte bancaire.",
      },
    ],
    [],
  );

  return (
    <div className="bg-white font-sans text-edge-black antialiased">
      {showSignupOverlay ? (
        <ParticuliersSignupOverlay
          email={submittedEmail}
          firstName={formState.first_name}
          onClose={() => setShowSignupOverlay(false)}
        />
      ) : null}
      <header
        className={`sticky top-0 z-50 border-b border-black/[0.06] bg-white/90 backdrop-blur-md transition-shadow ${
          isScrolled ? "shadow-sm" : ""
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/edge-lab" className="text-[15px] font-semibold tracking-[-0.02em] text-edge-black">
            EDGE
          </Link>
          <a
            href="#signup"
            className="rounded-full bg-edge-red px-5 py-2 text-[12px] font-medium text-white transition hover:opacity-90"
          >
            Créer mon espace
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src={EDGE_HERO_IMAGE_URL}
            alt=""
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0 bg-edge-black/75" aria-hidden />
        </div>

        <div className="relative mx-auto grid max-w-6xl gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[1fr_420px] lg:items-center lg:gap-16 lg:py-28">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-[10px] font-normal uppercase tracking-[0.2em] text-white/70">
              EDGE Powered Beyond
            </p>
            <h1 className="mt-8 text-[clamp(2.25rem,5vw,3.5rem)] font-medium leading-[1.05] tracking-[-0.03em] text-white">
              Votre espace
              <br />
              compétences.
            </h1>
            <p className="mt-6 max-w-md text-[16px] leading-[1.7] text-white/50">
              Créez gratuitement un espace dédié pour valoriser vos compétences, passer vos tests et partager vos
              résultats.
            </p>
            <ul className="mt-10 space-y-3">
              {["Inscription 100 % gratuite", "Tests DISC, IDMC & soft skills", "Profil public & Open Badges"].map(
                (item) => (
                  <li key={item} className="flex items-center gap-3 text-[14px] text-white/70">
                    <span className="h-1 w-1 rounded-full bg-edge-red" aria-hidden />
                    {item}
                  </li>
                ),
              )}
            </ul>
          </div>

          <div id="signup" className="scroll-mt-24">
            <SignupForm
              formState={formState}
              onChange={handleChange}
              onSubmit={() => void handleSubmit()}
              isLoading={isLoading}
              errorMessage={errorMessage}
            />
          </div>
        </div>
      </section>

      {/* Phone showcase */}
      <section className="border-b border-black/[0.06] bg-edge-grey px-5 py-16 sm:px-8 sm:py-20">
        <div
          data-animate
          className="mx-auto max-w-6xl opacity-0 translate-y-6 transition-all duration-700"
        >
          <p className="text-[10px] font-normal uppercase tracking-[0.2em] text-edge-red">Votre espace</p>
          <h2 className="mt-3 max-w-lg text-[clamp(1.5rem,3vw,2rem)] font-medium tracking-[-0.02em] text-edge-black">
            Tout votre profil, dans votre poche.
          </h2>
          <div
            className="mt-10 flex gap-5 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            style={{ scrollSnapType: "x mandatory" }}
          >
            {PHONE_SLIDES.map((slide) => (
              <div
                key={slide.src}
                className="w-[min(72%,280px)] shrink-0 sm:w-[240px]"
                style={{ scrollSnapAlign: "start" }}
              >
                <div className="relative aspect-[9/19.5] overflow-hidden rounded-[28px] shadow-[0_32px_80px_-24px_rgba(0,0,0,0.25)]">
                  <Image src={slide.src} alt={slide.alt} fill className="object-cover" sizes="280px" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-edge-black px-5 py-16 text-white sm:px-8 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-8 sm:grid-cols-3">
          {[
            { stat: "15 min", desc: "Pour compléter vos premiers tests" },
            { stat: "0 €", desc: "Inscription gratuite, pour toujours" },
            { stat: "1 lien", desc: "À partager partout" },
          ].map((item) => (
            <div key={item.stat} className="border-t border-white/10 pt-6">
              <p className="text-[clamp(2rem,4vw,2.75rem)] font-medium tracking-[-0.03em]">{item.stat}</p>
              <p className="mt-2 text-[14px] text-white/45">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-5 py-20 sm:px-8 sm:py-28">
        <div
          data-animate
          className="mx-auto max-w-6xl opacity-0 translate-y-6 transition-all duration-700"
        >
          <p className="text-[10px] font-normal uppercase tracking-[0.2em] text-edge-red">Inclus</p>
          <h2 className="mt-3 max-w-xl text-[clamp(1.75rem,3vw,2.25rem)] font-medium tracking-[-0.02em]">
            Tout ce dont vous avez besoin. Gratuitement.
          </h2>
          <div className="mt-14 grid gap-6 sm:grid-cols-2">
            {features.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-black/[0.06] p-8 transition hover:border-black/10"
              >
                <item.icon className="h-5 w-5 text-edge-red" strokeWidth={1.75} aria-hidden />
                <h3 className="mt-5 text-[17px] font-medium tracking-[-0.01em]">{item.title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-black/45">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="border-t border-black/[0.06] bg-edge-grey px-5 py-20 sm:px-8 sm:py-28">
        <div
          data-animate
          className="mx-auto max-w-6xl opacity-0 translate-y-6 transition-all duration-700"
        >
          <h2 className="text-[clamp(1.75rem,3vw,2.25rem)] font-medium tracking-[-0.02em]">
            Trois étapes. Quinze minutes.
          </h2>
          <ol className="mt-14 grid gap-10 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Créez votre espace",
                desc: "Inscription gratuite en moins d'une minute.",
              },
              {
                step: "02",
                title: "Passez vos tests",
                desc: "DISC, IDMC et soft skills depuis votre téléphone.",
              },
              {
                step: "03",
                title: "Partagez votre profil",
                desc: "Un lien unique pour vos candidatures et LinkedIn.",
              },
            ].map((item) => (
              <li key={item.step}>
                <span className="text-[13px] font-medium text-edge-red">{item.step}</span>
                <h3 className="mt-3 text-[17px] font-medium tracking-[-0.01em]">{item.title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-black/45">{item.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Included list */}
      <section className="px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-[10px] font-normal uppercase tracking-[0.2em] text-edge-red">EDGE Powered Beyond</p>
            <h2 className="mt-3 text-[clamp(1.75rem,3vw,2.25rem)] font-medium tracking-[-0.02em]">
              Un espace complet.
              <br />
              Sans frais cachés.
            </h2>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-black/45">
              La technologie Beyond au service de votre employabilité — portée par EDGE.
            </p>
          </div>
          <ul className="space-y-4">
            {INCLUDED.map((item) => (
              <li key={item} className="flex items-center gap-3 border-b border-black/[0.06] pb-4 text-[15px]">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-edge-red/10 text-edge-red">
                  ✓
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-black/[0.06] bg-edge-grey px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-[clamp(1.5rem,3vw,2rem)] font-medium tracking-[-0.02em]">Questions fréquentes</h2>
          <div className="mt-8 space-y-3">
            {[
              {
                q: "C'est quoi le test comportemental ?",
                a: "Il mesure quatre dimensions — Dominance, Influence, Stabilité, Conformité — en environ 15 minutes.",
              },
              {
                q: "Mon employeur peut voir mon profil ?",
                a: "Uniquement si vous partagez votre lien. Vous contrôlez qui voit quoi.",
              },
              {
                q: "C'est vraiment gratuit ?",
                a: "Oui. L'inscription et votre espace sont 100 % gratuits, sans limite de durée et sans carte bancaire.",
              },
              {
                q: "Qu'est-ce que EDGE Powered Beyond ?",
                a: "C'est votre espace personnel propulsé par la technologie Beyond : tests, profil et badges, au sein de l'écosystème EDGE.",
              },
            ].map((item) => (
              <details key={item.q} className="group rounded-2xl border border-black/[0.06] bg-white px-5 py-4">
                <summary className="cursor-pointer list-none text-[14px] font-medium [&::-webkit-details-marker]:hidden">
                  {item.q}
                </summary>
                <p className="mt-3 text-[14px] leading-relaxed text-black/50">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-edge-black px-5 py-20 text-white sm:px-8 sm:py-28">
        <div className="mx-auto max-w-xl text-center">
          <p className="text-[10px] font-normal uppercase tracking-[0.2em] text-white/40">EDGE Powered Beyond</p>
          <h2 className="mt-4 text-[clamp(1.75rem,3vw,2.25rem)] font-medium tracking-[-0.02em]">
            Votre espace vous attend.
          </h2>
          <p className="mt-4 text-[15px] text-white/45">Gratuit. Pour toujours.</p>
          <div className="mt-10">
            <EdgeButton href="#signup" variant="primary" ariaLabel="Créer mon espace gratuitement">
              Créer mon espace gratuitement
            </EdgeButton>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-edge-black px-5 py-8 text-center text-[12px] text-white/35">
        <p>© EDGE 2026 · EDGE Powered Beyond</p>
        <p className="mt-1">
          <Link href="/edge-lab" className="hover:text-white/60">
            Retour à edgebs.fr
          </Link>
        </p>
      </footer>

      <div className="fixed bottom-4 left-0 right-0 z-40 flex justify-center px-4 md:hidden">
        <a
          href="#signup"
          className="flex w-full max-w-sm items-center justify-center rounded-full bg-edge-red px-6 py-3.5 text-[13px] font-medium text-white shadow-lg"
        >
          Créer mon espace gratuitement
        </a>
      </div>

    </div>
  );
}
