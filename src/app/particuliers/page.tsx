"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { ParticuliersSignupOverlay } from "@/components/edge-site/particuliers-signup-overlay";
import { cn } from "@/lib/utils";

type FormState = {
  first_name: string;
  last_name: string;
  email: string;
  objectif: string;
};

const DREAM_GOALS = [
  { value: "responsable-marketing", label: "Devenir responsable marketing" },
  { value: "equipe-produit", label: "Rejoindre une équipe produit" },
  { value: "reconversion", label: "Me reconvertir" },
  { value: "autre", label: "Autre objectif" },
] as const;

function SignupForm({
  formState,
  onChange,
  onSubmit,
  isLoading,
  errorMessage,
}: {
  formState: FormState;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: () => void;
  isLoading: boolean;
  errorMessage: string | null;
}) {
  return (
    <div
      id="signup"
      className="scroll-mt-28 mx-auto w-full max-w-md space-y-4 border-t border-black/10 pt-10"
    >
      <p className="text-[13px] text-black/45">Créez votre compte pour voir votre chemin.</p>
      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            type="text"
            name="first_name"
            required
            value={formState.first_name}
            onChange={onChange}
            placeholder="Prénom"
            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3.5 text-[15px] outline-none transition focus:border-black/30"
          />
          <input
            type="text"
            name="last_name"
            required
            value={formState.last_name}
            onChange={onChange}
            placeholder="Nom"
            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3.5 text-[15px] outline-none transition focus:border-black/30"
          />
        </div>
        <input
          type="email"
          name="email"
          required
          value={formState.email}
          onChange={onChange}
          placeholder="Email"
          className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3.5 text-[15px] outline-none transition focus:border-black/30"
        />
        <input type="hidden" name="objectif" value={formState.objectif} readOnly />
        <button
          type="button"
          onClick={onSubmit}
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-edge-black px-6 py-4 text-[14px] font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isLoading ? "Préparation…" : "Construire mon chemin"}
          {!isLoading ? <ArrowRight className="h-4 w-4" aria-hidden /> : null}
        </button>
      </div>
      <p className="text-[12px] text-black/40">
        Gratuit · 2 minutes · aucun engagement.{" "}
        <Link href="/particuliers/login" className="font-medium text-edge-black underline-offset-2 hover:underline">
          Se connecter
        </Link>
      </p>
      {errorMessage ? (
        <div className="rounded-2xl border border-black/10 bg-black/[0.03] px-4 py-3 text-[13px]">{errorMessage}</div>
      ) : null}
    </div>
  );
}

