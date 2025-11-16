import { Metadata } from "next";
import { BeyondNotePageContent } from "@/components/beyond-note/beyond-note-page";

export const metadata: Metadata = {
  title: "Beyond Note - Scanner et transformer vos documents",
  description: "Scannez vos documents et transformez-les avec l'IA : fiches de révision, reformulation, traduction, schémas, audio et plus encore.",
};

export default function BeyondNotePage() {
  return <BeyondNotePageContent />;
}


