"use client";
import { useEffect, useMemo, useState } from "react";
import { DndContext, DragEndEvent, useDraggable, useDroppable } from "@dnd-kit/core";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Briefcase, CheckCircle2, FileText, Mail, MapPin, Phone, User } from "lucide-react";
import { toast } from "sonner";
import { mockProspects } from "@/lib/mocks/appData";

export const dynamic = "force-dynamic";

type CompanyCard = {
  id: string;
  name: string;
  company_name?: string;
  status: string;
  siren?: string;
  siret?: string;
  amount?: number | null;
  npc_value?: number | null;
  opco?: string;
  opco_name?: string;
  naf_ape?: string;
  naf_code?: string;
  tranche_effectif?: string;
  sector?: string;
  creation_date?: string;
  idcc_code?: string;
  cursus?: string;
  city?: string;
  zip_code?: string;
  address?: string;
  target_class_id?: string | null;
  is_signed?: boolean | null;
  contact_firstname?: string;
  contact_lastname?: string;
  contact_email?: string;
  contact_phone?: string;
  positions?: number;
  hot?: boolean;
};

type SchoolClassOption = {
  id: string;
  name: string | null;
  npc_amount?: number | null;
};

const columns = ["Prospect", "Présentation", "Offre en cours", "Envoi CERFA", "Gagné"];

const npcTable: Record<string, number> = {
  Mastere: 9500,
  Bachelor: 7500,
  "Titre Pro": 6000,
};

  const calculateTotals = (items: CompanyCard[]) => {
  const offers = items.filter((row) => row.status && row.status !== "Prospect").length;
  const caPot = items.reduce((sum, row) => sum + (row.amount || 0), 0);
  const caSec = items
    .filter((row) => ["Signé", "Contrat"].includes(row.status))
    .reduce((sum, row) => sum + (row.amount || 0), 0);
  return { offers, caPotentiel: caPot, caSecurise: caSec };
};

const formatMoney = (value: number) => `${value.toLocaleString("fr-FR")} €`;

const getOpcoStyle = (opcoName: string) => {
  const normalized = (opcoName || "").toLowerCase();
  if (normalized.includes("mobilités")) return "bg-gradient-to-r from-blue-600 to-blue-400 text-white";
  if (normalized.includes("akto")) return "bg-gradient-to-r from-emerald-700 to-emerald-500 text-white";
  if (normalized.includes("constructys")) return "bg-gradient-to-r from-green-500 to-yellow-400 text-black";
  return "bg-gradient-to-r from-orange-500 to-orange-300 text-black";
};

const cleanCompanyName = (value: string) => {
  const match = value.match(/\(([^)]+)\)/);
  if (match && match[1].trim().toUpperCase() === "ALTERNANCIA") {
    return "ALTERNANCIA";
  }
  return value.replace(/\s*\([^)]*\)\s*/g, " ").replace(/\s{2,}/g, " ").trim();
};

const getOpcoFromNaf = (naf: string): string => {
  if (!naf) return "À vérifier";
  const prefix2 = naf.substring(0, 2);

  if (["64", "65", "66", "69", "70", "71", "72", "73", "74", "75"].includes(prefix2)) return "ATLAS";
  if (["45", "49", "50", "51", "52", "53"].includes(prefix2)) return "OPCO Mobilités";
  if (["10", "11", "13", "14", "15", "16", "17", "18"].includes(prefix2)) return "OCAPIAT";
  if (["01", "02", "03", "05", "06", "07", "08", "09"].includes(prefix2)) return "OPCO 2i";
  if (["41", "42", "43"].includes(prefix2)) return "Constructys";
  if (["46", "47", "77", "79", "81", "82"].includes(prefix2)) return "L'Opcommerce";
  if (["55", "56", "58", "59", "60", "61", "62", "63"].includes(prefix2)) return "OPCO Santé";
  if (["84", "85", "86", "87", "88", "94"].includes(prefix2)) return "AKTO";
  if (["90", "91", "92", "93"].includes(prefix2)) return "AFDAS";
  if (["95", "96"].includes(prefix2)) return "OPCO Uniformation";

  return `À vérifier (NAF: ${naf})`;
};

const calculateNPC = (opco: string, className: string, npcAmount?: number | null) => {
  if (typeof npcAmount === "number" && Number.isFinite(npcAmount)) return npcAmount;
  const normalizedClass = className.toLowerCase();
  if (normalizedClass.includes("bts") && opco === "AKTO") return 8000;
  if (normalizedClass.includes("bachelor") && opco === "ATLAS") return 9500;
  return 0;
};

const getContractOpco = (companyName: string, nafCode: string) => {
  const normalizedName = companyName.toLowerCase();
  if (normalizedName.includes("stade malherbe") || nafCode.startsWith("93") || nafCode.startsWith("90")) {
    return "AFDAS";
  }
  if (normalizedName.includes("alternancia") || nafCode.startsWith("85")) return "AKTO";
  return getOpcoFromNaf(nafCode);
};

const mapMockProspects = () =>
  mockProspects.map((row) => ({
    id: row.id,
    name: row.company_name || row.name || "Prospect",
    company_name: row.company_name || row.name || null,
    status: row.status,
    amount: row.amount ?? null,
    npc_value: row.npc_value ?? null,
    opco_name: row.opco_name ?? null,
    city: row.city ?? null,
    positions: row.positions ?? 1,
    cursus: row.cursus ?? "Bachelor",
    hot: row.hot ?? false,
  })) as CompanyCard[];

function DraggableCard({ card, onSelect }: { card: CompanyCard; onSelect: (card: CompanyCard) => void }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: card.id });
  const style = transform ? { transform: `translate(${transform.x}px, ${transform.y}px)` } : undefined;
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-2xl border border-white/10 bg-white/70 p-3 shadow-sm backdrop-blur"
    >
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          onClick={() => onSelect(card)}
          className="block w-full text-left text-sm font-semibold text-black/70 hover:text-[#007AFF] hover:underline"
        >
          {card.company_name || card.name} {card.hot ? "🔥" : ""}
        </button>
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab select-none text-xs text-black/40 hover:text-black"
          aria-label="Déplacer la carte"
        >
          ⋮⋮
        </button>
      </div>
      <p className="mt-1 text-xs text-black/50">
        {card.cursus || "-"} · {card.positions || 1} poste(s)
      </p>
      <div className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={() => onSelect(card)}
          className="text-xs text-black/50 hover:text-black"
        >
          Détails
        </button>
      </div>
    </div>
  );
}

function DroppableColumn({
  id,
  children,
  header,
  highlight,
}: {
  id: string;
  header: React.ReactNode;
  highlight: string;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`min-w-[300px] flex-none rounded-3xl border border-white/10 p-4 shadow-sm backdrop-blur-xl ${
        isOver ? "ring-2 ring-blue-400/40" : ""
      } ${highlight}`}
    >
      <div className="mb-4 border-b border-white/10 pb-3">{header}</div>
      {children}
    </div>
  );
}

