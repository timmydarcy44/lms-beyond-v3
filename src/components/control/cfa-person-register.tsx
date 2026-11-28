"use client";

import { useEffect, useState } from "react";

import { formatRegisterDateTime, type CfaRegisterEntry } from "@/lib/cfa/person-register";

export function CfaPersonRegister({ personId }: { personId: string }) {
  const [entries, setEntries] = useState<CfaRegisterEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void fetch(`/api/super-admin/crm/cfa/register?id=${encodeURIComponent(personId)}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        setEntries(Array.isArray(json.entries) ? json.entries : []);
      })
      .catch(() => {
        if (!cancelled) setEntries([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [personId]);

  return (
    <section className="rounded-[24px] border border-[#1A2340] bg-[#111831] p-5">
      <h3 className="text-sm font-extrabold tracking-wide text-[#F2F4FA]">Registre</h3>
      <p className="mt-1 text-xs text-[#6C7593]">Chaque échange et chaque modification, avec date, heure et responsable.</p>
      {loading ? <p className="mt-4 text-sm text-[#9AA3BD]">Chargement du registre…</p> : null}
      {!loading && entries.length === 0 ? (
        <p className="mt-4 text-sm text-[#9AA3BD]">Aucun événement enregistré pour l’instant.</p>
      ) : null}
      <ol className="mt-4 space-y-3">
        {entries.map((entry) => (
          <li key={entry.id} className="rounded-2xl border border-[#1A2340] bg-[#0B1122] px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8DB8FF]">
              {formatRegisterDateTime(entry.occurredAt)}
            </p>
            <p className="mt-1 text-sm font-extrabold text-[#F2F4FA]">{entry.title}</p>
            {entry.detail ? <p className="mt-0.5 text-sm text-[#C9D2E8]">{entry.detail}</p> : null}
            <p className="mt-1 text-xs text-[#9AA3BD]">
              {entry.actorName}
              {entry.actorEmail ? ` · ${entry.actorEmail}` : ""}
            </p>
            {entry.proofUrl ? (
              <a
                href={entry.proofUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block text-xs font-semibold text-[#5EDCC3] underline"
              >
                Ouvrir la preuve
              </a>
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  );
}
