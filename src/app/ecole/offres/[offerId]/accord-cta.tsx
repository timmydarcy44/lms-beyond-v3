"use client";

import { useState } from "react";
import { ActionNotice } from "@/components/cfa/action-notice";

export function AccordCta({
  token,
  companyId,
  offerId,
  kind,
}: {
  token: string;
  companyId: string;
  offerId: string;
  kind: "need" | "offer";
}) {
  const [notice, setNotice] = useState<{ state: "working" | "done" | "error"; title: string; detail: string } | null>(null);

  async function accept() {
    setNotice({ state: "working", title: "Votre accord", detail: "La présentation part vers l'entreprise." });
    const response = await fetch("/api/cfa/accord", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        companyId,
        needId: kind === "need" ? offerId : undefined,
        jobOfferId: kind === "offer" ? offerId : undefined,
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setNotice({ state: "error", title: "Accord non enregistré", detail: String(data.error || "Réessayez dans un instant.") });
      return;
    }
    setNotice({
      state: "done",
      title: "Accord enregistré",
      detail: data.emailed === false ? "Votre accord est enregistré. L'entreprise n'a pas encore d'e-mail de contact." : "Votre présentation est envoyée à l'entreprise.",
    });
  }

  return (
    <>
      <button type="button" className="mt-6 h-12 rounded-full bg-[#1C1C1E] px-5 text-sm font-semibold text-white" onClick={() => void accept()}>Je donne mon accord</button>
      <ActionNotice open={Boolean(notice)} state={notice?.state ?? "working"} title={notice?.title ?? ""} detail={notice?.detail} onClose={() => setNotice(null)} />
    </>
  );
}
