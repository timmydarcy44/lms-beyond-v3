"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CLUB_PACKS, CLUB_PACK_OPTIONS, CLUB_SECTEURS, CLUB_STATUTS } from "@/lib/club/club-packs";
import { upsertClubPartnerLocal } from "@/lib/club/club-partners-store";
import type { ClubPartner, ClubPartnerPack } from "@/lib/mocks/club-partners";
import { createPartner, updatePartner } from "@/lib/supabase/club-queries";

const fieldClass = "border-white/10 bg-white/5 text-white";

export type PartnerFormMode = "create" | "contract" | "offer" | "fiche";

type PartnerFormModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: PartnerFormMode;
  partner?: ClubPartner | null;
  clubId?: string | null;
  isDemo?: boolean;
  onSaved?: (partner: ClubPartner) => void;
};

const emptyForm = {
  nom: "",
  secteur: "Autre",
  adresse: "",
  contact_prenom: "",
  contact_nom: "",
  contact_email: "",
  contact_tel: "",
  statut: "Prospect",
  valeur: "",
  date_signature: "",
  renouvellement: "",
  modalite_paiement: "Virement",
  pack: "Bronze" as ClubPartnerPack,
  prestationsText: "",
};

function partnerToForm(partner?: ClubPartner | null) {
  if (!partner) return emptyForm;
  return {
    nom: partner.nom,
    secteur: partner.secteur || "Autre",
    adresse: partner.adresse ?? "",
    contact_prenom: partner.contact_prenom ?? "",
    contact_nom: partner.contact_nom ?? "",
    contact_email: partner.contact_email ?? "",
    contact_tel: partner.contact_tel ?? "",
    statut: String(partner.statut || "Prospect"),
    valeur: partner.valeur ? String(partner.valeur) : "",
    date_signature: partner.date_signature ?? "",
    renouvellement: partner.renouvellement === "—" ? "" : partner.renouvellement ?? "",
    modalite_paiement: partner.modalite_paiement ?? "Virement",
    pack: (partner.pack as ClubPartnerPack) || "Bronze",
    prestationsText: (partner.prestations ?? []).join("\n"),
  };
}

const titles: Record<PartnerFormMode, string> = {
  create: "Ajouter un partenaire",
  fiche: "Modifier la fiche partenaire",
  contract: "Modifier le contrat",
  offer: "Modifier l'offre",
};

