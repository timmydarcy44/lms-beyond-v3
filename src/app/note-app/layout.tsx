import { Metadata } from "next";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { DyslexiaModeProvider } from "@/components/apprenant/dyslexia-mode-provider";

export const metadata: Metadata = {
  manifest: "/beyond-note-manifest.json",
};

export default async function BeyondNoteAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/app-landing/login?next=/note-app");
  }

  return (
    <DyslexiaModeProvider>
      <div className="overflow-x-hidden w-full max-w-[100vw]">
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
          <main>{children}</main>
        </div>
      </div>
    </DyslexiaModeProvider>
  );
}









