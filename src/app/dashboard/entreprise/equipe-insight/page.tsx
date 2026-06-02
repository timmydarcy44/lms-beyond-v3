"use client";

import EnterpriseSidebar from "@/components/EnterpriseSidebar";
import { RadarEquipeClient } from "@/components/radar-equipe/radar-equipe-client";

export default function EquipeInsightPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <EnterpriseSidebar />
      <main className="relative min-h-screen px-4 py-8 sm:px-6 lg:px-10 lg:pl-[280px]">
        <RadarEquipeClient variant="light" />
      </main>
    </div>
  );
}
