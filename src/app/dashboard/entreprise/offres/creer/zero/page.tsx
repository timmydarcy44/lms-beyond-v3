export default function CreateOfferZeroPage() {
  return (
    <main className="min-h-screen bg-white px-6 py-12 text-[#050A18]">
      <div className="mx-auto max-w-4xl space-y-8">
        <header className="space-y-3">
          <p className="text-xs tracking-tight text-[#050A18]/50">Créer une offre</p>
          <h1 className="text-3xl font-semibold tracking-tight">Formulaire vide</h1>
          <p className="text-sm text-[#050A18]/60">
            Décrivez librement le poste, les missions et les soft skills recherchés.
          </p>
        </header>
        <form className="grid gap-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <label className="space-y-2 text-sm">
            <span className="text-[#050A18]/70">Titre du poste</span>
            <input className="w-full rounded-xl border border-slate-200 px-4 py-3 text-[#050A18]" placeholder="Commercial B2B" />
          </label>
          <label className="space-y-2 text-sm">
            <span className="text-[#050A18]/70">Missions principales</span>
            <textarea
              className="min-h-[140px] w-full rounded-xl border border-slate-200 px-4 py-3 text-[#050A18]"
              placeholder="Décrivez les missions, objectifs, périmètre..."
            />
          </label>
          <label className="space-y-2 text-sm">
            <span className="text-[#050A18]/70">Soft skills recherchées</span>
            <textarea
              className="min-h-[120px] w-full rounded-xl border border-slate-200 px-4 py-3 text-[#050A18]"
              placeholder="Ex: Leadership, Résilience, Organisation..."
            />
          </label>
          <button
            type="button"
            className="w-fit rounded-sm border border-slate-200 px-6 py-3 text-xs font-semibold tracking-tight text-[#050A18] shadow-sm"
          >
            Enregistrer l&apos;offre
          </button>
        </form>
      </div>
    </main>
  );
}
