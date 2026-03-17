"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";


const features = [
  {
    title: "Scanne. Transforme. Révise.",
    description: "Capture un cours et transforme-le instantanément en formats adaptés.",
    visual: "Transformations IA",
  },
  {
    title: "Neo, ton second cerveau",
    description: "Pose tes questions et obtiens des réponses immédiates, claires et actionnables.",
    visual: "Assistant Neo",
  },
  {
    title: "Adapté à ton profil",
    description: "Neuro, focus, pomodoro et réglages personnalisés pour rester concentré.",
    visual: "Modes cognitifs",
  },
  {
    title: "Suis tes progrès",
    description: "Visualise ton évolution et garde le cap sur tes objectifs.",
    visual: "Dashboard stats",
  },
];

const pricing = [
  {
    title: "Nevo.",
    price: "14,90€/mois",
    features: ["Transformations illimitées", "Neo IA inclus", "Flashcards & Quiz", "Dossiers & organisation"],
    highlighted: false,
  },
  {
    title: "Nevo. + Care",
    price: "19,90€/mois",
    features: ["Tout Nevo.", "Check-in bien-être hebdo", "Suivi parental", "Tableau de bord émotionnel"],
    highlighted: true,
  },
];

export default function LandingPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    router.push(`/app-landing/particuliers?email=${encodeURIComponent(email)}`);
  };

  return (
    <div className="min-h-screen bg-white text-[#0F1117]">
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, #be1354 0%, #d4434a 30%, #e8673a 60%, #F97316 100%)",
          }}
        />
        <div
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-30 blur-3xl animate-pulse"
          style={{ background: "radial-gradient(circle, #ffffff, transparent)" }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-20 blur-3xl animate-pulse"
          style={{
            background: "radial-gradient(circle, #F97316, transparent)",
            animationDelay: "1s",
          }}
        />

        <div className="relative z-10 text-center text-white max-w-4xl mx-auto px-6 pt-24">
          <p className="text-sm font-semibold tracking-[0.3em] uppercase text-white/70 mb-4">
            Nevo. — L'intelligence au service de l'apprentissage
          </p>
          <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6 text-white">
            Apprends plus vite.
            <br />
            Retiens pour toujours.
          </h1>
          <p className="text-lg md:text-xl text-white/80 mb-10 max-w-2xl mx-auto">
            Transforme n'importe quel cours en fiches, quiz, schémas et audio en quelques secondes.
            Avec Neo, ton assistant IA personnel.
          </p>
          <form onSubmit={handleEmailSubmit} className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto mt-10">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Votre adresse email"
              required
              className="flex-1 px-6 py-4 rounded-full text-[#0F1117] text-base outline-none focus:ring-2 focus:ring-white/50 bg-white shadow-xl placeholder-[#9CA3AF]"
            />
            <button
              type="submit"
              className="px-8 py-4 rounded-full bg-white text-[#be1354] font-bold text-base shadow-xl hover:scale-105 transition-transform whitespace-nowrap"
            >
              Commencer →
            </button>
          </form>
          {error ? <p className="text-white/80 text-sm mt-3">{error}</p> : null}
          <p className="text-white/50 text-sm mt-4">
            Essai gratuit · Sans engagement · Résiliable à tout moment
          </p>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/50">
          <span className="text-xs tracking-widest uppercase">Découvrir</span>
          <div className="w-px h-8 bg-white/30 animate-pulse" />
        </div>
      </section>

      <section id="features" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6 space-y-16">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className={`grid md:grid-cols-2 gap-10 items-center ${
                index % 2 === 1 ? "md:flex-row-reverse" : ""
              }`}
            >
              <div>
                <p className="text-sm font-semibold uppercase tracking-widest text-[#be1354] mb-3">
                  {feature.title}
                </p>
                <h3 className="text-3xl font-bold mb-4">{feature.title}</h3>
                <p className="text-[#6B7280] text-lg">{feature.description}</p>
              </div>
              <div className="rounded-3xl border border-[#E8E9F0] bg-[#F8F9FC] p-10 shadow-sm">
                <div className="h-56 rounded-2xl bg-white border border-[#E8E9F0] flex items-center justify-center text-[#be1354] font-semibold">
                  {feature.visual}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="pricing" className="py-24 bg-[#F8F9FC]">
        <div className="max-w-6xl mx-auto px-6 text-center mb-12">
          <p className="text-sm font-semibold uppercase tracking-widest text-[#be1354] mb-3">Tarifs</p>
          <h2 className="text-4xl font-bold mb-4">Choisis ton plan Nevo.</h2>
          <p className="text-[#6B7280]">Simple, transparent et sans engagement.</p>
        </div>
        <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-2 gap-6">
          {pricing.map((plan) => (
            <div
              key={plan.title}
              className={`rounded-3xl border p-8 text-left shadow-sm ${
                plan.highlighted
                  ? "border-[#be1354] bg-white shadow-xl"
                  : "border-[#E8E9F0] bg-white"
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-semibold">{plan.title}</h3>
                {plan.highlighted && (
                  <span className="text-xs font-semibold uppercase tracking-widest text-[#be1354]">
                    Recommandé
                  </span>
                )}
              </div>
              <p className="text-3xl font-bold mb-6">{plan.price}</p>
              <ul className="space-y-3 text-[#6B7280]">
                {plan.features.map((feature) => (
                  <li key={feature}>• {feature}</li>
                ))}
              </ul>
              <a
                href="/app-landing/signup"
                className={`mt-8 inline-flex items-center justify-center w-full px-6 py-3 rounded-full font-semibold ${
                  plan.highlighted
                    ? "text-white"
                    : "border border-[#E8E9F0] text-[#0F1117] hover:bg-[#F8F9FC]"
                }`}
                style={plan.highlighted ? { background: "linear-gradient(135deg, #be1354, #F97316)" } : {}}
              >
                Choisir ce plan
              </a>
            </div>
          ))}
        </div>
      </section>

      <section id="entreprise" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6 text-center mb-12">
          <p className="text-sm font-semibold uppercase tracking-widest text-[#be1354] mb-3">
            CFA & Entreprise
          </p>
          <h2 className="text-4xl font-bold mb-4">Vous êtes un CFA ou une entreprise ?</h2>
          <p className="text-[#6B7280]">Des offres dédiées pour vos équipes et vos apprenants.</p>
        </div>
        <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-2 gap-6">
          {["CFA", "Entreprise"].map((label) => (
            <div key={label} className="rounded-3xl border border-[#E8E9F0] p-8 bg-[#F8F9FC]">
              <h3 className="text-2xl font-semibold mb-3">{label}</h3>
              <p className="text-[#6B7280] mb-6">
                Contactez-nous pour une solution sur mesure et un accompagnement personnalisé.
              </p>
              <a
                href="mailto:contact@nevo.app"
                className="inline-flex items-center justify-center px-6 py-3 rounded-full font-semibold text-white"
                style={{ background: "linear-gradient(135deg, #be1354, #F97316)" }}
              >
                Nous contacter
              </a>
            </div>
          ))}
        </div>
      </section>

      <footer className="bg-[#0F1117] text-white py-16">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-3 gap-8">
          <div>
            <img
              src="https://fqqqejpakbccwvrlolpc.supabase.co/storage/v1/object/public/nevo./Nevo_logo.png"
              alt="Nevo"
              className="h-8 mb-4"
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
