"use client";

import { useEffect, useMemo, useState } from "react";
import { ClubLayout } from "@/components/club/club-layout";
import { useClubGuard } from "@/components/club/use-club-guard";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { addPartnerOffer } from "@/lib/club/partner-offers-store";

type Pack = {
  nom: string;
  prix: string;
  gradient: string;
  border: string;
  avantages: string[];
  nb_souscripteurs: number;
};

const initialPacks: Pack[] = [
  {
    nom: "Pack Bronze",
    prix: "2 500€/an",
    gradient: "from-amber-900/60 to-amber-700/40",
    border: "border-amber-700/30",
    avantages: [
      "1 panneau publicitaire",
      "Logo sur site web",
      "2 invitations matchs",
      "Mention RS (2x/mois)",
    ],
    nb_souscripteurs: 8,
  },
  {
    nom: "Pack Argent",
    prix: "5 000€/an",
    gradient: "from-gray-700/60 to-gray-500/40",
    border: "border-gray-500/30",
    avantages: [
      "2 panneaux publicitaires",
      "Logo maillot entraînement",
      "4 invitations + 1 loge",
      "Mention RS (4x/mois)",
      "Accès annuaire partenaires",
      "1 article dédié",
    ],
    nb_souscripteurs: 10,
  },
  {
    nom: "Pack Or",
    prix: "10 000€/an",
    gradient: "from-yellow-900/60 to-yellow-700/40",
    border: "border-yellow-600/30",
    avantages: [
      "Logo maillot match",
      "Naming événement",
      "Loge VIP saison complète",
      "Mention RS (8x/mois)",
      "Accès Beyond Team + LMS",
      "Rapport ROI mensuel",
      "Placement prioritaire annuaire",
    ],
    nb_souscripteurs: 5,
  },
];

type PrestationItem = { id: string; label: string; price: number | null; description?: string };

const initialPrestations = {
  matchday: [
    { id: "maillot-principal", label: "Sponsor maillot principal", price: 30000 },
    { id: "maillot-manche-droite", label: "Sponsor maillot manche droite", price: 8000 },
    { id: "maillot-manche-gauche", label: "Sponsor maillot manche gauche", price: 8000 },
    { id: "maillot-dos-haut", label: "Sponsor maillot dos haut", price: 10000 },
    { id: "maillot-dos-bas", label: "Sponsor maillot dos bas", price: 6000 },
    { id: "short-avant-droit", label: "Sponsor short avant droit", price: 4000 },
    { id: "short-avant-gauche", label: "Sponsor short avant gauche", price: 4000 },
    { id: "short-arriere-droit", label: "Sponsor short arrière droit", price: 3000 },
    { id: "short-arriere-gauche", label: "Sponsor short arrière gauche", price: 3000 },
    { id: "veste-echauffement", label: "Sponsor veste échauffement", price: 5000 },
    { id: "sac-equipe", label: "Sponsor sac équipe", price: 3000 },
  ] as PrestationItem[],
  training: [
    { id: "training-principal", label: "Sponsor maillot training principal", price: 12000 },
    { id: "training-manche-droite", label: "Sponsor maillot training manche droite", price: 4000 },
    { id: "training-manche-gauche", label: "Sponsor maillot training manche gauche", price: 4000 },
    { id: "training-short-avant", label: "Sponsor short training avant", price: 3000 },
    { id: "training-short-arriere", label: "Sponsor short training arrière", price: 3000 },
    { id: "training-veste", label: "Sponsor veste training", price: 4000 },
    { id: "training-pantalon", label: "Sponsor pantalon training", price: 2000 },
  ] as PrestationItem[],
  digital: [
    { id: "digital-logo", label: "Logo espace partenaire site web", price: 2000 },
    { id: "digital-matchday", label: "Pack match day (story + post)", price: 3000 },
    { id: "digital-week", label: "Pack week (2 posts/semaine)", price: 5000 },
    { id: "digital-newsletter", label: "Naming newsletter", price: 2500 },
  ] as PrestationItem[],
  stade: [
    { id: "stade-3x1", label: "Panneau bord terrain 3m x 1m", price: 2500 },
    { id: "stade-6x1", label: "Panneau bord terrain 6m x 1m", price: 4000 },
    { id: "stade-bache", label: "Bâche tribune 5m x 2m", price: 6000 },
    { id: "stade-presse", label: "Naming salle de presse", price: 8000 },
  ] as PrestationItem[],
  dives: [{ id: "dives-platform", label: "Accès plateforme Beyond Network", price: null }] as PrestationItem[],
};

