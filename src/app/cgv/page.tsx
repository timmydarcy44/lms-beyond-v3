import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { BYOUND_COMPANY, companyPostalAddress } from "@/lib/company";

export const metadata: Metadata = {
  title: "Conditions générales de vente — Byound",
  description:
    "Conditions générales de vente applicables aux formations professionnelles Byound.",
  robots: { index: true, follow: true },
};

const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
});

const ARTICLES = [
  {
    title: "1. Objet",
    body: "Les présentes CGV régissent les prestations de formation professionnelle dispensées par l'Organisme (SAS Byound Business).",
  },
  {
    title: "2. Commande",
    body: "La commande est ferme après acceptation du devis et signature de la convention de formation.",
  },
  {
    title: "3. Prix",
    body: "Les prix sont indiqués en euros HT. La TVA applicable figure sur le devis et la facture.",
  },
  {
    title: "4. Paiement",
    body: "Sauf mention contraire, règlement à 30 jours date de facture. En cas de subrogation OPCO, le Client reste garant du paiement.",
  },
  {
    title: "5. Annulation",
    body: "Toute annulation Client à moins de 10 jours ouvrés avant le début de la formation peut entraîner une facturation partielle ou totale.",
  },
  {
    title: "6. Responsabilité",
    body: "L'Organisme met en œuvre les moyens nécessaires à la qualité pédagogique ; il ne garantit pas un résultat professionnel individuel.",
  },
  {
    title: "7. Données",
    body: "Les données sont traitées conformément à la réglementation applicable et à la politique de confidentialité Byound.",
  },
  {
    title: "8. Litiges",
    body: "Droit français. Recherche de solution amiable préalable avant tout contentieux.",
  },
] as const;

export default function CgvPage() {
  return (
    <main className={`${manrope.className} min-h-screen bg-[#0A0B12] px-4 py-10 text-[#F3F4FA]`}>
      <div className="mx-auto max-w-xl space-y-6">
        <header className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#6E5BFF] text-sm font-extrabold text-white">
            B
          </span>
          <span className="text-base font-extrabold tracking-[-0.02em]">Byound</span>
        </header>

        <section className="rounded-[24px] bg-[#15171E] p-5">
          <p className="text-xs font-semibold text-[#B7AEFF]">
            Version {BYOUND_COMPANY.cgv_version}
          </p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-[-0.03em]">
            Conditions générales de vente
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[#9AA0B5]">
            Formations professionnelles — applicables à tout devis et toute convention Byound.
          </p>
        </section>

        <section className="space-y-4 rounded-[24px] bg-[#15171E] p-5">
          {ARTICLES.map((article) => (
            <div key={article.title}>
              <h2 className="text-sm font-bold text-white">{article.title}</h2>
              <p className="mt-1 text-sm leading-relaxed text-[#9AA0B5]">{article.body}</p>
            </div>
          ))}
        </section>

        <footer className="px-1 pb-6 text-center text-xs leading-relaxed text-[#6B7288]">
          {BYOUND_COMPANY.legal_name} · SIRET {BYOUND_COMPANY.siret} · TVA{" "}
          {BYOUND_COMPANY.vat_intra}
          <br />
          {companyPostalAddress()} · NDA {BYOUND_COMPANY.nda}
        </footer>
      </div>
    </main>
  );
}
