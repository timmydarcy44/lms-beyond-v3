import Link from "next/link";

export default function ProduitLmsPage() {
  return (
    <main className="min-h-screen bg-[#070B1B] px-6 py-16 text-white">
      <div className="mx-auto w-full max-w-5xl space-y-8">
        <div className="inline-flex rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.25em]">
          Beyond LMS
        </div>
        <h1 className="text-4xl font-semibold tracking-tight">Plateforme LMS neuro-adaptee</h1>
        <p className="max-w-3xl text-white/75">
          Activez l efficience cognitive avec des parcours, flashcards, ancrages memoriels et un pilotage adapte au
          profil apprenant.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/login?from=lms"
            className="rounded-full bg-[#FF6B00] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#e55f00]"
          >
            Se connecter au LMS
          </Link>
          <Link
            href="/particuliers/login"
            className="rounded-full border border-white/25 px-6 py-3 text-sm font-semibold text-white/90 transition hover:bg-white/10"
          >
            Connexion particuliers
          </Link>
        </div>
      </div>
    </main>
  );
}

