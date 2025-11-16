import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { DyslexiaModeProvider } from "@/components/apprenant/dyslexia-mode-provider";
import { BeyondNoteHeader } from "@/components/beyond-note/beyond-note-header";

export default async function BeyondNoteAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login?next=/beyond-note-app");
  }

  return (
    <DyslexiaModeProvider>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <BeyondNoteHeader user={session} />
        <main>{children}</main>
      </div>
    </DyslexiaModeProvider>
  );
}



