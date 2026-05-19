"use client";

import { useState } from "react";

type Tab = "profil" | "alternance";

export function SchoolStudentEcoleDetailTabs(props: {
  profileTab: React.ReactNode;
  alternanceTab: React.ReactNode;
}) {
  const [tab, setTab] = useState<Tab>("profil");

  return (
    <div className="space-y-4">
      <div className="flex gap-1 rounded-2xl border border-[#E5E5EA] bg-white p-1 shadow-sm">
        <button
          type="button"
          onClick={() => setTab("profil")}
          className={`min-h-[44px] flex-1 rounded-xl px-3 py-2.5 text-sm font-semibold transition sm:px-4 ${
            tab === "profil" ? "bg-[#1D1D1F] text-white shadow-sm" : "text-[#86868B] hover:bg-[#F5F5F7]"
          }`}
        >
          Profil
        </button>
        <button
          type="button"
          onClick={() => setTab("alternance")}
          className={`min-h-[44px] flex-1 rounded-xl px-3 py-2.5 text-sm font-semibold transition sm:px-4 ${
            tab === "alternance" ? "bg-[#1D1D1F] text-white shadow-sm" : "text-[#86868B] hover:bg-[#F5F5F7]"
          }`}
        >
          <span className="hidden sm:inline">Administratif & alternance</span>
          <span className="sm:hidden">Admin & alt.</span>
        </button>
      </div>
      <p className="text-center text-xs leading-relaxed text-[#86868B]">
        {tab === "profil"
          ? "Vue synthétique : identité, compétences, wallet et suivi."
          : "Statut CFA, date de naissance, permis B, puis entreprise d’accueil et tuteur en entreprise."}
      </p>
      {tab === "profil" ? props.profileTab : props.alternanceTab}
    </div>
  );
}
