export default function CreateOfferBeyondAiPage() {
  return (
    <main className="min-h-screen bg-white px-6 py-12 text-[#050A18]">
      <div className="mx-auto max-w-4xl space-y-8">
        <header className="space-y-3">
          <p className="text-xs tracking-tight text-[#050A18]/50">Créer une offre</p>
          <h1 className="text-3xl font-semibold tracking-tight">Créer avec Beyond AI</h1>
          <p className="text-sm text-[#050A18]/60">
            Indiquez le titre du poste et laissez l&apos;IA proposer les soft skills clés.
          </p>
        </header>
        <div className="grid gap-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <label className="space-y-2 text-sm">
            <span className="text-[#050A18]/70">Titre du poste</span>
            <input className="w-full rounded-xl border border-slate-200 px-4 py-3" placeholder="Business Developer" />
          </label>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs tracking-tight text-[#050A18]/60">Soft skills suggérées</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {["Leadership", "Persévérance", "Organisation", "Communication", "Résolution de problèmes"].map(
                (skill) => (
                  <span
                    key={skill}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] tracking-tight text-[#050A18]/70"
                  >
                    {skill}
                  </span>
                )
              )}
            </div>
          </div>
          <button
            type="button"
            className="w-fit rounded-sm border border-slate-200 px-6 py-3 text-xs font-semibold tracking-tight text-[#050A18] shadow-sm"
          >
            Valider l&apos;offre
          </button>
        </div>
      </div>
    </main>
  );
}
