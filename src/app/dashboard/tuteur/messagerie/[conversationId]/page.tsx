"use client";

import { useParams } from "next/navigation";

import { TutorMessages } from "@/components/tuteur/tutor-messages";

export default function Page() {
  const { conversationId } = useParams<{ conversationId: string }>();
  return <TutorMessages conversationId={conversationId} />;
}
