"use client";

import Link from "next/link";
import SidebarExpert from "@/components/SidebarExpert";
import { useExpertAccess } from "@/components/expert/expert-access-provider";
import { expertSetPasswordPath } from "@/lib/expert/signup-redirect";
import { expertReviewStatusLabel } from "@/lib/expert/expert-access";

export default function ExpertSettingsPage() {
  const { expert, isApproved } = useExpertAccess();

  return (
    <div className="min-h-screen bg-[#F7F7F5] text-[#050505]">
      <SidebarExpert restricted={!isApproved} />
      <main className="min-h-screen pl-[260px]">
        <div className="mx-auto max-w-4xl px-6 py-10 pb-24">
          <header className="mb-8">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#635BFF]">Paramètres</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Mon compte</h1>
          </header>

          <section className="space-y-4">
            <div className="rounded-[28px] border border-[#050505]/8 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#050505]/40">Compte</p>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-[#050505]/50">Email</dt>
                  <dd className="font-medium">{expert.email ?? "—"}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-[#050505]/50">Statut profil</dt>
                  <dd className="font-medium">{expertReviewStatusLabel(expert.review_status)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-[#050505]/50">Profil actif</dt>
                  <dd className="font-medium">{expert.is_active ? "Oui" : "Non"}</dd>
                </div>
              </dl>
            </div>

            <div className="rounded-[28px] border border-[#050505]/8 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium">Sécurité</p>
              <p className="mt-2 text-sm text-[#050505]/55">Modifiez votre mot de passe à tout moment.</p>
              <Link
                href={expertSetPasswordPath()}
                className="mt-4 inline-flex rounded-2xl border border-[#635BFF]/20 bg-[#635BFF]/8 px-4 py-2.5 text-sm font-medium text-[#635BFF] hover:bg-[#635BFF]/12"
              >
                Modifier mon mot de passe
              </Link>
            </div>

            <div className="rounded-[28px] border border-[#050505]/8 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium">Support EDGE</p>
              <a
                href="mailto:cockpit@edgebs.fr"
                className="mt-2 inline-block text-sm text-[#635BFF] hover:underline"
              >
                cockpit@edgebs.fr
              </a>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