function PathMockup({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[2rem] border border-black/8 bg-[#0a0a0a] text-white shadow-[0_40px_100px_-40px_rgba(0,0,0,0.55)]",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(255,255,255,0.08),transparent_50%)]" />
      <div className="relative p-6 sm:p-8">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/35">Votre chemin</p>
        <p className="mt-3 text-[22px] font-medium tracking-[-0.03em] sm:text-[26px]">Responsable marketing</p>
        <div className="mt-8 space-y-3">
          {[
            { label: "Votre objectif", detail: "Cible définie", done: true },
            { label: "Ce qui manque", detail: "4 écarts prioritaires", done: true },
            { label: "Plan ordonné", detail: "12 jalons", done: true },
            { label: "Mission du jour", detail: "Écoute active · 10 min", done: false },
          ].map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5"
            >
              <div>
                <p className="text-[12px] text-white/40">{row.label}</p>
                <p className="mt-0.5 text-[14px] font-medium text-white/90">{row.detail}</p>
              </div>
              {row.done ? (
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10">
                  <Check className="h-3.5 w-3.5 text-white/70" aria-hidden />
                </span>
              ) : (
                <span className="h-2 w-2 rounded-full bg-white/80" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MissionMockup() {
  return (
    <div className="mx-auto max-w-lg overflow-hidden rounded-[2rem] border border-black/8 bg-white p-8 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.35)]">
      <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-black/35">Mission du jour</p>
      <h3 className="mt-4 text-[28px] font-medium tracking-[-0.03em] text-edge-black">Écoute active</h3>
      <p className="mt-3 text-[15px] leading-relaxed text-black/50">
        Une conversation. Une reformulation. Dix minutes. Assez petite pour être faite. Assez précise pour compter.
      </p>
      <div className="mt-8 flex items-center justify-between border-t border-black/6 pt-5 text-[13px] text-black/40">
        <span>Progression +6 pts</span>
        <span className="rounded-full bg-edge-black px-4 py-2 text-[12px] font-medium text-white">Commencer</span>
      </div>
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
    objectif: "",
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSignupOverlay, setShowSignupOverlay] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 8);
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
        ? "Ce lien de confirmation a expiré. Réinscrivez-vous ci-dessous."
        : "Le lien de confirmation est invalide. Réinscrivez-vous pour recevoir un nouvel email.";
    setErrorMessage(label);
    window.history.replaceState({}, "", "/particuliers#signup");
    requestAnimationFrame(() => {
      document.getElementById("signup")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  useEffect(() => {
    const items = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (!items.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("opacity-100", "translate-y-0");
          entry.target.classList.remove("opacity-0", "translate-y-10");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.14 },
    );
    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const selectGoal = (value: string, label: string) => {
    setSelectedGoal(value);
    setFormState((prev) => ({ ...prev, objectif: label }));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setShowSignupOverlay(false);
    try {
      const response = await fetch("/api/particuliers/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formState),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Une erreur est survenue.");
      setSubmittedEmail(formState.email);
      setShowSignupOverlay(true);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Une erreur est survenue.");
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToSignup = () => {
    document.getElementById("signup")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="bg-white font-sans text-edge-black antialiased">
      <style jsx global>{`
        @keyframes edgeHeroIn {
          from {
            opacity: 0;
            transform: translateY(18px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes edgePathDraw {
          from {
            stroke-dashoffset: 420;
          }
          to {
            stroke-dashoffset: 0;
          }
        }
        @keyframes edgeKenBurns {
          from {
            transform: scale(1);
          }
          to {
            transform: scale(1.06);
          }
        }
      `}</style>

      {showSignupOverlay ? (
        <ParticuliersSignupOverlay
          email={submittedEmail}
          firstName={formState.first_name}
          onClose={() => setShowSignupOverlay(false)}
        />
      ) : null}

      <header
        className={cn(
          "sticky top-0 z-50 border-b border-transparent bg-white/75 backdrop-blur-xl transition-all",
          isScrolled && "border-black/[0.06] shadow-[0_1px_0_rgba(0,0,0,0.03)]",
        )}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/particuliers" className="text-[17px] font-semibold tracking-[-0.04em]">
            EDGE
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/particuliers/login"
              className="hidden text-[13px] text-black/45 transition hover:text-edge-black sm:inline"
            >
              Se connecter
            </Link>
            <button
              type="button"
              onClick={scrollToSignup}
              className="rounded-full bg-edge-black px-5 py-2 text-[12px] font-medium text-white transition hover:opacity-90"
            >
              Commencer
            </button>
          </div>
        </div>
      </header>

      {/* 1 — Héros : promesse au visiteur */}
      <section className="relative min-h-[92vh] overflow-hidden bg-edge-black text-white">
        <div
          className="pointer-events-none absolute inset-0 origin-center bg-[radial-gradient(ellipse_at_60%_30%,rgba(255,255,255,0.09),transparent_55%),radial-gradient(ellipse_at_10%_90%,rgba(255,59,48,0.14),transparent_45%)]"
          style={{ animation: "edgeKenBurns 18s ease-in-out infinite alternate" }}
        />
        <div className="relative mx-auto flex min-h-[92vh] max-w-5xl flex-col justify-center px-5 py-24 sm:px-8">
          <h1
            className="max-w-3xl text-[clamp(2.6rem,7vw,5.2rem)] font-medium leading-[1.02] tracking-[-0.045em] opacity-0"
            style={{ animation: "edgeHeroIn 0.9s ease forwards" }}
          >
            Vous savez où vous voulez aller.
          </h1>
          <p
            className="mt-8 max-w-xl text-[17px] leading-[1.65] text-white/55 opacity-0 sm:text-[19px]"
            style={{ animation: "edgeHeroIn 0.9s ease 0.12s forwards" }}
          >
            La plupart des gens apprennent au hasard.
            <br />
            <span className="text-white/85">EDGE construit le chemin le plus rapide pour atteindre votre objectif.</span>
          </p>
          <div
            className="mt-12 flex flex-col items-start gap-3 opacity-0 sm:flex-row sm:items-center"
            style={{ animation: "edgeHeroIn 0.9s ease 0.24s forwards" }}
          >
            <button
              type="button"
              onClick={scrollToSignup}
              className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-[14px] font-medium text-edge-black transition hover:bg-white/90"
            >
              Construire mon chemin
              <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
            <p className="text-[13px] text-white/40">Gratuit · 2 minutes · aucun engagement</p>
          </div>
        </div>
      </section>

      {/* 2 — Le rêve */}
      <section className="mx-auto max-w-4xl px-5 py-28 sm:px-8 sm:py-36">
        <div data-reveal className="translate-y-10 opacity-0 transition duration-700 ease-out">
          <h2 className="text-[clamp(2rem,4vw,3rem)] font-medium tracking-[-0.04em]">Quel est votre objectif&nbsp;?</h2>
          <div className="mt-10 grid gap-3 sm:grid-cols-2">
            {DREAM_GOALS.map((goal) => {
              const active = selectedGoal === goal.value;
              return (
                <button
                  key={goal.value}
                  type="button"
                  onClick={() => selectGoal(goal.value, goal.label)}
                  className={cn(
                    "rounded-2xl border px-5 py-5 text-left text-[16px] transition",
                    active
                      ? "border-edge-black bg-edge-black text-white"
                      : "border-black/10 bg-white text-edge-black hover:border-black/25",
                  )}
                >
                  {goal.label}
                </button>
              );
            })}
          </div>
          {selectedGoal ? (
            <p className="mt-8 text-[16px] leading-relaxed text-black/55">
              Très bien. On va mesurer l&apos;écart entre vous et ce rôle — puis construire le chemin.
            </p>
          ) : null}
          <button
            type="button"
            onClick={scrollToSignup}
            disabled={!selectedGoal}
            className="mt-10 inline-flex items-center gap-2 rounded-full bg-edge-black px-6 py-3 text-[13px] font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
          >
            Continuer
            <ArrowRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </section>

      {/* 3 — Direction */}
      <section className="border-y border-black/[0.06] bg-[#f7f7f5]">
        <div className="mx-auto max-w-3xl px-5 py-28 sm:px-8 sm:py-36">
          <div data-reveal className="translate-y-10 opacity-0 transition duration-700 ease-out">
            <h2 className="text-[clamp(2rem,4vw,3.2rem)] font-medium leading-[1.1] tracking-[-0.04em]">
              Vous n&apos;avez pas un problème de motivation.
            </h2>
            <p className="mt-6 text-[22px] tracking-[-0.02em] text-black/45">Vous avez un problème de direction.</p>
            <ul className="mt-16 space-y-8 text-[18px] leading-relaxed text-black/60">
              <li>Des formations qui n&apos;ont rien à voir avec le poste.</li>
              <li>Des tests sans suite.</li>
              <li>De l&apos;effort… sans trajectoire.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 4 — Avant / Après */}
      <section className="mx-auto max-w-6xl px-5 py-28 sm:px-8 sm:py-36">
        <div data-reveal className="translate-y-10 opacity-0 transition duration-700 ease-out">
          <p className="text-center text-[15px] text-black/45">
            Ce n&apos;est pas plus d&apos;apprentissage. C&apos;est le bon ordre.
          </p>
          <div className="mt-14 grid gap-6 lg:grid-cols-2">
            <div className="rounded-[2rem] border border-black/8 bg-[#f3f3f1] p-8 sm:p-10">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-black/35">Sans chemin</p>
              <div className="mt-8 space-y-3">
                {["Formation A", "Article LinkedIn", "Test random", "Tutoriel YouTube", "Encore une formation"].map(
                  (item, i) => (
                    <div
                      key={item}
                      className="rounded-xl border border-black/5 bg-white/70 px-4 py-3 text-[14px] text-black/45"
                      style={{ transform: `translateX(${(i % 3) * 8}px)` }}
                    >
                      {item}
                    </div>
                  ),
                )}
              </div>
              <p className="mt-8 text-[15px] text-black/45">Beaucoup d&apos;effort. Peu de progression mesurable.</p>
            </div>
            <div className="rounded-[2rem] bg-edge-black p-8 text-white sm:p-10">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/35">Avec un chemin</p>
              <svg className="mt-10 h-24 w-full" viewBox="0 0 320 80" fill="none" aria-hidden>
                <path
                  d="M8 64 C 70 64, 90 16, 160 16 S 250 64, 312 16"
                  stroke="rgba(255,255,255,0.85)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeDasharray="420"
                  style={{ animation: "edgePathDraw 1.6s ease forwards" }}
                />
                <circle cx="8" cy="64" r="4" fill="white" />
                <circle cx="160" cy="16" r="4" fill="white" />
                <circle cx="312" cy="16" r="4" fill="white" />
              </svg>
              <div className="mt-4 flex justify-between text-[12px] text-white/40">
                <span>Aujourd&apos;hui</span>
                <span>Cette semaine</span>
                <span>Objectif</span>
              </div>
              <p className="mt-8 text-[15px] text-white/55">Chaque jour rapproche du rôle. Pas du catalogue.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5 — Mécanisme en 4 actes */}
      <section className="border-y border-black/[0.06] bg-[#f7f7f5]">
        <div className="mx-auto max-w-5xl px-5 py-28 sm:px-8 sm:py-36">
          <div data-reveal className="translate-y-10 opacity-0 transition duration-700 ease-out">
            <h2 className="max-w-2xl text-[clamp(2rem,4vw,3.2rem)] font-medium tracking-[-0.04em]">
              EDGE ne vous vend rien.
              <span className="mt-2 block text-black/40">EDGE aligne.</span>
            </h2>
            <ol className="mt-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { n: "01", title: "Profil", body: "On lit qui vous êtes aujourd’hui." },
                { n: "02", title: "Métier", body: "On compare à la cible." },
                { n: "03", title: "Plan", body: "On ordonne ce qu’il faut combler." },
                { n: "04", title: "Jour", body: "On vous donne la prochaine mission." },
              ].map((act) => (
                <li key={act.n}>
                  <p className="text-[12px] font-medium tracking-[0.16em] text-black/30">{act.n}</p>
                  <p className="mt-3 text-[20px] font-medium tracking-[-0.02em]">{act.title}</p>
                  <p className="mt-2 text-[15px] leading-relaxed text-black/50">{act.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* 6 — Révélation produit */}
      <section className="mx-auto max-w-5xl px-5 py-28 sm:px-8 sm:py-36">
        <div data-reveal className="translate-y-10 opacity-0 transition duration-700 ease-out">
          <h2 className="text-center text-[clamp(2rem,4vw,3.2rem)] font-medium tracking-[-0.04em]">
            Votre chemin, enfin visible.
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-center text-[16px] text-black/50">
            Objectif → écarts → plan → mission du jour.
          </p>
          <PathMockup className="mt-14" />
          <div className="mt-10 flex justify-center">
            <button
              type="button"
              onClick={scrollToSignup}
              className="inline-flex items-center gap-2 rounded-full bg-edge-black px-7 py-3.5 text-[14px] font-medium text-white transition hover:opacity-90"
            >
              Voir mon chemin
              <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
      </section>

      {/* 7 — Rituel quotidien */}
      <section className="bg-edge-black py-28 text-white sm:py-36">
        <div className="mx-auto max-w-4xl px-5 sm:px-8">
          <div data-reveal className="translate-y-10 opacity-0 transition duration-700 ease-out">
            <h2 className="text-center text-[clamp(2rem,4vw,3.2rem)] font-medium tracking-[-0.04em]">
              Pas un programme. Une journée.
            </h2>
            <p className="mx-auto mt-6 max-w-md text-center text-[17px] leading-relaxed text-white/50">
              Chaque matin, une mission.
              <br />
              Assez petite pour être faite.
              <br />
              Assez précise pour compter.
            </p>
            <div className="mt-14 text-edge-black">
              <MissionMockup />
            </div>
            <p className="mx-auto mt-10 max-w-lg text-center text-[14px] text-white/40">
              Les compétences se valident. Les écarts se ferment. L&apos;objectif se rapproche.
            </p>
          </div>
        </div>
      </section>

      {/* 8 — Expert */}
      <section className="mx-auto max-w-3xl px-5 py-28 sm:px-8 sm:py-36">
        <div data-reveal className="translate-y-10 opacity-0 transition duration-700 ease-out text-center">
          <h2 className="text-[clamp(1.8rem,3.5vw,2.6rem)] font-medium tracking-[-0.035em]">
            Avancez seul. Demandez un expert quand ça bloque.
          </h2>
          <p className="mx-auto mt-6 max-w-md text-[16px] leading-relaxed text-black/50">
            Le chemin est automatique. L&apos;humain intervient quand c&apos;est nécessaire — pas par défaut.
          </p>
        </div>
      </section>

      {/* 9 — Preuve narrative */}
      <section className="border-y border-black/[0.06] bg-[#f7f7f5]">
        <div className="mx-auto max-w-4xl px-5 py-28 sm:px-8 sm:py-36">
          <div data-reveal className="translate-y-10 opacity-0 transition duration-700 ease-out">
            <blockquote className="text-[clamp(1.5rem,3vw,2.2rem)] font-medium leading-[1.35] tracking-[-0.03em] text-edge-black">
              « Je savais que je voulais passer chef de projet. EDGE m&apos;a montré l&apos;écart. Puis la semaine. Puis
              aujourd&apos;hui. »
            </blockquote>
            <p className="mt-8 text-[14px] text-black/45">— Camille · objectif chef de projet</p>
            <div className="mt-12 max-w-xs">
              <div className="flex items-end justify-between text-[13px] text-black/45">
                <span>Compatibilité</span>
                <span className="font-medium text-edge-black">34 % → 61 %</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/10">
                <div className="h-full w-[61%] rounded-full bg-edge-black" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 10 — Close + signup (workflow inchangé) */}
      <section className="mx-auto max-w-3xl px-5 py-28 sm:px-8 sm:py-40">
        <div data-reveal className="translate-y-10 opacity-0 transition duration-700 ease-out text-center">
          <h2 className="text-[clamp(2.2rem,5vw,3.6rem)] font-medium leading-[1.05] tracking-[-0.045em]">
            Vous avez déjà l&apos;objectif.
            <span className="mt-3 block text-black/40">Il vous manque le chemin.</span>
          </h2>
          <SignupForm
            formState={formState}
            onChange={handleChange}
            onSubmit={() => void handleSubmit()}
            isLoading={isLoading}
            errorMessage={errorMessage}
          />
        </div>
      </section>

      <footer className="border-t border-black/[0.06] py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 text-[13px] text-black/40 sm:flex-row sm:px-8">
          <p>© EDGE {new Date().getFullYear()}</p>
          <div className="flex gap-5">
            <Link href="/particuliers/login" className="transition hover:text-edge-black">
              Se connecter
            </Link>
            <Link href="https://edgebs.fr" className="transition hover:text-edge-black">
              edgebs.fr
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