export default function SchoolProspectionPage() {
  const supabase = createSupabaseBrowserClient();
  const [cards, setCards] = useState<CompanyCard[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<CompanyCard | null>(null);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [schoolClasses, setSchoolClasses] = useState<SchoolClassOption[]>([]);
  const [siret, setSiret] = useState("");
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [address, setAddress] = useState("");
  const [nafApe, setNafApe] = useState("");
  const [trancheEffectif, setTrancheEffectif] = useState("");
  const [contactFirstname, setContactFirstname] = useState("");
  const [contactLastname, setContactLastname] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [opcoSaved, setOpcoSaved] = useState(false);
  const [isSavingOpco, setIsSavingOpco] = useState(false);
  const [opco, setOpco] = useState("");
  const [lastIdcc, setLastIdcc] = useState("");
  const [lastSiret, setLastSiret] = useState("");
  const [scanError, setScanError] = useState("");
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [hasCleanedDuplicates, setHasCleanedDuplicates] = useState(false);
  const [analysisDisc, setAnalysisDisc] = useState<string[]>([]);
  const [analysisTips, setAnalysisTips] = useState<string[]>([]);
  const [decisionMakers, setDecisionMakers] = useState<
    Array<{ id: string; name: string; role: string; email?: string }>
  >([]);
  const [decisionLoading, setDecisionLoading] = useState(false);
  const [contractDialogOpen, setContractDialogOpen] = useState(false);
  const [contractType, setContractType] = useState<"Alternance" | "Stage" | "Apprentissage">("Alternance");
  const [contractClauses, setContractClauses] = useState("");
  const [handicapPin, setHandicapPin] = useState("");
  const [handicapUnlocked, setHandicapUnlocked] = useState(false);
  const [handicapType, setHandicapType] = useState("");
  const [handicapExtraTime, setHandicapExtraTime] = useState("");
  const [handicapFiles, setHandicapFiles] = useState<File[]>([]);
  const [handicapSaving, setHandicapSaving] = useState(false);
  const [handicapError, setHandicapError] = useState<string | null>(null);
  const requiredHandicapCode = process.env.NEXT_PUBLIC_HANDICAP_ACCESS_CODE || "";
  const setFormData = (
    updater: (prev: {
      name: string;
      company_name: string;
      naf_code: string;
      opco_name: string;
      city: string;
      zip_code: string;
      address: string;
    }) => {
      name: string;
      company_name: string;
      naf_code: string;
      opco_name: string;
      city: string;
      zip_code: string;
      address: string;
    }
  ) => {
    const next = updater({
      name,
      company_name: name,
      naf_code: nafApe,
      opco_name: opco,
      city,
      zip_code: zipCode,
      address,
    });
    setName(next.name || "");
    setNafApe(next.naf_code || "");
    setOpco(next.opco_name || "");
    setCity(next.city || "");
    setZipCode(next.zip_code || "");
    setAddress(next.address || "");
  };
  const [discResult, setDiscResult] = useState<{
    color: "Rouge" | "Jaune" | "Vert" | "Bleu";
    strengths: string[];
    vigilance: string;
    hook: string;
  } | null>(null);
  const [cursus, setCursus] = useState<"Mastere" | "Bachelor" | "Titre Pro">("Mastere");
  const [positions, setPositions] = useState(1);
  const [isAutoFill, setIsAutoFill] = useState(false);
  const [manualEntry, setManualEntry] = useState(false);
  const [modalStep, setModalStep] = useState<1 | 2>(1);
  const [createdProspectId, setCreatedProspectId] = useState<string | null>(null);
  const potentialCA = useMemo(() => npcTable[cursus], [cursus]);
  const columnStats = useMemo(() => {
    return columns.reduce<Record<string, { count: number; ca: number }>>((acc, column) => {
      const items = cards.filter((card) => card.status === column);
      const ca = items.reduce((sum, item) => {
        const npc = npcTable[item.cursus || "Mastere"] || 0;
        const fallback = npc * (item.positions || 1);
        const amount = item.amount ?? item.npc_value ?? fallback;
        return sum + (amount || 0);
      }, 0);
      acc[column] = { count: items.length, ca };
      return acc;
    }, {});
  }, [cards]);

  const updateSelectedCard = (updates: Partial<CompanyCard>) => {
    if (!selectedCard) return;
    const next = { ...selectedCard, ...updates };
    setSelectedCard(next);
    setCards((prev) => prev.map((card) => (card.id === next.id ? next : card)));
  };

  const handleGenerateContract = () => {
    setContractClauses("");
    setContractType("Alternance");
    setContractDialogOpen(true);
  };

  const handlePrefillContract = () => {
    const nafCode = selectedCard?.naf_code || selectedCard?.naf_ape || "";
    const clauses = nafCode.startsWith("85")
      ? "Clauses spécifiques : encadrement pédagogique renforcé, rythme alterné, suivi trimestriel."
      : nafCode.startsWith("93") || nafCode.startsWith("92") || nafCode.startsWith("90")
      ? "Clauses spécifiques : cadre événementiel/sportif, mobilités terrain, reporting mensuel."
      : "Clauses spécifiques : missions commerciales, objectifs mensuels, point d'étape trimestriel.";
    setContractClauses(clauses);
  };

  const handleSaveSelectedCard = async () => {
    if (!selectedCard || !supabase || !schoolId) return;
    const npc = npcTable[selectedCard.cursus || "Mastere"] || 0;
    const selectedClass = schoolClasses.find((item) => item.id === selectedCard.target_class_id);
    const opcoValue =
      selectedCard.opco_name ||
      selectedCard.opco ||
      getOpcoFromNaf(selectedCard.naf_code || selectedCard.naf_ape || "");
    const npcValue =
      calculateNPC(opcoValue || "", selectedClass?.name || "", selectedClass?.npc_amount) ||
      npc * (selectedCard.positions || 1);
    const resolvedOpco = selectedCard.naf_code || selectedCard.naf_ape
      ? getOpcoFromNaf(selectedCard.naf_code || selectedCard.naf_ape || "")
      : selectedCard.opco;
    if (resolvedOpco && resolvedOpco !== selectedCard.opco) {
      updateSelectedCard({ opco: resolvedOpco });
    }
    await supabase
      .from("crm_prospects")
      .update({
        amount: selectedCard.amount ?? npcValue,
        npc_value: npcValue,
        step: selectedCard.status,
        target_class_id: selectedCard.target_class_id || null,
        is_signed: selectedCard.is_signed ?? false,
        school_id: schoolId,
      })
      .eq("id", selectedCard.id);
    await getStatistics(schoolId);
  };

  const handleHandicapUnlock = () => {
    if (!requiredHandicapCode || handicapPin === requiredHandicapCode) {
      setHandicapUnlocked(true);
      setHandicapError(null);
      return;
    }
    setHandicapError("Code d'accès invalide.");
  };

  const handleHandicapSave = async () => {
    if (!supabase || !selectedCard?.id) return;
    setHandicapSaving(true);
    setHandicapError(null);
    try {
      let uploadedPaths: string[] = [];
      if (handicapFiles.length) {
        const uploads = await Promise.all(
          handicapFiles.map(async (file) => {
            const path = `${selectedCard.id}/${Date.now()}-${file.name}`;
            const { error } = await supabase.storage.from("handicap-justificatifs").upload(path, file, {
              upsert: true,
            });
            if (error) throw error;
            return path;
          })
        );
        uploadedPaths = uploads;
      }
      const { error } = await supabase
        .from("student_handicap_data")
        .upsert(
          {
            student_id: selectedCard.id,
            accommodation_type: handicapType,
            extra_time_duration: handicapExtraTime,
            justification_files: uploadedPaths.length ? uploadedPaths : null,
          },
          { onConflict: "student_id" }
        );
      if (error) throw error;
    } catch (error) {
      setHandicapError((error as { message?: string })?.message || "Erreur lors de la sauvegarde");
    } finally {
      setHandicapSaving(false);
    }
  };

  const normalizeStep = (value?: string | null) => {
    if (!value) return "Prospect";
    if (value === "Presentation") return "Présentation";
    if (value === "Signer") return "Gagné";
    if (value === "Envoi candidats") return "Offre en cours";
    if (value === "Signature en attente") return "Envoi CERFA";
    return value;
  };

  const derivedTotals = useMemo(() => calculateTotals(cards), [cards]);
  const entrepriseAvecOffres = derivedTotals.offers;
  const caPotentiel = derivedTotals.caPotentiel;
  const caSecurise = derivedTotals.caSecurise;

  const caNpcPotentiel = useMemo(() => {
    return cards.reduce((sum, card) => {
      const selectedClass = schoolClasses.find((item) => item.id === card.target_class_id);
      const opcoValue = card.opco_name || card.opco || getOpcoFromNaf(card.naf_code || card.naf_ape || "");
      const npcAmount = calculateNPC(opcoValue || "", selectedClass?.name || "", selectedClass?.npc_amount);
      return sum + (npcAmount || 0);
    }, 0);
  }, [cards, schoolClasses]);

  const caNpcSigne = useMemo(() => {
    return cards.reduce((sum, card) => {
      if (!card.is_signed) return sum;
      const selectedClass = schoolClasses.find((item) => item.id === card.target_class_id);
      const opcoValue = card.opco_name || card.opco || getOpcoFromNaf(card.naf_code || card.naf_ape || "");
      const npcAmount = calculateNPC(opcoValue || "", selectedClass?.name || "", selectedClass?.npc_amount);
      return sum + (npcAmount || 0);
    }, 0);
  }, [cards, schoolClasses]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const target = over.id as string;
    if (!columns.includes(target)) return;
    setCards((prev) =>
      prev.map((card) => (card.id === String(active.id) ? { ...card, status: target } : card))
    );
    if (supabase && schoolId) {
      const nextStatus = target === "Gagné" ? "client" : "prospect";
      await supabase
        .from("crm_prospects")
        .update({ step: target, company_status: nextStatus })
        .eq("id", active.id);
    }
  };

  const handleAutoFill = async (nextSiret: string) => {
    if (createdProspectId) return;
    setIsAutoFill(true);
    setScanError("");
    try {
      if (nextSiret.length === 14) {
        if (lastSiret === nextSiret) {
          setIsAutoFill(false);
          return;
        }
        setLastSiret(nextSiret);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        const response = await fetch(`https://recherche-entreprises.api.gouv.fr/search?q=${nextSiret}`, {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        const data = await response.json();
        const first = data?.results?.[0];
        const siege = first?.siege || {};
        let proxyData: {
          raison_sociale?: string;
          activite_principale?: string;
          opco_name?: string;
          adresse?: string;
        } | null = null;
        try {
          const proxyResponse = await fetch(`/api/proxy-opco?siret=${nextSiret}`);
          proxyData = await proxyResponse.json();
        } catch {
          proxyData = null;
        }
        const rawName =
          proxyData?.raison_sociale ||
          first?.nom_raison_sociale ||
          first?.nom_entreprise ||
          first?.denomination ||
          name ||
          "Prospect";
        const nextName = String(rawName).replace(/[^\w\s]/gi, "");
        const nextCity = siege?.libelle_commune || "";
        const nextZip = siege?.code_postal || "";
        const apeCode = proxyData?.activite_principale || first?.activite_principale;
        const idccCode =
          first?.conventions_collectives?.[0]?.idcc ||
          first?.convention_collective?.idcc ||
          first?.idcc ||
          "";
        const nextSector =
          first?.activite_principale_libelle ||
          first?.libelle_activite_principale ||
          first?.libelle_activite_principale_entreprise ||
          first?.secteur_activite ||
          "";
        const nextCreationDate = first?.date_creation || null;
        const finalName = cleanCompanyName(proxyData?.raison_sociale || nextName);
        const finalNaf = proxyData?.activite_principale || apeCode || "";
        let finalOpco = getOpcoFromNaf(finalNaf);
        if (proxyData?.opco_name && proxyData.opco_name !== "À déterminer") {
          finalOpco = proxyData.opco_name;
        }
        const addressValue = proxyData?.adresse || siege?.adresse || "";
        const cityValue = nextCity || "";
        const zipValue = nextZip || "";
        setFormData((prev) => ({
          ...prev,
          name: finalName,
          company_name: finalName,
          naf_code: finalNaf,
          opco_name: finalOpco,
          city: cityValue || prev.city,
          zip_code: zipValue || prev.zip_code,
          address: addressValue || prev.address,
        }));
        setTrancheEffectif(first?.tranche_effectif_salarie || "");
        setLastIdcc(idccCode ? String(idccCode) : "");
        setLastSiret(nextSiret);

        if (!finalName) {
          toast.error("Nom de l'entreprise introuvable");
          return;
        }
        if (!schoolId) {
          alert("Erreur DB: school_id manquant");
        } else if (supabase) {
          const siren = nextSiret.slice(0, 9);
          try {
            const alreadyLocal = cards.some(
              (card) => card.siret === nextSiret || (card.siren && card.siren === siren)
            );
            if (alreadyLocal) {
              setDialogOpen(false);
              return;
            }
            // Schéma minimal: pas de check par siret
            const cleanData = {
              name: finalName || "Entreprise Inconnue",
              company_name: finalName || "Entreprise Inconnue",
              naf_code: finalNaf || "",
              opco_name: finalOpco || "",
              siret: nextSiret,
              address: addressValue || null,
              city: cityValue || null,
              zip_code: zipValue || null,
              amount: 0,
              npc_value: 0,
              step: "Prospect",
              sector: nextSector || null,
              creation_date: nextCreationDate,
              school_id: schoolId,
            };
            console.table(proxyData);
            console.log("Envoi vers Supabase:", finalName);
            const { error } = await supabase
              .from("crm_prospects")
              .upsert(cleanData, { onConflict: "siret" })
              .select("id")
              .single();
            if (error) {
              throw error;
            }
            await loadProspects(schoolId);
            await getStatistics(schoolId);
            setDialogOpen(false);
            setModalStep(1);
            setManualEntry(false);
            setCreatedProspectId(null);
          } catch (error) {
            console.error(
              "Détail erreur Supabase:",
              (error as { message?: string })?.message,
              (error as { details?: string })?.details,
              (error as { hint?: string })?.hint
            );
            alert("Erreur DB: " + ((error as { message?: string })?.message || "insertion échouée"));
          }
        }
      }
    } catch (error) {
      if ((error as { name?: string })?.name === "AbortError") {
        setScanError("Serveur INSEE indisponible, veuillez saisir manuellement");
      } else {
        setScanError("Serveur INSEE indisponible, veuillez saisir manuellement");
      }
      setName("Groupe Horizon");
      setCity("Rouen");
      setZipCode("76000");
      setOpco("À vérifier");
    } finally {
      setIsAutoFill(false);
    }
  };

  const loadProspects = async (sid: string) => {
    if (!supabase) return;
    const { data } = await supabase
      .from("crm_prospects")
      .select("*")
      .eq("school_id", sid);
    if (data && data.length) {
      setCards(
        data.map((row: any) => ({
          id: row.id,
          name: row.company_name || row.name || "Prospect",
          company_name: row.company_name || null,
          status: normalizeStep(row.step),
          amount: row.amount ?? null,
          npc_value: row.npc_value ?? null,
          siret: row.siret || null,
          siren: row.siren || null,
          city: row.city || null,
          zip_code: row.zip_code || null,
          address: row.address || null,
          opco: row.opco || null,
          opco_name: row.opco_name || null,
          naf_ape: row.naf_ape || null,
          naf_code: row.naf_code || null,
          sector: row.sector || null,
          creation_date: row.creation_date || null,
          idcc_code: row.idcc_code || null,
          contact_firstname: row.contact_firstname || null,
          contact_lastname: row.contact_lastname || null,
          contact_email: row.contact_email || null,
          contact_phone: row.contact_phone || null,
          target_class_id: row.target_class_id || null,
          is_signed: row.is_signed ?? null,
          hot: false,
        }))
      );
    } else {
      setCards(mapMockProspects());
    }
  };

  const getStatistics = async (sid: string) => {
    if (!supabase) return;
    const { data } = await supabase
      .from("crm_prospects")
      .select("step, amount, npc_value")
      .eq("school_id", sid);
    if (!data) return;
    const items = data.map((row: any) => ({
      status: normalizeStep(row.step),
      amount: row.amount ?? null,
      npc_value: row.npc_value ?? null,
    })) as CompanyCard[];
    // keep stats consistent if needed elsewhere
  };

  useEffect(() => {
    const init = async () => {
      if (!supabase) return;
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("school_id")
        .eq("id", userData.user.id)
        .maybeSingle();
      if (!profile?.school_id) return;
      setSchoolId(profile.school_id);
      await loadProspects(profile.school_id);
      await getStatistics(profile.school_id);
      await cleanupDuplicates(profile.school_id);
    };
    init();
  }, [supabase]);

  useEffect(() => {
    const loadClasses = async () => {
      if (!supabase || !schoolId) return;
      const { data } = await supabase
        .from("school_classes")
        .select("id, name, npc_amount")
        .eq("school_id", schoolId);
      if (data) {
        setSchoolClasses(data as SchoolClassOption[]);
      }
    };
    loadClasses();
  }, [supabase, schoolId]);


  useEffect(() => {
    if (!dialogOpen) {
      setModalStep(1);
      setManualEntry(false);
      setCreatedProspectId(null);
    }
  }, [dialogOpen]);

  useEffect(() => {
    const loadHandicap = async () => {
      if (!supabase || !selectedCard?.id || !handicapUnlocked) return;
      const { data } = await supabase
        .from("student_handicap_data")
        .select("accommodation_type, extra_time_duration, justification_files")
        .eq("student_id", selectedCard.id)
        .maybeSingle();
      if (data) {
        setHandicapType(data.accommodation_type || "");
        setHandicapExtraTime(data.extra_time_duration || "");
      }
    };
    loadHandicap();
  }, [supabase, selectedCard?.id, handicapUnlocked]);

  useEffect(() => {
    const label = selectedCard?.company_name || selectedCard?.name;
    if (!label) return;
    const contacts = getContactsFromDomain(label);
    setDecisionMakers(contacts);
  }, [selectedCard?.company_name, selectedCard?.name]);

  useEffect(() => {
    if (!manualEntry && siret.length === 14 && modalStep === 1 && !isAutoFill && siret !== lastSiret) {
      handleAutoFill(siret);
    }
  }, [siret, manualEntry, modalStep, isAutoFill]);

  useEffect(() => {
    const nafCode = selectedCard?.naf_code || selectedCard?.naf_ape;
    if (!nafCode || isSavingOpco) return;
    const nextOpco = getOpcoFromNaf(nafCode);
    if (nextOpco && nextOpco !== selectedCard?.opco_name) {
      updateSelectedCard({ opco: nextOpco, opco_name: nextOpco });
      if (supabase && selectedCard.id) {
        setIsSavingOpco(true);
        (async () => {
          const { error } = await supabase
            .from("crm_prospects")
            .update({ opco: nextOpco, opco_name: nextOpco, naf_code: nafCode })
            .eq("id", selectedCard.id);
          if (!error) {
            setOpcoSaved(true);
            setTimeout(() => setOpcoSaved(false), 1500);
          }
          setIsSavingOpco(false);
        })();
      }
    }
  }, [selectedCard?.naf_code, selectedCard?.naf_ape, selectedCard?.opco, selectedCard?.opco_name, selectedCard?.sector, isSavingOpco]);

  const handleSelectCard = async (card: CompanyCard) => {
    setSheetOpen(true);
    if (!supabase) {
      setSelectedCard(card);
      return;
    }
      const { data } = await supabase.from("crm_prospects").select("*").eq("id", card.id).maybeSingle();
    if (data) {
      setSelectedCard({
        ...card,
        ...data,
        name: data.company_name || data.name || card.name,
        company_name: data.company_name || card.company_name,
        status: normalizeStep(data.step),
        city: data.city || card.city,
      });
      return;
    }
    setSelectedCard(card);
  };

  const cleanupDuplicates = async (sid: string) => {
    if (!supabase || hasCleanedDuplicates) return;
    // Schéma minimal: pas de logique de doublon par siret
    setHasCleanedDuplicates(true);
  };

  const handleBehaviorAnalysis = () => {
    if (!selectedCard) return;
    const contactName = `${selectedCard.contact_firstname || ""} ${selectedCard.contact_lastname || ""}`.trim();
    const companyName = selectedCard.name || "l'entreprise";
    const prompt = `À partir du nom ${contactName || "du décideur"} et de l'entreprise ${companyName}, déduis le profil du Test comportemental probable et donne 3 conseils pour réussir le premier appel.`;
    setAnalysisLoading(true);
    setAnalysisDisc([]);
    setAnalysisTips([]);
    setTimeout(() => {
      const discs = ["Dominant", "Influent", "Stable", "Consciencieux"];
      const tips = [
        "Commencez par un angle résultat mesurable et concret.",
        "Validez rapidement le contexte avant de proposer une action.",
        "Proposez un next step clair en 2 options maximum.",
      ];
      setAnalysisDisc(discs);
      setAnalysisTips(tips);
      setAnalysisLoading(false);
      console.log("Prompt IA simulé:", prompt);
    }, 900);
  };

  const handleFindDecisionMakers = () => {
    if (!selectedCard) return;
    setDecisionLoading(true);
    setDecisionMakers([]);
    setTimeout(() => {
      const base = [
        { id: "1", name: "Camille Dupont", role: "Responsable RH" },
        { id: "2", name: "Nicolas Martin", role: "Directeur Formation" },
        { id: "3", name: "Sarah Lopez", role: "Dirigeant" },
      ];
      setDecisionMakers(base);
      setDecisionLoading(false);
    }, 900);
  };

  const getContactsFromDomain = (companyName?: string) => {
    const baseDomain = (companyName || "entreprise")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .slice(0, 12);
    return [
      { id: "rh", name: "Léa Morel", role: "RH / Recrutement", email: `lea@${baseDomain}.fr` },
      { id: "dir", name: "Thomas Petit", role: "Dirigeant", email: `thomas@${baseDomain}.fr` },
    ];
  };

  const handleAnalyzeDecisionMaker = (contact: { name: string; role: string }) => {
    if (!selectedCard) return;
    const prompt = `Analyse ce profil pro. Détermine son profil du Test comportemental dominant (Rouge, Jaune, Vert, Bleu). Donne-moi 2 points forts et 1 point de vigilance pour l'aborder au téléphone.`;
    setAnalysisLoading(true);
    setDiscResult(null);
    setTimeout(() => {
      const role = contact.role.toLowerCase();
      const isRh = role.includes("rh") || role.includes("recrut");
      const isExec = role.includes("dirigeant") || role.includes("ceo") || role.includes("directeur");
      const result = isRh
        ? {
            color: "Vert" as const,
            strengths: ["Écoute et empathie", "Stabilité dans les décisions"],
            vigilance: "Peut éviter le conflit et les pressions.",
            hook: "une accroche orientée bien‑être et sécurisation des process",
          }
        : isExec
        ? {
            color: "Rouge" as const,
            strengths: ["Décision rapide", "Orientation résultats"],
            vigilance: "Tolère peu les détours.",
            hook: "une accroche directe sur l'impact business immédiat",
          }
        : {
            color: "Bleu" as const,
            strengths: ["Structuré et factuel", "Décision méthodique"],
            vigilance: "Préfère éviter les promesses vagues.",
            hook: "une accroche orientée preuve et chiffres concrets",
          };
      setDiscResult(result);
      setAnalysisLoading(false);
      console.log("Prompt IA simulé:", prompt, contact, selectedCard.name);
    }, 900);
  };

  const handleCreateCompany = () => {
    if (supabase && schoolId) {
      const siren = siret.slice(0, 9);
      (async () => {
        try {
          const alreadyLocal = cards.some(
            (card) => card.siret === siret || (card.siren && card.siren === siren)
          );
          if (alreadyLocal) {
            setDialogOpen(false);
            return;
          }
          // Schéma minimal: pas de check par siret
          const cleanData = {
            name: name || "Entreprise Inconnue",
            company_name: name || "Entreprise Inconnue",
            naf_code: nafApe || "",
            opco_name: opco || "",
            siret,
            address: address || null,
            city: city || null,
            zip_code: zipCode || null,
            amount: 0,
            npc_value: 0,
            step: "Prospect",
            school_id: schoolId,
          };
          const { error } = await supabase.from("crm_prospects").upsert(cleanData, { onConflict: "siret" });
          if (error) {
            throw error;
          }
          await loadProspects(schoolId);
          await getStatistics(schoolId);
          setDialogOpen(false);
          setModalStep(1);
          setManualEntry(false);
          setCreatedProspectId(null);
        } catch (error) {
          console.error(
            "Détail erreur Supabase:",
            (error as { message?: string })?.message,
            (error as { details?: string })?.details,
            (error as { hint?: string })?.hint
          );
          alert("Erreur DB: " + ((error as { message?: string })?.message || "insertion échouée"));
        }
      })();
    }
  };

  const finalizeProspect = async () => {
    if (!supabase || !schoolId || !createdProspectId) return;
    const npc = npcTable[cursus] || 0;
    const npcValue = npc * (positions || 1);
    const { error } = await supabase
      .from("crm_prospects")
      .update({
        amount: npcValue,
        npc_value: npcValue,
        step: "Prospect",
        school_id: schoolId,
      })
      .eq("id", createdProspectId);
    if (error) {
      console.error("Erreur Supabase crm_prospects:", error);
      return;
    }
    await loadProspects(schoolId);
    await getStatistics(schoolId);
    setDialogOpen(false);
    setSiret("");
    setName("");
    setCity("");
    setZipCode("");
    setOpco("");
    setCursus("Mastere");
    setPositions(1);
    setManualEntry(false);
    setModalStep(1);
    setCreatedProspectId(null);
  };

  return (
    <div className="min-h-screen bg-white px-8 py-10 text-black">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <header className="rounded-3xl border border-white/10 bg-white/70 p-6 shadow-[0_30px_80px_-60px_rgba(15,23,42,0.35)] backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-5xl font-extrabold italic tracking-tight text-black">PROSPECTION</h1>
              <p className="mt-2 text-xs uppercase tracking-[0.3em] text-black/50">
                Votre pipeline de prospection
              </p>
            </div>
            <button
              type="button"
              onClick={() => setDialogOpen(true)}
              className="rounded-lg bg-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white"
            >
              Ajouter une entreprise
            </button>
          </div>
        </header>
        <div className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-sm font-semibold text-black">
          CA Potentiel : <span className="text-black">{formatMoney(caNpcPotentiel)}</span> · CA Signé :{" "}
          <span className="text-black">{formatMoney(caNpcSigne)}</span>
        </div>
        <section className="grid gap-4 md:grid-cols-3">
          {[
            { label: "Entreprises avec offres", value: entrepriseAvecOffres },
            { label: "CA Prévisionnel", value: formatMoney(caPotentiel) },
            { label: "CA Signé", value: formatMoney(caSecurise) },
          ].map((kpi) => (
            <div
              key={kpi.label}
              className={`rounded-3xl border border-white/10 p-4 shadow-sm backdrop-blur-xl ${
                kpi.label === "CA Sécurisé"
                  ? "bg-gradient-to-r from-red-600 to-blue-600 text-white"
                  : "bg-white/70"
              }`}
            >
              <p
                className={`text-xs uppercase tracking-[0.2em] ${
                  kpi.label === "CA Sécurisé" ? "text-white/80" : "text-black/50"
                }`}
              >
                {kpi.label}
              </p>
              <p
                className={`mt-3 text-2xl font-semibold ${
                  kpi.label === "CA Sécurisé" ? "text-white" : "text-black"
                }`}
              >
                {kpi.value}
              </p>
            </div>
          ))}
        </section>
        <DndContext onDragEnd={handleDragEnd}>
          <section className="flex h-[calc(100vh-220px)] gap-4 overflow-x-auto overflow-y-auto pb-4 scroll-smooth">
            {columns.map((column, index) => {
              const columnCards = cards.filter((card) => card.status === column);
              const stats = columnStats[column];
              const header = (
                <div className="flex items-center justify-between text-xs text-black/50">
                  <span className="uppercase tracking-[0.2em]">{column}</span>
                  <span>
                    {stats?.count || 0} · {stats?.ca.toLocaleString("fr-FR")} €
                  </span>
                </div>
              );
              const highlights = [
                "bg-white/60",
                "bg-white/55",
                "bg-white/50",
                "bg-white/45",
                "bg-white/40",
                "bg-white/35",
                "bg-white/30",
              ];
              return (
                <DroppableColumn
                  key={column}
                  id={column}
                  header={header}
                  highlight={`${highlights[index % highlights.length]} border-r border-white/10`}
                >
                  <div className="mt-4 space-y-3">
                    {columnCards.map((card) => (
                      <DraggableCard key={card.id} card={card} onSelect={handleSelectCard} />
                    ))}
                    {!columnCards.length ? (
                      <p className="text-xs text-black/40">Aucune entreprise</p>
                    ) : null}
                  </div>
                </DroppableColumn>
              );
            })}
          </section>
        </DndContext>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg rounded-[28px] bg-[#1C1C1E] text-white border border-white/10 backdrop-blur-md">
          <DialogTitle className="sr-only">Créer un prospect</DialogTitle>
          <DialogDescription className="sr-only">
            Formulaire de création de prospect
          </DialogDescription>
          <DialogHeader>
            <DialogTitle>Ajouter une entreprise</DialogTitle>
          </DialogHeader>
          {modalStep === 1 ? (
            <div className="space-y-4 text-sm">
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-xs text-white/70">
                Entrez le numéro SIRET de votre prospect
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-white/70">Numéro SIRET</label>
                <input
                  value={siret}
                  onChange={(event) => {
                    setSiret(event.target.value);
                    setCreatedProspectId(null);
                  }}
                  className="w-full rounded-lg border border-white/10 bg-[#1C1C1E] px-3 py-2 text-white"
                />
                <button
                  type="button"
                  onClick={() => setManualEntry((prev) => !prev)}
                  className="text-xs text-white/50 underline"
                >
                  Entrer les informations à la main
                </button>
              </div>
              {isAutoFill ? (
                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  <div className="text-xs text-white/70">Scan SIRET en cours...</div>
                </div>
              ) : null}
              {scanError ? (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-200">
                  {scanError}
                </div>
              ) : null}
              {manualEntry ? (
                <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-white/70">Nom</label>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#1C1C1E] px-3 py-2 text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-white/70">Adresse</label>
              <input
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#1C1C1E] px-3 py-2 text-white"
              />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-white/70">Ville</label>
                <input
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-[#1C1C1E] px-3 py-2 text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-white/70">Code postal</label>
                <input
                  value={zipCode}
                  onChange={(event) => setZipCode(event.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-[#1C1C1E] px-3 py-2 text-white"
                />
              </div>
            </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-white/70">OPCO</label>
                    <input
                      value={opco}
                      onChange={(event) => setOpco(event.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-[#1C1C1E] px-3 py-2 text-white"
                    />
                  </div>
                  <DialogFooter>
                    <button
                      type="button"
                      onClick={handleCreateCompany}
                      className="rounded-lg border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white"
                    >
                      Continuer
                    </button>
                  </DialogFooter>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="space-y-4 text-sm">
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/70">
                Prospect créé : <span className="font-semibold text-white">{name || "Nouveau prospect"}</span>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-white/70">Cursus</label>
                <select
                  value={cursus}
                  onChange={(event) => setCursus(event.target.value as "Mastere" | "Bachelor" | "Titre Pro")}
                  className="w-full rounded-lg border border-white/10 bg-[#1C1C1E] px-3 py-2 text-white"
                >
                  <option value="Mastere">Mastère</option>
                  <option value="Bachelor">Bachelor</option>
                  <option value="Titre Pro">Titre Pro</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-white/70">Nombre de postes</label>
                <input
                  type="number"
                  min={1}
                  value={positions}
                  onChange={(event) => setPositions(Number(event.target.value || 1))}
                  className="w-full rounded-lg border border-white/10 bg-[#1C1C1E] px-3 py-2 text-white"
                />
              </div>
              <p className="text-xs text-white/50">CA potentiel estimé : {potentialCA * positions} €</p>
              <DialogFooter>
                <button
                  type="button"
                  onClick={finalizeProspect}
                  className="rounded-lg border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white"
                >
                  Valider
                </button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
      <SheetContent
        side="right"
        className="inset-y-0 right-0 h-full w-full sm:max-w-[850px] p-0 bg-[#0a0a0a] border-l border-zinc-800 shadow-2xl flex flex-col z-[100] rounded-none"
      >
          <SheetHeader className="sr-only">
            <SheetTitle>Fiche Entreprise</SheetTitle>
            <SheetDescription>Détails complets du prospect</SheetDescription>
          </SheetHeader>
          <div className="p-6 border-b border-zinc-800 bg-[#0a0a0a]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {selectedCard?.company_name || selectedCard?.name || "Fiche Entreprise"}
                </h2>
                <p className="mt-2 text-xs text-zinc-400">
                  {selectedCard?.siret || "SIRET non renseigné"} · {selectedCard?.sector || "Secteur non renseigné"}
                </p>
                {(() => {
                  const opcoValue =
                    selectedCard?.opco_name ||
                    selectedCard?.opco ||
                    getOpcoFromNaf(selectedCard?.naf_code || selectedCard?.naf_ape || "") ||
                    "OPCO";
                  return (
                    <span
                      className={`mt-2 inline-flex items-center rounded-full px-3 py-1 text-[10px] font-bold ${getOpcoStyle(
                        opcoValue
                      )}`}
                    >
                      {opcoValue.toUpperCase()}
                    </span>
                  );
                })()}
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="text-xs uppercase tracking-[0.3em] text-zinc-400">Actions</span>
                <button
                  type="button"
                  onClick={handleGenerateContract}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-200 hover:bg-blue-700"
                >
                  <FileText size={18} />
                  Générer un contrat
                </button>
              </div>
            </div>
            <Separator className="mt-4 bg-zinc-800" />
          </div>

          <div className="flex-1 overflow-y-auto p-8">
          <div className="space-y-8 text-sm text-white">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-base font-semibold uppercase tracking-[0.25em] text-zinc-400">Nom</p>
                <input
                  value={selectedCard?.company_name || selectedCard?.name || ""}
                  onChange={(event) =>
                    updateSelectedCard({ company_name: event.target.value, name: event.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-white"
                />
              </div>
              <div>
                <p className="text-base font-semibold uppercase tracking-[0.25em] text-zinc-400">SIRET</p>
                <input
                  value={selectedCard?.siret || ""}
                  onChange={(event) => updateSelectedCard({ siret: event.target.value })}
                  className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-base font-semibold uppercase tracking-[0.25em] text-zinc-400">Secteur</p>
                <p className="mt-1 text-sm text-white">{selectedCard?.sector || "-"}</p>
              </div>
              <div>
                <p className="text-base font-semibold uppercase tracking-[0.25em] text-zinc-400">
                  Date de création
                </p>
                <p className="mt-1 text-sm text-white">{selectedCard?.creation_date || "-"}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-base font-semibold uppercase tracking-[0.25em] text-zinc-400">Ville</p>
                <div className="mt-1 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-zinc-400" />
                  <input
                    value={selectedCard?.city || "Ville non renseignée"}
                    onChange={(event) => updateSelectedCard({ city: event.target.value })}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-white"
                  />
                </div>
              </div>
              <div>
                <p className="text-base font-semibold uppercase tracking-[0.25em] text-zinc-400">Code postal</p>
                <input
                  value={selectedCard?.zip_code || ""}
                  onChange={(event) => updateSelectedCard({ zip_code: event.target.value })}
                  className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-white"
                />
              </div>
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">Localisation</p>
              <div className="mt-3 space-y-2 text-sm text-white">
                <p>{selectedCard?.address || "Adresse non renseignée"}</p>
                <p>
                  {selectedCard?.zip_code || "—"} {selectedCard?.city || "Ville non renseignée"}
                </p>
              </div>
            </div>
            <div>
              <p className="text-base font-semibold uppercase tracking-[0.25em] text-zinc-400">Adresse</p>
              <input
                value={selectedCard?.address || ""}
                onChange={(event) => updateSelectedCard({ address: event.target.value })}
                className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-white"
              />
            </div>
            <div>
              <p className="text-base font-semibold uppercase tracking-[0.25em] text-zinc-400">
                Classe / Formation visée
              </p>
              <select
                value={selectedCard?.target_class_id || ""}
                onChange={(event) => updateSelectedCard({ target_class_id: event.target.value })}
                className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-white"
              >
                <option value="">Sélectionner une classe</option>
                {schoolClasses.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name || "Classe"}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-base font-semibold uppercase tracking-[0.25em] text-zinc-400">NAF</p>
                <input
                  value={selectedCard?.naf_code || selectedCard?.naf_ape || ""}
                  onChange={(event) =>
                    updateSelectedCard({ naf_code: event.target.value, naf_ape: event.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-white"
                />
              </div>
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">Analyse Financière</p>
              {(() => {
                const selectedClass = schoolClasses.find((item) => item.id === selectedCard?.target_class_id);
                const opcoValue =
                  selectedCard?.opco_name ||
                  selectedCard?.opco ||
                  getOpcoFromNaf(selectedCard?.naf_code || selectedCard?.naf_ape || "");
                const npcAmount = calculateNPC(opcoValue || "", selectedClass?.name || "", selectedClass?.npc_amount);
                const realized = selectedCard?.is_signed ? npcAmount : 0;
                return (
                  <div className="mt-4 space-y-3 text-sm text-white">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400">Montant NPC estimé</span>
                      <span>{npcAmount ? `${npcAmount.toLocaleString("fr-FR")} €` : "—"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400">CA Réalisé</span>
                      <span>{realized ? `${realized.toLocaleString("fr-FR")} €` : "0 €"}</span>
                    </div>
                    <label className="flex items-center gap-2 text-xs text-zinc-300">
                      <input
                        type="checkbox"
                        checked={!!selectedCard?.is_signed}
                        onChange={(event) => updateSelectedCard({ is_signed: event.target.checked })}
                        className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-blue-500"
                      />
                      Contrat signé
                    </label>
                  </div>
                );
              })()}
            </div>
            <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-indigo-200">Handicap</p>
              {!handicapUnlocked ? (
                <div className="mt-4 space-y-4">
                  <p className="text-xs text-indigo-100/80">Accès restreint aux référents.</p>
                  <div className="rounded-xl border border-indigo-400/30 bg-indigo-900/20 p-4">
                    <div className="mb-3 text-center text-lg font-semibold tracking-[0.3em] text-white">
                      {handicapPin.padEnd(4, "•")}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                        <button
                          key={digit}
                          type="button"
                          onClick={() => setHandicapPin((prev) => (prev.length < 4 ? `${prev}${digit}` : prev))}
                          className="rounded-lg border border-indigo-400/20 bg-indigo-800/40 py-2 text-sm font-semibold text-white"
                        >
                          {digit}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setHandicapPin("")}
                        className="rounded-lg border border-indigo-400/20 bg-indigo-800/40 py-2 text-xs font-semibold text-white"
                      >
                        Effacer
                      </button>
                      <button
                        type="button"
                        onClick={() => setHandicapPin((prev) => (prev.length < 4 ? `${prev}0` : prev))}
                        className="rounded-lg border border-indigo-400/20 bg-indigo-800/40 py-2 text-sm font-semibold text-white"
                      >
                        0
                      </button>
                      <button
                        type="button"
                        onClick={handleHandicapUnlock}
                        className="rounded-lg bg-indigo-500 py-2 text-xs font-semibold text-white"
                      >
                        Valider
                      </button>
                    </div>
                    {handicapError ? <p className="mt-3 text-xs text-red-200">{handicapError}</p> : null}
                  </div>
                </div>
              ) : (
                <div className="mt-4 space-y-4 text-sm text-white">
                  <div>
                    <label className="text-xs uppercase tracking-[0.2em] text-indigo-100/70">
                      Type d'aménagement
                    </label>
                    <input
                      value={handicapType}
                      onChange={(event) => setHandicapType(event.target.value)}
                      className="mt-2 w-full rounded-lg border border-indigo-500/30 bg-indigo-950/40 px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-[0.2em] text-indigo-100/70">
                      Durée du tiers-temps
                    </label>
                    <input
                      value={handicapExtraTime}
                      onChange={(event) => setHandicapExtraTime(event.target.value)}
                      className="mt-2 w-full rounded-lg border border-indigo-500/30 bg-indigo-950/40 px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-[0.2em] text-indigo-100/70">
                      Justificatifs
                    </label>
                    <input
                      type="file"
                      multiple
                      onChange={(event) => setHandicapFiles(Array.from(event.target.files || []))}
                      className="mt-2 w-full rounded-lg border border-indigo-500/30 bg-indigo-950/40 px-3 py-2 text-xs text-white file:mr-4 file:rounded-md file:border-0 file:bg-indigo-500 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-white"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleHandicapSave}
                    disabled={handicapSaving}
                    className="rounded-lg bg-indigo-500 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white disabled:opacity-60"
                  >
                    {handicapSaving ? "Sauvegarde..." : "Sauvegarder"}
                  </button>
                  {handicapError ? <p className="text-xs text-red-200">{handicapError}</p> : null}
                </div>
              )}
            </div>
            {contractDialogOpen ? (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">
                  Prévisualisation du Contrat
                </p>
                <div className="mt-4 space-y-3 text-sm text-white">
                  <p>
                    <span className="text-zinc-400">Employeur :</span>{" "}
                    {selectedCard?.company_name || selectedCard?.name || "—"}
                  </p>
                  <p>
                    <span className="text-zinc-400">SIRET :</span> {selectedCard?.siret || "—"}
                  </p>
                  <p>
                    <span className="text-zinc-400">OPCO :</span>{" "}
                    {selectedCard?.opco_name ||
                      selectedCard?.opco ||
                      getOpcoFromNaf(selectedCard?.naf_code || selectedCard?.naf_ape || "")}
                  </p>
                  <p className="text-zinc-300">
                    Compte tenu du code NAF{" "}
                    {selectedCard?.naf_code || selectedCard?.naf_ape || "—"}, le stagiaire sera formé aux
                    spécificités du secteur {selectedCard?.sector || "concerné"}.
                  </p>
                </div>
              </div>
            ) : null}
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-white/40">Intelligence Commerciale</p>
              <div className="mt-3 space-y-4 rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs text-white/70">Analyse du Décideur</p>
                {decisionLoading ? (
                  <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70">
                    Recherche des décideurs...
                  </div>
                ) : null}
                {decisionMakers.length ? (
                  <div className="grid gap-2">
                    {decisionMakers.map((contact) => (
                      <div
                        key={contact.id}
                        className="rounded-[24px] border border-white/10 bg-[#1C1C1E] p-3 text-xs text-white/80 mb-4"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-white">{contact.name}</p>
                            <p className="text-[11px] text-white/60">{contact.role}</p>
                            {contact.email ? (
                              <p className="text-[11px] text-white/40">{contact.email}</p>
                            ) : null}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAnalyzeDecisionMaker(contact)}
                            className="rounded-full border border-[#007AFF]/40 px-3 py-1 text-[10px] font-semibold text-[#007AFF]"
                          >
                            Analyser le profil
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
                <button
                  type="button"
                  onClick={handleBehaviorAnalysis}
                  disabled={analysisLoading}
                  className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white disabled:opacity-60"
                >
                  {analysisLoading ? "Analyse en cours..." : "Lancer l'analyse comportementale"}
                </button>
                {analysisDisc.length ? (
                  <div className="flex flex-wrap gap-2">
                    {analysisDisc.map((disc) => (
                      <span
                        key={disc}
                        className="rounded-full bg-[#007AFF]/15 px-2 py-1 text-[10px] font-semibold text-[#007AFF]"
                      >
                        {disc}
                      </span>
                    ))}
                  </div>
                ) : null}
                {analysisTips.length ? (
                  <div className="rounded-lg border border-[#007AFF]/30 bg-[#007AFF]/10 px-3 py-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#007AFF]">
                      Beyond Tips
                    </p>
                    <ul className="mt-2 space-y-1 text-xs text-white/80">
                      {analysisTips.map((tip) => (
                        <li key={tip}>• {tip}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {discResult ? (
                  <div className="rounded-lg border border-[#007AFF]/30 bg-[#007AFF]/10 px-3 py-2 text-xs text-white/80">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#007AFF]">
                      Script d'approche personnalisé
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                          discResult.color === "Rouge"
                            ? "bg-red-500/20 text-red-300"
                            : discResult.color === "Jaune"
                            ? "bg-yellow-500/20 text-yellow-300"
                            : discResult.color === "Vert"
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-blue-500/20 text-blue-300"
                        }`}
                      >
                        {discResult.color}
                      </span>
                      <span>
                        Puisque ce profil est {discResult.color}, commencez votre appel par{" "}
                        {discResult.hook}.
                      </span>
                    </div>
                    <div className="mt-2">
                      <p className="text-[11px] text-white/60">Points forts</p>
                      <ul className="mt-1 space-y-1">
                        {discResult.strengths.map((item) => (
                          <li key={item}>• {item}</li>
                        ))}
                      </ul>
                      <p className="mt-2 text-[11px] text-white/60">Point de vigilance</p>
                      <p className="mt-1">• {discResult.vigilance}</p>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-[#0A0F1E]/50">Tranche effectif</p>
                <input
                  value={selectedCard?.tranche_effectif || ""}
                  onChange={(event) => updateSelectedCard({ tranche_effectif: event.target.value })}
                  className="mt-1 w-full rounded-lg border border-white/40 bg-white/80 px-3 py-2 text-[#0A0F1E]"
                />
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
              <p className="text-sm uppercase tracking-[0.3em] text-white/40">Contact Décisionnaire</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-white/40">Prénom</p>
                  <div className="mt-1 flex items-center gap-2">
                    <User className="h-4 w-4 text-white/60" />
                    <input
                      value={selectedCard?.contact_firstname || ""}
                      onChange={(event) => updateSelectedCard({ contact_firstname: event.target.value })}
                      className="w-full rounded-lg border border-white/10 bg-[#1C1C1E] px-3 py-2 text-white"
                    />
                  </div>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-white/40">Nom</p>
                  <input
                    value={selectedCard?.contact_lastname || ""}
                    onChange={(event) => updateSelectedCard({ contact_lastname: event.target.value })}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-[#1C1C1E] px-3 py-2 text-white"
                  />
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-white/40">Email</p>
                <div className="mt-1 flex items-center gap-2">
                  <Mail className="h-4 w-4 text-white/60" />
                  <input
                    value={selectedCard?.contact_email || ""}
                    onChange={(event) => updateSelectedCard({ contact_email: event.target.value })}
                    className="w-full rounded-lg border border-white/10 bg-[#1C1C1E] px-3 py-2 text-white"
                  />
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-white/40">Téléphone</p>
                <div className="mt-1 flex items-center gap-2">
                  <Phone className="h-4 w-4 text-white/60" />
                  <input
                    value={selectedCard?.contact_phone || ""}
                    onChange={(event) => updateSelectedCard({ contact_phone: event.target.value })}
                    className="w-full rounded-lg border border-white/10 bg-[#1C1C1E] px-3 py-2 text-white"
                  />
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleSaveSelectedCard}
                className="rounded-lg border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white"
              >
                Enregistrer les modifications
              </button>
              <button
                type="button"
                onClick={() => {
                  const company = encodeURIComponent(selectedCard?.name || "");
                  window.location.assign(`/dashboard/ecole/offres?company=${company}`);
                }}
                className="rounded-lg border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white"
              >
                Voir les offres liées
              </button>
              <button
                type="button"
                onClick={() => {
                  const company = encodeURIComponent(selectedCard?.name || "");
                  window.location.assign(`/dashboard/ecole/offres?company=${company}`);
                }}
                className="rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white"
              >
                + Ajouter une offre
              </button>
            </div>
          </div>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={contractDialogOpen} onOpenChange={setContractDialogOpen}>
        <DialogContent className="max-w-2xl rounded-2xl border border-white/20 bg-white/95 text-slate-900 shadow-2xl">
          <DialogTitle className="sr-only">Générer un contrat</DialogTitle>
          <DialogDescription className="sr-only">
            Configuration du contrat de l'entreprise sélectionnée
          </DialogDescription>
          <DialogHeader>
            <DialogTitle>Générer un contrat</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Entreprise</p>
                <p className="mt-2 text-base font-semibold text-slate-900">
                  {selectedCard?.company_name || selectedCard?.name || "Entreprise"}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500">OPCO</p>
                <p className="mt-2 text-base font-semibold text-slate-900">
                  {getContractOpco(
                    selectedCard?.company_name || selectedCard?.name || "",
                    selectedCard?.naf_code || selectedCard?.naf_ape || ""
                  )}
                </p>
                <p className="mt-1 text-[11px] text-slate-500">
                  OPCO détecté automatiquement par rapport au secteur d&apos;activité
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                Type de contrat
              </label>
              <select
                value={contractType}
                onChange={(event) =>
                  setContractType(event.target.value as "Alternance" | "Stage" | "Apprentissage")
                }
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900"
              >
                <option value="Alternance">Alternance</option>
                <option value="Stage">Stage</option>
                <option value="Apprentissage">Apprentissage</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">
                Pré-remplissage IA selon le code NAF {selectedCard?.naf_code || selectedCard?.naf_ape || "-"}.
              </p>
              <button
                type="button"
                onClick={handlePrefillContract}
                className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100"
              >
                Pré-remplir avec l&apos;IA
              </button>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                Clauses spécifiques
              </label>
              <textarea
                value={contractClauses}
                onChange={(event) => setContractClauses(event.target.value)}
                rows={5}
                className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900"
                placeholder="Ajoutez ou ajustez les clauses spécifiques..."
              />
            </div>
            <DialogFooter>
              <button
                type="button"
                onClick={() => setContractDialogOpen(false)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700"
              >
                Fermer
              </button>
              <button
                type="button"
                className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-lg shadow-blue-200 hover:bg-blue-700"
              >
                Générer le contrat
              </button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


