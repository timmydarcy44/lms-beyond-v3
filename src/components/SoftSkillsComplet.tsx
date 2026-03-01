"use client";

import React from "react";
import Link from "next/link";

export default function SoftSkillsComplet() {
  return (
    <div className="min-h-screen bg-[#0B0D12] text-white">
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap");
      `}</style>
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-6 py-16 font-['Inter']">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
          <div className="text-[12px] uppercase tracking-[0.3em] text-white/50">
            Soft Skills — Test complet
          </div>
          <h1 className="mt-3 text-3xl font-semibold">Le test complet arrive ici</h1>
          <p className="mt-3 text-sm text-white/70">
            Le questionnaire long sera injecté dans ce composant. Le design est prêt
            pour accueillir plus de 50 questions.
          </p>
          <Link
            href="/dashboard/apprenant"
            className="mt-6 inline-flex rounded-full bg-white/80 px-4 py-2 text-xs font-semibold text-black"
          >
            Retour au dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
