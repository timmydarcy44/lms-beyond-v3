/** Exemples pédagogiques Qualiopi — pas des preuves déposées. */

export const QUALIOPI_EXAMPLE_PROCESS = {
  title: "Mise à jour du coffre administratif",
  steps: [
    "Rédiger ou faire valider le modèle (convention, règlement ou livret) par la direction.",
    "Exporter en PDF versionnée (ex. Convention_OF_2026-v1.pdf).",
    "Déposer le fichier dans le slot Coffre correspondant.",
    "À chaque révision majeure : remplacer le fichier et noter la date dans le nom.",
  ],
};

export const QUALIOPI_EXAMPLE_DOCUMENT = {
  title: "Convention de formation (trame)",
  body: `Convention de formation professionnelle

1. Parties
   - Organisme de formation : Byound / Edge Business School
   - Client : [Raison sociale]

2. Objet
   - Intitulé, objectifs, durée, modalités (présentiel / distanciel / mixte).

3. Conditions financières
   - Tarif HT, facturation, prise en charge (OPCO, CPF…).

4. Obligations
   - OF : moyens pédagogiques, émargement, attestation.
   - Client : stagiaires, paiement.

5. Accessibilité
   - Référente handicap — étude personnalisée.

6. Signatures
   - Date, noms, qualités.`,
};

type Props = {
  /** Compact = colonne droite / sous un indicateur. */
  compact?: boolean;
  className?: string;
};

export function QualiopiPlanExamples({ compact = false, className }: Props) {
  return (
    <section
      className={
        className ??
        "rounded-[24px] border border-[#26304F] bg-[#111831] p-4 sm:p-5"
      }
    >
      <p className="text-[13.5px] font-extrabold text-[#F2F4FA]">Ce que l&apos;on va faire</p>
      <p className="mt-0.5 text-[12px] text-[#9AA3BD]">
        Exemples — en attendant les vraies preuves
      </p>

      <div
        className={
          compact
            ? "mt-3 space-y-3"
            : "mt-4 grid gap-3 sm:grid-cols-2"
        }
      >
        <article className="rounded-2xl border border-[#1A2340] bg-[#0B1122] p-3.5">
          <p className="text-[11px] font-semibold text-[#A99BFF]">Exemple de process</p>
          <h3 className="mt-1 text-[13px] font-extrabold leading-snug text-[#F2F4FA]">
            {QUALIOPI_EXAMPLE_PROCESS.title}
          </h3>
          <ol className="mt-2 list-decimal space-y-1.5 pl-4 text-[12px] leading-relaxed text-[#9AA3BD]">
            {QUALIOPI_EXAMPLE_PROCESS.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </article>

        <article className="rounded-2xl border border-[#1A2340] bg-[#0B1122] p-3.5">
          <p className="text-[11px] font-semibold text-[#F2CF6B]">Exemple de document</p>
          <h3 className="mt-1 text-[13px] font-extrabold leading-snug text-[#F2F4FA]">
            {QUALIOPI_EXAMPLE_DOCUMENT.title}
          </h3>
          <pre className="mt-2 max-h-40 overflow-y-auto whitespace-pre-wrap rounded-xl bg-[#0A0F1E] p-2.5 font-mono text-[10.5px] leading-relaxed text-[#9AA3BD]">
            {QUALIOPI_EXAMPLE_DOCUMENT.body}
          </pre>
        </article>
      </div>
    </section>
  );
}
