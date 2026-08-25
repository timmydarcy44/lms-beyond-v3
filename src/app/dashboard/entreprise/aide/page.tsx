"use client";

import { useState } from "react";
import EnterpriseSidebar from "@/components/EnterpriseSidebar";
import { ENTREPRISE_H1_CLASS } from "@/lib/entreprise/styles";
import { cn } from "@/lib/utils";
import { ChevronDown, Mail, MessageCircle } from "lucide-react";
import Link from "next/link";

const FAQ = [
  {
    q: "Comment inviter un collaborateur ?",
    a: "Allez dans Salariés → Ajouter (ou Actions rapides → Inviter un collaborateur). Renseignez prénom, nom et email : une invitation est envoyée pour créer le mot de passe.",
  },
  {
    q: "À quoi servent les diagnostics ?",
    a: "Les diagnostics (profil comportemental, IDMC, soft skills) cartographient les compétences et alimentent les écarts vs fiches métiers, les alertes et les recommandations RH.",
  },
  {
    q: "Où voir les écarts de compétences ?",
    a: "Sur la fiche collaborateur (écarts vs métier) et sur le dashboard (alertes). Les fiches métiers définissent les cibles soft / hard skills.",
  },
  {
    q: "Comment demander une formation EDGE ?",
    a: "Formations → Demander une formation. Filtrez par thématique, ouvrez le formulaire : l’équipe EDGE reçoit votre demande par email.",
  },
  {
    q: "À quoi sert Inclusion / accessibilité ?",
    a: "Sur chaque fiche collaborateur, le CTA propose des aménagements possibles selon les éléments déclarés ou documentés (RQTH, dys, TDAH, etc.).",
  },
  {
    q: "Comment fonctionne la messagerie RH ?",
    a: "Messages permet des échanges rapides collaborateur ↔ RH sans email, sur le modèle d’une conversation type iMessage.",
  },
  {
    q: "Comment créer une offre d’emploi ?",
    a: "Recrutement → Mes offres → Créer, ou via la carte Actions rapides. Renseignez le poste, compétences, expérience et niveau de formation.",
  },
  {
    q: "Comment changer d’abonnement ?",
    a: "Consultez Tarifs & abonnement, puis contactez contact@edgebs.fr pour un devis ou un changement de formule (Skills, Learning, Learning+).",
  },
  {
    q: "Qui peut accéder au dashboard entreprise ?",
    a: "Les comptes avec rôle entreprise / RH / manager liés à l’organisation. Les salariés ont leur propre espace apprenant.",
  },
  {
    q: "Besoin d’aide urgente ?",
    a: "Écrivez à contact@edgebs.fr ou utilisez la messagerie interne pour une question RH rapide auprès de vos équipes.",
  },
] as const;

export default function EntrepriseAidePage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="flex min-h-screen bg-[#f7f5fb] text-gray-900">
      <EnterpriseSidebar />
      <main className="flex-1 px-4 py-8 sm:px-6 lg:px-10 lg:pl-[280px]">
        <header className="mb-8 max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-500">Aide</p>
          <h1 className={`mt-2 text-left ${ENTREPRISE_H1_CLASS}`}>Centre d’aide</h1>
          <p className="mt-2 text-sm text-gray-500">
            FAQ pour utiliser le dashboard entreprise EDGE au quotidien.
          </p>
        </header>

        <div className="mb-8 grid gap-3 sm:grid-cols-2 max-w-3xl">
          <a
            href="mailto:contact@edgebs.fr"
            className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition hover:border-violet-200"
          >
            <Mail className="h-5 w-5 text-violet-600" />
            <div>
              <p className="text-sm font-semibold text-gray-900">Écrire au support</p>
              <p className="text-xs text-gray-500">contact@edgebs.fr</p>
            </div>
          </a>
          <Link
            href="/dashboard/entreprise/messages"
            className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition hover:border-violet-200"
          >
            <MessageCircle className="h-5 w-5 text-violet-600" />
            <div>
              <p className="text-sm font-semibold text-gray-900">Messages RH</p>
              <p className="text-xs text-gray-500">Échanges rapides avec vos équipes</p>
            </div>
          </Link>
        </div>

        <section className="max-w-3xl space-y-2">
          {FAQ.map((item, index) => {
            const open = openIndex === index;
            return (
              <div
                key={item.q}
                className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(open ? null : index)}
                  className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
                  aria-expanded={open}
                >
                  <span className="text-sm font-semibold text-gray-900">{item.q}</span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 shrink-0 text-gray-400 transition",
                      open && "rotate-180",
                    )}
                  />
                </button>
                {open ? (
                  <p className="border-t border-gray-50 px-5 pb-4 pt-3 text-sm leading-6 text-gray-600">
                    {item.a}
                  </p>
                ) : null}
              </div>
            );
          })}
        </section>
      </main>
    </div>
  );
}
