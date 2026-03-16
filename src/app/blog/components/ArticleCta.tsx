"use client";

import Link from "next/link";

export function ArticleCta() {
  return (
    <div
      className="rounded-3xl p-8 text-white shadow-lg"
      style={{ background: "linear-gradient(135deg, #be1354, #F97316)" }}
    >
      <h3 className="text-2xl font-semibold mb-3">Prêt à révolutionner vos révisions ?</h3>
      <p className="text-white/80 mb-6">
        Essayez Neo gratuitement et transformez vos cours en formats qui respectent votre cerveau.
      </p>
      <Link
        href="/app-landing/signup"
        className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-white text-[#be1354] font-semibold"
      >
        Essayer Neo gratuitement
      </Link>
    </div>
  );
}
