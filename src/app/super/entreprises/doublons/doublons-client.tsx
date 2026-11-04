"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader, RolePill } from "@/components/control/ui";
import type { DuplicatePair } from "@/lib/control/companies";

function Card({
  item,
  keep,
  onKeep,
}: {
  item: DuplicatePair["left"];
  keep: boolean;
  onKeep: () => void;
}) {
  return (
    <div className="rounded-[22px] border p-4" style={{ borderColor: keep ? "#6E5BFF" : "#1A2340", background: "#111831" }}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link href={`/super/entreprises/${item.id}`} className="text-lg font-bold">{item.name}</Link>
          <p className="mt-1 text-sm text-[#9AA3BD]">{[item.city || "Ville non renseignée", item.siret ? `SIRET ${item.siret}` : "SIRET non renseigné", item.sector].filter(Boolean).join(" · ")}</p>
        </div>
        <button type="button" onClick={onKeep} className="rounded-full px-3 py-1 text-sm" style={{ background: keep ? "#6E5BFF" : "#1A2340" }}>
          {keep ? "Fiche conservée" : "Conserver"}
        </button>
      </div>
      <div className="mt-3 flex gap-1">
        {item.roleBusiness ? <RolePill role="business" /> : null}
        {item.roleCfa ? <RolePill role="cfa" /> : null}
      </div>
      <p className="mt-3 text-sm text-[#C9D2E8]">Business : {item.roleBusiness ? item.businessLabel : "—"}</p>
      <p className="text-sm text-[#C9D2E8]">CFA : {item.roleCfa ? `${item.apprentices} apprentis, ${item.offers} offres, ${item.candidates} candidats` : "—"}</p>
      <p className="text-sm text-[#9AA3BD]">Responsable : {item.owner}</p>
    </div>
  );
}

export function DoublonsClient({ pairs, schemaReady }: { pairs: DuplicatePair[]; schemaReady: boolean }) {
  const router = useRouter();
  const [keep, setKeep] = useState<Record<string, string>>({});
  const [confirm, setConfirm] = useState<Record<string, boolean>>({});
  const [error, setError] = useState("");
  const [pending, setPending] = useState("");

  async function merge(pair: DuplicatePair) {
    const keepId = keep[pair.id] ?? pair.left.id;
    const dropId = keepId === pair.left.id ? pair.right.id : pair.left.id;
    setPending(pair.id);
    setError("");
    const response = await fetch("/api/super/companies/merge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keepId, dropId, confirm: true }),
    });
    const result = (await response.json()) as { error?: string };
    setPending("");
    if (!response.ok) {
      setError(result.error || "Fusion impossible");
      return;
    }
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-[1100px] space-y-6 px-6 py-8">
      <PageHeader
        title="Doublons"
        subtitle="Même SIRET, ou même nom et même ville. La fusion est manuelle et garde les fiches d'origine."
        actions={<Link href="/super/entreprises" className="text-sm text-[#9AA3BD]">Retour aux entreprises</Link>}
      />
      {!schemaReady ? <p className="text-sm text-[#F2CF6B]">Colle le script SQL des fiches entreprise avant de fusionner. La liste ci-dessous est une lecture seule.</p> : null}
      {error ? <p className="text-sm text-[#FF8AA0]">{error}</p> : null}
      {pairs.length === 0 ? <p className="rounded-[22px] border border-[#1A2340] bg-[#111831] px-6 py-12 text-center text-sm text-[#9AA3BD]">Aucun doublon proposé.</p> : null}
      {pairs.map((pair) => {
        const keepId = keep[pair.id] ?? pair.left.id;
        return (
          <section key={pair.id} className="space-y-3">
            <p className="text-sm text-[#9AA3BD]">{pair.reason === "siret" ? "Même SIRET" : "Même nom et même ville"}</p>
            <div className="grid gap-3 md:grid-cols-2">
              <Card item={pair.left} keep={keepId === pair.left.id} onKeep={() => setKeep({ ...keep, [pair.id]: pair.left.id })} />
              <Card item={pair.right} keep={keepId === pair.right.id} onKeep={() => setKeep({ ...keep, [pair.id]: pair.right.id })} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={confirm[pair.id] === true} onChange={(event) => setConfirm({ ...confirm, [pair.id]: event.target.checked })} />
              Je confirme la fusion. Les comptes, apprentis, offres et lignes de pipeline restent en place.
            </label>
            <button
              type="button"
              disabled={!schemaReady || confirm[pair.id] !== true || pending === pair.id}
              onClick={() => void merge(pair)}
              className="rounded-full bg-[#6E5BFF] px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
            >
              Fusionner
            </button>
          </section>
        );
      })}
    </div>
  );
}
