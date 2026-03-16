"use client";

export function AuthorBio({ author }: { author: string }) {
  return (
    <div className="rounded-2xl border border-[#E8E9F0] bg-white/80 backdrop-blur px-6 py-5 shadow-sm">
      <p className="text-xs uppercase tracking-[0.25em] text-[#be1354] font-semibold mb-2">Auteur</p>
      <p className="text-[#1A1A1A] font-semibold">{author}</p>
      <p className="text-sm text-[#6B7280] mt-2">
        L'équipe nevo. explore les meilleures pratiques pour l'apprentissage neuro-inclusif et les
        outils IA au service des étudiants.
      </p>
    </div>
  );
}
