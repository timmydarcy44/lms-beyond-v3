import { Suspense } from "react";
import { BeyondNoteHomePage } from "@/components/beyond-note/beyond-note-home-page";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <BeyondNoteHomePage />
    </Suspense>
  );
}








