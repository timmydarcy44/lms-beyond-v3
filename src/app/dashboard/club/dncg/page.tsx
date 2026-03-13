"use client";

import { useEffect, useMemo, useState } from "react";
import { Lock, Shield } from "lucide-react";
import { toast } from "sonner";
import { ClubLayout } from "@/components/club/club-layout";
import { clubPartners } from "@/lib/mocks/club-partners";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getClubDncg, getClubPartners, getMyClub } from "@/lib/supabase/club-queries";

type DncgForm = {
  produits_subventions: string;
  produits_billetterie: string;
  produits_partenariats: string;
  produits_cotisations: string;
  produits_manifestations: string;
  produits_autres: string;
  charges_masse_salariale: string;
  charges_sociales: string;
  charges_deplacements: string;
  charges_equipements: string;
  charges_structure: string;
  charges_autres: string;
  resultat_n1: string;
  capitaux_propres: string;
  dettes_totales: string;
  tresorerie: string;
  dettes_urssaf: string;
  dettes_impots: string;
  dettes_prestataires: string;
  nb_joueurs_contrat: string;
  nb_staff_admin: string;
  masse_salariale_sportive: string;
  masse_salariale_admin: string;
  nom_officiel: string;
  numero_rna: string;
  numero_siret: string;
  numero_fff: string;
  nb_licencies: string;
  stade_homologue: boolean;
  president_nom: string;
  president_email: string;
  tresorier_nom: string;
  tresorier_email: string;
  secretaire_nom: string;
  secretaire_email: string;
};

const emptyForm: DncgForm = {
  produits_subventions: "",
  produits_billetterie: "",
  produits_partenariats: "",
  produits_cotisations: "",
  produits_manifestations: "",
  produits_autres: "",
  charges_masse_salariale: "",
  charges_sociales: "",
  charges_deplacements: "",
  charges_equipements: "",
  charges_structure: "",
  charges_autres: "",
  resultat_n1: "",
  capitaux_propres: "",
  dettes_totales: "",
  tresorerie: "",
  dettes_urssaf: "",
  dettes_impots: "",
  dettes_prestataires: "",
  nb_joueurs_contrat: "",
  nb_staff_admin: "",
  masse_salariale_sportive: "",
  masse_salariale_admin: "",
  nom_officiel: "",
  numero_rna: "",
  numero_siret: "",
  numero_fff: "",
  nb_licencies: "",
  stade_homologue: false,
  president_nom: "",
  president_email: "",
  tresorier_nom: "",
  tresorier_email: "",
  secretaire_nom: "",
  secretaire_email: "",
};

