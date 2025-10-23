export default function TestStyles() {
  return (
    <main className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Test Tailwind</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm text-neutral-300">Carte 1</p>
          <button className="mt-3 rounded-lg bg-white/10 px-3 py-2 text-sm hover:bg-white/20">
            Bouton
          </button>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm text-neutral-300">Carte 2</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm text-neutral-300">Carte 3</p>
        </div>
      </div>
      <p className="text-xs text-neutral-400">Si tu vois des cartes sombres arrondies → Tailwind OK.</p>
    </main>
  );
}
