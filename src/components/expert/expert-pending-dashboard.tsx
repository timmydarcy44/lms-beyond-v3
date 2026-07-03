"use client";

import Link from "next/link";
import { Check, Clock, Lock, Mail, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import SidebarExpert from "@/components/SidebarExpert";
import { useExpertAccess } from "@/components/expert/expert-access-provider";
import { edgeCertificationLabel } from "@/lib/expert/expert-certification";

const LOCKED_FEATURES = [
  "Missions disponibles",
  "Matching entreprises",
  "Statistiques",
  "Planning",
  "Publication profil public",
] as const;

export function ExpertPendingDashboard() {
  const { expert, emailConfirmed } = useExpertAccess();
  const fullName = `${expert.first_name ?? ""} ${expert.last_name ?? ""}`.trim() || "Formateur";

  const timeline = [
    { label: "Profil créé", done: true },
    { label: "Email confirmé", done: emailConfirmed },
    { label: "Vérification du dossier", done: false },
    { label: "Validation pédagogique", done: false },
    { label: "Publication dans le réseau EDGE", done: false },
    { label: "Accès complet à l'espace formateur", done: false },
  ];

  return (
    <div className="min-h-screen bg-[#F7F7F5] text-[#050505]">
      <SidebarExpert restricted />
      <main className="min-h-screen pl-[260px]">
        <div className="mx-auto max-w-5xl px-6 py-10 pb-24">
          <header className="mb-8">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#635BFF]">Espace formateur</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              Votre profil est en cours de validation
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-[#050505]/60">
              Bonjour {fullName} — notre équipe examine votre dossier avant publication dans le réseau EDGE.
            </p>
          </header>

          <section className="rounded-[28px] border border-[#050505]/8 bg-white p-6 shadow-sm sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#050505]/40">Avancement</p>
            <div className="mt-5 space-y-3">
              {timeline.map((step) => (
                <div
                  key={step.label}
                  className={cn(
                    "flex items-center gap-4 rounded-2xl border px-4 py-3.5",
                    step.done
                      ? "border-[#635BFF]/20 bg-[#635BFF]/[0.06]"
                      : "border-[#050505]/8 bg-[#F7F7F5]",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                      step.done ? "bg-[#635BFF] text-white" : "bg-[#050505]/5 text-[#050505]/35",
                    )}
                  >
                    {step.done ? <Check className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                  </span>
                  <span className={cn("text-sm", step.done ? "font-medium text-[#050505]" : "text-[#050505]/50")}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-6 rounded-[28px] border border-[#635BFF]/15 bg-[linear-gradient(135deg,rgba(99,91,255,0.06),white)] p-6">
            <div className="flex items-start gap-3">
              <Sparkles className="mt-0.5 h-5 w-5 text-[#635BFF]" aria-hidden />
              <div>
                <p className="text-sm font-semibold">EDGE Certified</p>
                <p className="mt-1 text-sm text-[#050505]/55">
                  {expert.wants_certification
                    ? "Votre demande EDGE Certified est bien enregistrée. Statut : en attente de validation."
                    : "Vous pourrez rejoindre le parcours EDGE Certified après validation de votre profil."}
                </p>
                <p className="mt-2 text-xs text-[#050505]/40">Statut actuel : {edgeCertificationLabel(expert)}</p>
                <Link
                  href="/dashboard/expert/certification"
                  className="mt-3 inline-flex text-sm font-medium text-[#635BFF] hover:underline"
                >
                  Découvrir EDGE Certified →
                </Link>
              </div>
            </div>
          </section>

          <section className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="rounded-[28px] border border-[#050505]/8 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold">Actions disponibles</p>
              <div className="mt-4 space-y-2">
                {[
                  { href: "/dashboard/expert/profile", label: "Consulter mon profil", primary: true },
                  { href: "/dashboard/expert/profile", label: "Modifier mon profil" },
                  { href: "/dashboard/expert/profile", label: "Compléter mes informations" },
                  { href: "/dashboard/expert/documents", label: "Ajouter CV / justificatifs" },
                  { href: "/dashboard/expert/certification", label: "Découvrir EDGE Certified" },
                ].map((action) => (
                  <Link
                    key={action.label}
                    href={action.href}
                    className={cn(
                      "flex items-center justify-between rounded-2xl border px-4 py-3 text-sm transition",
                      action.primary
                        ? "border-[#635BFF]/15 bg-[#635BFF]/5 font-medium text-[#050505] hover:bg-[#635BFF]/10"
                        : "border-[#050505]/8 text-[#050505]/70 hover:bg-[#F7F7F5]",
                    )}
                  >
                    {action.label}
                  </Link>
                ))}
                <a
                  href="mailto:cockpit@edgebs.fr?subject=Question%20candidature%20EDGE"
                  className="flex items-center gap-2 rounded-2xl border border-[#050505]/8 px-4 py-3 text-sm text-[#050505]/70 hover:bg-[#F7F7F5]"
                >
                  <Mail className="h-4 w-4 text-[#635BFF]" />
                  Contacter EDGE
                </a>
              </div>
            </div>

            <div className="rounded-[28px] border border-[#050505]/8 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold">Fonctionnalités verrouillées</p>
              <p className="mt-1 text-xs text-[#050505]/50">Accessibles après validation de votre dossier.</p>
              <div className="mt-4 space-y-2">
                {LOCKED_FEATURES.map((label) => (
                  <div
                    key={label}
                    className="flex items-center justify-between rounded-2xl border border-[#050505]/6 bg-[#F7F7F5] px-4 py-3 text-sm text-[#050505]/40"
                  >
                    <span>{label}</span>
                    <Lock className="h-4 w-4 shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
