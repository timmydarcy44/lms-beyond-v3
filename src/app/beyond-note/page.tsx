import { Metadata } from "next";
import { BeyondNotePage } from "@/components/beyond-note/beyond-note-page";

export const metadata: Metadata = {
  title: "Beyond Note - Prise de notes intelligente | Beyond",
  description: "Organisez et structurez vos notes efficacement avec Beyond Note, une solution intelligente pour capturer, synthétiser et retrouver vos informations.",
};

export default function NotePage() {
  return <BeyondNotePage />;
}
