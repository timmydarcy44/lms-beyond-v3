export type ConceptRow = {
  label: string;
  correct: number;
  total: number;
  bits: boolean[];
};

export function ConceptBreakdown({ rows }: { rows: ConceptRow[] }) {
  if (!rows.length) return null;
  return (
    <section className="result-card" aria-labelledby="par-notion">
      <h3 id="par-notion">Par notion</h3>
      {rows.map((row) => {
        const weak = row.total > 0 && row.correct / row.total < 0.5;
        return (
          <div key={row.label} className="concept-row" data-weak={weak ? "true" : "false"}>
            <header>
              <span>{row.label}</span>
              <b>
                {row.correct} / {row.total}
              </b>
            </header>
            <div className="segment-bar" aria-hidden>
              {row.bits.map((on, index) => (
                <i key={index} data-on={on ? "true" : "false"} />
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}
