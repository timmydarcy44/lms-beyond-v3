"use client";

import Link from "next/link";

export default function ParticuliersSuccessPage() {
  return (
    <main
      className="min-h-screen flex items-center justify-center text-white px-6"
      style={{ background: "linear-gradient(to right, #C7224F, #F17D21)" }}
    >
      <div className="max-w-xl text-center">
        <h1 className="text-4xl font-semibold mb-4">Merci, votre abonnement est actif ✅</h1>
        <p className="text-white/80 mb-8">
          Vous pouvez maintenant accéder à toutes les fonctionnalités Nevo.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/app-landing/particuliers"
            className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-white text-[#be1354] font-semibold"
          >
            Retour à Nevo
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-6 py-3 rounded-full border border-white/40 text-white font-semibold"
          >
            Se connecter
          </Link>
        </div>
      </div>
    </main>
  );
}
