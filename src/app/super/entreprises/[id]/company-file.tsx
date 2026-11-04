"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AccountFile } from "@/components/control/account-file";
import { EmptyState, SegmentedFilter } from "@/components/control/chrome";
import { RolePill } from "@/components/control/ui";
import type { loadAccountDetail } from "@/lib/control/load";
import type { CompanyListItem } from "@/lib/control/companies";

type Detail = Awaited<ReturnType<typeof loadAccountDetail>>;
type CfaTab = "apprentis" | "contrats" | "offres" | "tuteurs";

export function CompanyFile({
  company,
  detail,
  initialPart,
  initialTab,
}: {
  company: CompanyListItem;
  detail: Detail | null;
  initialPart?: string;
  initialTab?: string;
}) {
  const router = useRouter();
  const both = company.roleBusiness && company.roleCfa;
  const [part, setPart] = useState(initialPart === "cfa" || (!company.roleBusiness && company.roleCfa) ? "cfa" : "business");
  const [cfaTab, setCfaTab] = useState<CfaTab>("apprentis");
  const [cfa, setCfa] = useState<{
    apprentices: Array<{ applicationId: string; firstName: string; lastName: string; placementStatus: string }>;
    tutors: Array<{ id: string; first_name: string; last_name: string; email?: string }>;
    offers: Array<{ id: string; title?: string }>;
    needs: Array<{ id: string; title?: string }>;
  } | null>(null);

  useEffect(() => {
    if (!company.cfaCompanyId || part !== "cfa") return;
    void fetch(`/api/super-admin/crm/cfa/companies/${company.cfaCompanyId}`, { cache: "no-store" })
      .then((response) => response.json())
      .then((result) => {
        setCfa({
          apprentices: result.apprentices ?? [],
          tutors: result.tutors ?? [],
          offers: result.offers ?? [],
          needs: result.needs ?? [],
        });
      })
      .catch(() => setCfa({ apprentices: [], tutors: [], offers: [], needs: [] }));
  }, [company.cfaCompanyId, part]);

  function choose(next: "business" | "cfa") {
    setPart(next);
    router.replace(`/super/entreprises/${company.id}?partie=${next}`);
  }

  return (
    <div className="mx-auto max-w-[1240px] px-6 py-8">
      <p className="mb-3 text-sm text-[#9AA3BD]">
        <Link href="/super/entreprises">Entreprises</Link>
      </p>
      <header className="mb-6">
        <h1 className="text-[36px] font-extrabold tracking-[-0.8px]">{company.name}</h1>
        <p className="mt-1 text-sm text-[#9AA3BD]">{[company.city, company.sector, company.siret ? `SIRET ${company.siret}` : ""].filter(Boolean).join(" · ")}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {company.roleBusiness ? <RolePill role="business" /> : null}
          {company.roleCfa ? <RolePill role="cfa" /> : null}
          {both && part === "business" ? (
            <button type="button" onClick={() => choose("cfa")} className="text-sm text-[#5EDCC3]">
              Aussi entreprise d'accueil ({company.apprentices} apprentis)
            </button>
          ) : null}
          {both && part === "cfa" ? (
            <button type="button" onClick={() => choose("business")} className="text-sm text-[#C4BAFF]">
              Aussi cliente Business
            </button>
          ) : null}
        </div>
      </header>

      {part === "business" ? (
        detail?.account ? (
          <AccountFile detail={detail} embedded initialTab={initialTab} />
        ) : (
          <EmptyState title={company.roleBusiness ? `${company.businessLabel}. Le compte client n'est pas encore ouvert.` : "Cette fiche n'a pas le rôle Business."} />
        )
      ) : (
        <div className="space-y-4">
          <SegmentedFilter
            value={cfaTab}
            onChange={(id) => setCfaTab(id as CfaTab)}
            items={[
              { id: "apprentis", label: "Apprentis", count: cfa?.apprentices.length ?? company.apprentices },
              { id: "contrats", label: "Contrats" },
              { id: "offres", label: "Offres", count: (cfa?.offers.length ?? 0) + (cfa?.needs.length ?? 0) || company.offers },
              { id: "tuteurs", label: "Tuteurs", count: cfa?.tutors.length },
            ]}
          />
          {cfaTab === "apprentis" ? <People title="Aucun apprenti placé." rows={(cfa?.apprentices ?? []).map((item) => ({ id: item.applicationId, label: `${item.firstName} ${item.lastName}`.trim(), hint: item.placementStatus === "active" ? "En poste" : "Proposé" }))} /> : null}
          {cfaTab === "contrats" ? <EmptyState title="Aucun contrat enregistré pour cette entreprise." /> : null}
          {cfaTab === "offres" ? (
            <People
              title="Aucune offre d'alternance."
              rows={[
                ...(cfa?.needs ?? []).map((item) => ({ id: item.id, label: item.title || "Besoin", hint: "Besoin" })),
                ...(cfa?.offers ?? []).map((item) => ({ id: item.id, label: item.title || "Offre", hint: "Offre" })),
              ]}
            />
          ) : null}
          {cfaTab === "tuteurs" ? <People title="Aucun tuteur." rows={(cfa?.tutors ?? []).map((item) => ({ id: item.id, label: `${item.first_name} ${item.last_name}`.trim(), hint: item.email }))} /> : null}
        </div>
      )}
    </div>
  );
}

function People({ rows, title }: { rows: Array<{ id: string; label: string; hint?: string }>; title: string }) {
  if (!rows.length) return <EmptyState title={title} />;
  return (
    <ul className="divide-y divide-[#1A2340] rounded-[22px] border border-[#1A2340] bg-[#111831]">
      {rows.map((row) => (
        <li key={row.id} className="flex items-center justify-between px-4 py-3 text-sm">
          <span>{row.label || "Sans nom"}</span>
          {row.hint ? <span className="text-[#9AA3BD]">{row.hint}</span> : null}
        </li>
      ))}
    </ul>
  );
}
