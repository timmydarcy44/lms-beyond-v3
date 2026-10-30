"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import EnterpriseSidebar from "@/components/EnterpriseSidebar";

type TutorSpace = {
  firstName: string;
  lastName: string;
  email: string;
  jobTitle: string;
  alternants: { id: string; firstName: string; lastName: string; status: string }[];
};

export default function EntrepriseTutorSpacePage() {
  const params = useParams<{ tutorId: string }>();
  const [tutor, setTutor] = useState<TutorSpace | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    void fetch(`/api/dashboard/entreprise/tuteurs/${params.tutorId}`, { credentials: "include" })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) setError(result.error || "Cet espace est indisponible.");
        else setTutor(result.tutor);
      })
      .catch(() => setError("Cet espace est indisponible."));
  }, [params.tutorId]);

  return (
    <div className="min-h-screen bg-[#F4F4F1] text-[#07080B]">
      <EnterpriseSidebar />
      <main className="px-4 py-8 pb-28 sm:px-6 lg:px-8 lg:pl-[264px]">
        <Link href="/dashboard/entreprise/tuteurs" className="text-sm font-semibold text-[#3A3D45]">Espaces tuteurs</Link>
        {error ? <p className="mt-6 rounded-[26px] bg-white p-6">{error}</p> : null}
        {!tutor && !error ? <div className="mt-6 h-36 animate-pulse rounded-[26px] bg-white" /> : null}
        {tutor ? (
          <>
            <h1 className="mt-4 text-[40px] font-extrabold leading-none tracking-[-1.2px]">Espace de {tutor.firstName}</h1>
            <p className="mt-2 text-[15px] text-[#3A3D45]">{[tutor.firstName, tutor.lastName].filter(Boolean).join(" ")}{tutor.jobTitle ? ` · ${tutor.jobTitle}` : ""}</p>
            <section className="mt-6 rounded-[26px] bg-white p-6">
              <h2 className="text-[16px] font-extrabold">Alternants suivis</h2>
              {tutor.alternants.length ? (
                <ul className="mt-4 space-y-3">
                  {tutor.alternants.map((alternant) => (
                    <li key={alternant.id} className="flex items-center justify-between gap-3 rounded-2xl bg-[#F4F4F1] px-4 py-3">
                      <span className="font-semibold">{[alternant.firstName, alternant.lastName].filter(Boolean).join(" ") || "Alternant"}</span>
                      <span className="text-sm text-[#3A3D45]">{alternant.status}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-[#3A3D45]">Aucun alternant n'est suivi pour le moment.</p>
              )}
            </section>
          </>
        ) : null}
      </main>
    </div>
  );
}
