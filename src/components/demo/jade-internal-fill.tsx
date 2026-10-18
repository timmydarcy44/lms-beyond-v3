"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import EnterpriseSidebar from "@/components/EnterpriseSidebar";
import SidebarExpert from "@/components/SidebarExpert";
import { ClubLayout } from "@/components/club/club-layout";
import { TuteurShell } from "@/components/tuteur/tuteur-shell";
import { PartenaireLayout } from "@/components/partenaire/partenaire-layout";
import { isJadeDemoEmail } from "@/lib/demo/jade-account";
import { jadeDemoPage, type JadeDemoPage } from "@/lib/demo/jade-page-catalog";
import { partenaireClub, partenaireProfile } from "@/lib/mocks/partenaire-data";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const STUDENT_LINKS = [
  ["Formations", "/dashboard/student/learning/formations"],
  ["Parcours", "/dashboard/student/learning/parcours"],
  ["Exercices", "/dashboard/student/learning/exercices"],
  ["Ressources", "/dashboard/student/learning/ressources"],
  ["Connect", "/dashboard/student/learning/beyond-connect"],
] as const;

function Surface({ page }: { page: JadeDemoPage }) {
  const light = page.tone === "light";
  return (
    <div className={light ? "px-4 py-6 text-[#1D1D1F] sm:px-8" : "px-4 py-6 text-[#F4F5F7] sm:px-8"}>
      <p className={light ? "text-xs font-bold text-[#86868B]" : "text-xs font-bold text-[#9096A3]"}>{page.kicker}</p>
      <h1 className="mt-1 text-3xl font-extrabold tracking-tight">{page.title}</h1>
      <p className={light ? "mt-2 text-sm text-[#6E6E73]" : "mt-2 text-sm text-[#B5BAC6]"}>Compte démo Jade Martin</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {page.stats.map((stat) => (
          <article key={stat.label} className={light ? "rounded-[26px] border border-[#E5E5EA] bg-white p-4" : "rounded-[26px] border border-[#262A36] bg-[#12141A] p-4"}>
            <p className={light ? "text-xs font-bold text-[#86868B]" : "text-xs font-bold text-[#9096A3]"}>{stat.label}</p>
            <p className="mt-2 text-2xl font-extrabold">{stat.value}</p>
          </article>
        ))}
      </div>
      <div className={light ? "mt-6 overflow-x-auto rounded-[26px] border border-[#E5E5EA] bg-white" : "mt-6 overflow-x-auto rounded-[26px] border border-[#262A36] bg-[#12141A]"}>
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className={light ? "text-[#86868B]" : "text-[#9096A3]"}>
              {page.columns.map((column) => (
                <th key={column} className="px-4 py-3 text-xs font-bold">{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {page.rows.map((row) => (
              <tr key={row.cells.join("|")} className={light ? "border-t border-[#E5E5EA]" : "border-t border-[#262A36]"}>
                {row.cells.map((cell, index) => (
                  <td key={`${cell}-${index}`} className="px-4 py-3 font-medium">
                    {index === 0 && row.href ? (
                      <Link href={row.href} className="font-bold underline-offset-2 hover:underline">{cell}</Link>
                    ) : cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Frame({ page }: { page: JadeDemoPage }) {
  if (page.chrome === "expert") {
    return (
      <div className="min-h-screen bg-[#070b1f]">
        <SidebarExpert />
        <div className="lg:pl-[276px]"><Surface page={page} /></div>
      </div>
    );
  }
  if (page.chrome === "entreprise") {
    return (
      <div className="min-h-screen bg-[#07080B]">
        <EnterpriseSidebar />
        <div className="lg:pl-[248px]"><Surface page={page} /></div>
      </div>
    );
  }
  if (page.chrome === "club") {
    return (
      <ClubLayout activeItem={page.title}>
        <Surface page={page} />
      </ClubLayout>
    );
  }
  if (page.chrome === "partenaire") {
    return (
      <PartenaireLayout club={partenaireClub} partner={partenaireProfile} activeItem={page.title}>
        <Surface page={page} />
      </PartenaireLayout>
    );
  }
  if (page.chrome === "tuteur") {
    return (
      <TuteurShell tutorName="Jade Martin">
        <Surface page={page} />
      </TuteurShell>
    );
  }
  if (page.chrome === "student") {
    return (
      <div className="min-h-screen bg-[#F5F5F7] lg:pl-56">
        <aside className="fixed inset-y-0 left-0 hidden w-56 flex-col gap-1 border-r border-[#E5E5EA] bg-white p-4 lg:flex">
          <p className="px-3 pb-2 text-xs font-bold text-[#86868B]">Promo NTC 2026</p>
          {STUDENT_LINKS.map(([label, href]) => (
            <Link key={href} href={href} className="rounded-2xl px-3 py-2 text-sm font-bold text-[#1D1D1F] hover:bg-[#F5F5F7]">{label}</Link>
          ))}
        </aside>
        <Surface page={page} />
      </div>
    );
  }
  return <Surface page={page} />;
}

export function JadeInternalFill({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "/";
  const page = jadeDemoPage(pathname);
  const [jade, setJade] = useState<boolean | null>(null);

  useEffect(() => {
    if (!page) return;
    let ignore = false;
    const browser = createSupabaseBrowserClient();
    if (!browser) {
      setJade(false);
      return;
    }
    browser.auth.getUser().then(({ data }) => {
      if (!ignore) setJade(isJadeDemoEmail(data.user?.email));
    }).catch(() => {
      if (!ignore) setJade(false);
    });
    return () => {
      ignore = true;
    };
  }, [pathname, page]);

  if (!page || jade === false) return children;
  if (jade === null) return children;
  return <Frame page={page} />;
}
