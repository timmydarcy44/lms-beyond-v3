"use client";

import { useParams } from "next/navigation";

import { TutorEvaluationDetail } from "@/components/tuteur/tutor-records";

export default function Page() {
  const { id } = useParams<{ id: string }>();
  return <TutorEvaluationDetail id={id} />;
}
