import Link from "next/link";

export default function ProduitConnectPage() {
  return (
    <main className="min-h-screen bg-[#070B1B] px-6 py-16 text-white">
      <div className="mx-auto w-full max-w-5xl space-y-8">
        <div className="inline-flex rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.25em]">
          Beyond Connect
        </div>
        <h1 className="text-4xl font-semibold tracking-tight">Recrutement predictif et matching</h1>
        <p className="max-w-3xl text-white/75">
          Pilotez vos viviers, la prospection et vos offres avec un matching comportemental oriente impact.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/login?from=connect"
            className="rounded-full bg-[#FF6B00] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#e55f00]"
          >
            Se connecter a Connect
          </Link>
        </div>
      </div>
    </main>
  );
}

