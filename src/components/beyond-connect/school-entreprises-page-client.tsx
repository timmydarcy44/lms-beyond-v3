"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Briefcase, Mail, MapPin, Phone, User } from "lucide-react";

type CompanyRow = {
  id: string;
  name?: string | null;
  company_status?: string | null;
  step?: string | null;
  opco?: string | null;
  city?: string | null;
  zip_code?: string | null;
  siren?: string | null;
  naf_ape?: string | null;
  tranche_effectif?: string | null;
  sector?: string | null;
  creation_date?: string | null;
  contact_firstname?: string | null;
  contact_lastname?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
};

type SchoolEntreprisesPageClientProps = {
  companies: CompanyRow[];
};

export function SchoolEntreprisesPageClient({ companies }: SchoolEntreprisesPageClientProps) {
  const [selected, setSelected] = useState<CompanyRow | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const supabase = createSupabaseBrowserClient();

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2">
        {companies.map((company) => (
          <button
            key={company.id}
            type="button"
            onClick={() => setSelected(company)}
            className="rounded-[24px] border border-white/10 bg-[#1C1C1E] p-5 text-left text-white shadow-[0_16px_40px_rgba(15,23,42,0.12)]"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">{company.name || "Entreprise"}</p>
              <span className="rounded-full bg-white/10 px-2 py-1 text-xs text-white/70">
                {company.company_status || company.step || "Prospect"}
              </span>
            </div>
            <p className="mt-2 text-xs text-white/60">
              {company.city || "-"} {company.zip_code ? `(${company.zip_code})` : ""}
            </p>
            <p className="mt-1 text-xs text-white/50">OPCO : {company.opco || "À vérifier"}</p>
          </button>
        ))}
        {!companies.length ? (
          <p className="text-sm text-black/60">Aucune entreprise pour le moment.</p>
        ) : null}
      </section>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg rounded-[28px] bg-[#1C1C1E] text-white border border-white/10 backdrop-blur-md">
          <DialogTitle className="sr-only">Ajouter une entreprise</DialogTitle>
          <DialogDescription className="sr-only">
            Formulaire de création d'entreprise
          </DialogDescription>
          <DialogHeader>
            <DialogTitle>Détails entreprise</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm text-white/70">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/40">Nom</p>
              <input
                value={selected?.name || ""}
                onChange={(event) => setSelected((prev) => (prev ? { ...prev, name: event.target.value } : prev))}
                className="mt-1 w-full rounded-lg border border-white/10 bg-[#1C1C1E] px-3 py-2 text-white"
              />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/40">SIRET</p>
              <p className="mt-1 text-sm text-white/80">{selected?.siren || "-"}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-white/40">Secteur</p>
                <p className="mt-1 text-sm text-white/80">{selected?.sector || "-"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-white/40">Date de création</p>
                <p className="mt-1 text-sm text-white/80">{selected?.creation_date || "-"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-white/60" />
              <input
                value={selected?.city || ""}
                onChange={(event) => setSelected((prev) => (prev ? { ...prev, city: event.target.value } : prev))}
                className="w-full rounded-lg border border-white/10 bg-[#1C1C1E] px-3 py-2 text-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-white/60" />
              <input
                value={selected?.opco || ""}
                onChange={(event) => setSelected((prev) => (prev ? { ...prev, opco: event.target.value } : prev))}
                className="w-full rounded-lg border border-white/10 bg-[#1C1C1E] px-3 py-2 text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-white/40">NAF / APE</p>
                <input
                  value={selected?.naf_ape || ""}
                  onChange={(event) => setSelected((prev) => (prev ? { ...prev, naf_ape: event.target.value } : prev))}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-[#1C1C1E] px-3 py-2 text-white"
                />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-white/40">Tranche effectif</p>
                <input
                  value={selected?.tranche_effectif || ""}
                  onChange={(event) =>
                    setSelected((prev) => (prev ? { ...prev, tranche_effectif: event.target.value } : prev))
                  }
                  className="mt-1 w-full rounded-lg border border-white/10 bg-[#1C1C1E] px-3 py-2 text-white"
                />
              </div>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-3 space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-white/40">Contact Décisionnaire</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-white/60" />
                  <input
                    value={selected?.contact_firstname || ""}
                    onChange={(event) =>
                      setSelected((prev) => (prev ? { ...prev, contact_firstname: event.target.value } : prev))
                    }
                    placeholder="Prénom"
                    className="w-full rounded-lg border border-white/10 bg-[#1C1C1E] px-3 py-2 text-white"
                  />
                </div>
                <input
                  value={selected?.contact_lastname || ""}
                  onChange={(event) =>
                    setSelected((prev) => (prev ? { ...prev, contact_lastname: event.target.value } : prev))
                  }
                  placeholder="Nom"
                  className="w-full rounded-lg border border-white/10 bg-[#1C1C1E] px-3 py-2 text-white"
                />
                <div className="flex items-center gap-2 md:col-span-2">
                  <Mail className="h-4 w-4 text-white/60" />
                  <input
                    value={selected?.contact_email || ""}
                    onChange={(event) =>
                      setSelected((prev) => (prev ? { ...prev, contact_email: event.target.value } : prev))
                    }
                    placeholder="Email"
                    className="w-full rounded-lg border border-white/10 bg-[#1C1C1E] px-3 py-2 text-white"
                  />
                </div>
                <div className="flex items-center gap-2 md:col-span-2">
                  <Phone className="h-4 w-4 text-white/60" />
                  <input
                    value={selected?.contact_phone || ""}
                    onChange={(event) =>
                      setSelected((prev) => (prev ? { ...prev, contact_phone: event.target.value } : prev))
                    }
                    placeholder="Téléphone"
                    className="w-full rounded-lg border border-white/10 bg-[#1C1C1E] px-3 py-2 text-white"
                  />
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={async () => {
                  if (!selected?.id) return;
                  if (!supabase) return;
                  setIsSaving(true);
                  await supabase
                    .from("crm_prospects")
                    .update({
                      name: selected.name || "",
                      opco: selected.opco || "",
                      city: selected.city || "",
                      zip_code: selected.zip_code || "",
                      naf_ape: selected.naf_ape || "",
                      tranche_effectif: selected.tranche_effectif || "",
                      contact_firstname: selected.contact_firstname || "",
                      contact_lastname: selected.contact_lastname || "",
                      contact_email: selected.contact_email || "",
                      contact_phone: selected.contact_phone || "",
                    })
                    .eq("id", selected.id);
                  setIsSaving(false);
                }}
                className="rounded-lg border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white"
              >
                {isSaving ? "Enregistrement..." : "Modifier"}
              </button>
              <button
                type="button"
                onClick={() => {
                  const company = encodeURIComponent(selected?.name || "");
                  window.location.assign(`/dashboard/ecole/offres?company=${company}`);
                }}
                className="rounded-lg border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white"
              >
                Voir les offres liées
              </button>
              <button
                type="button"
                onClick={() => {
                  const company = encodeURIComponent(selected?.name || "");
                  window.location.assign(`/dashboard/ecole/offres?company=${company}`);
                }}
                className="rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white"
              >
                + Ajouter une offre
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
