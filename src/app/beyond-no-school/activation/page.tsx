"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { BadgeCheck, Lock, Sparkles } from "lucide-react";
import { useSupabase } from "@/components/providers/supabase-provider";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  competencies,
  type CompetenceData,
} from "@/components/beyond-no-school/competences-data";
import { getDraft } from "@/lib/bns-trajectory-draft";

type DraftSummary = {
  items: { slug: string; name: string; proof: string }[];
};

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

export default function BeyondNoSchoolActivationPage() {
  const router = useRouter();
  const supabase = useSupabase();
  const [draftSummary, setDraftSummary] = useState<DraftSummary>({ items: [] });
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const draft = getDraft();
    if (!draft.items.length) {
      setDraftSummary({ items: [] });
      return;
    }
    const items = draft.items
      .map((slug) => competencies.find((competence) => competence.slug === slug))
      .filter((competence): competence is CompetenceData => Boolean(competence))
      .map((competence) => ({
        slug: competence.slug,
        name: competence.name,
        proof: competence.proof.type,
      }));
    setDraftSummary({ items });
  }, []);

  const hasDraft = draftSummary.items.length > 0;
  const signupNext = "/beyond-no-school/reprendre";
  const backToCheckout = "/beyond-no-school/checkout";

  const reasons = useMemo(
    () => [
      {
        icon: Sparkles,
        title: "Activer tes preuves",
        copy: "Accès aux critères, livrables et validations.",
      },
      {
        icon: Lock,
        title: "Conserver ton travail",
        copy: "Tes preuves t’appartiennent. Même si tu pars.",
      },
      {
        icon: BadgeCheck,
        title: "Rendre visible ton impact",
        copy: "Open Badges publics, traçables, partageables.",
      },
    ],
    [],
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    setError(null);
    setSuccessMessage(null);
    setNeedsEmailConfirmation(false);
    setResendStatus(null);
    setIsSubmitting(true);

    if (!supabase) {
      setError("Supabase n'est pas configuré. Vérifiez les variables d'environnement.");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          fullName: `${firstName} ${lastName}`.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Erreur lors de la création du compte.");
        setIsSubmitting(false);
        return;
      }

      if (result.needsEmailConfirmation) {
        console.info("[BNS] signup needs email confirmation for", email);
        setSuccessMessage("Email de confirmation envoyé.");
        setNeedsEmailConfirmation(true);
        setIsSubmitting(false);
        return;
      }

      if (result.session && result.user) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: result.session.access_token,
          refresh_token: result.session.refresh_token,
        });

        if (sessionError) {
          setError(sessionError.message);
          setIsSubmitting(false);
          return;
        }

        const { data } = await supabase.auth.getSession();
        if (data.session) {
          router.replace(signupNext);
          router.refresh();
          return;
        }

        setError("La session n’a pas pu être confirmée. Réessaie.");
        setIsSubmitting(false);
        return;
      }

      setError("Aucune session créée. Réessaie dans un instant.");
      setIsSubmitting(false);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Une erreur inattendue s'est produite.";
      setError(errorMessage);
      setIsSubmitting(false);
    }
  };

  const handleResendEmail = async () => {
    if (!supabase || !email) {
      setResendStatus("Email invalide.");
      return;
    }
    setResendStatus(null);
    console.info("[BNS] resend confirmation email for", email);
    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email,
    });
    if (resendError) {
      setResendStatus(resendError.message);
      return;
    }
    setResendStatus("Email renvoyé ✅");
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0b0b10] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(255,88,61,0.18),transparent_50%),radial-gradient(circle_at_85%_20%,rgba(255,140,90,0.12),transparent_50%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(180deg,rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:2px_2px]" />

      <section className="relative px-6 pb-16 pt-24 sm:px-12 lg:px-24">
        <div className="mx-auto grid min-h-[70vh] max-w-6xl gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <motion.div initial="hidden" animate="show" variants={fadeUp} className="space-y-6">
            <p className="text-xs uppercase tracking-[0.4em] text-white/50">
              Beyond No School
            </p>
            <h1 className="text-pretty text-4xl font-semibold sm:text-5xl lg:text-6xl">
              Tu es à une étape de rendre ta preuve réelle.
            </h1>
            <p className="text-lg text-white/70">
              Crée ton compte pour activer ton accès aux formations.
              Tu seras ensuite redirigé vers Reprendre.
            </p>
            <p className="text-xs uppercase tracking-[0.35em] text-white/50">
              Open Badges vérifiables • Preuves réelles • Annulable à tout moment
            </p>
            <p className="text-sm text-white/70">
              Tu paies pour accéder aux formations.
            </p>
            <p className="text-sm text-white/60">30 € / mois — paiement immédiat.</p>
            <p className="text-sm text-white/70">
              Les Open Badges sont délivrés après validation de tes preuves.
            </p>
          </motion.div>

          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.45)]"
            >
              <p className="text-xs uppercase tracking-[0.35em] text-white/50">
                Création de compte
              </p>
              <h2 className="text-xl font-semibold text-white">Créer mon compte</h2>
              <form onSubmit={handleSubmit} className="mt-6 grid gap-5">
                <div className="grid gap-2">
                  <Label htmlFor="firstName" className="text-white/70">
                    Prénom
                  </Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                    placeholder="Prénom"
                    className="border-white/20 bg-white/5 text-white"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="lastName" className="text-white/70">
                    Nom
                  </Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                    placeholder="Nom"
                    className="border-white/20 bg-white/5 text-white"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email" className="text-white/70">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="ton@email.com"
                    className="border-white/20 bg-white/5 text-white"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password" className="text-white/70">
                    Mot de passe
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="border-white/20 bg-white/5 text-white"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirmPassword" className="text-white/70">
                    Confirmation mot de passe
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="border-white/20 bg-white/5 text-white"
                    required
                  />
                </div>
                {error ? <p className="text-sm text-red-300">{error}</p> : null}
                {successMessage ? (
                  <p className="text-sm text-emerald-200">{successMessage}</p>
                ) : null}
                {needsEmailConfirmation ? (
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/70">
                    <p className="text-xs uppercase tracking-[0.3em] text-white/60">
                      Confirmation requise
                    </p>
                    <p className="mt-2 text-sm text-white/70">
                      Compte créé. Confirme ton email pour continuer.
                    </p>
                    <p className="mt-2 text-sm text-white/70">
                      Vérifie spam/promotions. Délai possible : 2 minutes.
                    </p>
                    <p className="mt-2 text-sm text-white/70">
                      Si tu n’as rien : renvoie l’email.
                    </p>
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <Button
                        type="button"
                        onClick={handleResendEmail}
                        className="rounded-full border border-white/20 bg-white/10 px-4 text-xs uppercase tracking-[0.28em] text-white hover:bg-white/20"
                      >
                        Renvoyer l’email
                      </Button>
                    </div>
                    {resendStatus ? (
                      <p className="mt-3 text-sm text-white/70">{resendStatus}</p>
                    ) : null}
                    <div className="mt-4">
                      <Link
                        href={backToCheckout}
                        className="text-xs uppercase tracking-[0.28em] text-white/70 hover:text-white"
                      >
                        Retour au paiement
                      </Link>
                    </div>
                  </div>
                ) : null}
                <Button
                  type="submit"
                  className="rounded-full bg-white px-6 text-xs uppercase tracking-[0.3em] text-black hover:bg-white/90"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Activation en cours..." : "Créer mon compte et continuer"}
                </Button>
                {successMessage ? (
                  <Link
                    href="/beyond-no-school/login"
                    className="text-xs uppercase tracking-[0.3em] text-white/70 hover:text-white"
                  >
                    J’ai déjà confirmé → me connecter
                  </Link>
                ) : null}
                <p className="text-sm text-white/60">
                  Paiement immédiat pour accéder aux formations.
                </p>
                <div className="space-y-1">
                  <Link
                    href="/beyond-no-school/login"
                    className="text-xs uppercase tracking-[0.3em] text-white/60 hover:text-white"
                  >
                    J’ai déjà un compte
                  </Link>
                  <Link
                    href="/beyond-no-school/login"
                    className="text-xs uppercase tracking-[0.3em] text-white/40 hover:text-white"
                  >
                    Je préfère me connecter
                  </Link>
                </div>
              </form>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.45)]"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.35em] text-white/50">
                  Tes preuves sélectionnées
                </p>
                <span className="rounded-full border border-white/15 px-3 py-1 text-xs uppercase tracking-[0.3em] text-white/70">
                  {draftSummary.items.length} preuve
                  {draftSummary.items.length > 1 ? "s" : ""}
                </span>
              </div>
              <div className="mt-4 rounded-2xl border border-white/10 bg-black/40 p-4">
                <p className="text-[10px] uppercase tracking-[0.35em] text-white/50">
                  Open Badge
                </p>
                <p className="mt-2 text-sm text-white/80">
                  Preuves — {draftSummary.items.length} sélection
                  {draftSummary.items.length > 1 ? "s" : ""}
                </p>
              </div>
              <p className="mt-4 text-sm text-white/70">
                Voilà ce que tu pourrais montrer publiquement.
              </p>
              <div className="mt-4 space-y-4">
                {hasDraft ? (
                  draftSummary.items.map((item) => (
                    <div
                      key={item.slug}
                      className="rounded-2xl border border-white/10 bg-black/40 p-4"
                    >
                      <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                        Badge
                      </p>
                      <h3 className="mt-2 text-lg font-semibold text-white">{item.name}</h3>
                      <p className="mt-2 text-sm text-white/70">{item.proof}</p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/15 bg-black/30 p-6 text-sm text-white/60">
                    Tu n’as rien sélectionné pour l’instant.
                    <div className="mt-4 space-y-2">
                    <Link
                      href="/beyond-no-school/preuves"
                      className="text-xs uppercase tracking-[0.3em] text-white/80 hover:text-white"
                    >
                      Composer mes preuves
                    </Link>
                      <p className="text-xs text-white/50">
                        2 minutes. Tu peux modifier ensuite.
                      </p>
                    </div>
                  </div>
                )}
              </div>
              {hasDraft ? (
                <div className="mt-4">
                  <Link
                    href="/beyond-no-school/preuves"
                    className="inline-flex rounded-full border border-white/15 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/70 hover:border-white/40 hover:text-white"
                  >
                    Modifier mes preuves
                  </Link>
                </div>
              ) : null}
              <p className="mt-4 text-sm text-white/60">
                La prochaine étape consistera à choisir comment tu veux t’engager pour lancer
                ta première preuve.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="px-6 pb-16 sm:px-12 lg:px-24">
        <div className="mx-auto max-w-6xl space-y-6">
          <h2 className="text-2xl font-semibold text-white">
            Pourquoi créer un compte maintenant ?
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {reasons.map((reason) => (
              <motion.div
                key={reason.title}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                variants={fadeUp}
                className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.4)] transition duration-300 hover:-translate-y-1 hover:border-white/25 hover:shadow-[0_30px_80px_rgba(255,88,61,0.18)]"
              >
                <reason.icon className="h-6 w-6 text-white/80" />
                <h3 className="mt-4 text-lg font-semibold text-white">{reason.title}</h3>
                <p className="mt-2 text-sm text-white/70">{reason.copy}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 pb-16 sm:px-12 lg:px-24">
        <p className="mx-auto max-w-4xl text-center text-xs uppercase tracking-[0.3em] text-white/40">
          Tu n’achètes pas des vidéos. Tu choisis de laisser une preuve.
        </p>
      </section>
    </main>
  );
}



