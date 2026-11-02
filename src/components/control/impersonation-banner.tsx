"use client";

import { useState } from "react";
import { REASON_CODES } from "@/lib/control/constants";

export function ImpersonationBanner({
  orgName,
  mode,
  expiresAt,
  orgId,
}: {
  orgName: string;
  mode: "read" | "write";
  expiresAt: number;
  orgId: string;
}) {
  const [open, setOpen] = useState(false);
  const [reasonCode, setReasonCode] = useState("client_request");
  const [reasonText, setReasonText] = useState("");
  const [notifyAdmin, setNotifyAdmin] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const remaining = Math.max(0, expiresAt - Date.now());
  const minutes = Math.ceil(remaining / 60000);

  return (
    <>
      <div className="sticky top-0 z-[80] flex flex-wrap items-center justify-between gap-3 bg-[#6E5BFF] px-4 py-2 text-sm text-white">
        <p>Vous êtes dans l'espace de {orgName}, en tant que Byound · {mode === "write" ? "Modification" : "Lecture seule"} · {minutes} min restantes</p>
        <div className="flex gap-2">
          {mode === "read" ? (
            <button type="button" onClick={() => setOpen(true)} className="rounded-full bg-white px-3 py-1 text-[#2A215F]">Passer en modification</button>
          ) : null}
          <button
            type="button"
            className="rounded-full border border-white/40 px-3 py-1"
            onClick={async () => {
              const response = await fetch("/api/super/impersonation/end", { method: "POST" });
              const json = (await response.json()) as { orgId?: string | null };
              window.location.href = json.orgId ? `/super/organisations/${json.orgId}` : "/super/organisations";
            }}
          >
            Quitter l'espace
          </button>
        </div>
      </div>
      {open ? (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-black/50 p-4">
          <form
            className="w-full max-w-md rounded-[28px] bg-[#111831] p-6 text-[#F4F7FF]"
            onSubmit={async (event) => {
              event.preventDefault();
              const response = await fetch("/api/super/impersonation", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orgId, mode: "write", reasonCode, reasonText, notifyAdmin }),
              });
              const json = (await response.json()) as { error?: string };
              if (!response.ok) {
                setError(json.error || "Activation impossible");
                return;
              }
              window.location.reload();
            }}
          >
            <h2 className="text-xl font-bold">Passer en modification</h2>
            <p className="mt-2 text-sm text-[#C9D2E8]">Vos actions seront enregistrées dans le journal de {orgName}, avec la mention Byound pour {orgName}.</p>
            <label className="mt-4 block text-sm">Motif
              <select value={reasonCode} onChange={(event) => setReasonCode(event.target.value)} className="mt-1 w-full rounded-2xl border border-[#26304F] bg-[#0B1122] px-3 py-2">
                {REASON_CODES.map((reason) => <option key={reason.code} value={reason.code}>{reason.label}</option>)}
              </select>
            </label>
            <label className="mt-3 block text-sm">Précision
              <textarea required value={reasonText} onChange={(event) => setReasonText(event.target.value)} className="mt-1 min-h-20 w-full rounded-2xl border border-[#26304F] bg-[#0B1122] p-3" />
            </label>
            <label className="mt-3 flex items-center gap-2 text-sm">
              <input type="checkbox" checked={notifyAdmin} onChange={(event) => setNotifyAdmin(event.target.checked)} />
              Prévenir l'administrateur du compte par e-mail
            </label>
            <p className="mt-3 text-xs text-[#9AA6C2]">Toujours inaccessible : données Byound Care, résultats individuels des tests, messages privés, mots de passe, moyens de paiement.</p>
            {error ? <p className="mt-2 text-sm text-[#FF8A9B]">{error}</p> : null}
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setOpen(false)} className="rounded-full px-4 py-2">Annuler</button>
              <button type="submit" className="rounded-full bg-white px-4 py-2 font-semibold text-[#0A0F1E]">Activer pour 30 min</button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
