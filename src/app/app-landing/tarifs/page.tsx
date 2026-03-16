"use client";

const plans = [
  {
    title: "Solo",
    price: "14,90€/mois",
    features: ["Neo IA", "Transformations illimitées", "Quiz & Flashcards"],
  },
  {
    title: "Solo + Care",
    price: "19,90€/mois",
    features: ["Tout Solo", "Check-in bien-être", "Suivi parental"],
  },
  {
    title: "Famille",
    price: "24,90€/mois",
    features: ["Jusqu'à 3 comptes", "Tableau de bord partagé", "Neo IA inclus"],
  },
  {
    title: "Famille + Care",
    price: "29,90€/mois",
    features: ["Tout Famille", "Care illimité", "Suivi émotionnel avancé"],
  },
];

const faqs = [
  { q: "Puis-je arrêter quand je veux ?", a: "Oui, l'abonnement est sans engagement." },
  { q: "Neo est-il inclus ?", a: "Oui, Neo est inclus dans tous les plans." },
  { q: "Existe-t-il une période d'essai ?", a: "Oui, un essai gratuit est disponible." },
  { q: "Puis-je changer de plan ?", a: "Oui, à tout moment depuis votre compte." },
  { q: "Le paiement est-il sécurisé ?", a: "Oui, via Stripe." },
  { q: "Puis-je utiliser Nevo sur mobile ?", a: "Oui, Nevo est optimisé pour mobile." },
];

export default function TarifsPage() {
  return (
    <div className="min-h-screen bg-white text-[#0F1117]">
      <section className="px-6 pt-28 pb-12 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-[#be1354] mb-3">
          Tarifs
        </p>
        <h1 className="text-4xl font-bold mb-4">Choisissez votre plan</h1>
        <p className="text-[#6B7280]">Des offres simples et transparentes.</p>
      </section>

      <section className="px-6 pb-16">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <div key={plan.title} className="rounded-3xl border border-[#E8E9F0] p-6 bg-white">
              <h3 className="text-xl font-semibold">{plan.title}</h3>
              <p className="text-2xl font-bold mt-4">{plan.price}</p>
              <ul className="mt-4 space-y-2 text-sm text-[#6B7280]">
                {plan.features.map((f) => (
                  <li key={f}>• {f}</li>
                ))}
              </ul>
              <a
                href="/app-landing/signup"
                className="mt-6 inline-flex items-center justify-center w-full rounded-full px-5 py-2.5 text-white font-semibold"
                style={{ background: "linear-gradient(135deg, #be1354, #F97316)" }}
              >
                Choisir
              </a>
            </div>
          ))}
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
          Commencer l'essai gratuit
        </a>
      </section>
    </div>
  );
}
