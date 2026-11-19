type MemEvaluationSectionProps = {
  specialization?: string;
  practiceLine?: string;
};

const TITLE_BLOCKS = [
  [
    "Étude de cas",
    "Analyse d’une situation de management et de performance en établissement marchand",
  ],
  ["Entretien technique", "Échange avec le jury sur les pratiques et les choix opérationnels"],
  ["Dossier professionnel", "Productions préparées en amont et questionnement du jury"],
  ["Entretien final", "Présentation du parcours et du projet professionnel"],
] as const;

export function MemEvaluationSection({
  specialization = "Retail Experience",
  practiceLine = "Ateliers, cas d’enseigne, labo retail et challenges terrain",
}: MemEvaluationSectionProps) {
  const levels = [
    ["1. Compétences", practiceLine, "Progression pédagogique"],
    ["2. Spécialisation", `Projet ${specialization} et Open Badges Byound`, "Preuves partageables"],
    ["3. Titre professionnel", "Épreuves réglementaires devant un jury habilité", "3 CCP · MEM Niveau 5"],
  ] as const;

  return (
    <div className="mt-16">
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5146e5]">
          RNCP 41853 · Niveau 5
        </p>
        <h3 className="mt-3 text-[clamp(1.8rem,3vw,2.6rem)] font-semibold tracking-[-0.04em] text-[#070b1f]">
          Comment le titre est évalué.
        </h3>
        <p className="mt-4 text-base leading-relaxed text-black/55">
          L’évaluation du titre professionnel Manager d’établissement marchand repose sur des mises
          en situation professionnelles, un dossier et des entretiens avec un jury — pas sur des
          partiels scolaires.
        </p>
        <p className="mt-3 text-base leading-relaxed text-black/55">
          Les 3 CCP sont validables séparément. La spécialisation {specialization} est distincte de
          la certification RNCP et se valide par Open Badges.
        </p>
      </div>

      <div className="mt-10 overflow-hidden rounded-[28px] border border-black/[0.07] bg-white">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-black/[0.06] px-6 py-5 sm:px-8">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-black/40">
              Titre MEM complet
            </p>
            <p className="mt-1 text-lg font-semibold text-[#070b1f]">4 temps devant le jury</p>
          </div>
          <p className="text-sm text-black/45">Référentiel officiel</p>
        </div>
        <div className="divide-y divide-black/[0.06]">
          {TITLE_BLOCKS.map(([label, detail]) => (
            <div
              key={label}
              className="grid gap-2 px-6 py-5 sm:grid-cols-[1.1fr_1.9fr] sm:items-center sm:px-8"
            >
              <p className="font-semibold text-[#070b1f]">{label}</p>
              <p className="text-sm leading-relaxed text-black/55">{detail}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {levels.map(([title, text, caption]) => (
          <article
            key={title}
            className="rounded-[24px] border border-black/[0.07] bg-[#f7f7f5] p-6"
          >
            <p className="text-sm font-semibold text-[#070b1f]">{title}</p>
            <p className="mt-3 text-sm leading-relaxed text-black/55">{text}</p>
            <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#5146e5]">
              {caption}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
