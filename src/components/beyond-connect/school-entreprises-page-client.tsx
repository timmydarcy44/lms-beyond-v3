"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { fetchSiretCompany } from "@/lib/ecole/fetch-siret-company";
import { Briefcase, Building2, Mail, MapPin, Phone, Plus, User } from "lucide-react";
import { toast } from "sonner";

export type CompanyRow = {
  id: string;
  name?: string | null;
  company_name?: string | null;
  company_status?: string | null;
  step?: string | null;
  opco?: string | null;
  opco_name?: string | null;
  city?: string | null;
  zip_code?: string | null;
  siret?: string | null;
  siren?: string | null;
  naf_ape?: string | null;
  naf_code?: string | null;
  tranche_effectif?: string | null;
  sector?: string | null;
  creation_date?: string | null;
  address?: string | null;
  contact_firstname?: string | null;
  contact_lastname?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  recruitment_need?: string | null;
  logo_url?: string | null;
};

type SchoolEntreprisesPageClientProps = {
  schoolId: string;
  companies: CompanyRow[];
};

const emptyAddForm = () => ({
  company_name: "",
  siret: "",
  siren: "",
  naf_code: "",
  address: "",
  city: "",
  zip_code: "",
  sector: "",
  creation_date: "",
  opco: "",
  opco_name: "",
  contact_firstname: "",
  contact_lastname: "",
  contact_email: "",
  contact_phone: "",
  recruitment_need: "",
  logo_url: "",
});

