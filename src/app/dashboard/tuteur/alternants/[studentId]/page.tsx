"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";

import { TutorFicheView } from "@/components/tuteur/tutor-neo";

export default function TutorFichePage() {
  const { studentId } = useParams<{ studentId: string }>();
  return (
    <Suspense fallback={null}>
      <TutorFicheView studentId={studentId} />
    </Suspense>
  );
}
