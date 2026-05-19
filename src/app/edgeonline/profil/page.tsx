import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function EdgeOnlineProfilPage() {
  return (
    <div className="pb-10">
      <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/45">Profil</div>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">Votre profil</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/50">
        À venir : objectifs, préférences, historique, export de validations.
      </p>
      <div className="mt-6">
        <Link href="/login" className="text-sm font-semibold text-white/70 underline-offset-4 hover:text-white hover:underline">
          Se connecter / gérer mon compte →
        </Link>
      </div>
    </div>
  );
}

