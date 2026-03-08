"use client";

import { useEffect, useMemo, useState } from "react";
import { Shield } from "lucide-react";
import { toast } from "sonner";
import { ClubLayout } from "@/components/club/club-layout";
import { useClubGuard } from "@/components/club/use-club-guard";
import { clubPartners } from "@/lib/mocks/club-partners";

type BudgetFields = {
  subventions: string;
  billetterie: string;
  sponsoring: string;
  cotisations: string;
  manifestations: string;
  autres: string;
};

type ChargesFields = {
  masse: string;
  charges: string;
  deplacements: string;
  equipements: string;
  structure: string;
  autres: string;
};

type ToggleValue = "" | "oui" | "non";

type ConfirmedPartner = {
  nom: string;
  montant: string;
  statut: "verbal" | "signe";
};

type DncgState = {
  produits: BudgetFields;
  charges: ChargesFields;
  bilan: {
    hasBilan: ToggleValue;
    resultat: string;
    capitaux: string;
    dettes: string;
    tresorerie: string;
    bilanFile: string;
  };
  dettes: {
    fiscales: ToggleValue;
    urssaf: string;
    impots: string;
    echeancier: ToggleValue;
    sportives: ToggleValue;
    sportivesMontant: string;
  };
  conventions: {
    sponsoring: boolean;
    mecenat: boolean;
    subventions: boolean;
  };
  previsionnel: ConfirmedPartner[];
  masseSalariale: {
    joueurs: string;
    entraineur: ToggleValue;
    staffTech: string;
    masseSportive: string;
    staffAdmin: string;
    masseAdmin: string;
  };
  contrats: {
    joueursFff: ToggleValue;
    nbJoueurs: string;
    dureeMax: string;
    registre: string;
  };
  dettesSalariales: {
    retards: ToggleValue;
    montant: string;
    explication: string;
  };
  structure: {
    nom: string;
    rna: string;
    siret: string;
    creation: string;
    prefecture: string;
  };
  dirigeants: {
    president: string;
    presidentEmail: string;
    tresorier: string;
    tresorierEmail: string;
    secretaire: string;
    secretaireEmail: string;
    directeur: string;
    directeurEmail: string;
  };
  documents: {
    statutsDate: string;
    statutsFile: string;
    agDate: string;
    agFile: string;
    fffNumero: string;
    fffFile: string;
    cnosf: "obtenu" | "en_cours" | "non_applicable" | "";
    commissaire: "applicable" | "non_applicable" | "";
    commissaireFile: string;
  };
  licences: {
    licencesActuelles: string;
    licencesPassees: string;
    stadeHomologue: ToggleValue;
    accueilConforme: ToggleValue;
  };
};

const defaultState: DncgState = {
  produits: {
    subventions: "",
    billetterie: "",
    sponsoring: "",
    cotisations: "",
    manifestations: "",
    autres: "",
  },
  charges: {
    masse: "",
    charges: "",
    deplacements: "",
    equipements: "",
    structure: "",
    autres: "",
  },
  bilan: {
    hasBilan: "",
    resultat: "",
    capitaux: "",
    dettes: "",
    tresorerie: "",
    bilanFile: "",
  },
  dettes: {
    fiscales: "",
    urssaf: "",
    impots: "",
    echeancier: "",
    sportives: "",
    sportivesMontant: "",
  },
  conventions: {
    sponsoring: false,
    mecenat: false,
    subventions: false,
  },
  previsionnel: [
    { nom: "BNP Paribas Le Havre", montant: "15000", statut: "signe" },
    { nom: "Normandie Auto", montant: "8000", statut: "verbal" },
  ],
  masseSalariale: {
    joueurs: "",
    entraineur: "",
    staffTech: "",
    masseSportive: "",
    staffAdmin: "",
    masseAdmin: "",
  },
  contrats: {
    joueursFff: "",
    nbJoueurs: "",
    dureeMax: "",
    registre: "",
  },
  dettesSalariales: {
    retards: "",
    montant: "",
    explication: "",
  },
  structure: {
    nom: "SU Dives Cabourg",
    rna: "",
    siret: "",
    creation: "",
    prefecture: "",
  },
  dirigeants: {
    president: "",
    presidentEmail: "",
    tresorier: "",
    tresorierEmail: "",
    secretaire: "",
    secretaireEmail: "",
    directeur: "",
    directeurEmail: "",
  },
  documents: {
    statutsDate: "",
    statutsFile: "",
    agDate: "",
    agFile: "",
    fffNumero: "",
    fffFile: "",
    cnosf: "",
    commissaire: "",
    commissaireFile: "",
  },
  licences: {
    licencesActuelles: "",
    licencesPassees: "",
    stadeHomologue: "",
    accueilConforme: "",
  },
};