export default function ClubOffersPage() {
  const status = useClubGuard();
  const [packs, setPacks] = useState<Pack[]>(initialPacks);
  const [showDialog, setShowDialog] = useState(false);
  const [editingPackIndex, setEditingPackIndex] = useState<number | null>(null);
  const [form, setForm] = useState({ nom: "", prix: "", avantages: [""] });
  const [expandedSection, setExpandedSection] = useState<string | null>("match-day");
  const [prestations, setPrestations] = useState(initialPrestations);
  const [showAddPrestationDialog, setShowAddPrestationDialog] = useState(false);
  const [addCategory, setAddCategory] = useState<keyof typeof initialPrestations>("matchday");
  const [newPrestationTitle, setNewPrestationTitle] = useState("");
  const [newPrestationDescription, setNewPrestationDescription] = useState("");
  const [newPrestationPrice, setNewPrestationPrice] = useState<number | "">("");
  const [showCustomOfferDialog, setShowCustomOfferDialog] = useState(false);
  const [customOfferName, setCustomOfferName] = useState("");
  const [customExpandedSection, setCustomExpandedSection] = useState<string | null>("match-day");
  const [customSelections, setCustomSelections] = useState<Record<string, number>>({});
  const [selectedPartner, setSelectedPartner] = useState("");

  const partenaires = [
    { id: "1", nom: "Normandie Énergie" },
    { id: "2", nom: "Cabinet Dupont RH" },
    { id: "3", nom: "Brasserie du Port" },
    { id: "4", nom: "SPA Cabourg" },
    { id: "5", nom: "Auto Garage Martin" },
    { id: "6", nom: "Marine Services" },
    { id: "7", nom: "Électro Plus" },
    { id: "8", nom: "Imprimerie Côte Fleurie" },
  ];

  const catalogSections = useMemo(
    () => [
      { id: "match-day", title: "Match Day — Maillot & Équipement", items: prestations.matchday },
      { id: "training", title: "Training", items: prestations.training },
      { id: "digital", title: "Digital", items: prestations.digital },
      { id: "stade", title: "Stade", items: prestations.stade },
      { id: "dives", title: "Dives Développement", items: prestations.dives },
    ],
    [prestations]
  );

  useEffect(() => {
    const rates: Record<string, number> = {};
    Object.values(prestations).forEach((items) => {
      items.forEach((item) => {
        if (typeof item.price === "number") {
          rates[item.id] = item.price;
        }
      });
    });
    localStorage.setItem("club_sponsorship_rates", JSON.stringify(rates));
  }, [prestations]);

  const updatePrestationPrice = (category: keyof typeof prestations, id: string, price: number) => {
    setPrestations((prev) => ({
      ...prev,
      [category]: prev[category].map((item) => (item.id === id ? { ...item, price } : item)),
    }));
  };

  const addPrestation = () => {
    if (!newPrestationTitle || newPrestationPrice === "") return;
    const id = `${addCategory}-${newPrestationTitle}-${Date.now()}`.toLowerCase().replace(/\s+/g, "-");
    setPrestations((prev) => ({
      ...prev,
      [addCategory]: [
        ...prev[addCategory],
        {
          id,
          label: newPrestationTitle,
          description: newPrestationDescription || undefined,
          price: Number(newPrestationPrice),
        },
      ],
    }));
    setShowAddPrestationDialog(false);
    setNewPrestationTitle("");
    setNewPrestationDescription("");
    setNewPrestationPrice("");
  };

  const removePrestation = (category: keyof typeof prestations, id: string) => {
    if (!confirm("Supprimer cette prestation ?")) return;
    setPrestations((prev) => ({
      ...prev,
      [category]: prev[category].filter((item) => item.id !== id),
    }));
  };

  const offerItemsById = useMemo(() => {
    const map: Record<string, { label: string; price: number | null }> = {};
    catalogSections.forEach((section) => {
      section.items.forEach((item) => {
        map[item.id] = { label: item.label, price: item.price };
      });
    });
    return map;
  }, []);

  const selectedOfferItems = useMemo(() => {
    return Object.entries(customSelections).map(([id, price]) => ({
      id,
      price,
      label: offerItemsById[id]?.label ?? id,
    }));
  }, [customSelections, offerItemsById]);

  const includedOfferItems = useMemo(() => {
    return Object.entries(offerItemsById)
      .filter(([, item]) => item.price === null)
      .map(([id, item]) => ({ id, label: item.label }));
  }, [offerItemsById]);

  const totalOffer = selectedOfferItems.reduce((sum, item) => sum + item.price, 0);
  const totalOfferTtc = totalOffer * 1.2;

  const openDialog = (index?: number) => {
    if (index !== undefined) {
      const pack = packs[index];
      setEditingPackIndex(index);
      setForm({ nom: pack.nom, prix: pack.prix, avantages: pack.avantages });
    } else {
      setEditingPackIndex(null);
      setForm({ nom: "", prix: "", avantages: [""] });
    }
    setShowDialog(true);
  };

  const savePack = () => {
    const nextPack: Pack = {
      nom: form.nom,
      prix: form.prix,
      avantages: form.avantages.filter(Boolean),
      nb_souscripteurs: 0,
      gradient: "from-slate-800/60 to-slate-600/40",
      border: "border-white/10",
    };
    if (editingPackIndex !== null) {
      setPacks((prev) => prev.map((pack, idx) => (idx === editingPackIndex ? { ...pack, ...nextPack } : pack)));
    } else {
      setPacks((prev) => [...prev, nextPack]);
    }
    setShowDialog(false);
  };

  const saveCustomOffer = () => {
    if (selectedOfferItems.length === 0) return;
    const nextPack: Pack = {
      nom: customOfferName || "Offre personnalisée",
      prix: `${totalOffer.toLocaleString("fr-FR")}€`,
      avantages: [
        ...selectedOfferItems.map((item) => item.label),
        ...includedOfferItems.map((item) => `${item.label} (INCLUS)`),
      ],
      nb_souscripteurs: 0,
      gradient: "from-slate-800/60 to-slate-600/40",
      border: "border-white/10",
    };
    setPacks((prev) => [nextPack, ...prev]);
    setShowCustomOfferDialog(false);
    if (selectedPartner) {
      const partner = partenaires.find((item) => item.id === selectedPartner);
      addPartnerOffer(selectedPartner, partner?.nom ?? selectedPartner, {
        id: `offer-${Date.now()}`,
        name: nextPack.nom,
        totalHt: totalOffer,
        createdAt: new Date().toISOString(),
      });
      toast.success(`Offre sauvegardée dans la fiche de ${partner?.nom ?? "ce partenaire"} ✓`);
    } else {
      toast.success("Offre créée ✓");
    }
    setCustomOfferName("");
    setCustomSelections({});
    setCustomExpandedSection("match-day");
    setSelectedPartner("");
  };

  if (status !== "allowed") {
    return null;
  }

  return (
    <ClubLayout activeItem="Offres">
      <div className="p-4 lg:p-8 pt-6 lg:pt-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-lg font-semibold text-white lg:text-2xl">Packs partenaires</h1>
          <button
            className="rounded-full px-5 py-2 text-sm font-semibold text-white"
            style={{ backgroundColor: "var(--club-primary)" }}
            onClick={() => openDialog()}
          >
            + Créer un pack
          </button>
        </div>

        <div className="mt-6 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {packs.map((pack, index) => (
            <div
              key={pack.nom}
              className={`rounded-2xl border ${pack.border} bg-gradient-to-br ${pack.gradient} p-6`}
            >
              <div className="text-lg font-black text-white lg:text-2xl">{pack.nom}</div>
              <div className="mt-1 text-xl" style={{ color: "var(--club-primary)" }}>
                {pack.prix}
              </div>
              <div className="my-4 h-px bg-white/10" />
              <ul className="space-y-2 text-sm text-white/70">
                {pack.avantages.map((item) => (
                  <li key={item}>
                    <span style={{ color: "var(--club-primary)" }}>✓</span> {item}
                  </li>
                ))}
              </ul>
              <div className="mt-4 text-sm text-white/50">{pack.nb_souscripteurs} partenaires</div>
              <div className="mt-4 flex gap-2">
                <button
                  className="rounded-full bg-white/10 px-4 py-1.5 text-xs text-white"
                  onClick={() => openDialog(index)}
                >
                  Modifier
                </button>
                <button className="rounded-full bg-white/10 px-4 py-1.5 text-xs text-white">
                  Générer PDF
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-[#111] text-white">
          <DialogHeader>
            <DialogTitle>{editingPackIndex !== null ? "Modifier le pack" : "Créer un pack"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              value={form.nom}
              onChange={(event) => setForm({ ...form, nom: event.target.value })}
              placeholder="Nom"
              className="border-white/10 bg-white/5 text-white"
            />
            <Input
              value={form.prix}
              onChange={(event) => setForm({ ...form, prix: event.target.value })}
              placeholder="Prix"
              className="border-white/10 bg-white/5 text-white"
            />
            <div className="space-y-2">
              {form.avantages.map((avantage, idx) => (
                <div key={`${avantage}-${idx}`} className="flex items-center gap-2">
                  <Input
                    value={avantage}
                    onChange={(event) => {
                      const next = [...form.avantages];
                      next[idx] = event.target.value;
                      setForm({ ...form, avantages: next });
                    }}
                    placeholder="Avantage"
                    className="border-white/10 bg-white/5 text-white"
                  />
                  <button
                    className="text-white/50"
                    onClick={() =>
                      setForm({ ...form, avantages: form.avantages.filter((_, index) => index !== idx) })
                    }
                  >
                    🗑️
                  </button>
                </div>
              ))}
              <button
                className="rounded-full bg-white/10 px-3 py-1 text-xs text-white"
                onClick={() => setForm({ ...form, avantages: [...form.avantages, ""] })}
              >
                + Ajouter
              </button>
            </div>
          </div>
          <DialogFooter>
            <button className="rounded-full bg-white/10 px-4 py-2 text-sm" onClick={() => setShowDialog(false)}>
              Annuler
            </button>
            <button
              className="rounded-full px-4 py-2 text-sm text-white"
              style={{ backgroundColor: "var(--club-primary)" }}
              onClick={savePack}
            >
              Sauvegarder
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="mt-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="text-lg font-semibold text-white lg:text-2xl">Catalogue des prestations</div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              className="rounded-full bg-white/10 px-4 py-2 text-sm text-white/70"
              onClick={() => {
                setAddCategory("matchday");
                setShowAddPrestationDialog(true);
              }}
            >
              + Nouvelle prestation
            </button>
            <button
              className="rounded-full bg-[#C8102E] px-6 py-3 text-base font-semibold text-white"
              onClick={() => setShowCustomOfferDialog(true)}
            >
              ✨ Créer une offre personnalisée
            </button>
          </div>
        </div>
        <div className="mt-1 text-sm text-white/60">
          Configurez les tarifs suggérés par emplacement
        </div>

        <div className="mt-6 space-y-3">
          {catalogSections.map((section) => {
            const sectionKey = (section.id === "match-day"
              ? "matchday"
              : section.id === "training"
                ? "training"
                : section.id === "digital"
                  ? "digital"
                  : section.id === "stade"
                    ? "stade"
                    : "dives") as keyof typeof prestations;
            return (
            <div key={section.id} className="rounded-xl bg-[#1B2A4A]/40 p-4">
              <button
                className="flex w-full items-center justify-between text-left text-sm font-semibold text-white"
                onClick={() =>
                  setExpandedSection((prev) => (prev === section.id ? null : section.id))
                }
              >
                <span>{section.title}</span>
                <span className="text-white/60">{expandedSection === section.id ? "▾" : "▸"}</span>
              </button>
              {expandedSection === section.id && (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-left text-sm text-white/70">
                    <thead className="text-xs uppercase text-white/50">
                      <tr>
                        <th className="py-2">Prestation</th>
                        <th className="py-2">Tarif suggéré</th>
                        <th className="py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {section.items.map((item) => (
                        <tr key={item.id} className="border-t border-white/10">
                          <td className="py-2">{item.label}</td>
                          <td className="py-2">
                            {item.price === null ? (
                              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-300">
                                INCLUS
                              </span>
                            ) : (
                              <Input
                                type="number"
                                className="h-8 max-w-[140px] border-white/10 bg-white/5 text-white"
                                value={item.price}
                                onChange={(event) =>
                                  updatePrestationPrice(sectionKey, item.id, Number(event.target.value))
                                }
                              />
                            )}
                          </td>
                          <td className="py-2">
                            {item.price === null ? (
                              <span className="text-xs text-white/40">—</span>
                            ) : (
                              <div className="flex items-center gap-2">
                                <button className="rounded-full bg-white/10 px-3 py-1 text-xs text-white">
                                  ✓ Sauvegarder
                                </button>
                                <button
                                  onClick={() => removePrestation(sectionKey, item.id)}
                                  className="text-red-400 hover:text-red-300 text-sm ml-2"
                                >
                                  🗑️
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <button
                    className="mt-3 rounded-full bg-white/10 px-3 py-1 text-sm text-white/70"
                    onClick={() => {
                      setAddCategory(sectionKey);
                      setShowAddPrestationDialog(true);
                    }}
                  >
                    + Ajouter une prestation
                  </button>
                </div>
              )}
            </div>
          )})}
        </div>
      </div>

      <Dialog open={showCustomOfferDialog} onOpenChange={setShowCustomOfferDialog}>
        <DialogContent className="max-h-[90vh] max-w-6xl overflow-y-auto bg-[#111] text-white">
          <DialogHeader>
            <DialogTitle>Créer une offre personnalisée</DialogTitle>
            <div className="text-sm text-white/60">
              Sélectionnez les prestations et composez votre offre sur mesure
            </div>
          </DialogHeader>
          <div className="grid grid-cols-[1fr_380px] gap-6">
            <div className="max-h-[65vh] overflow-y-auto space-y-4 pr-2">
              <div className="text-sm font-semibold text-white">Sélectionnez les prestations</div>
              {catalogSections.map((section) => (
                <div key={section.id} className="rounded-xl bg-[#1B2A4A]/40 p-4">
                  <button
                    className="flex w-full items-center justify-between text-left text-sm font-semibold text-white"
                    onClick={() =>
                      setCustomExpandedSection((prev) => (prev === section.id ? null : section.id))
                    }
                  >
                    <span>{section.title.replace("— Maillot & Équipement", "")}</span>
                    <span className="text-white/60">
                      {customExpandedSection === section.id ? "▾" : "▸"}
                    </span>
                  </button>
                  {customExpandedSection === section.id && (
                    <div className="mt-4 space-y-2 text-sm text-white/70">
                      {section.items.map((item) => {
                        if (item.price === null) {
                          return (
                            <div key={item.id} className="flex items-center justify-between">
                              <span>{item.label}</span>
                              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-300">
                                INCLUS
                              </span>
                            </div>
                          );
                        }
                        const value = item.price ?? 0;
                        const checked = Object.prototype.hasOwnProperty.call(customSelections, item.id);
                        return (
                          <label key={item.id} className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(event) => {
                                  const isChecked = event.target.checked;
                                  setCustomSelections((prev) => {
                                    if (!isChecked) {
                                      const next = { ...prev };
                                      delete next[item.id];
                                      return next;
                                    }
                                    return { ...prev, [item.id]: value };
                                  });
                                }}
                              />
                              <span>{item.label}</span>
                            </div>
                            <span>{value.toLocaleString("fr-FR")}€</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="sticky top-0 space-y-4 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm font-semibold text-white">Votre offre</div>
              <div className="mb-4">
                <label className="mb-1 block text-xs text-white/60">Associer à un partenaire</label>
                <select
                  value={selectedPartner}
                  onChange={(event) => setSelectedPartner(event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white"
                >
                  <option value="">— Sélectionner un partenaire —</option>
                  {partenaires.map((partner) => (
                    <option key={partner.id} value={partner.id}>
                      {partner.nom}
                    </option>
                  ))}
                </select>
              </div>
              <Input
                value={customOfferName}
                onChange={(event) => setCustomOfferName(event.target.value)}
                placeholder="Nom de l'offre"
                className="border-white/10 bg-white/5 text-white"
              />
              <div className="space-y-2 text-sm text-white/70">
                {selectedOfferItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <div>{item.label}</div>
                    <div className="flex items-center gap-2">
                      <span>{item.price.toLocaleString("fr-FR")}€</span>
                      <button
                        className="text-white/50"
                        onClick={() =>
                          setCustomSelections((prev) => {
                            const next = { ...prev };
                            delete next[item.id];
                            return next;
                          })
                        }
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
                {includedOfferItems.length > 0 && (
                  <div className="text-xs text-white/50">
                    {includedOfferItems.map((item) => item.label).join(", ")} (INCLUS)
                  </div>
                )}
              </div>
              <div className="my-2 h-px bg-white/10" />
              <div className="text-xl font-black text-[#C8102E] lg:text-3xl">
                {totalOffer.toLocaleString("fr-FR")}€
              </div>
              <div className="text-sm text-white/60">Total TTC : {totalOfferTtc.toLocaleString("fr-FR")}€</div>
              <button
                className="w-full rounded-full bg-[#C8102E] px-4 py-2 text-sm font-semibold text-white"
                onClick={saveCustomOffer}
              >
                Sauvegarder l'offre
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddPrestationDialog} onOpenChange={setShowAddPrestationDialog}>
        <DialogContent className="bg-[#1B2A4A] text-white">
          <DialogHeader>
            <DialogTitle>Nouvelle prestation</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Titre de la prestation"
              value={newPrestationTitle}
              onChange={(event) => setNewPrestationTitle(event.target.value)}
              className="border-white/10 bg-white/5 text-white"
            />
            <textarea
              placeholder="Description (optionnel)"
              value={newPrestationDescription}
              onChange={(event) => setNewPrestationDescription(event.target.value)}
              className="min-h-[120px] rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white"
            />
            <Input
              type="number"
              placeholder="Tarif suggéré €"
              value={newPrestationPrice}
              onChange={(event) => setNewPrestationPrice(Number(event.target.value))}
              className="border-white/10 bg-white/5 text-white"
            />
          </div>
          <DialogFooter>
            <button
              className="rounded-full bg-white/10 px-4 py-2 text-sm"
              onClick={() => setShowAddPrestationDialog(false)}
            >
              Annuler
            </button>
            <button
              className="rounded-full bg-[#C8102E] px-4 py-2 text-sm text-white"
              onClick={addPrestation}
            >
              Ajouter
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ClubLayout>
  );
}
