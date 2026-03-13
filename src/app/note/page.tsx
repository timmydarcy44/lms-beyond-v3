import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Beyond Note - Prise de notes intelligente | Beyond",
  description: "Organisez et structurez vos notes efficacement avec Beyond Note, une solution intelligente pour capturer, synthétiser et retrouver vos informations.",
};

export default function NotePage() {
  redirect("/note/login?next=/note-app");
}