const parseNumber = (value: string) => {
  const parsed = Number(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatCurrency = (value: number) =>
  `${value.toLocaleString("fr-FR", { maximumFractionDigits: 0 })}€`;

export default function ClubDncgPage() {
  const status = useClubGuard();
  const [form, setForm] = useState<DncgState>(defaultState);

  useEffect(() => {
    const raw = localStorage.getItem("club_dncg_dossier");
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as DncgState;
      setForm({ ...defaultState, ...parsed });
    } catch {
      // ignore
    }
  }, []);

  const produitsTotal = useMemo(() => {
    return (
      parseNumber(form.produits.subventions)
      + parseNumber(form.produits.billetterie)
      + parseNumber(form.produits.sponsoring)
      + parseNumber(form.produits.cotisations)
      + parseNumber(form.produits.manifestations)
      + parseNumber(form.produits.autres)
    );
  }, [form.produits]);

  const chargesTotal = useMemo(() => {
    return (
      parseNumber(form.charges.masse)
      + parseNumber(form.charges.charges)
      + parseNumber(form.charges.deplacements)
      + parseNumber(form.charges.equipements)
      + parseNumber(form.charges.structure)
      + parseNumber(form.charges.autres)
    );
  }, [form.charges]);

  const resultatNet = produitsTotal - chargesTotal;
  const masseSalarialeTotal =
    parseNumber(form.masseSalariale.masseSportive) + parseNumber(form.masseSalariale.masseAdmin);
  const ratioMasse = produitsTotal > 0 ? Math.round((masseSalarialeTotal / produitsTotal) * 100) : 0;

  const partenairesActifs = clubPartners.slice(0, 8);
  const valeurPortefeuille = partenairesActifs.reduce((sum, partner) => sum + partner.valeur, 0);
  const maxPartner = partenairesActifs.reduce((best, partner) => (partner.valeur > best.valeur ? partner : best), partenairesActifs[0]);
  const maxPercent = valeurPortefeuille > 0 ? Math.round((maxPartner.valeur / valeurPortefeuille) * 100) : 0;

  const totalPrevisionnel = form.previsionnel.reduce(
    (sum, entry) => sum + parseNumber(entry.montant),
    0
  );

  const completionFields = useMemo(() => {
    const fields: Array<string | ToggleValue | boolean> = [
      form.produits.subventions,
      form.produits.billetterie,
      form.produits.sponsoring,
      form.produits.cotisations,
      form.produits.manifestations,
      form.produits.autres,
      form.charges.masse,
      form.charges.charges,
      form.charges.deplacements,
      form.charges.equipements,
      form.charges.structure,
      form.charges.autres,
      form.bilan.hasBilan,
      form.bilan.resultat,
      form.bilan.capitaux,
      form.bilan.dettes,
      form.bilan.tresorerie,
      form.dettes.fiscales,
      form.dettes.sportives,
      form.masseSalariale.masseSportive,
      form.masseSalariale.masseAdmin,
      form.contrats.joueursFff,
      form.structure.nom,
      form.structure.rna,
      form.structure.siret,
      form.dirigeants.president,
      form.dirigeants.tresorier,
      form.documents.statutsDate,
      form.documents.agDate,
      form.documents.fffNumero,
      form.licences.licencesActuelles,
      form.licences.stadeHomologue,
    ];
    const filled = fields.filter((value) => {
      if (typeof value === "boolean") return value;
      return String(value ?? "").trim().length > 0;
    }).length;
    return { filled, total: fields.length };
  }, [form]);

  const completionPercent = Math.round((completionFields.filled / completionFields.total) * 100);
  const completionColor =
    completionPercent < 40 ? "text-red-400" : completionPercent < 70 ? "text-orange-400" : "text-green-400";

  const sectionsCompleted = useMemo(() => {
    const sections = [
      form.produits.subventions && form.charges.masse,
      form.bilan.hasBilan,
      form.dettes.fiscales,
      form.conventions.sponsoring || form.conventions.mecenat || form.conventions.subventions,
      partenairesActifs.length > 0,
      form.previsionnel.length > 0,
      form.masseSalariale.masseSportive,
      form.contrats.joueursFff,
      form.dettesSalariales.retards,
      form.structure.nom,
      form.documents.statutsDate,
      form.licences.stadeHomologue,
    ];
    return sections.filter(Boolean).length;
  }, [form, partenairesActifs.length]);

  const readinessStatus =
    completionPercent < 40 ? "Dossier à risque" : completionPercent < 70 ? "Dossier en cours" : "Dossier prêt";

  const scoreBadgeColor =
    completionPercent < 40 ? "text-red-300" : completionPercent < 70 ? "text-orange-300" : "text-green-300";

  const handleSave = () => {
    localStorage.setItem("club_dncg_dossier", JSON.stringify(form));
    toast.success("Dossier sauvegardé ✓");
  };

  if (status !== "allowed") {
    return null;
  }

  return (
    <ClubLayout activeItem="Rapport DNCG">
      <div className="space-y-6 bg-[#0d1b2e] p-4 text-white lg:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex-1">
            <div className="mb-6 flex items-center gap-4 rounded-2xl border border-blue-500/30 bg-blue-900/40 p-4">
              <div className="rounded-xl bg-blue-500/20 p-3">
                <Shield className="h-5 w-5 text-blue-300" />
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider text-blue-300">
                  Direction Nationale du Contrôle de Gestion
                </div>
                <div className="text-sm text-white/60">
                  Préparez votre passage annuel avec tous les documents requis
                </div>
              </div>
            </div>
            <div className="text-lg font-black text-white lg:text-3xl">
              Dossier DNCG — SU Dives Cabourg
            </div>
            <div className="text-sm text-white/50">Saison 2025/2026</div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={handleSave}
              className="rounded-full bg-white/10 px-6 py-3 text-sm font-semibold text-white"
            >
              💾 Sauvegarder
            </button>
            <button className="rounded-full bg-[#C8102E] px-6 py-3 font-semibold text-white shadow-lg shadow-[#C8102E]/30">
              📄 Générer le dossier complet PDF
            </button>
          </div>
        </div>

        <div className="rounded-2xl bg-[#111827] p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1">
              <div className="mb-2 text-sm text-white/60">Votre score de préparation DNCG</div>
              <div className="h-4 w-full rounded-full bg-white/10">
                <div
                  className="h-4 rounded-full bg-gradient-to-r from-[#C8102E] to-orange-500"
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
              <div className="mt-2 text-sm text-white/60">
                {sectionsCompleted}/12 sections complétées
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className={`text-2xl font-black ${completionColor} lg:text-4xl`}>{completionPercent}%</div>
                <div className="text-sm text-white/50">{readinessStatus}</div>
              </div>
              <div className="space-y-2">
                <div className="rounded-full bg-green-500/20 px-3 py-1 text-xs text-green-300">
                  ✓ 4 documents prêts
                </div>
                <div className="rounded-full bg-orange-500/20 px-3 py-1 text-xs text-orange-300">
                  ⚠ 5 à compléter
                </div>
                <div className="rounded-full bg-red-500/20 px-3 py-1 text-xs text-red-300">
                  ✗ 3 manquants
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-[#111827] p-6">
          <div className="flex items-center justify-between">
            <div className="text-lg font-bold text-white">💰 Situation Financière</div>
            <span className="rounded-full bg-red-500/20 px-3 py-1 text-xs text-red-300">Obligatoire</span>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl bg-[#1B2A4A]/60 p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-white">Budget prévisionnel de la saison</div>
                <span className="rounded-full bg-orange-500/20 px-2 py-0.5 text-xs text-orange-300">À compléter</span>
              </div>
              <div className="mt-3 space-y-3 text-sm text-white/60">
                <div className="text-xs uppercase text-white/40">Produits</div>
                {[
                  { label: "Subventions collectivités (€)", key: "subventions" },
                  { label: "Recettes billetterie (€)", key: "billetterie" },
                  { label: "Recettes partenariats/sponsoring (€)", key: "sponsoring" },
                  { label: "Cotisations licenciés (€)", key: "cotisations" },
                  { label: "Produits manifestations (€)", key: "manifestations" },
                  { label: "Autres produits (€)", key: "autres" },
                ].map((field) => (
                  <input
                    key={field.key}
                    placeholder={field.label}
                    value={form.produits[field.key as keyof BudgetFields]}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        produits: { ...prev.produits, [field.key]: event.target.value },
                      }))
                    }
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white placeholder:text-white/30"
                  />
                ))}
                <div className="mt-2 text-sm font-semibold text-white">
                  Total produits : {formatCurrency(produitsTotal)}
                </div>
                <div className="mt-4 text-xs uppercase text-white/40">Charges</div>
                {[
                  { label: "Masse salariale (€)", key: "masse" },
                  { label: "Charges sociales (€)", key: "charges" },
                  { label: "Déplacements (€)", key: "deplacements" },
                  { label: "Équipements sportifs (€)", key: "equipements" },
                  { label: "Frais de structure (€)", key: "structure" },
                  { label: "Autres charges (€)", key: "autres" },
                ].map((field) => (
                  <input
                    key={field.key}
                    placeholder={field.label}
                    value={form.charges[field.key as keyof ChargesFields]}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        charges: { ...prev.charges, [field.key]: event.target.value },
                      }))
                    }
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white placeholder:text-white/30"
                  />
                ))}
                <div className="mt-2 text-sm font-semibold text-white">
                  Total charges : {formatCurrency(chargesTotal)}
                </div>
                <div
                  className={`mt-3 text-lg font-bold ${
                    resultatNet >= 0 ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {resultatNet >= 0
                    ? `Excédent +${formatCurrency(resultatNet)}`
                    : `Déficit ${formatCurrency(resultatNet)}`}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl bg-[#1B2A4A]/60 p-4">
                <div className="text-sm font-semibold text-white">Bilan N-1 (exercice clos)</div>
                <div className="mt-3 flex items-center gap-2 text-sm text-white/60">
                  Avez-vous votre bilan comptable ?
                  {["oui", "non"].map((value) => (
                    <button
                      key={value}
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          bilan: { ...prev.bilan, hasBilan: value as ToggleValue },
                        }))
                      }
                      className={`rounded-full px-3 py-1 text-xs ${
                        form.bilan.hasBilan === value ? "bg-white/20 text-white" : "bg-white/5 text-white/50"
                      }`}
                    >
                      {value === "oui" ? "Oui" : "Non"}
                    </button>
                  ))}
                </div>
                {form.bilan.hasBilan === "oui" && (
                  <div className="mt-3 rounded-xl border border-dashed border-white/20 bg-white/5 px-3 py-2 text-xs text-white/40">
                    À joindre au dossier
                  </div>
                )}
                <div className="mt-3 space-y-2">
                  {[
                    { label: "Résultat de l'exercice N-1 (€)", key: "resultat" },
                    { label: "Capitaux propres (€)", key: "capitaux" },
                    { label: "Dettes totales (€)", key: "dettes" },
                    { label: "Trésorerie disponible (€)", key: "tresorerie" },
                  ].map((field) => (
                    <input
                      key={field.key}
                      placeholder={field.label}
                      value={form.bilan[field.key as keyof DncgState["bilan"]]}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          bilan: { ...prev.bilan, [field.key]: event.target.value },
                        }))
                      }
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white placeholder:text-white/30"
                    />
                  ))}
                </div>
              </div>

              <div className="rounded-xl bg-[#1B2A4A]/60 p-4">
                <div className="text-sm font-semibold text-white">Situation des dettes</div>
                <div className="mt-3 text-sm text-white/60">
                  Avez-vous des dettes fiscales ou sociales ?
                </div>
                <div className="mt-2 flex gap-2">
                  {["oui", "non"].map((value) => (
                    <button
                      key={value}
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          dettes: { ...prev.dettes, fiscales: value as ToggleValue },
                        }))
                      }
                      className={`rounded-full px-3 py-1 text-xs ${
                        form.dettes.fiscales === value ? "bg-white/20 text-white" : "bg-white/5 text-white/50"
                      }`}
                    >
                      {value === "oui" ? "Oui" : "Non"}
                    </button>
                  ))}
                </div>
                {form.dettes.fiscales === "oui" && (
                  <div className="mt-3 space-y-2">
                    <input
                      placeholder="Montant dettes URSSAF (€)"
                      value={form.dettes.urssaf}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          dettes: { ...prev.dettes, urssaf: event.target.value },
                        }))
                      }
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white placeholder:text-white/30"
                    />
                    <input
                      placeholder="Montant dettes impôts (€)"
                      value={form.dettes.impots}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          dettes: { ...prev.dettes, impots: event.target.value },
                        }))
                      }
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white placeholder:text-white/30"
                    />
                    <div className="flex items-center gap-2 text-xs text-white/60">
                      Échéancier en place ?
                      {["oui", "non"].map((value) => (
                        <button
                          key={value}
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              dettes: { ...prev.dettes, echeancier: value as ToggleValue },
                            }))
                          }
                          className={`rounded-full px-3 py-1 text-xs ${
                            form.dettes.echeancier === value ? "bg-white/20 text-white" : "bg-white/5 text-white/50"
                          }`}
                        >
                          {value === "oui" ? "Oui" : "Non"}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="mt-4 text-sm text-white/60">
                  Avez-vous des dettes envers des prestataires sportifs (agents, clubs) ?
                </div>
                <div className="mt-2 flex gap-2">
                  {["oui", "non"].map((value) => (
                    <button
                      key={value}
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          dettes: { ...prev.dettes, sportives: value as ToggleValue },
                        }))
                      }
                      className={`rounded-full px-3 py-1 text-xs ${
                        form.dettes.sportives === value ? "bg-white/20 text-white" : "bg-white/5 text-white/50"
                      }`}
                    >
                      {value === "oui" ? "Oui" : "Non"}
                    </button>
                  ))}
                </div>
                {form.dettes.sportives === "oui" && (
                  <input
                    placeholder="Montant dettes prestataires sportifs (€)"
                    value={form.dettes.sportivesMontant}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        dettes: { ...prev.dettes, sportivesMontant: event.target.value },
                      }))
                    }
                    className="mt-3 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white placeholder:text-white/30"
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-[#111827] p-6">
          <div className="flex items-center justify-between">
            <div className="text-lg font-bold text-white">🤝 Partenariats & Revenus Commerciaux</div>
            <span className="rounded-full bg-blue-500/20 px-3 py-1 text-xs text-blue-300">
              Clé pour la DNCG
            </span>
          </div>
          <div className="mt-4 rounded-xl border border-blue-500/20 bg-blue-900/30 p-3 text-sm text-blue-200">
            La DNCG évalue la solidité et la diversité de vos revenus partenaires. Un portefeuille
            diversifié sans dépendance à un seul sponsor est valorisé positivement.
          </div>

          <div className="mt-4 rounded-xl bg-[#1B2A4A]/60 p-4">
            <div className="text-sm font-semibold text-white">Portefeuille partenaires</div>
            <div className="mt-3 overflow-hidden rounded-xl border border-white/10 text-sm text-white/70">
              <table className="w-full">
                <thead className="bg-white/5 text-xs text-white/50">
                  <tr>
                    <th className="px-3 py-2 text-left">Partenaire</th>
                    <th className="px-3 py-2 text-left">Pack</th>
                    <th className="px-3 py-2 text-left">Montant</th>
                    <th className="px-3 py-2 text-left">Statut</th>
                    <th className="px-3 py-2 text-left">Durée</th>
                  </tr>
                </thead>
                <tbody>
                  {partenairesActifs.map((partner) => (
                    <tr key={partner.slug} className="border-t border-white/10">
                      <td className="px-3 py-2">{partner.nom}</td>
                      <td className="px-3 py-2">{partner.prestations[0] ?? "Pack club"}</td>
                      <td className="px-3 py-2">{formatCurrency(partner.valeur)}</td>
                      <td className="px-3 py-2">{partner.statut}</td>
                      <td className="px-3 py-2">{partner.renouvellement}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 text-xl font-black text-[#C8102E]">
              Valeur totale portefeuille : {formatCurrency(valeurPortefeuille)}
            </div>
            <div className="mt-2 grid gap-2 text-sm text-white/60 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              <div>Nb partenaires actifs : 23</div>
              <div className="flex items-center gap-2">
                Partenaire principal (max %) : {maxPercent}%
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    maxPercent < 30
                      ? "bg-green-500/20 text-green-300"
                      : maxPercent < 50
                        ? "bg-orange-500/20 text-orange-300"
                        : "bg-red-500/20 text-red-300"
                  }`}
                >
                  {maxPercent < 30 ? "Diversifié" : maxPercent < 50 ? "Surveillance" : "Risque"}
                </span>
              </div>
              <div>Taux de renouvellement : 78%</div>
            </div>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl bg-[#1B2A4A]/60 p-4">
              <div className="text-sm font-semibold text-white">Conventions et contrats</div>
              <div className="mt-3 space-y-3 text-sm text-white/70">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={form.conventions.sponsoring}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        conventions: { ...prev.conventions, sponsoring: event.target.checked },
                      }))
                    }
                  />
                  Contrats de sponsoring signés
                  <button className="ml-auto rounded-full bg-white/10 px-3 py-1 text-xs">
                    Générer depuis Beyond Network
                  </button>
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={form.conventions.mecenat}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        conventions: { ...prev.conventions, mecenat: event.target.checked },
                      }))
                    }
                  />
                  Conventions de mécénat
                  <button className="ml-auto rounded-full bg-white/10 px-3 py-1 text-xs">Générer</button>
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={form.conventions.subventions}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        conventions: { ...prev.conventions, subventions: event.target.checked },
                      }))
                    }
                  />
                  Justificatifs subventions (Ville, Département, Région)
                  <div className="ml-auto rounded-full border border-dashed border-white/20 bg-white/5 px-3 py-1 text-xs">
                    Upload
                  </div>
                </label>
              </div>
            </div>

            <div className="rounded-xl bg-[#1B2A4A]/60 p-4">
              <div className="text-sm font-semibold text-white">Prévisionnel partenariats N+1</div>
              <div className="mt-3 text-sm text-white/60">
                Quels partenariats sont déjà confirmés pour la saison prochaine ?
              </div>
              <div className="mt-3 space-y-2">
                {form.previsionnel.map((entry, index) => (
                  <div key={`${entry.nom}-${index}`} className="flex flex-col gap-2 rounded-xl bg-white/5 p-3">
                    <input
                      placeholder="Nom du partenaire"
                      value={entry.nom}
                      onChange={(event) =>
                        setForm((prev) => {
                          const next = [...prev.previsionnel];
                          next[index] = { ...next[index], nom: event.target.value };
                          return { ...prev, previsionnel: next };
                        })
                      }
                      className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white placeholder:text-white/30"
                    />
                    <div className="flex gap-2">
                      <input
                        placeholder="Montant (€)"
                        value={entry.montant}
                        onChange={(event) =>
                          setForm((prev) => {
                            const next = [...prev.previsionnel];
                            next[index] = { ...next[index], montant: event.target.value };
                            return { ...prev, previsionnel: next };
                          })
                        }
                        className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white placeholder:text-white/30"
                      />
                      <select
                        value={entry.statut}
                        onChange={(event) =>
                          setForm((prev) => {
                            const next = [...prev.previsionnel];
                            next[index] = { ...next[index], statut: event.target.value as ConfirmedPartner["statut"] };
                            return { ...prev, previsionnel: next };
                          })
                        }
                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white"
                      >
                        <option value="verbal">Verbal</option>
                        <option value="signe">Signé</option>
                      </select>
                    </div>
                  </div>
                ))}
                <button
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      previsionnel: [...prev.previsionnel, { nom: "", montant: "", statut: "verbal" }],
                    }))
                  }
                  className="rounded-full bg-white/10 px-4 py-2 text-sm"
                >
                  + Ajouter un partenariat confirmé
                </button>
                <div className="text-sm font-semibold text-white">
                  Total prévisionnel N+1 : {formatCurrency(totalPrevisionnel)}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-[#111827] p-6">
          <div className="flex items-center justify-between">
            <div className="text-lg font-bold text-white">👥 Masse Salariale & Effectifs</div>
            <span className="rounded-full bg-red-500/20 px-3 py-1 text-xs text-red-300">Obligatoire</span>
          </div>
          <div className="mt-4 text-sm text-white/60">
            La DNCG vérifie que votre masse salariale est soutenable par rapport à vos revenus.
            Ratio recommandé : &lt; 70% des produits totaux.
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl bg-[#1B2A4A]/60 p-4">
              <div className="text-sm font-semibold text-white">Staff sportif</div>
              <div className="mt-3 space-y-2">
                <input
                  placeholder="Nb joueurs sous contrat"
                  value={form.masseSalariale.joueurs}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      masseSalariale: { ...prev.masseSalariale, joueurs: event.target.value },
                    }))
                  }
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white placeholder:text-white/30"
                />
                <div className="flex items-center gap-2 text-xs text-white/60">
                  Entraîneur principal (contrat ?)
                  {["oui", "non"].map((value) => (
                    <button
                      key={value}
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          masseSalariale: { ...prev.masseSalariale, entraineur: value as ToggleValue },
                        }))
                      }
                      className={`rounded-full px-3 py-1 text-xs ${
                        form.masseSalariale.entraineur === value ? "bg-white/20 text-white" : "bg-white/5 text-white/50"
                      }`}
                    >
                      {value === "oui" ? "Oui" : "Non"}
                    </button>
                  ))}
                </div>
                <input
                  placeholder="Staff technique (nb)"
                  value={form.masseSalariale.staffTech}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      masseSalariale: { ...prev.masseSalariale, staffTech: event.target.value },
                    }))
                  }
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white placeholder:text-white/30"
                />
                <input
                  placeholder="Masse salariale sportive totale (€/an)"
                  value={form.masseSalariale.masseSportive}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      masseSalariale: { ...prev.masseSalariale, masseSportive: event.target.value },
                    }))
                  }
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white placeholder:text-white/30"
                />
              </div>
            </div>

            <div className="rounded-xl bg-[#1B2A4A]/60 p-4">
              <div className="text-sm font-semibold text-white">Staff administratif</div>
              <div className="mt-3 space-y-2">
                <input
                  placeholder="Nb salariés admin"
                  value={form.masseSalariale.staffAdmin}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      masseSalariale: { ...prev.masseSalariale, staffAdmin: event.target.value },
                    }))
                  }
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white placeholder:text-white/30"
                />
                <input
                  placeholder="Masse salariale admin (€/an)"
                  value={form.masseSalariale.masseAdmin}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      masseSalariale: { ...prev.masseSalariale, masseAdmin: event.target.value },
                    }))
                  }
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white placeholder:text-white/30"
                />
                <div className="mt-3 text-sm text-white/60">
                  Total masse salariale : {formatCurrency(masseSalarialeTotal)}
                </div>
                <div className="mt-1 text-sm text-white/60">
                  Ratio masse salariale / produits :{" "}
                  <span
                    className={`font-semibold ${
                      ratioMasse < 50 ? "text-green-300" : ratioMasse < 70 ? "text-orange-300" : "text-red-300"
                    }`}
                  >
                    {ratioMasse}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl bg-[#1B2A4A]/60 p-4">
              <div className="text-sm font-semibold text-white">Contrats joueurs</div>
              <div className="mt-3 flex items-center gap-2 text-xs text-white/60">
                Avez-vous des joueurs sous contrat FFF ?
                {["oui", "non"].map((value) => (
                  <button
                    key={value}
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        contrats: { ...prev.contrats, joueursFff: value as ToggleValue },
                      }))
                    }
                    className={`rounded-full px-3 py-1 text-xs ${
                      form.contrats.joueursFff === value ? "bg-white/20 text-white" : "bg-white/5 text-white/50"
                    }`}
                  >
                    {value === "oui" ? "Oui" : "Non"}
                  </button>
                ))}
              </div>
              {form.contrats.joueursFff === "oui" && (
                <div className="mt-3 space-y-2">
                  <input
                    placeholder="Nb de joueurs sous contrat"
                    value={form.contrats.nbJoueurs}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        contrats: { ...prev.contrats, nbJoueurs: event.target.value },
                      }))
                    }
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white placeholder:text-white/30"
                  />
                  <input
                    placeholder="Durée maximale des contrats"
                    value={form.contrats.dureeMax}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        contrats: { ...prev.contrats, dureeMax: event.target.value },
                      }))
                    }
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white placeholder:text-white/30"
                  />
                  <div className="rounded-xl border border-dashed border-white/20 bg-white/5 px-3 py-2 text-xs text-white/40">
                    Registre des contrats
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-xl bg-[#1B2A4A]/60 p-4">
              <div className="text-sm font-semibold text-white">Dettes salariales</div>
              <div className="mt-3 flex items-center gap-2 text-xs text-white/60">
                Avez-vous des retards de paiement de salaires ?
                {["oui", "non"].map((value) => (
                  <button
                    key={value}
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        dettesSalariales: { ...prev.dettesSalariales, retards: value as ToggleValue },
                      }))
                    }
                    className={`rounded-full px-3 py-1 text-xs ${
                      form.dettesSalariales.retards === value ? "bg-white/20 text-white" : "bg-white/5 text-white/50"
                    }`}
                  >
                    {value === "oui" ? "Oui" : "Non"}
                  </button>
                ))}
              </div>
              {form.dettesSalariales.retards === "oui" && (
                <div className="mt-3 space-y-2">
                  <input
                    placeholder="Montant"
                    value={form.dettesSalariales.montant}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        dettesSalariales: { ...prev.dettesSalariales, montant: event.target.value },
                      }))
                    }
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white placeholder:text-white/30"
                  />
                  <input
                    placeholder="Explication"
                    value={form.dettesSalariales.explication}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        dettesSalariales: { ...prev.dettesSalariales, explication: event.target.value },
                      }))
                    }
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white placeholder:text-white/30"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-[#111827] p-6">
          <div className="text-lg font-bold text-white">📋 Gouvernance & Documents Officiels</div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl bg-[#1B2A4A]/60 p-4">
              <div className="text-sm font-semibold text-white">Informations association</div>
              <div className="mt-3 space-y-2">
                {[
                  { label: "Nom officiel de l'association", key: "nom" },
                  { label: "Numéro RNA (registre national)", key: "rna" },
                  { label: "Numéro SIRET", key: "siret" },
                  { label: "Date de création", key: "creation" },
                  { label: "Préfecture de déclaration", key: "prefecture" },
                ].map((field) => (
                  <input
                    key={field.key}
                    placeholder={field.label}
                    value={form.structure[field.key as keyof DncgState["structure"]]}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        structure: { ...prev.structure, [field.key]: event.target.value },
                      }))
                    }
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white placeholder:text-white/30"
                  />
                ))}
              </div>
            </div>

            <div className="rounded-xl bg-[#1B2A4A]/60 p-4">
              <div className="text-sm font-semibold text-white">Dirigeants</div>
              <div className="mt-3 space-y-2">
                {[
                  { label: "Président", key: "president" },
                  { label: "Email président", key: "presidentEmail" },
                  { label: "Trésorier", key: "tresorier" },
                  { label: "Email trésorier", key: "tresorierEmail" },
                  { label: "Secrétaire général", key: "secretaire" },
                  { label: "Email secrétaire", key: "secretaireEmail" },
                  { label: "Directeur sportif", key: "directeur" },
                  { label: "Email directeur sportif", key: "directeurEmail" },
                ].map((field) => (
                  <input
                    key={field.key}
                    placeholder={field.label}
                    value={form.dirigeants[field.key as keyof DncgState["dirigeants"]]}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        dirigeants: { ...prev.dirigeants, [field.key]: event.target.value },
                      }))
                    }
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white placeholder:text-white/30"
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-xl bg-[#1B2A4A]/60 p-4">
            <div className="text-sm font-semibold text-white">Documents obligatoires</div>
            <div className="mt-3 grid gap-3 text-sm text-white/70 lg:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div>Statuts de l'association à jour</div>
                <input
                  type="date"
                  value={form.documents.statutsDate}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      documents: { ...prev.documents, statutsDate: event.target.value },
                    }))
                  }
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white"
                />
                <div className="mt-2 rounded-xl border border-dashed border-white/20 bg-white/5 px-3 py-2 text-xs text-white/40">
                  Upload zone
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div>PV de la dernière Assemblée Générale</div>
                <input
                  type="date"
                  value={form.documents.agDate}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      documents: { ...prev.documents, agDate: event.target.value },
                    }))
                  }
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white"
                />
                <div className="mt-2 rounded-xl border border-dashed border-white/20 bg-white/5 px-3 py-2 text-xs text-white/40">
                  Upload zone
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div>Attestation d'affiliation FFF</div>
                <input
                  placeholder="Numéro de club FFF"
                  value={form.documents.fffNumero}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      documents: { ...prev.documents, fffNumero: event.target.value },
                    }))
                  }
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white placeholder:text-white/30"
                />
                <div className="mt-2 rounded-xl border border-dashed border-white/20 bg-white/5 px-3 py-2 text-xs text-white/40">
                  Upload zone
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div>Certificat de conformité CNOSF</div>
                <select
                  value={form.documents.cnosf}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      documents: { ...prev.documents, cnosf: event.target.value as DncgState["documents"]["cnosf"] },
                    }))
                  }
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white"
                >
                  <option value="">Sélectionner</option>
                  <option value="obtenu">Obtenu</option>
                  <option value="en_cours">En cours</option>
                  <option value="non_applicable">Non applicable</option>
                </select>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div>Rapport du commissaire aux comptes</div>
                <select
                  value={form.documents.commissaire}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      documents: {
                        ...prev.documents,
                        commissaire: event.target.value as DncgState["documents"]["commissaire"],
                      },
                    }))
                  }
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white"
                >
                  <option value="">Sélectionner</option>
                  <option value="applicable">Applicable</option>
                  <option value="non_applicable">Non applicable</option>
                </select>
                {form.documents.commissaire === "applicable" && (
                  <div className="mt-2 rounded-xl border border-dashed border-white/20 bg-white/5 px-3 py-2 text-xs text-white/40">
                    Upload zone
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-xl bg-[#1B2A4A]/60 p-4">
            <div className="text-sm font-semibold text-white">Licences et homologations</div>
            <div className="mt-3 grid gap-3 lg:grid-cols-2">
              <input
                placeholder="Nb de licenciés saison en cours"
                value={form.licences.licencesActuelles}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    licences: { ...prev.licences, licencesActuelles: event.target.value },
                  }))
                }
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white placeholder:text-white/30"
              />
              <input
                placeholder="Nb de licenciés saison précédente"
                value={form.licences.licencesPassees}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    licences: { ...prev.licences, licencesPassees: event.target.value },
                  }))
                }
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white placeholder:text-white/30"
              />
              <div className="flex items-center gap-2 text-xs text-white/60">
                Stade homologué par la FFF ?
                {["oui", "non"].map((value) => (
                  <button
                    key={value}
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        licences: { ...prev.licences, stadeHomologue: value as ToggleValue },
                      }))
                    }
                    className={`rounded-full px-3 py-1 text-xs ${
                      form.licences.stadeHomologue === value ? "bg-white/20 text-white" : "bg-white/5 text-white/50"
                    }`}
                  >
                    {value === "oui" ? "Oui" : "Non"}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 text-xs text-white/60">
                Conditions d'accueil conformes ?
                {["oui", "non"].map((value) => (
                  <button
                    key={value}
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        licences: { ...prev.licences, accueilConforme: value as ToggleValue },
                      }))
                    }
                    className={`rounded-full px-3 py-1 text-xs ${
                      form.licences.accueilConforme === value ? "bg-white/20 text-white" : "bg-white/5 text-white/50"
                    }`}
                  >
                    {value === "oui" ? "Oui" : "Non"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-[#1B2A4A] to-[#0d1b2e] p-6">
          <div className="text-lg font-bold text-white">Récapitulatif DNCG</div>
          <div className="text-sm text-white/60">Points d'attention avant votre passage</div>
          <div className="mt-4 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl bg-white/5 p-4 text-sm text-green-300">
              <div className="mb-2 text-xs uppercase text-white/50">Points forts</div>
              <div>✓ Portefeuille partenaires diversifié</div>
              <div>✓ Taux de renouvellement &gt; 70%</div>
              {resultatNet >= 0 && <div>✓ Résultat prévisionnel positif</div>}
            </div>
            <div className="rounded-xl bg-white/5 p-4 text-sm text-orange-300">
              <div className="mb-2 text-xs uppercase text-white/50">Points à améliorer</div>
              {ratioMasse >= 50 && ratioMasse <= 70 && <div>⚠ Ratio masse salariale à surveiller</div>}
              {form.bilan.hasBilan !== "oui" && <div>⚠ Dossier comptable incomplet</div>}
            </div>
            <div className="rounded-xl bg-white/5 p-4 text-sm text-red-300">
              <div className="mb-2 text-xs uppercase text-white/50">Risques</div>
              {form.bilan.hasBilan !== "oui" && <div>✗ Bilan N-1 non renseigné</div>}
              {form.contrats.joueursFff !== "oui" && <div>✗ Contrats joueurs non uploadés</div>}
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-to-r from-[#C8102E] to-[#8B0000] p-4 text-center lg:p-8">
          <div className="text-lg font-bold text-white lg:text-2xl">Dossier prêt à présenter à la DNCG</div>
          <div className="mt-2 text-sm text-white/80">
            Beyond Network compile automatiquement tous vos documents en un dossier PDF structuré
          </div>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <button className="rounded-full bg-white px-8 py-3 font-semibold text-[#C8102E]">
              📄 Générer le rapport DNCG complet
            </button>
            <a
              href="mailto:expert@club.fr?subject=Dossier%20DNCG%20SU%20Dives%20Cabourg"
              className="rounded-full border border-white px-8 py-3 text-white"
            >
              📧 Envoyer à mon expert-comptable
            </a>
            <button className="rounded-full bg-white/10 px-8 py-3 text-white">
              💾 Sauvegarder le dossier
            </button>
          </div>
          <div className="mt-4 text-xs text-white/40">
            ⚠ Ce dossier est un outil de préparation. Beyond Network ne remplace pas votre
            expert-comptable ou votre conseiller juridique. Faites relire votre dossier avant
            soumission.
          </div>
        </div>
      </div>
    </ClubLayout>
  );
}
