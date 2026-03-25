import { Suspense } from "react";
import { BeyondNoteHomePage } from "@/components/beyond-note/beyond-note-home-page";

export default function Page() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <BeyondNoteHomePage />
    </Suspense>
  );
}








