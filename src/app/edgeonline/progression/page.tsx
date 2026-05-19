export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function EdgeOnlineProgressionPage() {
  return (
    <div className="pb-10">
      <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/45">Progression</div>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">Votre progression</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/50">
        À venir : progression globale, temps passé, compétences validées, séquences terminées.
      </p>
    </div>
  );
}

