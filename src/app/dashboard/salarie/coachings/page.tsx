"use client";

import SidebarSalarie from "@/components/SidebarSalarie";

export default function SalarieCoachingsPage() {
  return (
    <div className="min-h-screen bg-[#fbfbff] text-gray-900">
      <SidebarSalarie />
      <main className="relative mx-auto max-w-5xl px-6 py-10 pb-40 pl-[268px]">
        <header className="mb-8">
          <div className="text-xs font-black uppercase tracking-[0.22em] text-gray-500">Espace Salarié</div>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-950">Mes Coachings</h1>
          <p className="mt-2 text-sm text-gray-600">À venir — cette section affichera vos coachings planifiés et passés.</p>
        </header>
      </main>
    </div>
  );
}

