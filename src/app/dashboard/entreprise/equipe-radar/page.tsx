"use client";

import EnterpriseSidebar from "@/components/EnterpriseSidebar";
import { RadarEquipeClient } from "@/components/radar-equipe/radar-equipe-client";

function BeyondIaBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[#050505]" />
      <div className="absolute -bottom-56 -left-56 h-[720px] w-[720px] rounded-full bg-[radial-gradient(circle_at_center,rgba(217,70,239,0.35),rgba(99,102,241,0.15),rgba(2,6,23,0)_60%)] blur-2xl" />
      <div className="absolute -top-56 -right-56 h-[640px] w-[640px] rounded-full bg-[radial-gradient(circle_at_center,rgba(236,72,153,0.22),rgba(2,6,23,0)_62%)] blur-2xl" />
    </div>
  );
}

export default function EquipeRadarPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <BeyondIaBackground />
      <EnterpriseSidebar />
      <main className="relative min-h-screen px-8 py-10 pl-[280px]">
        <RadarEquipeClient />
      </main>
    </div>
  );
}