const toNumber = (value: string) => {
  const parsed = Number(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
};

export default function ClubDncgPage() {
  const [formData, setFormData] = useState<DncgForm>(emptyForm);
  const [role, setRole] = useState<string | null>(null);
  const [club, setClub] = useState<any | null>(null);
  const [partnersTotal, setPartnersTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [openSections, setOpenSections] = useState({
    financier: true,
    partenariats: true,
    masse_salariale: false,
    gouvernance: false,
  });

  const toggleSection = (key: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    let active = true;
    const load = async () => {
      const supabase = createSupabaseBrowserClient();
      if (!supabase) {
        setLoading(false);
        return;
      }

      const { data: userResult } = await supabase.auth.getUser();
      const user = userResult?.user;
      let roleValue: string | null = null;
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, role_type")
          .eq("id", user.id)
          .maybeSingle();
        roleValue = String(profile?.role_type ?? profile?.role ?? "").toLowerCase() || null;
      }

      const clubData = await getMyClub();
      if (!active) return;
      setRole(roleValue);
      setClub(clubData);

      if (roleValue === "demo") {
        const demoPartnersTotal = clubPartners.reduce((sum, partner) => sum + (partner.valeur || 0), 0);
        setPartnersTotal(demoPartnersTotal);
        setFormData({
          ...emptyForm,
          produits_subventions: "120000",
          produits_billetterie: "35000",
          produits_partenariats: "180000",
          charges_masse_salariale: "210000",
          resultat_n1: "15000",
          nom_officiel: "SU Dives Cabourg",
          numero_siret: "12345678900011",
          numero_fff: "012345",
          nb_licencies: "420",
          stade_homologue: true,
          president_nom: "Jean Dupont",
          president_email: "president@club.fr",
        });
        setLoading(false);
        return;
      }

      if (!clubData?.id) {
        setLoading(false);
        return;
      }

      const [dncg, partners] = await Promise.all([
        getClubDncg(clubData.id),
        getClubPartners(clubData.id),
      ]);
      if (!active) return;

      const total = (partners ?? []).reduce(
        (sum, partner: any) => sum + Number(partner?.valeur ?? partner?.montant ?? 0),
        0
      );
      setPartnersTotal(total);

      if (dncg) {
        setFormData({
          ...emptyForm,
          ...dncg,
          stade_homologue: Boolean(dncg.stade_homologue),
        });
      }
      setLoading(false);
    };

    load();
    return () => {
      active = false;
    };
  }, []);

  const completionPercent = useMemo(() => {
    const values = Object.values(formData);
    const filled = values.filter((value) => {
      if (typeof value === "boolean") return value;
      return String(value ?? "").trim().length > 0;
    }).length;
    return Math.round((filled / values.length) * 100);
  }, [formData]);

  const produitsTotal =
    toNumber(formData.produits_subventions)
    + toNumber(formData.produits_billetterie)
    + toNumber(formData.produits_partenariats)
    + toNumber(formData.produits_cotisations)
    + toNumber(formData.produits_manifestations)
    + toNumber(formData.produits_autres);

  const masseSalarialeTotal =
    toNumber(formData.masse_salariale_sportive) + toNumber(formData.masse_salariale_admin);
  const ratioMasse = produitsTotal > 0 ? Math.round((masseSalarialeTotal / produitsTotal) * 100) : 0;

  const handleSave = async () => {
    if (!club?.id) return;
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    const payload = {
      club_id: club.id,
      saison: "2025-2026",
      ...formData,
    };
    await supabase.from("club_dncg").upsert(payload, { onConflict: "club_id,saison" });
    toast.success("Dossier sauvegardé ✓");
  };

  if (loading) {
    return (
      <ClubLayout activeItem="Rapport DNCG">
        <div className="flex h-64 items-center justify-center bg-[#0d1b2e] text-white">
          <div className="text-white/60">Chargement…</div>
        </div>
      </ClubLayout>
    );
  }

  if (role === "club") {
    return (
      <ClubLayout activeItem="Rapport DNCG">
        <div className="flex h-[60vh] items-center justify-center bg-[#0d1b2e] text-white">
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-[#111827] p-8">
            <div className="rounded-full bg-white/10 p-3">
              <Lock className="h-6 w-6 text-white/70" />
            </div>
            <div className="text-lg font-semibold">Accès réservé aux dirigeants</div>
            <div className="text-sm text-white/60">Contactez un administrateur du club.</div>
          </div>
        </div>
      </ClubLayout>
    );
  }

  return (
    <ClubLayout activeItem="Rapport DNCG">
      <div className="space-y-6 bg-[#0d1b2e] p-4 pt-6 text-white lg:p-8 lg:pt-8">
        <div className="rounded-2xl bg-[#111827] p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wider text-white/50">
                <Shield className="h-4 w-4 text-blue-300" />
                Dossier DNCG
              </div>
              <div className="text-lg font-semibold text-white">Saison 2025-2026</div>
              <div className="mt-3 h-3 w-full rounded-full bg-white/10">
                <div
                  className="h-3 rounded-full bg-gradient-to-r from-[#C8102E] to-orange-500"
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
              <div className="mt-2 text-sm text-white/60">{completionPercent}% complété</div>
            </div>
            <button
              onClick={handleSave}
              className="rounded-full bg-[#C8102E] px-6 py-2.5 text-sm font-semibold text-white"
            >
              Sauvegarder
            </button>
          </div>
        </div>

        <div className="rounded-2xl bg-[#111827] overflow-hidden">
          <button
            onClick={() => toggleSection("financier")}
            className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-all"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">💰</span>
              <div className="text-left">
                <div className="text-base font-bold text-white">Situation financière</div>
                <div className="text-xs text-white/40">Produits, charges et bilan N-1</div>
              </div>
            </div>
            <svg
              className={`h-5 w-5 text-white/40 transition-transform ${
                openSections.financier ? "rotate-180" : "rotate-0"
              }`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {openSections.financier && (
            <div className="p-5 pt-0">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {[
                  { key: "produits_subventions", label: "Subventions" },
                  { key: "produits_billetterie", label: "Billetterie" },
                  { key: "produits_partenariats", label: "Partenariats" },
                  { key: "produits_cotisations", label: "Cotisations" },
                  { key: "produits_manifestations", label: "Manifestations" },
                  { key: "produits_autres", label: "Autres produits" },
                  { key: "charges_masse_salariale", label: "Masse salariale" },
                  { key: "charges_sociales", label: "Charges sociales" },
                  { key: "charges_deplacements", label: "Déplacements" },
                  { key: "charges_equipements", label: "Équipements" },
                  { key: "charges_structure", label: "Structure" },
                  { key: "charges_autres", label: "Autres charges" },
                  { key: "resultat_n1", label: "Résultat N-1" },
                  { key: "capitaux_propres", label: "Capitaux propres" },
                  { key: "dettes_totales", label: "Dettes totales" },
                  { key: "tresorerie", label: "Trésorerie" },
                ].map((field) => (
                  <div key={field.key}>
                    <label className="mb-1 block text-sm text-white/60">{field.label}</label>
                    <input
                      type="number"
                      value={formData[field.key as keyof DncgForm] as string}
                      onChange={(event) =>
                        setFormData((prev) => ({ ...prev, [field.key]: event.target.value }))
                      }
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-[#111827] overflow-hidden">
          <button
            onClick={() => toggleSection("partenariats")}
            className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-all"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">🤝</span>
              <div className="text-left">
                <div className="text-base font-bold text-white">Partenariats & Revenus</div>
                <div className="text-xs text-white/40">Dettes et portefeuille partenaires</div>
              </div>
            </div>
            <svg
              className={`h-5 w-5 text-white/40 transition-transform ${
                openSections.partenariats ? "rotate-180" : "rotate-0"
              }`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {openSections.partenariats && (
            <div className="p-5 pt-0">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {[
                  { key: "dettes_urssaf", label: "Dettes URSSAF" },
                  { key: "dettes_impots", label: "Dettes impôts" },
                  { key: "dettes_prestataires", label: "Dettes prestataires" },
                ].map((field) => (
                  <div key={field.key}>
                    <label className="mb-1 block text-sm text-white/60">{field.label}</label>
                    <input
                      type="number"
                      value={formData[field.key as keyof DncgForm] as string}
                      onChange={(event) =>
                        setFormData((prev) => ({ ...prev, [field.key]: event.target.value }))
                      }
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white"
                    />
                  </div>
                ))}
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <div className="text-sm text-white/60">Total partenaires</div>
                  <div className="text-lg font-semibold text-white">
                    {partnersTotal.toLocaleString("fr-FR")}€
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-[#111827] overflow-hidden">
          <button
            onClick={() => toggleSection("masse_salariale")}
            className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-all"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">👥</span>
              <div className="text-left">
                <div className="text-base font-bold text-white">Masse salariale</div>
                <div className="text-xs text-white/40">Effectifs et masse salariale</div>
              </div>
            </div>
            <svg
              className={`h-5 w-5 text-white/40 transition-transform ${
                openSections.masse_salariale ? "rotate-180" : "rotate-0"
              }`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {openSections.masse_salariale && (
            <div className="p-5 pt-0">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {[
                  { key: "nb_joueurs_contrat", label: "Nb joueurs sous contrat" },
                  { key: "nb_staff_admin", label: "Nb staff admin" },
                  { key: "masse_salariale_sportive", label: "Masse salariale sportive" },
                  { key: "masse_salariale_admin", label: "Masse salariale admin" },
                ].map((field) => (
                  <div key={field.key}>
                    <label className="mb-1 block text-sm text-white/60">{field.label}</label>
                    <input
                      type="number"
                      value={formData[field.key as keyof DncgForm] as string}
                      onChange={(event) =>
                        setFormData((prev) => ({ ...prev, [field.key]: event.target.value }))
                      }
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white"
                    />
                  </div>
                ))}
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <div className="text-sm text-white/60">Ratio masse salariale / budget</div>
                  <div className="text-lg font-semibold text-white">{ratioMasse}%</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-[#111827] overflow-hidden">
          <button
            onClick={() => toggleSection("gouvernance")}
            className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-all"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">🏛️</span>
              <div className="text-left">
                <div className="text-base font-bold text-white">Gouvernance</div>
                <div className="text-xs text-white/40">Identité et dirigeants</div>
              </div>
            </div>
            <svg
              className={`h-5 w-5 text-white/40 transition-transform ${
                openSections.gouvernance ? "rotate-180" : "rotate-0"
              }`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {openSections.gouvernance && (
            <div className="p-5 pt-0">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {[
                  { key: "nom_officiel", label: "Nom officiel" },
                  { key: "numero_rna", label: "N° RNA" },
                  { key: "numero_siret", label: "N° SIRET" },
                  { key: "numero_fff", label: "N° FFF" },
                  { key: "nb_licencies", label: "Nb licenciés" },
                ].map((field) => (
                  <div key={field.key}>
                    <label className="mb-1 block text-sm text-white/60">{field.label}</label>
                    <input
                      value={formData[field.key as keyof DncgForm] as string}
                      onChange={(event) =>
                        setFormData((prev) => ({ ...prev, [field.key]: event.target.value }))
                      }
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white"
                    />
                  </div>
                ))}
                <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
                  <input
                    type="checkbox"
                    checked={formData.stade_homologue}
                    onChange={(event) => setFormData((prev) => ({ ...prev, stade_homologue: event.target.checked }))}
                  />
                  Stade homologué
                </label>
                {[
                  { key: "president_nom", label: "Président — Nom" },
                  { key: "president_email", label: "Président — Email" },
                  { key: "tresorier_nom", label: "Trésorier — Nom" },
                  { key: "tresorier_email", label: "Trésorier — Email" },
                  { key: "secretaire_nom", label: "Secrétaire — Nom" },
                  { key: "secretaire_email", label: "Secrétaire — Email" },
                ].map((field) => (
                  <div key={field.key}>
                    <label className="mb-1 block text-sm text-white/60">{field.label}</label>
                    <input
                      value={formData[field.key as keyof DncgForm] as string}
                      onChange={(event) =>
                        setFormData((prev) => ({ ...prev, [field.key]: event.target.value }))
                      }
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </ClubLayout>
  );
}
