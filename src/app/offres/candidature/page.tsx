import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Manrope } from "next/font/google";
import { ApplicationGuide } from "@/components/offres/application-guide";
import { getSession } from "@/lib/auth/session";
import { loadHomeApplication } from "@/lib/offres/application-home";
import { getServiceRoleClient } from "@/lib/supabase/server";

const manrope = Manrope({ subsets: ["latin"], weight: ["500", "600", "700", "800"] });

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Votre candidature — Byound",
  robots: { index: false, follow: false },
};

export default async function CandidaturePage() {
  const session = await getSession();
  if (!session?.id) redirect("/login");
  const db = getServiceRoleClient();
  const application = db ? await loadHomeApplication(db, session.id) : null;

  return (
    <div className={`${manrope.className} min-h-dvh bg-[#070C1C] text-white`}>
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between px-5 py-6">
        <span className="text-sm font-extrabold">Byound</span>
        <Link href={application?.slug ? `/offres/${application.slug}` : "/offres"} className="text-sm text-white/70">
          {application?.slug ? "Voir l'offre" : "Offres"}
        </Link>
      </header>
      <main className="mx-auto w-full max-w-3xl px-5 pb-16">
        {application ? (
          <ApplicationGuide application={application} />
        ) : (
          <div className="rounded-[32px] bg-[#15171E] p-6">
            <h1 className="text-3xl font-extrabold tracking-[-0.04em]">Aucune candidature en cours</h1>
            <p className="mt-3 text-sm text-white/70">Choisissez une offre pour commencer.</p>
            <Link href="/offres" className="mt-6 inline-flex h-11 items-center rounded-full bg-[#6E5BFF] px-4 text-sm font-semibold">
              Voir les offres
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
