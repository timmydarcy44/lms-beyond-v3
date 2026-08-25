import Link from "next/link";
import EnterpriseSidebar from "@/components/EnterpriseSidebar";
import { ENTREPRISE_H1_CLASS } from "@/lib/entreprise/styles";
import { EDGE_DPO_CONTACT, EDGE_PROCESSING_REGISTER } from "@/lib/entreprise/rgpd-register";

export default function EntreprisePrivacyPage() {
  return (
    <div className="flex min-h-screen bg-[#f7f5fb] text-gray-900">
      <EnterpriseSidebar />
      <main className="flex-1 px-4 py-8 sm:px-6 lg:px-10 lg:pl-[280px]">
        <article className="mx-auto max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-500">
            RGPD
          </p>
          <h1 className={`mt-2 text-left ${ENTREPRISE_H1_CLASS}`}>
            Politique de confidentialité
          </h1>
          <p className="mt-3 text-sm text-gray-500">
            Dernière mise à jour : 25 août 2026 — Espace entreprise EDGE
          </p>

          <div className="prose prose-sm mt-8 max-w-none space-y-6 text-gray-700">
            <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-950">1. Responsable de traitement</h2>
              <p className="mt-2 text-sm leading-6">
                {EDGE_DPO_CONTACT.organization}
                <br />
                Contact :{" "}
                <a className="font-semibold text-violet-600" href={`mailto:${EDGE_DPO_CONTACT.email}`}>
                  {EDGE_DPO_CONTACT.email}
                </a>
              </p>
              <p className="mt-2 text-sm leading-6">
                Pour les données des collaborateurs de votre organisation, le responsable de
                traitement est en principe votre employeur (client EDGE) ; EDGE agit comme
                sous-traitant (art. 28 RGPD) pour l’hébergement et le fonctionnement de la
                plateforme.
              </p>
            </section>

            <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-950">2. Données collectées</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6">
                <li>Identité et coordonnées professionnelles (compte RH)</li>
                <li>Annuaire collaborateurs et fiches métiers</li>
                <li>Résultats de diagnostics (selon consentement de partage)</li>
                <li>Messages internes RH, offres, candidatures, demandes de formation</li>
                <li>Logs techniques nécessaires à la sécurité</li>
              </ul>
            </section>

            <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-950">3. Bases légales</h2>
              <p className="mt-2 text-sm leading-6">
                Chaque traitement dispose d’une base légale identifiée (contrat, intérêt
                légitime, consentement ou obligation légale). Le détail figure dans le{" "}
                <Link
                  href="/dashboard/entreprise/rgpd/registre"
                  className="font-semibold text-violet-600"
                >
                  registre des traitements
                </Link>{" "}
                ({EDGE_PROCESSING_REGISTER.length} traitements documentés).
              </p>
            </section>

            <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-950">4. Vos droits</h2>
              <p className="mt-2 text-sm leading-6">
                Vous disposez des droits d’accès, de rectification, d’effacement, d’opposition et
                de limitation. Depuis{" "}
                <Link href="/dashboard/entreprise/compte" className="font-semibold text-violet-600">
                  Mon compte
                </Link>
                , vous pouvez exporter vos données et demander la suppression. Vous pouvez aussi
                écrire à {EDGE_DPO_CONTACT.email}. Réponse sous 30 jours.
              </p>
            </section>

            <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-950">5. Conservation & sécurité</h2>
              <p className="mt-2 text-sm leading-6">
                Les durées de conservation sont définies par traitement dans le registre. Les
                accès sont authentifiés, chiffrés en transit (HTTPS) et restreints aux rôles
                autorisés de votre organisation.
              </p>
            </section>

            <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-950">6. Réclamation</h2>
              <p className="mt-2 text-sm leading-6">
                Vous pouvez introduire une réclamation auprès de la CNIL (
                <a
                  href="https://www.cnil.fr"
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-violet-600"
                >
                  cnil.fr
                </a>
                ).
              </p>
            </section>
          </div>
        </article>
      </main>
    </div>
  );
}
