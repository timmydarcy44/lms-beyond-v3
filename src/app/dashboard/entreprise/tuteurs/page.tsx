"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import EnterpriseSidebar from "@/components/EnterpriseSidebar";

type TutorCard = {
  id: string;
  firstName: string;
  lastName: string;
  jobTitle: string;
  alternants: { id: string }[];
};

export default function EntrepriseTutorsPage() {
  const [state, setState] = useState<{ loading: boolean; error: string; hasApprentices: boolean; tutors: TutorCard[] }>({
    loading: true,
    error: "",
    hasApprentices: false,
    tutors: [],
  });

  useEffect(() => {
    void fetch("/api/dashboard/entreprise/tuteurs", { credentials: "include" })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) {
          setState({ loading: false, error: result.error || "Chargement impossible.", hasApprentices: false, tutors: [] });
          return;
        }
        setState({ loading: false, error: "", hasApprentices: Boolean(result.hasApprentices), tutors: result.tutors ?? [] });
      })
      .catch(() => setState({ loading: false, error: "Chargement impossible.", hasApprentices: false, tutors: [] }));
  }, []);

  return (
    <div className="min-h-screen bg-[#F4F4F1] text-[#07080B]">
      <EnterpriseSidebar />
      <main className="px-4 py-8 pb-28 sm:px-6 lg:px-8 lg:pl-[104px]">
        <h1 className="text-[40px] font-extrabold leading-none tracking-[-1.2px]">Espaces tuteurs</h1>
        <p className="mt-2 max-w-xl text-[15px] text-[#3A3D45]">Les maîtres d'apprentissage et les alternants qu'ils suivent.</p>
        {state.loading ? <div className="mt-6 h-36 animate-pulse rounded-[26px] bg-white" /> : null}
        {state.error ? <p className="mt-6 rounded-[26px] bg-white p-6 text-[15px]">{state.error}</p> : null}
        {!state.loading && !state.error && !state.hasApprentices ? (
          <p className="mt-6 rounded-[26px] bg-white p-6 text-[15px]">Les espaces tuteurs apparaissent lorsqu'un alternant est rattaché à l'entreprise.</p>
        ) : null}
        {!state.loading && state.hasApprentices && !state.tutors.length ? (
          <p className="mt-6 rounded-[26px] bg-white p-6 text-[15px]">Un alternant est rattaché, sans maître d'apprentissage pour le moment.</p>
        ) : null}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {state.tutors.map((tutor) => (
            <Link key={tutor.id} href={`/dashboard/entreprise/tuteurs/${tutor.id}`} className="rounded-[26px] bg-white p-6">
              <p className="text-[20px] font-extrabold">{tutor.firstName} {tutor.lastName}</p>
              {tutor.jobTitle ? <p className="mt-1 text-sm text-[#3A3D45]">{tutor.jobTitle}</p> : null}
              <p className="mt-4 text-sm font-semibold">{tutor.alternants.length} alternant{tutor.alternants.length > 1 ? "s" : ""}</p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
