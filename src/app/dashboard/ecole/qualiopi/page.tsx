export const dynamic = 'force-dynamic';

export default function QualiopiPage() {
  const criteres = [
    { title: "Critere 1 : Conditions d'information", indicators: ["Indicateur 1 : Info Public"] },
    { title: "Critere 2 : Identification des objectifs", indicators: ["Indicateur 2 : Resultats"] },
    { title: "Critere 3 : Adaptation des dispositifs", indicators: ["Indicateur 3 : Positionnement"] },
    { title: "Critere 4 : Moyens pedagogiques", indicators: ["Indicateur 4 : Encadrement"] },
    { title: "Critere 5 : Qualification des equipes", indicators: ["Indicateur 5 : Formateurs"] },
    { title: "Critere 6 : Inscription & investissement", indicators: ["Indicateur 6 : Alternance"] },
    { title: "Critere 7 : Amelioration continue", indicators: ["Indicateur 7 : Satisfaction"] },
  ];

  const cardStyle = {
    backdropFilter: "blur(20px) saturate(180%)",
    background: "rgba(255, 255, 255, 0.03)",
    boxShadow: "inset 0 0 1px 1px rgba(255,255,255,0.1), 0 20px 40px rgba(0,0,0,0.3)",
    border: "1px solid rgba(255,255,255,0.08)",
  } as const;

  return (
    <div
      className="min-h-screen px-6 py-10 text-black"
      style={{
        backgroundImage:
          "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.08), transparent 45%), radial-gradient(circle at 80% 10%, rgba(255,255,255,0.05), transparent 40%), linear-gradient(180deg, rgba(10,10,12,0.9), rgba(10,10,12,0.98))",
      }}
    >
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-3xl p-6 text-white" style={cardStyle}>
          <h1 className="text-2xl font-semibold">Qualiopi</h1>
          <p className="mt-2 text-sm text-white/70">
            Centralisez les preuves, documents techniques et indicateurs pour un audit fluide et securise.
          </p>
        </header>

        <section className="space-y-4">
          {criteres.map((critere, index) => {
            const progress = Math.min(100, 70 + index * 4);
            return (
            <details key={critere.title} className="rounded-3xl p-5 text-white" style={cardStyle}>
              <summary className="cursor-pointer text-sm font-semibold text-white">
                <span className="flex items-center justify-between">
                  {critere.title}
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-full text-[10px] font-semibold text-white/80"
                    style={{
                      background: `conic-gradient(#22c55e ${progress * 3.6}deg, rgba(255,255,255,0.1) 0deg)`,
                    }}
                  >
                    <span className="rounded-full bg-[#0d0d0f] px-2 py-1">{progress}%</span>
                  </span>
                </span>
              </summary>
              <div className="mt-4 space-y-4">
                {critere.indicators.map((indicator) => (
                  <div key={indicator} className="rounded-2xl p-4 text-white" style={cardStyle}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white/80">{indicator}</p>
                        <span className="mt-2 inline-flex items-center gap-2 rounded-full border border-emerald-400/50 bg-emerald-500/20 px-2 py-1 text-[10px] font-semibold text-emerald-200 shadow-[0_0_12px_rgba(16,185,129,0.6)] animate-pulse">
                          Conforme
                        </span>
                      </div>
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold text-white/70">
                        <input type="file" className="hidden" />
                        Uploader la preuve
                      </label>
                    </div>
                    {indicator.includes("Resultats") ? (
                      <div className="mt-4 grid gap-3 md:grid-cols-3">
                        {["Taux de reussite", "Insertion pro", "Satisfaction"].map((label) => (
                          <div key={label} className="rounded-xl p-3 text-white/80" style={cardStyle}>
                            <p className="text-xs text-white/50">{label}</p>
                            <div className="mt-2 h-2 w-full rounded-full bg-white/10">
                              <div className="h-full w-4/5 rounded-full bg-emerald-500" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                    {indicator.includes("Alternance") ? (
                      <div className="mt-4 rounded-xl p-3 text-xs text-white/70" style={cardStyle}>
                        <p className="font-semibold">Indicateur 13 : Alternance</p>
                        <div className="mt-2 grid grid-cols-3 gap-2">
                          {["Visite 1", "Visite 2", "Echange tuteur"].map((item) => (
                            <div key={item} className="rounded-lg border border-white/10 px-2 py-1 text-center">
                              {item}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    {indicator.includes("Satisfaction") ? (
                      <div className="mt-4 rounded-xl p-3 text-xs text-white/70" style={cardStyle}>
                        <p className="font-semibold">Indicateur 14 : Accompagnement</p>
                        <ul className="mt-2 space-y-1">
                          <li>Atelier Soft Skills - 12/01</li>
                          <li>Atelier Prise de parole - 25/01</li>
                          <li>Atelier Leadership - 02/02</li>
                        </ul>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </details>
          )})}
        </section>
      </div>
    </div>
  );
}

