"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Compass, Link as LinkIcon, ShieldCheck } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type PlanType = "free" | "pro";

export default function ParticuliersPage() {
  const supabase = createSupabaseBrowserClient();
  const [isScrolled, setIsScrolled] = useState(false);
  const [plan, setPlan] = useState<PlanType>("free");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formState, setFormState] = useState({
    first_name: "",
    last_name: "",
    email: "",
    role: "PARTICULIER",
    password: "",
    objectif: "",
  });
  const [message, setMessage] = useState<string | null>(null);

  const objectiveOptions = useMemo(
    () => [
      { value: "alternance", label: "Alternance" },
      { value: "freelance", label: "Freelance" },
      { value: "emploi", label: "Emploi" },
      { value: "reconversion", label: "Reconversion" },
      { value: "autre", label: "Autre" },
    ],
    []
  );

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const applyHashPlan = () => {
      if (window.location.hash === "#signup-pro") {
        setPlan("pro");
      } else {
        setPlan("free");
      }
    };
    applyHashPlan();
    window.addEventListener("hashchange", applyHashPlan);
    return () => window.removeEventListener("hashchange", applyHashPlan);
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
      { threshold: 0.18 }
    );

    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    event?.stopPropagation();
    setIsSubmitting(true);
    setIsPreparing(true);
    setIsLoading(true);

    try {
      const safeFirstName = formState.first_name?.trim();
      const safeLastName = formState.last_name?.trim();
      const safeEmail = formState.email?.trim();
      const safePassword = formState.password?.trim();
      if (!safeFirstName || !safeLastName || !safeEmail || !safePassword) {
        throw new Error("Prénom, nom, email et mot de passe sont requis.");
      }

      if (!supabase) {
        throw new Error("Supabase n'est pas configuré.");
      }

      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: safeEmail,
        password: safePassword,
        options: {
          data: {
            first_name: safeFirstName,
            last_name: safeLastName,
            role: "apprenant",
            type_profil: formState.objectif || null,
          },
        },
      });

      if (signUpError) {
        console.error("[particuliers][signUp] error:", signUpError);
        const lower = signUpError.message.toLowerCase();
        if (lower.includes("already registered") || lower.includes("already exists")) {
          throw new Error("Ce compte existe déjà. Connecte-toi ou utilise un autre email.");
        }
        throw new Error(signUpError.message);
      }

      if (!authData?.user?.id) {
        throw new Error("Impossible de créer le compte.");
      }

      try {
        await supabase.from("profiles").upsert(
          {
            id: authData.user.id,
            email: safeEmail,
            first_name: safeFirstName,
            last_name: safeLastName,
            type_profil: formState.objectif || null,
          },
          { onConflict: "id" }
        );
      } catch (profileError) {
        console.error("[particuliers][profile] upsert error:", profileError);
      }

      const waitForSession = async () => {
        for (let attempt = 0; attempt < 5; attempt += 1) {
          const { data } = await supabase.auth.getSession();
          if (data?.session?.user?.id) return data.session.user.id;
          await new Promise<void>((resolve) => setTimeout(resolve, 300));
        }
        return null;
      };

      const fallbackProfileId = authData.user.id;
      try {
        sessionStorage.setItem("particulierProfileId", fallbackProfileId);
      } catch {
        // ignore
      }

      const sessionUserId = await waitForSession();
      const targetProfileId = sessionUserId ?? fallbackProfileId;

      setIsRedirecting(true);
      window.location.href = "/dashboard/apprenant/test-comportemental-intro";
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Une erreur est survenue. Réessaie."
      );
    } finally {
      setIsSubmitting(false);
      setIsRedirecting(false);
      setIsPreparing(false);
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white text-black">
      <header
        className={`sticky top-0 z-50 w-full border-b border-black/5 bg-white transition-shadow ${
          isScrolled ? "shadow-sm" : "shadow-none"
        }`}
      >
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <div className="text-[14px] font-black tracking-[0.3em] text-black">
            BEYOND
          </div>
          <a
            href="#signup"
            className="rounded-full bg-[#F97316] px-5 py-2 text-[12px] font-black uppercase text-black shadow-sm"
          >
            Créer mon profil gratuit
          </a>
        </div>
      </header>

      <style jsx>{`
        .hero {
          display: grid;
          grid-template-columns: 50% 50%;
          height: 100vh;
        }
        .hero-image {
          background-image: url("/images/road.jpg");
          background-size: cover;
          background-position: center;
          position: relative;
        }
        .hero-image::after {
          content: "";
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
        }
        .hero-image__content {
          position: relative;
          z-index: 1;
          height: 100%;
          display: flex;
          align-items: center;
          padding: 48px;
        }
        .hero-form {
          background: white;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 48px;
        }
        @media (max-width: 768px) {
          .hero {
            grid-template-columns: 1fr;
            height: auto;
          }
          .hero-image {
            height: 40vh;
          }
          .hero-image::after {
            background: rgba(0, 0, 0, 0.7);
          }
          .hero-image__content {
            padding: 24px;
          }
          .hero-form {
            height: auto;
            padding: 48px 24px;
          }
        }
      `}</style>

      <section className="hero">
        <div className="hero-image">
          <div className="hero-image__content">
            <div className="text-white">
              <h1 className="text-5xl font-black uppercase leading-tight sm:text-6xl">
                150 CVs.
                <br />
                1 POSTE.
                <br />
                COMMENT TU TE
                <br />
                DÉMARQUES ?
              </h1>
              <p className="mt-6 text-lg text-white/80">
                Crée ton profil comportemental gratuit en 15 minutes. Un lien.
                Une certification. Une différence.
              </p>
              <p className="mt-3 text-sm text-white/70">
                Gratuit pour toujours. Sans CB. Sans engagement.
              </p>
            </div>
          </div>
        </div>

        <div className="hero-form">
          <div className="w-full max-w-xl">
            <div className="text-[12px] uppercase tracking-[0.4em] text-black/60">
              Particuliers
            </div>
            <h2 className="mt-4 text-3xl font-bold text-black">
              Crée ton profil Beyond
            </h2>
            <p className="mt-2 text-sm text-black/60">
              15 minutes. Gratuit. Pour toujours.
            </p>

            <div className="mt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  type="text"
                  name="first_name"
                  required
                  value={formState.first_name}
                  onChange={handleChange}
                  placeholder="Prénom"
                  className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm"
                />
                <input
                  type="text"
                  name="last_name"
                  required
                  value={formState.last_name}
                  onChange={handleChange}
                  placeholder="Nom"
                  className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm"
                />
              </div>
              <input
                type="email"
                name="email"
                required
                value={formState.email}
                onChange={handleChange}
                placeholder="Email pro ou perso"
                className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm"
              />
              <input
                type="password"
                name="password"
                required
                value={formState.password}
                onChange={handleChange}
                placeholder="Mot de passe"
                className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm"
              />
              <select
                name="objectif"
                required
                value={formState.objectif}
                onChange={handleChange}
                className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm"
              >
                <option value="">Tu cherches :</option>
                {objectiveOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={isLoading}
                className="w-full rounded-full bg-black px-6 py-3 text-sm font-black uppercase text-white transition hover:bg-black/90 disabled:cursor-not-allowed disabled:bg-black/40"
              >
                <span className="inline-flex items-center justify-center gap-2">
                  {isLoading && (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  )}
                  {isLoading
                    ? "Préparation de votre espace en cours..."
                    : "CRÉER MON PROFIL & LANCER LE TEST"}
                </span>
              </button>
              {isLoading ? (
                <p className="mt-3 text-xs text-black/60">
                  Préparation de votre espace en cours...
                </p>
              ) : null}
            </div>

            <div className="mt-4 text-xs text-black/50">
              🔒 Données protégées. Jamais revendues. Jamais de spam.
            </div>
            <div className="mt-2 text-xs text-black/50">
              Déjà un compte ?{" "}
              <Link href="/particuliers/login" className="font-semibold text-black">
                Connecte-toi →
              </Link>
            </div>
            <div className="mt-6 text-xs font-semibold text-black/70">
              ★★★★★ +1 200 profils créés · Certifié Beyond
            </div>

            {message && (
              <div className="mt-4 rounded-xl border border-black/10 bg-black/5 px-4 py-3 text-xs text-black">
                {message}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="bg-[#0B0B0B] px-6 py-16 text-white" id="social-proof">
        <div
          data-animate
          className="mx-auto w-full max-w-6xl opacity-0 translate-y-6 transition-all duration-700"
        >
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { stat: "15 min", desc: "Pour passer le test complet" },
              { stat: "100% gratuit", desc: "Pour toujours, sans CB" },
              { stat: "1 lien", desc: "à partager partout" },
            ].map((item) => (
              <div
                key={item.stat}
                className="rounded-3xl border border-white/10 bg-white/5 p-6"
              >
                <div className="text-4xl font-black text-white">{item.stat}</div>
                <div className="mt-2 text-sm text-white/60">{item.desc}</div>
              </div>
            ))}
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              {
                quote: "Le recruteur m'a appelée le lendemain.",
                name: "Jade L., 22 ans · Alternance marketing ★★★★★",
                initials: "JL",
                badge: "bg-[#F97316]",
              },
              {
                quote: "J'ai enfin compris pourquoi je déteste les open spaces.",
                name: "Thomas R., 28 ans · Reconversion dev ★★★★★",
                initials: "TR",
                badge: "bg-[#1E293B]",
              },
              {
                quote: "Mon CFA connaissait mon profil avant même que j'arrive.",
                name: "Camille D., 20 ans · BTS Commerce ★★★★★",
                initials: "CD",
                badge: "bg-[#14532D]",
              },
            ].map((item) => (
              <div
                key={item.name}
                className="rounded-3xl border border-white/10 bg-white/5 p-6"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={
                      "flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold text-white " +
                      (item.badge ?? "")
                    }
                  >
                    {item.initials}
                  </div>
                  <div className="text-sm font-semibold text-white">
                    Profil vérifié Beyond ✓
                  </div>
                </div>
                <p className="mt-4 text-sm text-white/70">"{item.quote}"</p>
                <p className="mt-4 text-xs text-white/50">— {item.name}</p>
                <p className="mt-2 text-xs text-white/50">Profil vérifié Beyond ✓</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-20">
        <div
          data-animate
          className="mx-auto w-full max-w-5xl text-center opacity-0 translate-y-6 transition-all duration-700"
        >
          <h2 className="text-4xl font-black">
            Les recruteurs reçoivent 150 candidatures.
          </h2>
          <p className="mt-4 text-base text-black/70">
            Ils passent 6 secondes sur un CV. Beyond te donne ce qu'un CV ne peut
            pas : la preuve de qui tu es vraiment.
          </p>
          <a
            href="#signup"
            className="mt-8 inline-flex items-center justify-center rounded-full bg-[#F97316] px-8 py-3 text-sm font-black uppercase text-black shadow-[0_0_30px_rgba(249,115,22,0.45)]"
          >
            Je veux me démarquer →
          </a>
        </div>
      </section>

      <section className="bg-white px-6 py-20">
        <div
          data-animate
          className="mx-auto w-full max-w-6xl opacity-0 translate-y-6 transition-all duration-700"
        >
          <h2 className="text-3xl font-bold text-black">
            Ce que tu reçois. Gratuitement.
          </h2>
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {[
              {
                icon: <Compass className="h-6 w-6" />,
                title: "Ton test comportemental complet",
                desc: "Dominant · Influent · Stable · Consciencieux.",
              },
              {
                icon: <LinkIcon className="h-6 w-6" />,
                title: "Un lien public certifié",
                desc: "Une page à ton nom. Certifiée Beyond.",
              },
              {
                icon: <ShieldCheck className="h-6 w-6" />,
                title: "Ton badge certifié",
                desc: "Pas un test trouvé sur Google. Un vrai badge.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-3xl border border-black/10 bg-white p-8"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F97316]/10 text-[#F97316]">
                  {item.icon}
                </div>
                <h3 className="mt-6 text-xl font-semibold text-black">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm text-black/70">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-20">
        <div
          data-animate
          className="mx-auto w-full max-w-6xl opacity-0 translate-y-6 transition-all duration-700"
        >
          <h2 className="text-3xl font-bold text-black">
            3 étapes. 15 minutes. Un profil pour ta carrière.
          </h2>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {[
              {
                step: "1",
                title: "Tu passes le test comportemental",
                desc: "Gratuit. Depuis ton téléphone. 15 minutes.",
              },
              {
                step: "2",
                title: "Tu reçois ton profil public",
                desc: "getbeyond.fr/p/ton-prenom-nom · Certifié Beyond.",
              },
              {
                step: "3",
                title: "Tu partages ton lien",
                desc: "CV, LinkedIn, candidature. Une preuve unique.",
              },
            ].map((item) => (
              <div key={item.step} className="rounded-3xl border border-black/10 bg-white p-6">
                <div className="text-4xl font-black text-[#F97316]">
                  {item.step}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-black">{item.title}</h3>
                <p className="mt-2 text-sm text-black/60">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-black px-6 py-20 text-white">
        <div
          data-animate
          className="mx-auto w-full max-w-5xl text-center opacity-0 translate-y-6 transition-all duration-700"
        >
          <h2 className="text-4xl font-black">Tu veux aller encore plus loin ?</h2>
          <p className="mt-3 text-sm text-white/70">
            Optionnel. Seulement quand tu es prêt.
          </p>
        </div>

        <div className="mx-auto mt-12 grid w-full max-w-5xl gap-8 md:grid-cols-2">
          <div className="rounded-3xl border border-white/15 bg-transparent p-8">
            <h3 className="text-xl font-semibold text-white">Gratuit — 0€</h3>
            <ul className="mt-6 space-y-2 text-sm text-white/70">
              <li>✓ Test comportemental complet</li>
              <li>✓ Profil public</li>
              <li>✓ Badge certifié</li>
              <li>✗ Soft skills (12 compétences)</li>
              <li>✗ IDMC</li>
              <li>✗ Pré-diagnostic DYS</li>
              <li>✗ Recommandations métiers</li>
              <li>✗ Export PDF certifié</li>
            </ul>
            <a
              href="#signup"
              className="mt-6 inline-flex rounded-full border border-white/40 px-5 py-2 text-xs font-semibold text-white"
            >
              Continuer en gratuit
            </a>
          </div>
          <div className="rounded-3xl border border-[#F97316] bg-white/5 p-8">
            <div className="inline-flex items-center rounded-full bg-[#F97316] px-3 py-1 text-[11px] font-black uppercase text-black">
              ⚡ Offre de lancement
            </div>
            <h3 className="mt-4 text-xl font-semibold text-white">
              Beyond Pro — <span className="line-through text-white/60">49€</span> 19€
            </h3>
            <p className="mt-2 text-sm text-white/70">
              Paiement unique. Accès à vie.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-white/70">
              <li>✓ Tout du gratuit</li>
              <li>✓ Soft skills détaillées (12 compétences)</li>
              <li>✓ IDMC</li>
              <li>✓ Pré-diagnostic DYS</li>
              <li>✓ Recommandations métiers personnalisées</li>
              <li>✓ Export PDF certifié pour candidatures</li>
            </ul>
            <a
              href="#signup-pro"
              className="mt-6 inline-flex rounded-full bg-[#F97316] px-6 py-2 text-xs font-black uppercase text-black"
            >
              Débloquer Beyond Pro — 19€
            </a>
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-20">
        <div
          data-animate
          className="mx-auto w-full max-w-6xl opacity-0 translate-y-6 transition-all duration-700"
        >
          <h2 className="text-3xl font-bold text-black">
            Ils ont créé leur profil. Voilà ce que ça a changé.
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              {
                quote:
                  "J'ai collé mon lien Beyond dans mon email de candidature. Le recruteur m'a appelée le lendemain.",
                name: "Jade L., 22 ans · Alternance marketing ★★★★★",
                initials: "JL",
                badge: "bg-[#F97316]",
              },
              {
                quote:
                  "Je savais pas pourquoi je me sentais mal dans les open spaces. Mon test comportemental l'a expliqué en 3 lignes.",
                name: "Thomas R., 28 ans · Reconversion dev ★★★★★",
                initials: "TR",
                badge: "bg-[#1E293B]",
              },
              {
                quote:
                  "Mon CFA utilisait Beyond. J'avais déjà mon profil quand je suis arrivé en formation.",
                name: "Camille D., 20 ans · BTS Commerce ★★★★★",
                initials: "CD",
                badge: "bg-[#14532D]",
              },
            ].map((item) => (
              <div
                key={item.name}
                className="rounded-3xl border border-black/10 bg-white p-6"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={
                      "flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold text-white " +
                      (item.badge ?? "")
                    }
                  >
                    {item.initials}
                  </div>
                  <div className="text-sm font-semibold text-black">
                    Profil vérifié Beyond ✓
                  </div>
                </div>
                <p className="mt-4 text-sm text-black/70">"{item.quote}"</p>
                <p className="mt-4 text-xs text-black/50">— {item.name}</p>
                <p className="mt-2 text-xs text-black/50">Profil vérifié Beyond ✓</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#F97316] px-6 py-20 text-black" id="signup">
        <div className="mx-auto w-full max-w-5xl">
          <div className="text-center">
            <h2 className="text-4xl font-black text-white">
              Ton profil t'attend.
            </h2>
            <p className="mt-3 text-sm text-white/80">
              15 minutes. Gratuit. Pour toujours.
            </p>
          </div>

          <div
            id="signup-pro"
            className="mt-10 rounded-3xl bg-white p-8 shadow-[0_25px_80px_rgba(0,0,0,0.25)]"
          >
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <input
                  type="text"
                  name="first_name"
                  required
                  value={formState.first_name}
                  onChange={handleChange}
                  placeholder="Prénom *"
                  className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm"
                />
                <input
                  type="text"
                  name="last_name"
                  required
                  value={formState.last_name}
                  onChange={handleChange}
                  placeholder="Nom *"
                  className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm"
                />
              </div>
              <input
                type="email"
                name="email"
                required
                value={formState.email}
                onChange={handleChange}
                placeholder="Email *"
                className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm"
              />
              <input
                type="password"
                name="password"
                required
                value={formState.password}
                onChange={handleChange}
                placeholder="Mot de passe *"
                className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm"
              />
              <select
                name="objectif"
                required
                value={formState.objectif}
                onChange={handleChange}
                className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm"
              >
                <option value="">Tu cherches :</option>
                {objectiveOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={isSubmitting || isRedirecting}
                className="w-full rounded-full bg-black px-6 py-3 text-sm font-black uppercase text-white transition hover:bg-black/90 disabled:cursor-not-allowed disabled:bg-black/40"
              >
                {isSubmitting || isRedirecting
                  ? "Création..."
                  : "CRÉER MON PROFIL & LANCER LE TEST"}
              </button>
              {message && (
                <div className="rounded-xl border border-black/10 bg-black/5 px-4 py-3 text-xs text-black">
                  {message}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-16">
        <div
          data-animate
          className="mx-auto w-full max-w-4xl opacity-0 translate-y-6 transition-all duration-700"
        >
          <h2 className="text-3xl font-bold text-black">FAQ</h2>
          <div className="mt-6 space-y-3">
            {[
              {
                question: "C'est quoi le test comportemental ?",
                answer:
                  "Le test comportemental mesure 4 dimensions : Dominance, Influence, Stabilité, Conformité. Validé scientifiquement. 15 minutes.",
              },
              {
                question: "Mon employeur peut voir mon profil ?",
                answer:
                  "Uniquement si tu partages ton lien. Tu contrôles qui voit quoi.",
              },
              {
                question: "C'est vraiment gratuit ?",
                answer:
                  "Oui. La version gratuite est illimitée. Beyond Pro est optionnel.",
              },
              {
                question: "Quelle différence avec un test gratuit sur Google ?",
                answer:
                  "Beyond certifie ton profil et le rend partageable avec un lien reconnu par les CFA et entreprises partenaires.",
              },
            ].map((item) => (
              <details
                key={item.question}
                className="rounded-2xl border border-black/10 bg-white p-4"
              >
                <summary className="cursor-pointer text-sm font-semibold text-black">
                  {item.question}
                </summary>
                <p className="mt-2 text-sm text-black/70">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-black px-6 py-20 text-white">
        <div
          data-animate
          className="mx-auto w-full max-w-4xl text-center opacity-0 translate-y-6 transition-all duration-700"
        >
          <h2 className="text-4xl font-black">Arrête de ressembler aux autres.</h2>
          <p className="mt-4 text-sm text-white/70">
            Crée ton profil Beyond. Gratuit. Maintenant.
          </p>
          <a
            href="#signup"
            className="mt-8 inline-flex items-center justify-center rounded-full bg-[#F97316] px-10 py-4 text-sm font-black uppercase text-black"
          >
            CRÉER MON PROFIL GRATUIT →
          </a>
        </div>
      </section>

      <footer className="bg-black px-6 py-8 text-center text-xs text-white/60">
        © Beyond 2026
      </footer>

      <div className="fixed bottom-4 left-0 right-0 z-40 flex justify-center px-4 md:hidden">
        <a
          href="#signup"
          className="flex w-full max-w-sm items-center justify-center rounded-full bg-[#F97316] px-6 py-3 text-sm font-black uppercase text-black shadow-lg"
        >
          CRÉER MON PROFIL GRATUIT →
        </a>
      </div>

      {isPreparing ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6">
          <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-white/10 p-6 text-center text-white backdrop-blur-xl">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            <p className="text-sm font-semibold">
              Préparation de votre espace personnalisé en cours...
            </p>
            <p className="mt-2 text-xs text-white/70">
              Cela peut prendre quelques secondes.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