export function PartnerFormModal({
  open,
  onOpenChange,
  mode,
  partner,
  clubId,
  isDemo = true,
  onSaved,
}: PartnerFormModalProps) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(partnerToForm(partner));
  }, [open, partner]);

  const packAvantages = useMemo(() => CLUB_PACKS[form.pack]?.avantages ?? [], [form.pack]);
  const showIdentity = mode === "create" || mode === "fiche";
  const showContact = mode === "create" || mode === "fiche";
  const showContract = mode === "create" || mode === "contract";
  const showOffer = mode === "create" || mode === "offer";

  const handlePackChange = (pack: ClubPartnerPack) => {
    const defaults = CLUB_PACKS[pack];
    setForm((prev) => ({
      ...prev,
      pack,
      valeur: prev.valeur || (defaults.prix ? String(defaults.prix) : prev.valeur),
      prestationsText: defaults.avantages.join("\n"),
    }));
  };

  const handleSave = async () => {
    if (showIdentity && !form.nom.trim()) {
      toast.error("Le nom de l'entreprise est obligatoire.");
      return;
    }
    if (showContact && form.contact_email && !form.contact_email.includes("@")) {
      toast.error("L'email du contact n'est pas valide.");
      return;
    }

    const prestations = form.prestationsText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const payload: ClubPartner = {
      ...(partner ?? {}),
      nom: form.nom.trim() || partner?.nom || "",
      secteur: form.secteur,
      adresse: form.adresse,
      contact_prenom: form.contact_prenom,
      contact_nom: form.contact_nom,
      contact_email: form.contact_email,
      contact_tel: form.contact_tel,
      statut: form.statut,
      valeur: Number(String(form.valeur).replace(/\s/g, "").replace(",", ".")) || 0,
      date_signature: form.date_signature,
      renouvellement: form.renouvellement || "—",
      modalite_paiement: form.modalite_paiement,
      pack: form.pack,
      prestations,
      slug: partner?.slug ?? "",
      logo_initiales: partner?.logo_initiales ?? "",
      logo_couleur: partner?.logo_couleur ?? "#8B1A2B",
    };

    setSaving(true);
    try {
      const saved = upsertClubPartnerLocal(payload);
      if (!isDemo && clubId) {
        const dbPayload = {
          nom: saved.nom,
          secteur: saved.secteur,
          contact_prenom: saved.contact_prenom,
          contact_nom: saved.contact_nom,
          contact_email: saved.contact_email,
          contact_tel: saved.contact_tel,
          statut: saved.statut,
          valeur: saved.valeur,
        };
        if (partner?.id && !String(partner.id).startsWith("demo-")) {
          await updatePartner(partner.id, dbPayload);
        } else if (mode === "create") {
          await createPartner(clubId, { ...dbPayload, colonne_tunnel: "prospects" });
        }
      }
      onSaved?.(saved);
      toast.success(mode === "create" ? "Partenaire ajouté" : "Modifications enregistrées");
      onOpenChange(false);
    } catch {
      toast.error("Impossible d'enregistrer pour le moment.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto bg-[#1A0A0D] text-white sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{titles[mode]}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {showIdentity ? (
            <section className="space-y-3">
              <div className="text-xs font-semibold uppercase tracking-wider text-white/40">Entreprise</div>
              <div className="space-y-1.5">
                <Label>Nom de l'entreprise</Label>
                <Input
                  value={form.nom}
                  onChange={(event) => setForm((prev) => ({ ...prev, nom: event.target.value }))}
                  placeholder="Ex. Brasserie du Port"
                  className={fieldClass}
                />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Secteur</Label>
                  <select
                    value={form.secteur}
                    onChange={(event) => setForm((prev) => ({ ...prev, secteur: event.target.value }))}
                    className="h-9 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white"
                  >
                    {CLUB_SECTEURS.map((secteur) => (
                      <option key={secteur} value={secteur} className="bg-[#1A0A0D]">
                        {secteur}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Statut</Label>
                  <select
                    value={form.statut}
                    onChange={(event) => setForm((prev) => ({ ...prev, statut: event.target.value }))}
                    className="h-9 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white"
                  >
                    {CLUB_STATUTS.map((statut) => (
                      <option key={statut} value={statut} className="bg-[#1A0A0D]">
                        {statut}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Adresse</Label>
                <Input
                  value={form.adresse}
                  onChange={(event) => setForm((prev) => ({ ...prev, adresse: event.target.value }))}
                  placeholder="Rue, ville"
                  className={fieldClass}
                />
              </div>
            </section>
          ) : null}

          {showContact ? (
            <section className="space-y-3">
              <div className="text-xs font-semibold uppercase tracking-wider text-white/40">Contact principal</div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Prénom</Label>
                  <Input
                    value={form.contact_prenom}
                    onChange={(event) => setForm((prev) => ({ ...prev, contact_prenom: event.target.value }))}
                    className={fieldClass}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Nom</Label>
                  <Input
                    value={form.contact_nom}
                    onChange={(event) => setForm((prev) => ({ ...prev, contact_nom: event.target.value }))}
                    className={fieldClass}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={form.contact_email}
                    onChange={(event) => setForm((prev) => ({ ...prev, contact_email: event.target.value }))}
                    placeholder="contact@entreprise.fr"
                    className={fieldClass}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Téléphone</Label>
                  <Input
                    value={form.contact_tel}
                    onChange={(event) => setForm((prev) => ({ ...prev, contact_tel: event.target.value }))}
                    placeholder="06 12 34 56 78"
                    className={fieldClass}
                  />
                </div>
              </div>
            </section>
          ) : null}

          {showContract ? (
            <section className="space-y-3">
              <div className="text-xs font-semibold uppercase tracking-wider text-white/40">Contrat</div>
              {mode === "contract" ? (
                <div className="space-y-1.5">
                  <Label>Statut</Label>
                  <select
                    value={form.statut}
                    onChange={(event) => setForm((prev) => ({ ...prev, statut: event.target.value }))}
                    className="h-9 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white"
                  >
                    {CLUB_STATUTS.map((statut) => (
                      <option key={statut} value={statut} className="bg-[#1A0A0D]">
                        {statut}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Montant HT / an (€)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.valeur}
                    onChange={(event) => setForm((prev) => ({ ...prev, valeur: event.target.value }))}
                    placeholder="5000"
                    className={fieldClass}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Modalité de paiement</Label>
                  <select
                    value={form.modalite_paiement}
                    onChange={(event) => setForm((prev) => ({ ...prev, modalite_paiement: event.target.value }))}
                    className="h-9 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white"
                  >
                    {["Virement", "Chèque", "Prélèvement", "Espèces", "Compensation"].map((item) => (
                      <option key={item} value={item} className="bg-[#1A0A0D]">
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Date de signature</Label>
                  <Input
                    type="date"
                    value={form.date_signature}
                    onChange={(event) => setForm((prev) => ({ ...prev, date_signature: event.target.value }))}
                    className={fieldClass}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Renouvellement</Label>
                  <Input
                    value={form.renouvellement}
                    onChange={(event) => setForm((prev) => ({ ...prev, renouvellement: event.target.value }))}
                    placeholder="Jan 2027 ou 2027-01-15"
                    className={fieldClass}
                  />
                </div>
              </div>
            </section>
          ) : null}

          {showOffer ? (
            <section className="space-y-3">
              <div className="text-xs font-semibold uppercase tracking-wider text-white/40">Offre / pack</div>
              <div className="space-y-1.5">
                <Label>Pack souscrit</Label>
                <select
                  value={form.pack}
                  onChange={(event) => handlePackChange(event.target.value as ClubPartnerPack)}
                  className="h-9 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white"
                >
                  {CLUB_PACK_OPTIONS.map((pack) => (
                    <option key={pack} value={pack} className="bg-[#1A0A0D]">
                      {pack}
                      {CLUB_PACKS[pack].prix ? ` — ${CLUB_PACKS[pack].prix.toLocaleString("fr-FR")}€` : ""}
                    </option>
                  ))}
                </select>
              </div>
              {packAvantages.length > 0 && form.pack !== "Personnalisé" ? (
                <p className="text-xs text-white/50">
                  Les prestations du pack {form.pack} sont préremplies. Vous pouvez les ajuster.
                </p>
              ) : null}
              <div className="space-y-1.5">
                <Label>Prestations incluses (une par ligne)</Label>
                <textarea
                  value={form.prestationsText}
                  onChange={(event) => setForm((prev) => ({ ...prev, prestationsText: event.target.value }))}
                  rows={5}
                  placeholder="Panneau bord terrain&#10;Logo site web"
                  className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30"
                />
              </div>
            </section>
          ) : null}
        </div>

        <DialogFooter>
          <button
            className="rounded-full bg-white/10 px-4 py-2 text-sm text-white"
            onClick={() => onOpenChange(false)}
          >
            Annuler
          </button>
          <button
            className="rounded-full px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            style={{ backgroundColor: "var(--club-primary, #8B1A2B)" }}
            onClick={() => void handleSave()}
            disabled={saving}
          >
            {saving ? "Enregistrement..." : mode === "create" ? "Ajouter" : "Enregistrer"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
