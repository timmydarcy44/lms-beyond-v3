const TITLE_TRIALS = [
  ["Mise en situation professionnelle", "6 h 30", "Étude de cas écrite, analyse commerciale, prospection téléphonique et négociation"],
  ["Entretien technique", "50 min", "Analyse SWOT, recommandations et échange avec le jury"],
  ["Questionnement sur productions", "1 h", "Présentation de travaux préparés en amont et questions du jury"],
  ["Entretien final", "10 min", "Échange sur le dossier professionnel et le parcours"],
] as const;

const CCP_BLOCKS = [
  {
    code: "CCP1",
    duration: "4 h",
    title: "Prospection commerciale",
    text: "Élaborer une stratégie de prospection et la mettre en œuvre.",
    items: [
      ["Étude de cas et tableau de bord", "1 h 30"],
      ["Oral et simulation de prospection", "1 h"],
      ["Entretien technique", "50 min"],
      ["Présentation de productions", "40 min"],
    ],
  },
  {
    code: "CCP2",
    duration: "6 h 05",
    title: "Négociation commerciale",
    text: "Négocier une solution technique et commerciale et consolider l’expérience client.",
    items: [
      ["Étude de cas écrite", "3 h"],
      ["Préparation et négociation orale", "1 h 45"],
      ["Entretien technique", "50 min"],
      ["Présentation de productions", "30 min"],
    ],
  },
] as const;

const LEVELS = [
  ["1. Compétences", "Exercices, cas pratiques, challenges et projets réels", "Progression pédagogique"],
  ["2. Spécialisation", "Projets AI Business, Sport ou Real Estate, avec critères définis", "Open Badges Byound"],
  ["3. Titre professionnel", "Épreuves réglementaires devant un jury habilité", "CCP1, CCP2 et titre NTC"],
] as const;

export function NtcEvaluationSection() {
  return (
    <div className="mt-16">
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5146e5]">
          RNCP39063 · Niveau 5
        </p>
        <h3 className="mt-3 text-[clamp(1.8rem,3vw,2.6rem)] font-semibold tracking-[-0.04em] text-[#070b1f]">
          Comment le titre est évalué.
        </h3>
        <p className="mt-4 text-base leading-relaxed text-black/55">
          L’évaluation du titre professionnel Négociateur technico-commercial ne repose pas sur des
          examens scolaires, des partiels ou des notes sur 20. Elle repose sur des mises en situation
          professionnelles, des productions écrites et des entretiens avec un jury de professionnels.
        </p>
        <p className="mt-3 text-base leading-relaxed text-black/55">
          Deux temps sont distincts : les évaluations réalisées pendant la formation chez Byound, et
          les épreuves officielles qui permettent d’obtenir le titre ou les CCP.
        </p>
      </div>

      <div className="mt-10 overflow-hidden rounded-[28px] border border-black/[0.07] bg-white">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-black/[0.06] px-6 py-5 sm:px-8">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-black/40">
              1 · Titre NTC complet
            </p>
            <p className="mt-1 text-lg font-semibold text-[#070b1f]">8 h 30 devant le jury</p>
          </div>
          <p className="text-sm text-black/45">Référentiel officiel</p>
        </div>
        <div className="divide-y divide-black/[0.06]">
          {TITLE_TRIALS.map(([label, duration, detail]) => (
            <div key={label} className="grid gap-2 px-6 py-5 sm:grid-cols-[1.1fr_.45fr_1.6fr] sm:items-center sm:px-8">
              <p className="font-semibold text-[#070b1f]">{label}</p>
              <p className="text-sm font-semibold text-[#5146e5]">{duration}</p>
              <p className="text-sm leading-relaxed text-black/55">{detail}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        {CCP_BLOCKS.map((block) => (
          <article key={block.code} className="rounded-[28px] border border-black/[0.07] bg-white p-7">
            <div className="flex items-center justify-between gap-3">
              <span className="rounded-full bg-[#070b1f] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white">
                {block.code}
              </span>
              <span className="text-sm font-semibold text-[#5146e5]">{block.duration}</span>
            </div>
            <h3 className="mt-5 text-xl font-semibold tracking-[-0.03em] text-[#070b1f]">{block.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-black/55">{block.text}</p>
            <ul className="mt-6 space-y-3">
              {block.items.map(([label, duration]) => (
                <li key={label} className="flex items-start justify-between gap-4 text-sm">
                  <span className="text-black/70">{label}</span>
                  <span className="shrink-0 font-semibold text-[#070b1f]">{duration}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
      <p className="mt-4 text-xs text-black/40">Durées officielles des sessions CCP distinctes.</p>

      <div className="mt-12">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-black/40">
          3 · Les trois niveaux Byound
        </p>
        <div className="mt-4 overflow-hidden rounded-[28px] border border-black/[0.07] bg-white">
          {LEVELS.map(([level, evaluation, validation]) => (
            <div key={level} className="grid gap-1 border-t border-black/[0.06] px-6 py-5 first:border-t-0 sm:grid-cols-[.7fr_1.4fr_1fr] sm:items-center sm:gap-4 sm:px-8">
              <p className="font-semibold text-[#070b1f]">{level}</p>
              <p className="text-sm leading-relaxed text-black/60">{evaluation}</p>
              <p className="text-sm font-semibold text-[#5146e5]">{validation}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 rounded-[28px] bg-[#070b1f] p-7 text-white sm:p-9">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8c86ff]">Soutenance Byound</p>
        <p className="mt-4 max-w-3xl text-lg font-medium leading-relaxed tracking-[-0.02em]">
          Un projet business construit pendant le cursus, présenté devant des professionnels, avec une
          grille d’exigence propre à Byound. Cette soutenance est indépendante des épreuves
          réglementaires.
        </p>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-white/55">
          Byound peut créer ses propres évaluations. Elles ne remplacent jamais les épreuves
          officielles du titre. Le titre professionnel garantit un socle national. Le Byound Standard
          atteste un niveau d’exigence complémentaire.
        </p>
      </div>
    </div>
  );
}
