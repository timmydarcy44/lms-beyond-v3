import { OPCO_COUNT, OPCO_MUTUAL_THRESHOLD, OPCO_PER_COMPANY } from "@/lib/financement-opco";
import { Band, H2 } from "@/components/site/ui";

const FACTS = [
  { value: OPCO_COUNT.text, label: "OPCO en France" },
  { value: OPCO_PER_COMPANY.text, label: "OPCO par entreprise" },
  {
    value: OPCO_MUTUAL_THRESHOLD.text,
    label: "salariés",
    caption: "Seuil d'accès aux fonds mutualisés pour le plan de développement des compétences.",
  },
];

export function OpcoWhat() {
  return (
    <Band>
      <H2>Un OPCO, c&apos;est quoi ?</H2>
      <p className="mt-4 max-w-3xl text-[18px] leading-relaxed text-[#4A4F5C]">
        L&apos;opérateur de compétences collecte une partie des contributions formation de votre branche et finance la formation de vos salariés. Chaque entreprise dépend d&apos;un seul OPCO, selon son activité principale et sa convention collective.
      </p>
      <ul className="mt-10 grid gap-4 md:grid-cols-3">
        {FACTS.map((fact) => (
          <li key={fact.label} className="rounded-[32px] bg-white p-6 sm:p-8">
            <p className="text-[56px] font-extrabold leading-none tracking-[-2px]">{fact.value}</p>
            <p className="mt-3 text-[18px] font-extrabold">{fact.label}</p>
            {fact.caption ? <p className="mt-2 text-[15px] leading-relaxed text-[#4A4F5C]">{fact.caption}</p> : null}
          </li>
        ))}
      </ul>
    </Band>
  );
}
