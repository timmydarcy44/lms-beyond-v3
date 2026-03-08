"use client";

import { Medal } from "lucide-react";
import { ClubLayout } from "@/components/club/club-layout";

export default function ClubAidesPage() {
  return (
    <ClubLayout activeItem="Aides & Formation">
      <div className="space-y-10">
        <section className="mb-8 grid grid-cols-3 gap-4">
          <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-900/60 to-blue-800/40 p-6">
            <div className="text-xs uppercase tracking-wider text-blue-300">
              Plan de Développement des Compétences
            </div>
            <div className="mt-3 text-4xl font-black text-white">jusqu'à 1 800€</div>
            <div className="text-sm text-white/60">par salarié / an</div>
            <div className="mt-4 h-2 rounded-full bg-white/10">
              <div className="h-2 w-[60%] rounded-full bg-blue-400" />
            </div>
            <div className="mt-3 text-xs text-white/50">
              Dossier à déposer avant le début de la formation
            </div>
          </div>

          <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-900/60 to-purple-800/40 p-6">
            <div className="text-xs uppercase tracking-wider text-purple-300">AFEST</div>
            <div className="mt-3 text-4xl font-black text-white">jusqu'à 6 000€</div>
            <div className="text-sm text-white/60">par action de formation</div>
            <div className="mt-3 text-xs text-white/40">
              150h max • 15€/h • dont 2 250€ distanciel
            </div>
            <button className="mt-3 text-xs text-purple-300 underline">Simuler mon financement →</button>
          </div>

          <div className="rounded-2xl border border-[#C8102E]/30 bg-gradient-to-br from-[#C8102E]/20 to-[#8B0000]/10 p-6">
            <div className="flex items-center gap-2">
              <Medal className="h-5 w-5 text-[#C8102E]" />
              <span className="rounded-full bg-[#C8102E]/20 px-3 py-1 text-xs text-[#C8102E]">Open Badges</span>
            </div>
            <div className="mt-3 text-xl font-black text-white">Beyond Compétences</div>
            <div className="text-sm text-white/60">Compétences certifiées par Open Badge</div>
            <div className="mt-3 text-3xl font-black text-[#C8102E]">Jusqu'à 100% financé</div>
            <div className="mt-3 text-xs text-white/70">
              <ul className="space-y-1">
                <li>• Référentiels validés par des pros du sport</li>
                <li>• Badges numériques reconnus et partageables</li>
                <li>• Formations 100% en ligne et asynchrones</li>
                <li>• Éligible AFDAS Plan de Développement</li>
              </ul>
            </div>
            <button className="mt-3 text-sm text-[#C8102E] underline">Voir les parcours Beyond →</button>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#111] p-8">
          <div className="inline-flex items-center rounded-full bg-emerald-500/20 px-3 py-1 text-xs text-emerald-300">
            ✓ Votre club cotise à l'AFDAS via vos charges patronales
          </div>
          <div className="mt-4 text-3xl font-black text-white">Aides au développement</div>
          <div className="mt-2 max-w-2xl text-sm text-white/70">
            Financez la montée en compétences de vos collaborateurs grâce aux dispositifs de l'AFDAS, OPCO de la
            branche Sport
          </div>
        </section>

        <section className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl border border-white/10 bg-[#111] p-6">
            <div className="inline-flex items-center rounded-full bg-blue-500/20 px-3 py-1 text-xs text-blue-200">
              📚
            </div>
            <div className="mt-4 text-lg font-semibold text-white">Plan de Développement des Compétences</div>
            <p className="mt-2 text-sm text-white/70">
              Financez les formations de vos salariés permanents. Dépôt de dossier obligatoire AVANT le début de la
              formation.
            </p>
            <div className="mt-3 text-sm text-white/70">
              <div>Plafonds 2026 :</div>
              <ul className="mt-2 space-y-1">
                <li>• Moins de 11 salariés → 1 100€ HT/an</li>
                <li>• 11 à 49 salariés → 1 800€ HT/an</li>
              </ul>
            </div>
            <div className="mt-3 inline-flex rounded-full bg-orange-500/20 px-3 py-1 text-xs text-orange-200">
              ⚠ Déposer 2 semaines avant
            </div>
            <a
              href="https://www.afdas.com"
              className="mt-4 inline-flex rounded-full bg-white/10 px-4 py-2 text-xs text-white hover:bg-white/20"
              target="_blank"
              rel="noreferrer"
            >
              Accéder à MyA (portail AFDAS)
            </a>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#111] p-6">
            <div className="inline-flex items-center rounded-full bg-green-500/20 px-3 py-1 text-xs text-green-200">
              ⚽
            </div>
            <div className="mt-4 text-lg font-semibold text-white">Fonds Conventionnels — Branche Sport</div>
            <p className="mt-2 text-sm text-white/70">
              Budget complémentaire négocié par les partenaires sociaux de la branche. Vient EN PLUS des fonds légaux.
            </p>
            <div className="mt-3 text-sm text-white/70">
              <div>Bénéficiaires :</div>
              <ul className="mt-2 space-y-1">
                <li>• Salariés du club</li>
                <li>
                  • Dirigeants bénévoles (Président, VP, Trésorier, Secrétaire général)
                  <div className="text-xs text-white/50">
                    → depuis jan. 2025 : réservé aux actions collectives et catalogue sport
                  </div>
                </li>
              </ul>
            </div>
            <div className="mt-3 inline-flex rounded-full bg-red-500/20 px-3 py-1 text-xs text-red-200">
              Budget actions collectives épuisé depuis avril 2025
            </div>
            <button className="mt-4 inline-flex rounded-full bg-white/10 px-4 py-2 text-xs text-white hover:bg-white/20">
              Voir le catalogue branche sport
            </button>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#111] p-6">
            <div className="inline-flex items-center rounded-full bg-purple-500/20 px-3 py-1 text-xs text-purple-200">
              🎯
            </div>
            <div className="mt-4 text-lg font-semibold text-white">AFEST — Formation en Situation de Travail</div>
            <p className="mt-2 text-sm text-white/70">
              Formez vos collaborateurs directement sur le terrain, au poste de travail. Idéal pour les nouveaux
              recrutements et montées en compétences internes.
            </p>
            <div className="mt-3 text-sm text-white/70">
              <ul className="space-y-1">
                <li>• Alterne pratique et temps de réflexivité</li>
                <li>• S'appuie sur l'expertise de vos collaborateurs seniors</li>
                <li>• Limite les coûts de déplacement</li>
                <li>
                  • Financement : jusqu'à 6 000€ HT (150h max, 15€/h max → 2 250€ HT pour la partie distancielle)
                </li>
              </ul>
            </div>
            <button className="mt-4 inline-flex rounded-full bg-white/10 px-4 py-2 text-xs text-white hover:bg-white/20">
              En savoir plus sur l'AFEST
            </button>
          </div>

          <div className="rounded-2xl border border-[#C8102E]/30 bg-gradient-to-br from-[#C8102E]/20 to-[#8B0000]/10 p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white">B</div>
              <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs text-green-300">Éligible AFDAS</span>
            </div>
            <div className="mt-4 text-xl font-black text-white">Beyond — Formations Club</div>
            <div className="mt-2 text-sm italic text-white/70">
              Référentiels validés par des professionnels du sport
            </div>
            <div className="my-4 h-px bg-white/10" />
            <div className="text-sm font-bold uppercase tracking-wider text-[#C8102E]">Développement des revenus</div>
            <div className="mt-2 flex flex-wrap gap-2 text-sm text-white">
              {[
                "Prospecter de nouveaux partenaires",
                "Réussir une soirée partenaires",
                "Négocier un contrat de sponsoring",
                "Développer ses revenus de billetterie",
                "Construire son budget prévisionnel",
              ].map((item) => (
                <button
                  key={item}
                  className="rounded-full bg-white/10 px-3 py-1 text-sm text-white hover:bg-[#C8102E]/30"
                >
                  {item}
                </button>
              ))}
            </div>
            <div className="mt-4 text-sm font-bold uppercase tracking-wider text-[#C8102E]">
              Communication & Réseaux
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-sm text-white">
              {[
                "Développement réseaux sociaux",
                "Créer du contenu vidéo match day",
                "Gérer sa e-réputation",
                "Animer une communauté de supporters",
              ].map((item) => (
                <button
                  key={item}
                  className="rounded-full bg-white/10 px-3 py-1 text-sm text-white hover:bg-[#C8102E]/30"
                >
                  {item}
                </button>
              ))}
            </div>
            <a
              href="/dashboard/formateur"
              className="mt-4 inline-flex rounded-full bg-[#C8102E] px-5 py-2 text-sm font-semibold text-white"
            >
              Voir tous les parcours Beyond →
            </a>
          </div>
        </section>

        <section className="rounded-2xl bg-gradient-to-r from-[#C8102E] to-[#8B0000] p-8">
          <div className="text-2xl font-black text-white">Formez votre club avec Beyond</div>
          <div className="mt-2 max-w-2xl text-sm text-white/80">
            Parcours 100% en ligne, finançables AFDAS, conçus avec et pour les clubs sportifs professionnels et
            amateurs.
          </div>
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-white">
            <span>✓ Référentiels validés par des pros du sport</span>
            <span>✓ Suivi de progression en temps réel</span>
            <span>✓ Attestations et badges automatiques</span>
          </div>
          <div className="mt-4 text-sm text-white/80">
            Nos formations phares : Développement des revenus • Réseaux sociaux • Soirée partenaires • Prospection
            commerciale • Management d'équipe
          </div>
          <a
            href="mailto:contact@beyond.fr"
            className="mt-6 inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#8B0000]"
          >
            Demander une démo Beyond
          </a>
          <div className="mt-3 text-xs text-white/70">
            Votre conseiller AFDAS peut financer votre abonnement Beyond dans le cadre du Plan de Développement des
            Compétences.
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#111] p-8">
          <div className="text-xl font-bold text-white">Par où commencer ?</div>
          <ol className="mt-4 space-y-3 text-sm text-white/70">
            <li>1️⃣ Créez votre compte AFDAS sur mya.afdas.com</li>
            <li>2️⃣ Identifiez les besoins de formation de vos salariés</li>
            <li>3️⃣ Choisissez le bon dispositif (PDC, AFEST, Catalogue branche)</li>
            <li>4️⃣ Déposez votre demande AVANT le début de la formation</li>
            <li>5️⃣ Attendez l'accord de prise en charge (ne pas commencer avant !)</li>
          </ol>
          <div className="mt-4 inline-flex rounded-full bg-orange-500/20 px-3 py-1 text-xs text-orange-200">
            ⚠ Sans accord préalable de l'AFDAS, aucun financement possible
          </div>
        </section>
      </div>
    </ClubLayout>
  );
}
