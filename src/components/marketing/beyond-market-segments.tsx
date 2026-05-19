/**
 * Bloc « For Education / For Enterprise / For Club » — réutilisé sur la home et la page Prix.
 */
export function BeyondMarketSegments({
  className = "",
  heading = "Une plateforme. Trois usages.",
}: {
  className?: string;
  heading?: string;
}) {
  return (
    <section
      className={`mx-auto w-full max-w-6xl border-y border-white/5 bg-white/[0.02] px-5 py-16 md:px-8 md:py-24 ${className}`}
    >
      <h2 className="text-3xl font-semibold text-white md:text-4xl">{heading}</h2>
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        <div id="education" className="scroll-mt-28 rounded-2xl border-2 border-cyan-400/50 bg-cyan-500/10 p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-cyan-300">Par défaut</p>
          <h3 className="mt-2 text-lg font-semibold text-white">For Education</h3>
          <p className="mt-2 text-sm text-slate-300">Pilotage des parcours étudiants.</p>
        </div>
        <div id="entreprise" className="scroll-mt-28 rounded-2xl border border-white/10 p-6">
          <h3 className="mt-2 text-lg font-semibold text-white">For Enterprise</h3>
          <p className="mt-2 text-sm text-slate-400">Pilotage des compétences et des équipes.</p>
        </div>
        <div id="club" className="scroll-mt-28 rounded-2xl border border-white/10 p-6">
          <h3 className="mt-2 text-lg font-semibold text-white">For Club</h3>
          <p className="mt-2 text-sm text-slate-400">Pilotage de la progression sportive.</p>
        </div>
      </div>
    </section>
  );
}
