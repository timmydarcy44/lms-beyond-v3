"use client";
import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";

export const dynamic = "force-dynamic";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_NEVO_STRIPE_PUBLISHABLE_KEY || "");

const plan = {
  title: "Offre unique",
  priceMonthly: "14,90€ / mois",
  priceYearly: "160,92€ / an",
  features: [
    "Neo IA",
    "Transformations illimitées",
    "Quiz & Flashcards",
    "Mode Focus & Pomodoro",
    "Export PDF & partage",
  ],
};

const faqs = [
  { q: "Puis-je arrêter quand je veux ?", a: "Oui, l'abonnement est sans engagement." },
  { q: "Neo est-il inclus ?", a: "Oui, Neo est inclus dans tous les plans." },
  { q: "Existe-t-il une période d'essai ?", a: "Oui, un essai gratuit est disponible." },
  { q: "Puis-je changer de plan ?", a: "Oui, à tout moment depuis votre compte." },
  { q: "Le paiement est-il sécurisé ?", a: "Oui, via Stripe." },
  { q: "Puis-je utiliser Nevo sur mobile ?", a: "Oui, Nevo est optimisé pour mobile." },
];

function TarifsContent() {
  const [isLoading, setIsLoading] = useState<"monthly" | "annual" | null>(null);
  const searchParams = useSearchParams();
  const emailFromUrl = searchParams.get("email") || "";

  const priceIds = useMemo(
    () => ({
      monthly: process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID || "",
      annual: process.env.NEXT_PUBLIC_STRIPE_ANNUAL_PRICE_ID || "",
    }),
    [],
  );

  const handleCheckout = async (cycle: "monthly" | "annual") => {
    const priceId = priceIds[cycle];
    if (!priceId) {
      alert("Prix indisponible pour le moment.");
      return;
    }
    if (!process.env.NEXT_PUBLIC_NEVO_STRIPE_PUBLISHABLE_KEY) {
      alert("Stripe n'est pas configuré.");
      return;
    }
    setIsLoading(cycle);
    try {
      const response = await fetch("/api/nevo/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId, email: emailFromUrl || undefined }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Erreur lors de la création de la session");
      }
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error("Stripe n'est pas initialisé");
      }
      const { error } = await stripe.redirectToCheckout({ sessionId: data.sessionId });
      if (error) {
        throw new Error(error.message);
      }
    } catch (error: any) {
      alert(error?.message || "Erreur de paiement");
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#0F1117]">
      <section
        className="px-6 pt-24 pb-16 text-center text-white"
        style={{ background: "linear-gradient(135deg, #be1354, #F97316)" }}
      >
        <p className="text-sm font-semibold uppercase tracking-widest text-white/80 mb-3">
          Tarifs
        </p>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Une offre simple, un seul prix</h1>
        <p className="text-white/80 max-w-2xl mx-auto">
          Accédez à tous les outils Nevo, sans options compliquées ni frais cachés.
        </p>
      </section>

      <section className="px-6 -mt-12 pb-16">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-3xl border border-[#E8E9F0] p-8 bg-white shadow-lg">
            <div className="flex flex-col gap-6">
              <div>
                <p className="text-sm font-semibold uppercase tracking-widest text-[#be1354] mb-2">
                  {plan.title}
                </p>
                <p className="text-[#6B7280] text-sm">
                  Choisissez votre rythme de paiement.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-[#E8E9F0] p-5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-[#6B7280]">
                    Mensuel
                  </p>
                  <h2 className="text-3xl font-bold mt-2">{plan.priceMonthly}</h2>
                  <button
                    type="button"
                    onClick={() => handleCheckout("monthly")}
                    disabled={isLoading === "monthly" || !priceIds.monthly}
                    className="mt-4 inline-flex items-center justify-center w-full rounded-full px-5 py-2.5 text-white font-semibold disabled:opacity-60"
                    style={{ background: "linear-gradient(135deg, #be1354, #F97316)" }}
                  >
                    {isLoading === "monthly" ? "Redirection..." : "Démarrer mes 7 jours d'essai gratuit"}
                  </button>
                </div>

                <div className="rounded-2xl border border-[#E8E9F0] p-5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-[#6B7280]">
                    Annuel
                  </p>
                  <h2 className="text-3xl font-bold mt-2">{plan.priceYearly}</h2>
                  <button
                    type="button"
                    onClick={() => handleCheckout("annual")}
                    disabled={isLoading === "annual" || !priceIds.annual}
                    className="mt-4 inline-flex items-center justify-center w-full rounded-full px-5 py-2.5 text-white font-semibold disabled:opacity-60"
                    style={{ background: "linear-gradient(135deg, #be1354, #F97316)" }}
                  >
                    {isLoading === "annual" ? "Redirection..." : "Démarrer mes 7 jours d'essai gratuit"}
                  </button>
                </div>
              </div>
            </div>
            <ul className="mt-6 grid sm:grid-cols-2 gap-3 text-sm text-[#6B7280]">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <span className="text-[#be1354]">•</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="px-6 py-16 bg-[#F8F9FC]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">FAQ</h2>
          <div className="space-y-4">
            {faqs.map((item) => (
              <div key={item.q} className="rounded-2xl bg-white border border-[#E8E9F0] p-5">
                <p className="font-semibold mb-2">{item.q}</p>
                <p className="text-sm text-[#6B7280]">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 pb-20 text-center">
        <a
          href="/app-landing/signup"
          className="inline-flex items-center justify-center px-8 py-3 rounded-full text-white font-semibold"
          style={{ background: "linear-gradient(135deg, #be1354, #F97316)" }}
        >
          Commencer maintenant
        </a>
      </section>
    </div>
  );
}

export default function TarifsPage() {
  return (
    <Suspense fallback={null}>
      <TarifsContent />
    </Suspense>
  );
}

