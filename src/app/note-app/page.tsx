import { Metadata } from "next";
import { BeyondNoteHomePage } from "@/components/beyond-note/beyond-note-home-page";

export const metadata: Metadata = {
  title: "nevo. - Bibliothèque",
  description: "Accédez à vos documents et capturez un nouveau cours en quelques secondes.",
};

export default function BeyondNoteAppPage() {
  return <BeyondNoteHomePage />;
}








