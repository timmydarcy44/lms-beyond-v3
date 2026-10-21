"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { TuteurShell } from "@/components/tuteur/tuteur-shell";

type Resource = { id: string; category: string; title: string; description: string | null; format: string | null; action: string; external?: boolean; url?: string | null };
type Payload = {
  featured: { id: string; title: string; description: string | null; action: string; url?: string | null } | null;
  badge: { done: number; total: number; steps: Array<{ id: string; label: string; done: boolean }> };
  resources: Resource[];
  referent: { conversationId: string; label: string } | null;
};

const filters = [
  ["tout", "Tout"],
  ["guide", "Guides"],
  ["template", "Modèles"],
  ["aid", "Aides employeur"],
  ["rules", "Réglementation"],
  ["video", "Vidéos"],
] as const;

const chip: Record<string, string> = {
  guide: "bg-[#3A1E0E] text-[#FFB085]",
  template: "bg-[#132A4D] text-[#8DB8FF]",
  aid: "bg-[#0E2A1D] text-[#6BE39B]",
  rules: "bg-[#36301A] text-[#F2CF6B]",
  video: "bg-[#2A2452] text-[#B9AFFF]",
};

export function TutorResourcesPage() {
  const params = useSearchParams();
  const router = useRouter();
  const cat = params.get("cat") ?? "tout";
  const [data, setData] = useState<Payload | null>(null);

  useEffect(() => {
    void fetch("/api/tuteur/ressources", { cache: "no-store" }).then(async (res) => {
      if (res.ok) setData(await res.json());
    });
  }, []);

  async function openFeatured() {
    if (!data?.featured) return;
    await fetch(`/api/tuteur/ressources/${data.featured.id}/view`, { method: "POST" });
    if (data.featured.url) window.open(data.featured.url, "_blank", "noopener");
  }

  const present = new Set((data?.resources ?? []).map((item) => item.category));
  const shownFilters = filters.filter(([id]) => id === "tout" || present.has(id));
  const visibleResources = (data?.resources ?? []).filter((item) => cat === "tout" || item.category === cat);

  return (
    <TuteurShell tutorName="">
      <h1 className="text-4xl font-extrabold tracking-tight">Ressources</h1>
      <p className="mt-2 text-sm text-[var(--tutor-text-3)]">Tout pour accompagner votre alternant sereinement</p>
      {!data ? <div className="mt-6 h-48 animate-pulse rounded-[32px] bg-[#12141A]" /> : null}
      {data ? (
        <>
          <div className="mt-6 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
            {data.featured ? (
              <article className="relative overflow-hidden rounded-[32px] bg-[#FF7A2F] p-6 text-[#1A0C04]">
                <span className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/25" aria-hidden />
                <span className="pointer-events-none absolute -left-8 bottom-0 h-24 w-24 rounded-full bg-black/10" aria-hidden />
                <span className="rounded-full bg-[#1A0C04] px-3 py-1 text-xs font-bold text-[#FFB085]">À lire en premier</span>
                <h2 className="mt-4 max-w-md text-[clamp(28px,4vw,34px)] font-extrabold leading-tight">{data.featured.title}</h2>
                <p className="mt-3 max-w-md text-sm">{data.featured.description}</p>
                <button type="button" className="mt-5 rounded-full bg-[#1A0C04] px-4 py-2 text-sm font-bold text-[#F4F5F7]" onClick={() => void openFeatured()}>{data.featured.action}</button>
              </article>
            ) : null}
            <article className="rounded-[28px] bg-[#12141A] p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F2CF6B] text-[#1A0C04]">★</span>
                <span>
                  <span className="block font-extrabold">Badge Tuteur Byound</span>
                  <span className="text-sm text-[#9096A3]">{data.badge.done} étapes sur {data.badge.total}</span>
                </span>
              </div>
              <ul className="mt-4 space-y-3">
                {data.badge.steps.map((step) => (
                  <li key={step.id} className={`flex items-center gap-2 text-sm ${step.done ? "text-[#9096A3] line-through" : ""}`}>
                    <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${step.done ? "bg-[#0E2A1D] text-[#6BE39B]" : "border border-[#9096A3]"}`}>{step.done ? "✓" : ""}</span>
                    {step.label}
                  </li>
                ))}
              </ul>
            </article>
          </div>
          <div className="mt-5 flex flex-wrap gap-2" role="tablist">
            {shownFilters.map(([id, label]) => (
              <button key={id} type="button" role="tab" aria-selected={cat === id} className={`rounded-full px-4 py-2 text-sm font-semibold ${cat === id ? "bg-[#F4F5F7] text-[#07080B]" : "bg-[#1E2130]"}`} onClick={() => router.push(id === "tout" ? "/dashboard/tuteur/ressources" : `/dashboard/tuteur/ressources?cat=${id}`)}>{label}</button>
            ))}
          </div>
          {visibleResources.length === 0 ? <p className="mt-6 text-sm text-[var(--tutor-text-3)]">Aucune ressource publiée pour le moment.</p> : null}
          <div className="mt-4 grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(240px,1fr))]">
            {visibleResources.map((item) => {
              const inner = (
                <>
                  <span className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-extrabold ${chip[item.category] ?? chip.guide}`}>{item.title.slice(0, 1)}</span>
                  <h3 className="mt-4 font-extrabold">{item.title}</h3>
                  <p className="mt-2 text-sm text-[#9096A3]">{item.description}</p>
                  <p className="mt-4 flex items-center justify-between text-sm"><span className="text-[#9096A3]">{item.format}</span><span className="font-bold text-[#FFB085]">{item.action}</span></p>
                </>
              );
              return item.external && item.url ? (
                <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer" className="rounded-[24px] bg-[#12141A] p-4">{inner}</a>
              ) : (
                <article key={item.id} className="rounded-[24px] bg-[#12141A] p-4">{inner}</article>
              );
            })}
          </div>
          {data.referent ? (
            <Link href={`/dashboard/tuteur/messagerie/${data.referent.conversationId}`} className="mt-4 flex items-center justify-between rounded-[24px] border border-[#262A36] px-4 py-4">
              <span>
                <span className="block font-extrabold">Une question sur votre rôle de tuteur ?</span>
                <span className="text-sm text-[#9096A3]">Écrivez directement au formateur référent de votre alternant.</span>
              </span>
              <span aria-hidden>›</span>
            </Link>
          ) : null}
        </>
      ) : null}
    </TuteurShell>
  );
}
