"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { AppleSuccessOverlay } from "@/components/expert/apple-success-overlay";
import { EmptyState, ExpertPageFrame, ExpertPageHeader, ExpertPrimaryButton } from "@/components/expert/expert-ui";
import { centsToInput } from "@/lib/entreprise/offer-conditions";
import { DEFAULT_CARE_PRESTATIONS, prestationPriceLabel, type CarePrestation } from "@/lib/expert/care-prestations";

const field = "h-12 w-full rounded-2xl border border-[#1E2130] bg-[#12141A] px-4 text-sm text-[#F4F5F7] outline-none";

export function CarePrestationsBoard() {
  const search = useSearchParams();
  const [list, setList] = useState<CarePrestation[]>(DEFAULT_CARE_PRESTATIONS);
  const [draftLabel, setDraftLabel] = useState("");
  const [draftAmount, setDraftAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState<{ title: string; subtitle?: string } | null>(null);
  const showNew = search.get("nouveau") === "1";

  const load = async () => {
    const res = await fetch("/api/expert/care/prestations", { cache: "no-store" });
    const json = await res.json();
    if (Array.isArray(json.prestations)) setList(json.prestations);
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (!hash) return;
    document.getElementById(hash)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [list]);

  const add = async () => {
    if (!draftLabel.trim()) {
      toast.error("Indiquez le nom de la prestation.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/expert/care/prestations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: draftLabel, amount: draftAmount }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Ajout impossible");
      setList(json.prestations);
      setDraftLabel("");
      setDraftAmount("");
      setSuccess({ title: "Prestation ajoutée", subtitle: "Elle est disponible dans le menu et à la facturation." });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ajout impossible");
    } finally {
      setBusy(false);
    }
  };

  const savePrice = async (item: CarePrestation, amount: string, free: boolean) => {
    setBusy(true);
    try {
      const res = await fetch("/api/expert/care/prestations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, amount, free }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Enregistrement impossible");
      setList(json.prestations);
      setSuccess({ title: "Tarif mis à jour", subtitle: item.label });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Enregistrement impossible");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (item: CarePrestation) => {
    setBusy(true);
    try {
      const res = await fetch("/api/expert/care/prestations", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Suppression impossible");
      setList(json.prestations);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Suppression impossible");
    } finally {
      setBusy(false);
    }
  };

  const catalog = useMemo(() => list, [list]);

  return (
    <ExpertPageFrame>
      <AppleSuccessOverlay
        open={Boolean(success)}
        title={success?.title ?? ""}
        subtitle={success?.subtitle}
        onClose={() => setSuccess(null)}
      />
      <ExpertPageHeader
        title="Mes prestations"
        subtitle="Ces tarifs sont repris à la facturation. Vous pouvez les ajuster au moment d’émettre une facture."
      />
      <div className="space-y-3">
        {catalog.map((item) => (
          <PrestationRow
            key={item.id}
            item={item}
            busy={busy}
            onSave={savePrice}
            onRemove={item.builtin ? undefined : () => void remove(item)}
          />
        ))}
      </div>
      <div id="nouveau" className="mt-8 rounded-[28px] bg-[#12141A] p-5">
        <p className="text-sm font-extrabold">Ajouter une prestation</p>
        <p className="mt-1 text-xs text-[#9096A3]">Laissez le prix vide pour un tarif libre, à renseigner à la facture.</p>
        <div className={`mt-4 grid gap-3 sm:grid-cols-[1fr_8rem_auto] ${showNew ? "ring-1 ring-[#FF4B4B]/40 rounded-2xl p-2" : ""}`}>
          <input className={field} placeholder="Nom de la prestation" value={draftLabel} onChange={(event) => setDraftLabel(event.target.value)} />
          <input className={field} placeholder="Prix €" inputMode="decimal" value={draftAmount} onChange={(event) => setDraftAmount(event.target.value)} />
          <ExpertPrimaryButton onClick={() => void add()}>{busy ? "…" : "Ajouter"}</ExpertPrimaryButton>
        </div>
      </div>
      {catalog.length === 0 ? <EmptyState title="Aucune prestation" text="Ajoutez votre première offre." /> : null}
    </ExpertPageFrame>
  );
}

function PrestationRow({
  item,
  busy,
  onSave,
  onRemove,
}: {
  item: CarePrestation;
  busy: boolean;
  onSave: (item: CarePrestation, amount: string, free: boolean) => Promise<void>;
  onRemove?: () => void;
}) {
  const [amount, setAmount] = useState(centsToInput(item.cents));
  const [free, setFree] = useState(item.cents == null);
  useEffect(() => {
    setAmount(centsToInput(item.cents));
    setFree(item.cents == null);
  }, [item.cents, item.id]);

  return (
    <article id={item.id} className="rounded-[24px] bg-[#12141A] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-extrabold">{item.label}</p>
          <p className="mt-1 text-xs text-[#9096A3]">{item.builtin ? "Catalogue Byound Care" : "Prestation personnelle"} · {prestationPriceLabel(free ? null : item.cents)}</p>
        </div>
        {onRemove ? (
          <button type="button" className="text-xs font-bold text-[#9096A3]" onClick={onRemove} disabled={busy}>
            Supprimer
          </button>
        ) : null}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-[#B5BAC6]">
          <input
            type="checkbox"
            checked={free}
            onChange={(event) => setFree(event.target.checked)}
          />
          Prix libre
        </label>
        {free ? null : (
          <input
            className={`${field} max-w-[9rem]`}
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            inputMode="decimal"
            aria-label={`Prix ${item.label}`}
          />
        )}
        <button
          type="button"
          disabled={busy}
          className="h-11 rounded-full bg-[#FF4B4B] px-5 text-sm font-extrabold text-[#04140C]"
          onClick={() => void onSave(item, amount, free)}
        >
          Enregistrer
        </button>
      </div>
    </article>
  );
}
