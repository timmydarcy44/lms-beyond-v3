import { Metadata } from "next";
import { BeyondNoteMarketingPage } from "@/components/landing/beyond-note-page";

export const metadata: Metadata = {
  title: "Beyond Note - Scanner et transformer vos documents avec l'IA | Beyond LMS",
  description: "Scannez vos documents et transformez-les avec l'intelligence artificielle : fiches de révision, reformulation, traduction, schémas, audio et plus encore.",
};

export default function BeyondNotePageRoute() {
  return <BeyondNoteMarketingPage />;
}


