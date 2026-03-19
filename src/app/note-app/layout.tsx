import { Metadata } from "next";
import { DyslexiaModeProvider } from "@/components/apprenant/dyslexia-mode-provider";
import { NoteAppAuthGate } from "@/components/beyond-note/note-app-auth-gate";

export const metadata: Metadata = {
  manifest: "/beyond-note-manifest.json",
};

export default async function BeyondNoteAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DyslexiaModeProvider>
      <div className="overflow-x-hidden w-full max-w-[100vw]">
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
          <NoteAppAuthGate>
            <main>{children}</main>
          </NoteAppAuthGate>
        </div>
      </div>
    </DyslexiaModeProvider>
  );
}









