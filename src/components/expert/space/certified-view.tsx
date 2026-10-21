"use client";

import { useState } from "react";
import { toast } from "sonner";

import { startCertification } from "@/app/dashboard/expert/space-actions";
import { ExpertPageFrame, ExpertPageHeader, ExpertPrimaryButton } from "@/components/expert/expert-ui";
import type { ExpertCertificationModel } from "@/lib/expert/space-server";

export function CertifiedView({ certification }: { certification: ExpertCertificationModel }) {
  const [pending, setPending] = useState(false);
  const next = certification.steps.find((step) => !step.done);
  const publicUrl = `https://www.byound.fr${certification.publicPath}`;
  const linkedin = `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${encodeURIComponent("Byound Certified")}&organizationName=${encodeURIComponent("Byound")}&issueYear=${new Date().getFullYear()}&certUrl=${encodeURIComponent(publicUrl)}`;

  const download = () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="520"><rect width="900" height="520" rx="36" fill="#E2B94E"/><text x="48" y="90" font-size="28" font-family="Arial" fill="#2A2312">Byound Certified</text><text x="48" y="400" font-size="42" font-family="Arial" fill="#2A2312">${certification.name}</text><text x="48" y="450" font-size="20" font-family="Arial" fill="#2A2312">N° ${certification.badgeId}</text></svg>`;
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    link.download = "byound-certified.svg";
    link.click();
  };

  return (
    <ExpertPageFrame>
      <ExpertPageHeader title="Byound Certified" subtitle="Votre certification d'experte et votre badge public" />
      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        {certification.certified ? (
          <article className="relative min-h-[290px] overflow-hidden rounded-[32px] bg-[linear-gradient(135deg,#F7DD8A,#E2B94E_45%,#B8913A)] p-6 text-[#2A2312]">
            <span className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full bg-white/30" aria-hidden />
            <span className="pointer-events-none absolute bottom-0 right-16 h-36 w-36 rounded-full bg-white/20" aria-hidden />
            <div className="relative flex h-full min-h-[250px] flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-lg font-extrabold">Byound Certified</p>
                  <p className="text-sm">{certification.specialty}</p>
                </div>
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#2A2312] text-lg text-[#F2CF6B]">★</span>
              </div>
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-[30px] font-extrabold tracking-[-0.03em]">{certification.name}</p>
                  <p className="text-sm">N° {certification.badgeId}</p>
                </div>
                <p className="text-right text-sm">Valide jusqu'en<br /><span className="text-2xl font-extrabold">{certification.expiresYear}</span></p>
              </div>
            </div>
          </article>
        ) : (
          <article className="rounded-[32px] bg-[#12141A] p-6">
            <h2 className="text-[32px] font-extrabold tracking-[-0.04em]">Devenir Byound Certified</h2>
            <p className="mt-2 text-sm text-[#B5BAC6]">Déposez votre dossier pour publier un badge vérifiable.</p>
            <ol className="mt-5 space-y-2 text-sm text-[#DADDE4]">
              {certification.steps.slice(0, 3).map((step) => <li key={step.id}>{step.label}</li>)}
            </ol>
            <div className="mt-6">
              <ExpertPrimaryButton onClick={() => { setPending(true); void startCertification().then(() => { setPending(false); toast.success("Dossier enregistré"); }); }}>{pending ? "Envoi…" : "Déposer mon dossier"}</ExpertPrimaryButton>
            </div>
          </article>
        )}
        {certification.certified ? (
          <section className="rounded-[28px] bg-[#12141A] p-5">
            <StatusPillLike>Badge actif et public</StatusPillLike>
            <h2 className="mt-4 text-2xl font-extrabold">Montrez votre certification</h2>
            <p className="mt-2 text-sm text-[#B5BAC6]">Votre badge est vérifiable en ligne : n'importe qui peut contrôler qu'il est authentique et à jour.</p>
            <a href={linkedin} className="mt-5 inline-flex h-11 items-center rounded-full bg-[#2FD08A] px-5 text-sm font-extrabold text-[#04140C]">Ajouter à LinkedIn</a>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={() => void navigator.clipboard.writeText(publicUrl).then(() => toast.success("Lien copié"))} className="h-11 rounded-full bg-[#1E2130] px-4 text-sm font-bold">Copier le lien</button>
              <button type="button" onClick={download} className="h-11 rounded-full bg-[#1E2130] px-4 text-sm font-bold">Télécharger</button>
            </div>
          </section>
        ) : <section className="rounded-[28px] bg-[#12141A] p-5 text-sm text-[#B5BAC6]">Le badge public apparaît ici une fois la certification obtenue.</section>}
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <section className="rounded-[28px] bg-[#12141A] p-5">
          <h2 className="mb-4 text-base font-extrabold">Votre parcours de certification</h2>
          <ol className="space-y-4">
            {certification.steps.map((step, index) => {
              const current = step.id === next?.id;
              return (
                <li key={step.id} className="flex gap-3">
                  <span className="flex flex-col items-center">
                    <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-extrabold ${step.done ? "bg-[#2FD08A] text-[#04140C]" : current ? "border-2 border-[#F2CF6B] text-[#F2CF6B]" : "border border-[#262A36] text-[#9096A3]"}`}>{step.done ? "✓" : index + 1}</span>
                    {index < certification.steps.length - 1 ? <span className={`mt-1 h-8 w-0.5 ${step.done ? "bg-[#2FD08A]" : "bg-[#262A36]"}`} /> : null}
                  </span>
                  <span className="flex min-w-0 flex-1 items-start justify-between gap-3">
                    <span>
                      <span className="block text-sm font-extrabold">{step.label}</span>
                      <span className="block text-xs text-[#9096A3]">{step.detail}</span>
                    </span>
                    {step.at ? <span className="text-sm text-[#DADDE4]">{step.at}</span> : null}
                  </span>
                </li>
              );
            })}
          </ol>
        </section>
        <section className="rounded-[28px] bg-[#12141A] p-5">
          <h2 className="mb-4 text-base font-extrabold">Ce que le badge vous apporte</h2>
          <ul className="space-y-4 text-sm">
            <li><span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-[#2FD08A]" />Badge vérifiable. Authentifié sur une page publique.</li>
            <li><span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-[#8DB8FF]" />Visible sur LinkedIn, dans la signature et sur le lien du badge.</li>
          </ul>
        </section>
      </div>
    </ExpertPageFrame>
  );
}

function StatusPillLike({ children }: { children: string }) {
  return <span className="inline-flex rounded-full bg-[#0F2E20] px-3 py-1 text-xs font-bold text-[#7EEBB5]">{children}</span>;
}
