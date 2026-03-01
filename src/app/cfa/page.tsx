"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

const CALENDLY_URL = "CALENDLY_URL";

const heroImage =
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=2400&q=80";

const revealProps = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
  viewport: { once: true, amount: 0.35 },
};

export default function CfaLandingPage() {
  const openCalendly = useMemo(
    () => () => window.open(CALENDLY_URL, "_blank", "noopener,noreferrer"),
    []
  );

  return (
    <div className="bg-white text-black">
      <nav className="sticky top-0 z-[1000] w-full border-b border-gray-100 bg-white shadow-sm">
        <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between px-6 sm:px-10">
          <span className="text-2xl font-black tracking-tighter text-black">BEYOND</span>
          <button
            type="button"
            onClick={openCalendly}
            className="rounded-full bg-[#F97316] px-5 py-2 text-[12px] font-black uppercase text-black shadow-sm"
          >
            Planifier ma demo gratuite
          </button>
        </div>
      </nav>

      <section className="relative h-screen w-full">
        <img
          src={heroImage}
          alt="Route vers la performance"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/70" />
        <div className="relative z-10 flex h-screen items-center px-6 sm:px-10">
          <div className="mx-auto w-full max-w-4xl space-y-6 text-center text-white">
            <motion.h1
              {...revealProps}
              className="text-4xl font-black uppercase tracking-tight sm:text-6xl lg:text-7xl"
            >
              COMBIEN D&apos;APPRENANTS
              <br />
              AVEZ-VOUS PERDUS
              <br />
              SANS LE VOIR VENIR ?
            </motion.h1>
            <motion.p {...revealProps} className="text-lg text-white/85">
              Beyond detecte les signaux de decrochage 14 jours avant la rupture. Certifie
              Qualiopi. Operationnel en 48h.
            </motion.p>
            <motion.div {...revealProps} className="space-y-4">
              <button
                type="button"
                onClick={openCalendly}
                className="rounded-full bg-[#F97316] px-10 py-4 text-sm font-black uppercase text-black"
              >
                Voir comment ca marche — demo 20 min gratuite
              </button>
              <p className="text-xs text-white/80">
                Aucun engagement. Juste 20 minutes pour changer la facon dont vous suivez vos
                apprenants.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="bg-black py-20 text-white">
        <div className="mx-auto max-w-4xl px-6 sm:px-10 text-center">
          <motion.h2 {...revealProps} className="text-3xl font-black sm:text-4xl">
            Vous reconnaissez-vous ?
          </motion.h2>
          <div className="mt-10 space-y-8">
            {[
              "Lundi matin. Kevin n'est pas venu depuis 11 jours. Vous l'apprenez quand son employeur vous appelle. La rupture de contrat est deja signee.",
              "L'audit Qualiopi approche. Votre referent handicap a passe 3 jours a rassembler les preuves de suivi. A la main. Encore.",
              "Vous avez place Sarah chez une entreprise parce qu'elle \"avait l'air bien\". 6 mois plus tard, rupture de contrat. L'instinct a ses limites.",
            ].map((text) => (
              <div key={text} className="border-t border-white/10 pt-6 text-left text-sm text-white/80">
                {text}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={openCalendly}
            className="mt-10 rounded-full bg-[#F97316] px-8 py-3 text-sm font-black uppercase text-black"
          >
            Il existe une autre facon de travailler →
          </button>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-6 sm:px-10">
          <motion.h2
            {...revealProps}
            className="text-3xl font-black text-black sm:text-4xl"
          >
            Ce que vos formateurs voient avec Beyond
          </motion.h2>
          <div className="mt-10 overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr>
                  <th className="py-3 text-gray-500">Avant</th>
                  <th className="py-3 text-gray-500">Avec Beyond</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Decrochage detecte trop tard", "Alerte automatique J-14 avant la rupture"],
                  ["Dossier handicap = 3 jours de travail manuel", "Genere automatiquement. Export certifiable."],
                  ["Matching alternance a l'instinct", "Compatibilite comportementale mesuree par IA"],
                  ["Profil apprenant = impression subjective", "DISC + Soft Skills + IDMC en 20 minutes"],
                  ["Qualiopi : preuves difficiles a tracer", "Tracabilite automatique. Audit serein."],
                ].map((row) => (
                  <tr key={row[0]} className="border-t border-gray-100">
                    <td className="py-4 text-gray-600">{row[0]}</td>
                    <td className="py-4 text-gray-900">{row[1]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-6xl px-6 sm:px-10">
          <motion.h2
            {...revealProps}
            className="text-3xl font-black text-black sm:text-4xl"
          >
            Operationnel en 48h. Vraiment.
          </motion.h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              {
                step: "1",
                title: "On configure votre espace en 24h",
                desc: "Votre CFA parametre. Vos formateurs onboardes. Vos apprenants invites par email automatique.",
              },
              {
                step: "2",
                title: "Vos apprenants passent leurs tests en autonomie",
                desc: "20 minutes. Depuis leur telephone. DISC + Soft Skills + IDMC + pre-diag DYS.",
              },
              {
                step: "3",
                title: "Vous pilotez. Vous anticipez. Vous agissez.",
                desc: "Dashboard directeur en temps reel. Alertes decrochage. Dossiers handicap auto. Matching alternance comportemental.",
              },
            ].map((item) => (
              <motion.div key={item.step} {...revealProps} className="rounded-3xl bg-white p-8">
                <div className="text-3xl font-black text-[#F97316]">{item.step}</div>
                <h3 className="mt-4 text-lg font-semibold text-black">{item.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-4xl px-6 sm:px-10">
          <motion.h2
            {...revealProps}
            className="text-3xl font-black text-black sm:text-4xl"
          >
            Ce que ca change concretement
          </motion.h2>
          <motion.div
            {...revealProps}
            className="mt-10 rounded-3xl bg-gray-50 p-8 text-center"
          >
            <p className="text-lg font-semibold italic text-gray-800">
              "On a detecte 3 situations a risque en un mois. On en aurait perdu 2 sans Beyond.
              Ce sont de vraies personnes, pas des statistiques."
            </p>
            <p className="mt-4 text-sm font-semibold text-gray-600">
              Directrice pedagogique — Kelia Formation
            </p>
            <p className="mt-4 text-xs text-gray-500">
              400 apprenants suivis · 0 decrochage non detecte · Dossier Qualiopi boucle en 2h au
              lieu de 3 jours
            </p>
          </motion.div>
        </div>
      </section>

      <section className="bg-[#F97316] py-20 text-black">
        <div className="mx-auto max-w-6xl px-6 sm:px-10 text-center">
          <motion.h2
            {...revealProps}
            className="text-3xl font-black text-white sm:text-4xl"
          >
            3 mois gratuits.
            <br />
            50 apprenants.
            <br />
            Zero engagement.
          </motion.h2>
          <motion.p {...revealProps} className="mt-4 text-white/90">
            On configure tout. Vous mesurez. Vous decidez.
          </motion.p>
          <div className="mt-8 grid gap-3 text-sm font-semibold text-white">
            {[
              "Onboarding complet de votre equipe (inclus)",
              "Tests sur 50 apprenants de votre choix",
              "Dashboard directeur + formateurs actif",
              "Rapport de resultats a 30 jours",
            ].map((item) => (
              <div key={item} className="flex items-center justify-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-white" />
                {item}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={openCalendly}
            className="mt-8 rounded-full bg-white px-10 py-4 text-sm font-black uppercase text-black"
          >
            Planifier ma demo gratuite — 20 min
          </button>
          <p className="mt-3 text-xs text-white/80">
            La demo inclut la configuration de votre pilote gratuit.
          </p>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-6 sm:px-10">
          <motion.h2
            {...revealProps}
            className="text-3xl font-black text-black sm:text-4xl"
          >
            Pourquoi les CFA choisissent Beyond plutot que Grimp
          </motion.h2>
          <div className="mt-10 overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="py-3 text-gray-500">Feature</th>
                  <th className="py-3 text-gray-500">Beyond ✓</th>
                  <th className="py-3 text-gray-500">Grimp</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Tests psychometriques valides", "✅", "❌"],
                  ["Detection decrochage automatique", "✅", "❌"],
                  ["Module handicap Qualiopi integre", "✅", "❌"],
                  ["Matching comportemental IA", "✅", "partiel"],
                  ["Prix transparent par apprenant", "✅", "❌"],
                  ["Onboarding en 48h", "✅", "❌"],
                  ["Pilote gratuit 3 mois", "✅", "❌"],
                ].map((row) => (
                  <tr key={row[0]} className="border-b border-gray-100">
                    <td className="py-3 text-gray-700">{row[0]}</td>
                    <td className="py-3 text-green-600 font-semibold">{row[1]}</td>
                    <td className="py-3 text-gray-500">{row[2]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            type="button"
            onClick={() => document.getElementById("faq")?.scrollIntoView({ behavior: "smooth" })}
            className="mt-6 text-sm font-semibold text-gray-500 underline"
          >
            En savoir plus →
          </button>
        </div>
      </section>

      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-4xl px-6 sm:px-10">
          <motion.h2
            {...revealProps}
            className="text-3xl font-black text-black sm:text-4xl"
          >
            Un prix que vous pouvez defendre devant votre conseil d'administration.
          </motion.h2>
          <motion.div
            {...revealProps}
            className="mt-10 rounded-3xl bg-white p-10 shadow-xl"
          >
            <div className="text-sm font-semibold text-gray-500">BEYOND START</div>
            <div className="mt-3 text-4xl font-black text-black">3€ / mois / apprenant</div>
            <p className="mt-2 text-sm text-gray-600">
              + 8€/mois pour apprenants en situation de handicap
            </p>
            <ul className="mt-6 space-y-2 text-sm text-gray-600">
              <li>✓ Tests DISC + Soft Skills + IDMC + pre-diag DYS</li>
              <li>✓ Detection decrochage precoce</li>
              <li>✓ Module handicap Qualiopi automatise</li>
              <li>✓ Dashboard directeur + formateurs</li>
              <li>✓ Matching alternance comportemental</li>
              <li>✓ Support onboarding inclus</li>
            </ul>
            <div className="mt-6 rounded-2xl bg-orange-50 px-4 py-3 text-sm text-gray-700">
              Pour 400 apprenants (dont 30 en situation de handicap) : 370 × 3€ + 30 × 11€ =
              1 440€/mois soit 17 280€/an. Early adopter -30% jusqu'au 30 avril 2026 → 12 096€/an
            </div>
            <button
              type="button"
              onClick={openCalendly}
              className="mt-6 rounded-full bg-[#F97316] px-8 py-3 text-sm font-black uppercase text-black"
            >
              Planifier ma demo — je veux ce tarif
            </button>
          </motion.div>
        </div>
      </section>

      <section id="faq" className="bg-white py-20">
        <div className="mx-auto max-w-4xl px-6 sm:px-10">
          <motion.h2
            {...revealProps}
            className="text-3xl font-black text-black sm:text-4xl"
          >
            Vos questions. Nos reponses.
          </motion.h2>
          <div className="mt-8 space-y-4">
            {[
              {
                q: "On utilise deja Grimp. Pourquoi changer ?",
                a: "Beyond fait ce que Grimp ne fait pas : tests psychometriques, detection decrochage, module handicap Qualiopi. On offre -50% la premiere annee pour les CFA qui basculent depuis Grimp.",
              },
              {
                q: "Compatible avec Ypareo / Aurion / SC13Scolaire ?",
                a: "Oui. Integration API avec les principaux outils CFA. Configuration en 48h par notre equipe technique.",
              },
              {
                q: "Qualiopi : que couvre exactement le module handicap ?",
                a: "Generation automatique des dossiers de suivi, tracabilite des amenagements, exports certifiables pour vos audits.",
              },
              {
                q: "Nos apprenants ont deja des comptes Beyond particulier ?",
                a: "Rattachement automatique. L'historique des tests est conserve. Aucune ressaisie.",
              },
              {
                q: "Apres le pilote gratuit, on est engages ?",
                a: "Non. Vous continuez a 3€/mois/apprenant ou vous arretez. Sans penalite, sans friction.",
              },
            ].map((item) => (
              <details key={item.q} className="rounded-2xl border border-gray-200 p-4">
                <summary className="cursor-pointer text-sm font-semibold text-black">
                  {item.q}
                </summary>
                <p className="mt-3 text-sm text-gray-600">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-black py-20 text-white">
        <div className="mx-auto max-w-4xl px-6 text-center sm:px-10">
          <motion.h2
            {...revealProps}
            className="text-3xl font-black sm:text-4xl"
          >
            Arretez de decouvrir le decrochage trop tard.
          </motion.h2>
          <motion.p {...revealProps} className="mt-4 text-lg text-white/80">
            20 minutes. Une demo. Et vous repartez avec votre pilote configure.
          </motion.p>
          <button
            type="button"
            onClick={openCalendly}
            className="mt-8 rounded-full bg-[#F97316] px-10 py-4 text-sm font-black uppercase text-black"
          >
            Planifier ma demo gratuite maintenant
          </button>
          <p className="mt-4 text-sm text-white/70">Ou envoyez-nous un email : hello@getbeyond.fr</p>
        </div>
      </section>

      <footer className="bg-black py-6 text-center text-xs text-white/60">
        <span>© Beyond 2026 · </span>
        <Link href="/cgu" target="_blank" rel="noreferrer" className="underline">
          CGU
        </Link>
        <span> · </span>
        <Link href="/confidentialite" target="_blank" rel="noreferrer" className="underline">
          Politique de confidentialite
        </Link>
      </footer>

      <div className="fixed inset-x-0 bottom-0 z-[900] bg-white/95 p-3 shadow-2xl sm:hidden">
        <button
          type="button"
          onClick={openCalendly}
          className="w-full rounded-full bg-[#F97316] px-6 py-3 text-sm font-black uppercase text-black"
        >
          Planifier ma demo gratuite
        </button>
      </div>
    </div>
  );
}