export function SchoolEntreprisesPageClient({ schoolId, companies }: SchoolEntreprisesPageClientProps) {
  const router = useRouter();
  const [list, setList] = useState<CompanyRow[]>(companies);
  const [selected, setSelected] = useState<CompanyRow | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addMode, setAddMode] = useState<"siret" | "manual">("siret");
  const [siretDraft, setSiretDraft] = useState("");
  const [scanLoading, setScanLoading] = useState(false);
  const [submittingNew, setSubmittingNew] = useState(false);
  const [form, setForm] = useState(emptyAddForm);
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    setList(companies);
  }, [companies]);

  const mergeList = useCallback((row: CompanyRow) => {
    setList((prev) => {
      const next = prev.filter((r) => r.id !== row.id);
      return [row, ...next];
    });
  }, []);

  const handleSiretLookup = async () => {
    const digits = siretDraft.replace(/\s/g, "");
    if (digits.length !== 14) {
      toast.error("Saisissez un SIRET à 14 chiffres.");
      return;
    }
    setScanLoading(true);
    const res = await fetchSiretCompany(digits);
    setScanLoading(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    const d = res.data;
    setForm({
      company_name: d.company_name,
      siret: d.siret,
      siren: d.siren,
      naf_code: d.naf_code,
      address: d.address || "",
      city: d.city || "",
      zip_code: d.zip_code || "",
      sector: d.sector || "",
      creation_date: d.creation_date || "",
      opco: d.opco_name,
      opco_name: d.opco_name,
      contact_firstname: "",
      contact_lastname: "",
      contact_email: "",
      contact_phone: "",
      recruitment_need: "",
      logo_url: "",
    });
    setAddMode("manual");
    toast.success("Fiche préremplie — complétez le contact et le besoin.");
  };

  const handleLogoFile = async (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Choisissez une image (PNG, JPG, WebP).");
      return;
    }
    if (file.size > 120_000) {
      toast.error("Image trop lourde (max. 120 Ko). Utilisez une URL de logo à la place.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const url = typeof reader.result === "string" ? reader.result : "";
      if (url) setForm((f) => ({ ...f, logo_url: url }));
    };
    reader.readAsDataURL(file);
  };

  const handleCreateCompany = async () => {
    if (!schoolId) {
      toast.error("École non identifiée.");
      return;
    }
    const name = form.company_name.trim();
    if (!name) {
      toast.error("Indiquez le nom de la société.");
      return;
    }
    if (!supabase) return;
    setSubmittingNew(true);
    const siretNorm = form.siret.replace(/\s/g, "") || null;
    const payload: Record<string, unknown> = {
      school_id: schoolId,
      name,
      company_name: name,
      company_status: "client",
      step: "Gagné",
      siret: siretNorm && siretNorm.length === 14 ? siretNorm : null,
      siren: siretNorm && siretNorm.length >= 9 ? siretNorm.slice(0, 9) : null,
      naf_code: form.naf_code || null,
      naf_ape: form.naf_code || null,
      address: form.address || null,
      city: form.city || null,
      zip_code: form.zip_code || null,
      sector: form.sector || null,
      creation_date: form.creation_date || null,
      opco: form.opco || form.opco_name || null,
      opco_name: form.opco_name || form.opco || null,
      contact_firstname: form.contact_firstname || null,
      contact_lastname: form.contact_lastname || null,
      contact_email: form.contact_email || null,
      contact_phone: form.contact_phone || null,
      recruitment_need: form.recruitment_need.trim() || null,
      logo_url: form.logo_url.trim() || null,
      amount: 0,
      npc_value: 0,
    };

    try {
      if (siretNorm && siretNorm.length === 14) {
        const { data, error } = await supabase
          .from("crm_prospects")
          .upsert(payload, { onConflict: "siret" })
          .select("*")
          .single();
        if (error) throw error;
        if (data) mergeList(data as CompanyRow);
      } else {
        const { data, error } = await supabase.from("crm_prospects").insert(payload).select("*").single();
        if (error) throw error;
        if (data) mergeList(data as CompanyRow);
      }
      toast.success("Entreprise enregistrée.");
      setAddOpen(false);
      setSiretDraft("");
      setForm(emptyAddForm());
      setAddMode("siret");
      router.refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erreur à l'enregistrement";
      toast.error(msg);
    } finally {
      setSubmittingNew(false);
    }
  };

  const rows = list.length ? list : companies;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-black/60">Partenaires avec statut « client ».</p>
        <button
          type="button"
          onClick={() => {
            setAddOpen(true);
            setAddMode("siret");
            setSiretDraft("");
            setForm(emptyAddForm());
          }}
          className="inline-flex items-center gap-2 rounded-full bg-[#1C1C1E] px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-black"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Ajouter une entreprise
        </button>
      </div>

      <section className="grid gap-4 md:grid-cols-2">
        {rows.map((company) => (
          <button
            key={company.id}
            type="button"
            onClick={() => setSelected(company)}
            className="rounded-[24px] border border-white/10 bg-[#1C1C1E] p-5 text-left text-white shadow-[0_16px_40px_rgba(15,23,42,0.12)] transition hover:ring-2 hover:ring-white/20"
          >
            <div className="flex items-start gap-3">
              {company.logo_url ? (
                <img src={company.logo_url} alt="" className="h-12 w-12 shrink-0 rounded-xl border border-white/10 object-cover" />
              ) : (
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                  <Building2 className="h-6 w-6 text-white/50" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold">{company.company_name || company.name || "Entreprise"}</p>
                  <span className="shrink-0 rounded-full bg-white/10 px-2 py-1 text-xs text-white/70">
                    {company.company_status || company.step || "—"}
                  </span>
                </div>
                <p className="mt-2 text-xs text-white/60">
                  {company.city || "-"} {company.zip_code ? `(${company.zip_code})` : ""}
                </p>
                <p className="mt-1 text-xs text-white/50">OPCO : {company.opco_name || company.opco || "À vérifier"}</p>
              </div>
            </div>
          </button>
        ))}
        {!rows.length ? <p className="text-sm text-black/60">Aucune entreprise pour le moment.</p> : null}
      </section>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto rounded-[28px] border border-white/10 bg-[#1C1C1E] text-white backdrop-blur-md">
          <DialogHeader>
            <DialogTitle>Nouvelle entreprise partenaire</DialogTitle>
            <DialogDescription className="text-white/50">
              Recherche par SIRET (comme en prospection) ou saisie complète. Les fiches sont enregistrées comme clients.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-sm">
            <div className="flex gap-2 rounded-xl border border-white/10 bg-white/5 p-1">
              <button
                type="button"
                onClick={() => setAddMode("siret")}
                className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold ${
                  addMode === "siret" ? "bg-white/15 text-white" : "text-white/60"
                }`}
              >
                Par SIRET
              </button>
              <button
                type="button"
                onClick={() => setAddMode("manual")}
                className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold ${
                  addMode === "manual" ? "bg-white/15 text-white" : "text-white/60"
                }`}
              >
                Saisie libre
              </button>
            </div>

            {addMode === "siret" ? (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-white/70">Numéro SIRET</label>
                <input
                  value={siretDraft}
                  onChange={(e) => setSiretDraft(e.target.value)}
                  placeholder="14 chiffres"
                  className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-white"
                />
                <button
                  type="button"
                  disabled={scanLoading}
                  onClick={handleSiretLookup}
                  className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-white disabled:opacity-50"
                >
                  {scanLoading ? "Recherche…" : "Récupérer la fiche"}
                </button>
                <p className="text-[11px] text-white/45">Ensuite, complétez contact et besoin dans le formulaire ci-dessous.</p>
              </div>
            ) : null}

            <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-white/40">Société</p>
              <input
                value={form.company_name}
                onChange={(e) => setForm((f) => ({ ...f, company_name: e.target.value }))}
                placeholder="Raison sociale"
                className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-white"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={form.siret}
                  onChange={(e) => setForm((f) => ({ ...f, siret: e.target.value }))}
                  placeholder="SIRET"
                  className="rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-white"
                />
                <input
                  value={form.naf_code}
                  onChange={(e) => setForm((f) => ({ ...f, naf_code: e.target.value }))}
                  placeholder="NAF / APE"
                  className="rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-white"
                />
              </div>
              <input
                value={form.opco_name}
                onChange={(e) => setForm((f) => ({ ...f, opco_name: e.target.value, opco: e.target.value }))}
                placeholder="OPCO"
                className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-white"
              />
              <textarea
                value={form.recruitment_need}
                onChange={(e) => setForm((f) => ({ ...f, recruitment_need: e.target.value }))}
                placeholder="Besoin (recrutement, profils, volume…)"
                rows={3}
                className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-white"
              />
              <input
                value={form.logo_url}
                onChange={(e) => setForm((f) => ({ ...f, logo_url: e.target.value }))}
                placeholder="URL du logo (optionnel)"
                className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-xs text-white"
              />
              <div>
                <label className="text-[11px] text-white/50">Importer un logo (léger, max 120 Ko)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleLogoFile(e.target.files?.[0] ?? null)}
                  className="mt-1 w-full text-xs text-white/70 file:mr-2 file:rounded file:border-0 file:bg-white/10 file:px-2 file:py-1 file:text-white"
                />
              </div>
              <input
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                placeholder="Adresse"
                className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-white"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={form.zip_code}
                  onChange={(e) => setForm((f) => ({ ...f, zip_code: e.target.value }))}
                  placeholder="Code postal"
                  className="rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-white"
                />
                <input
                  value={form.city}
                  onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                  placeholder="Ville"
                  className="rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-white"
                />
              </div>
            </div>

            <div className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-white/40">Contact</p>
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={form.contact_firstname}
                  onChange={(e) => setForm((f) => ({ ...f, contact_firstname: e.target.value }))}
                  placeholder="Prénom"
                  className="rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-white"
                />
                <input
                  value={form.contact_lastname}
                  onChange={(e) => setForm((f) => ({ ...f, contact_lastname: e.target.value }))}
                  placeholder="Nom"
                  className="rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-white"
                />
              </div>
              <input
                value={form.contact_email}
                onChange={(e) => setForm((f) => ({ ...f, contact_email: e.target.value }))}
                placeholder="Email"
                className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-white"
              />
              <input
                value={form.contact_phone}
                onChange={(e) => setForm((f) => ({ ...f, contact_phone: e.target.value }))}
                placeholder="Téléphone"
                className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-white"
              />
            </div>

            <button
              type="button"
              disabled={submittingNew}
              onClick={handleCreateCompany}
              className="w-full rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {submittingNew ? "Enregistrement…" : "Enregistrer l'entreprise"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto rounded-[28px] border border-white/10 bg-[#1C1C1E] text-white backdrop-blur-md">
          <DialogTitle className="sr-only">Détails entreprise</DialogTitle>
          <DialogDescription className="sr-only">Modifier la fiche entreprise</DialogDescription>
          <DialogHeader>
            <DialogTitle>Détails entreprise</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm text-white/70">
            {selected?.logo_url ? (
              <img src={selected.logo_url} alt="" className="h-16 w-16 rounded-xl border border-white/10 object-cover" />
            ) : null}
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/40">Nom</p>
              <input
                value={selected?.company_name || selected?.name || ""}
                onChange={(event) =>
                  setSelected((prev) =>
                    prev ? { ...prev, name: event.target.value, company_name: event.target.value } : prev,
                  )
                }
                className="mt-1 w-full rounded-lg border border-white/10 bg-[#1C1C1E] px-3 py-2 text-white"
              />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/40">SIRET</p>
              <input
                value={selected?.siret || ""}
                onChange={(event) => setSelected((prev) => (prev ? { ...prev, siret: event.target.value } : prev))}
                className="mt-1 w-full rounded-lg border border-white/10 bg-[#1C1C1E] px-3 py-2 text-white"
              />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/40">Besoin recrutement</p>
              <textarea
                value={selected?.recruitment_need || ""}
                onChange={(event) =>
                  setSelected((prev) => (prev ? { ...prev, recruitment_need: event.target.value } : prev))
                }
                rows={3}
                className="mt-1 w-full rounded-lg border border-white/10 bg-[#1C1C1E] px-3 py-2 text-white"
              />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/40">URL logo</p>
              <input
                value={selected?.logo_url || ""}
                onChange={(event) => setSelected((prev) => (prev ? { ...prev, logo_url: event.target.value } : prev))}
                className="mt-1 w-full rounded-lg border border-white/10 bg-[#1C1C1E] px-3 py-2 text-xs text-white"
              />
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
                value={selected?.opco_name || selected?.opco || ""}
                onChange={(event) =>
                  setSelected((prev) => (prev ? { ...prev, opco: event.target.value, opco_name: event.target.value } : prev))
                }
                className="w-full rounded-lg border border-white/10 bg-[#1C1C1E] px-3 py-2 text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-white/40">NAF / APE</p>
                <input
                  value={selected?.naf_ape || selected?.naf_code || ""}
                  onChange={(event) =>
                    setSelected((prev) => (prev ? { ...prev, naf_ape: event.target.value, naf_code: event.target.value } : prev))
                  }
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
              <p className="text-xs uppercase tracking-[0.2em] text-white/40">Contact</p>
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
                      name: selected.company_name || selected.name || "",
                      company_name: selected.company_name || selected.name || "",
                      siret: selected.siret || null,
                      opco: selected.opco || "",
                      opco_name: selected.opco_name || selected.opco || "",
                      city: selected.city || "",
                      zip_code: selected.zip_code || "",
                      naf_ape: selected.naf_ape || selected.naf_code || "",
                      naf_code: selected.naf_code || selected.naf_ape || "",
                      tranche_effectif: selected.tranche_effectif || "",
                      contact_firstname: selected.contact_firstname || "",
                      contact_lastname: selected.contact_lastname || "",
                      contact_email: selected.contact_email || "",
                      contact_phone: selected.contact_phone || "",
                      recruitment_need: selected.recruitment_need || null,
                      logo_url: selected.logo_url || null,
                    })
                    .eq("id", selected.id);
                  setIsSaving(false);
                  toast.success("Fiche mise à jour.");
                  router.refresh();
                }}
                className="rounded-lg border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white"
              >
                {isSaving ? "Enregistrement..." : "Modifier"}
              </button>
              <button
                type="button"
                onClick={() => {
                  const company = encodeURIComponent(selected?.company_name || selected?.name || "");
                  window.location.assign(`/dashboard/ecole/offres?company=${company}`);
                }}
                className="rounded-lg border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white"
              >
                Voir les offres liées
              </button>
              <button
                type="button"
                onClick={() => {
                  const company = encodeURIComponent(selected?.company_name || selected?.name || "");
                  window.location.assign(`/dashboard/ecole/offres?create=1&company=${company}`);
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
