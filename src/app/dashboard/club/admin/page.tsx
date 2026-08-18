"use client";

import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { ClubLayout } from "@/components/club/club-layout";
import { ClubGuardGate, useClubGuard } from "@/components/club/use-club-guard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DEFAULT_CLUB_ADMIN_PROFILE,
  contractTypeLabel,
  getClubAdminProfile,
  saveClubAdminProfile,
  type ClubAdminProfile,
  type ClubContractType,
} from "@/lib/club/club-admin-profile";

const fieldClass = "border-white/10 bg-white/5 text-white";

export default function ClubAdminPage() {
  const status = useClubGuard();
  const [form, setForm] = useState<ClubAdminProfile>(DEFAULT_CLUB_ADMIN_PROFILE);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    setForm(getClubAdminProfile());
  }, []);

  const setField = <K extends keyof ClubAdminProfile>(key: K, value: ClubAdminProfile[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    if (!form.associationName.trim()) {
      toast.error("Le nom de l'association est obligatoire.");
      return;
    }
    saveClubAdminProfile(form);
    setSavedAt(new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }));
    toast.success("Informations administratives enregistrées");
  };

  if (status !== "allowed") {
    return <ClubGuardGate status={status}>{null}</ClubGuardGate>;
  }

  return (
    <ClubLayout activeItem="Administratif">
      <div className="p-4 lg:p-8 pt-6 lg:pt-8">
        <div className="max-w-4xl">
          <h1 className="text-lg font-semibold text-white lg:text-2xl">Éléments administratifs</h1>
          <p className="mt-2 max-w-3xl text-sm text-white/60">
            Ces informations apparaissent sur les PDF d’offres. Le type de contrat change le régime : le
            sponsoring est une prestation de visibilité (facture, TVA si assujetti) ; le mécénat est un don
            sans contrepartie commerciale disproportionnée (reçu fiscal, hors TVA).
          </p>

          <section className="mt-8 space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="text-xs font-semibold uppercase tracking-wider text-white/40">Association</div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Nom de l'association">
                <Input
                  value={form.associationName}
                  onChange={(event) => setField("associationName", event.target.value)}
                  placeholder="Association Football Club Rochelais"
                  className={fieldClass}
                />
              </Field>
              <Field label="Nom d'usage / enseigne">
                <Input
                  value={form.usageName}
                  onChange={(event) => setField("usageName", event.target.value)}
                  placeholder="Football Club Rochelais"
                  className={fieldClass}
                />
              </Field>
              <Field label="Numéro RNA (W…)">
                <Input
                  value={form.rna}
                  onChange={(event) => setField("rna", event.target.value)}
                  placeholder="W173000000"
                  className={fieldClass}
                />
              </Field>
              <Field label="SIRET">
                <Input
                  value={form.siret}
                  onChange={(event) => setField("siret", event.target.value)}
                  placeholder="123 456 789 00012"
                  className={fieldClass}
                />
              </Field>
              <Field label="Adresse du siège" className="sm:col-span-2">
                <Input
                  value={form.address}
                  onChange={(event) => setField("address", event.target.value)}
                  placeholder="Rue, lieu-dit"
                  className={fieldClass}
                />
              </Field>
              <Field label="Code postal">
                <Input
                  value={form.postalCode}
                  onChange={(event) => setField("postalCode", event.target.value)}
                  placeholder="17000"
                  className={fieldClass}
                />
              </Field>
              <Field label="Ville">
                <Input
                  value={form.city}
                  onChange={(event) => setField("city", event.target.value)}
                  placeholder="La Rochelle"
                  className={fieldClass}
                />
              </Field>
            </div>
          </section>

          <section className="mt-6 space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="text-xs font-semibold uppercase tracking-wider text-white/40">
              Contact & représentant légal
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Téléphone">
                <Input
                  value={form.phone}
                  onChange={(event) => setField("phone", event.target.value)}
                  placeholder="05 46 00 00 00"
                  className={fieldClass}
                />
              </Field>
              <Field label="Email">
                <Input
                  type="email"
                  value={form.email}
                  onChange={(event) => setField("email", event.target.value)}
                  placeholder="contact@club.fr"
                  className={fieldClass}
                />
              </Field>
              <Field label="Site web" className="sm:col-span-2">
                <Input
                  value={form.website}
                  onChange={(event) => setField("website", event.target.value)}
                  placeholder="https://www.club.fr"
                  className={fieldClass}
                />
              </Field>
              <Field label="Qualité du représentant">
                <Input
                  value={form.legalRepTitle}
                  onChange={(event) => setField("legalRepTitle", event.target.value)}
                  placeholder="Président"
                  className={fieldClass}
                />
              </Field>
              <Field label="Nom du représentant légal">
                <Input
                  value={form.legalRepName}
                  onChange={(event) => setField("legalRepName", event.target.value)}
                  placeholder="Prénom Nom"
                  className={fieldClass}
                />
              </Field>
            </div>
          </section>

          <section className="mt-6 space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="text-xs font-semibold uppercase tracking-wider text-white/40">
              Type de contrat & fiscalité
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {(["sponsoring", "mecenat"] as ClubContractType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      contractType: type,
                      vatLiable: type === "sponsoring" ? prev.vatLiable : false,
                    }))
                  }
                  className={`rounded-xl border p-4 text-left ${
                    form.contractType === type
                      ? "border-[#8B1A2B] bg-[#8B1A2B]/20"
                      : "border-white/10 bg-white/5"
                  }`}
                >
                  <div className="text-sm font-semibold text-white">{contractTypeLabel(type)}</div>
                  <p className="mt-1 text-xs text-white/55">
                    {type === "sponsoring"
                      ? "Contreparties de visibilité, facture, TVA si l’association est assujettie."
                      : "Don, reçu fiscal Cerfa 11580, pas de contrepartie commerciale disproportionnée."}
                  </p>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="flex items-center gap-2 text-sm text-white/80">
                <input
                  type="checkbox"
                  checked={form.vatLiable}
                  disabled={form.contractType === "mecenat"}
                  onChange={(event) => setField("vatLiable", event.target.checked)}
                />
                Assujetti à la TVA
              </label>
              <Field label="N° TVA intracommunautaire">
                <Input
                  value={form.vatNumber}
                  onChange={(event) => setField("vatNumber", event.target.value)}
                  placeholder="FRXX123456789"
                  disabled={!form.vatLiable}
                  className={fieldClass}
                />
              </Field>
            </div>
          </section>

          <section className="mt-6 space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="text-xs font-semibold uppercase tracking-wider text-white/40">Paiement</div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="IBAN" className="sm:col-span-2">
                <Input
                  value={form.iban}
                  onChange={(event) => setField("iban", event.target.value)}
                  placeholder="FR76 …"
                  className={fieldClass}
                />
              </Field>
              <Field label="BIC">
                <Input
                  value={form.bic}
                  onChange={(event) => setField("bic", event.target.value)}
                  placeholder="AGRIFRPP"
                  className={fieldClass}
                />
              </Field>
              <Field label="Banque">
                <Input
                  value={form.bank}
                  onChange={(event) => setField("bank", event.target.value)}
                  placeholder="Crédit Agricole Charente-Maritime"
                  className={fieldClass}
                />
              </Field>
            </div>
          </section>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              className="rounded-full px-5 py-2 text-sm font-semibold text-white"
              style={{ backgroundColor: "var(--club-primary)" }}
              onClick={handleSave}
            >
              Enregistrer
            </button>
            {savedAt ? <span className="text-xs text-white/40">Enregistré à {savedAt}</span> : null}
          </div>
        </div>
      </div>
    </ClubLayout>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}
