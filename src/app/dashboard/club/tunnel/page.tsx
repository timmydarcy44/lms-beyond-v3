"use client";

import { useEffect, useMemo, useState } from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import { DndContext, DragEndEvent, useDroppable } from "@dnd-kit/core";
import { arrayMove, SortableContext, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ClubLayout } from "@/components/club/club-layout";
import { useClubGuard } from "@/components/club/use-club-guard";
import { cn } from "@/lib/utils";
import { CheckCircle, TrendingUp, Users } from "lucide-react";
import jsPDF from "jspdf";
import { getMyClub, getClubPartners, updatePartner } from "@/lib/supabase/club-queries";

type Column = { id: string; label: string; couleur: string; cards: ProspectCard[] };
type ProspectCard = {
  id: string;
  nom: string;
  secteur: string;
  valeur: number;
  contact: string;
  contactEmail?: string;
  contactTel?: string;
  adresse?: string;
  siret?: string;
  notes?: string;
  lastAction: string;
  columnId: string;
  createdAt?: string;
  updatedAt?: string;
  offerName?: string;
  offerSelections?: Record<string, number>;
  partnershipType?: "sponsoring" | "mecenat" | "both";
  paymentMode?: string;
};

const initialColumnsBase = [
  { id: "prospects", label: "Prospects", couleur: "#6B7280" },
  { id: "premier_contact", label: "Premier contact", couleur: "#3B82F6" },
  { id: "presentation", label: "Présentation", couleur: "#EAB308" },
  { id: "negociation", label: "Négociation", couleur: "#F97316" },
  { id: "signature", label: "Signature", couleur: "#22C55E" },
  { id: "perdu", label: "Perdu", couleur: "#EF4444" },
];

const initialColumns: Column[] = initialColumnsBase.map((column) => ({
  ...column,
  cards: [],
}));

const baseSponsorshipSections = [
  {
    title: "Match Day — Maillot",
    items: [
      { id: "maillot-principal", label: "Sponsor maillot principal", price: 30000 },
      { id: "maillot-manche-droite", label: "Sponsor maillot manche droite", price: 8000 },
      { id: "maillot-manche-gauche", label: "Sponsor maillot manche gauche", price: 8000 },
      { id: "maillot-dos-haut", label: "Sponsor maillot dos haut", price: 10000 },
      { id: "maillot-dos-bas", label: "Sponsor maillot dos bas", price: 6000 },
      { id: "short-avant-droit", label: "Sponsor short avant droit", price: 4000 },
      { id: "short-avant-gauche", label: "Sponsor short avant gauche", price: 4000 },
      { id: "short-arriere-droit", label: "Sponsor short arrière droit", price: 3000 },
      { id: "short-arriere-gauche", label: "Sponsor short arrière gauche", price: 3000 },
    ],
  },
  {
    title: "Match Day — Équipement",
    items: [
      { id: "veste-echauffement", label: "Sponsor veste échauffement", price: 5000 },
      { id: "sac-equipe", label: "Sponsor sac équipe", price: 3000 },
      { id: "chaussettes", label: "Sponsor chaussettes", price: 2000 },
    ],
  },
  {
    title: "Training",
    items: [
      { id: "training-principal", label: "Sponsor maillot training principal", price: 12000 },
      { id: "training-manche-droite", label: "Sponsor maillot training manche droite", price: 4000 },
      { id: "training-manche-gauche", label: "Sponsor maillot training manche gauche", price: 4000 },
      { id: "training-short-avant", label: "Sponsor short training avant", price: 3000 },
      { id: "training-short-arriere", label: "Sponsor short training arrière", price: 3000 },
      { id: "training-veste", label: "Sponsor veste training", price: 4000 },
      { id: "training-pantalon", label: "Sponsor pantalon training", price: 2000 },
    ],
  },
  {
    title: "Digital",
    items: [
      { id: "digital-logo", label: "Logo partenaire espace partenaire site web", price: 2000 },
      { id: "digital-matchday", label: "Pack match day (story + post Instagram/Facebook)", price: 3000 },
      { id: "digital-week", label: "Pack week (2 posts/semaine)", price: 5000 },
      { id: "digital-newsletter", label: "Naming newsletter", price: 2500 },
    ],
  },
  {
    title: "Stade",
    items: [
      { id: "stade-3x1", label: "Panneau bord terrain 3m x 1m", price: 2500 },
      { id: "stade-6x1", label: "Panneau bord terrain 6m x 1m", price: 4000 },
      { id: "stade-bache", label: "Bâche tribune 5m x 2m", price: 6000 },
      { id: "stade-presse", label: "Naming salle de presse", price: 8000 },
    ],
  },
];

const sectorColors: Record<string, string> = {
  Banque: "#3B82F6",
  Automobile: "#F97316",
  RH: "#A855F7",
  Restauration: "#EF4444",
  Santé: "#22C55E",
  Immobilier: "#8B5CF6",
  Énergie: "#FACC15",
  Sport: "#38BDF8",
  Hôtellerie: "#F59E0B",
  Assurance: "#6366F1",
  Transport: "#14B8A6",
  Communication: "#EC4899",
  "Bien-être": "#10B981",
};

const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

function ColumnDropZone({ id, children }: { id: string; children: ReactNode }) {
  const { setNodeRef } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className="space-y-3">
      {children}
    </div>
  );
}

function SortableCard({
  card,
  columns,
  onMove,
  setSelectedProspect,
  setShowDetailModal,
}: {
  card: ProspectCard;
  columns: Column[];
  onMove: (cardId: string, columnId: string) => void;
  setSelectedProspect: (prospect: ProspectCard) => void;
  setShowDetailModal: (value: boolean) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: card.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="rounded-xl border border-white/10 bg-[#1a1a1a] p-4"
      onDoubleClick={(event) => {
        event.stopPropagation();
        setSelectedProspect(card);
        setShowDetailModal(true);
      }}
    >
      <div className="flex items-start justify-between">
        <div className="text-sm font-semibold text-white">{card.nom}</div>
        <span className="text-white/30">⠿</span>
      </div>
      <div className="mt-1 text-xs text-white/60">{card.secteur}</div>
      <div className="mt-2 text-sm font-semibold" style={{ color: "var(--club-primary)" }}>
        {card.valeur.toLocaleString("fr-FR")}€
      </div>
      <div className="mt-2 text-xs text-white/60">{card.contact}</div>
      <div className="text-[11px] text-white/40">{card.lastAction}</div>
      <div className="mt-3">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            event.preventDefault();
            setSelectedProspect(card);
            setShowDetailModal(true);
          }}
          className="relative z-10 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm text-white hover:bg-white/20 cursor-pointer"
        >
          Voir
        </button>
      </div>
      <select
        value={(card as ProspectCard & { colonneId?: string }).colonneId ?? card.columnId}
        onChange={(event) => onMove(card.id, event.target.value)}
        onClick={(event) => event.stopPropagation()}
        onPointerDown={(event) => event.stopPropagation()}
        className="mt-2 w-full cursor-pointer rounded-lg border border-white/10 bg-white/10 px-2 py-1 text-xs text-white/70 hover:bg-white/20"
      >
        {columns.map((col) => (
          <option key={col.id} value={col.id} className="text-black">
            {col.label}
          </option>
        ))}
      </select>
    </div>
  );
}

type TabsComponentProps = {
  prospect: ProspectCard;
  detailTab: "coordonnees" | "offre" | "documents";
  setDetailTab: (tab: "coordonnees" | "offre" | "documents") => void;
  columns: Column[];
  moveCard: (cardId: string, columnId: string) => void;
  updateProspect: (id: string, changes: Partial<ProspectCard>) => void;
  partnershipTypes: { sponsoring: boolean; mecenat: boolean; dives: boolean };
  setPartnershipTypes: Dispatch<SetStateAction<{ sponsoring: boolean; mecenat: boolean; dives: boolean }>>;
  mecenatAmount: number;
  setMecenatAmount: Dispatch<SetStateAction<number>>;
  sponsorSelections: Record<string, number>;
  setSponsorSelections: Dispatch<SetStateAction<Record<string, number>>>;
  offerSections: { title: string; items: { id: string; label: string; price: number; included?: boolean }[] }[];
  totalPartnership: number;
  paymentMode: string;
  setPaymentMode: Dispatch<SetStateAction<string>>;
  generateMecenatPdf: () => void;
  handleSendMecenatEmail: () => void;
  documents: { id: string; type: "mecenat" | "sponsoring" | "offer"; name: string; date: string }[];
  generateSponsoringPdf: () => void;
  generateCustomOfferPdf: () => void;
  handleSendOfferEmail: () => void;
};

function TabsComponent({
  prospect,
  detailTab,
  setDetailTab,
  columns,
  moveCard,
  updateProspect,
  partnershipTypes,
  setPartnershipTypes,
  mecenatAmount,
  setMecenatAmount,
  sponsorSelections,
  setSponsorSelections,
  offerSections,
  totalPartnership,
  paymentMode,
  setPaymentMode,
  generateMecenatPdf,
  handleSendMecenatEmail,
  documents,
  generateSponsoringPdf,
  generateCustomOfferPdf,
  handleSendOfferEmail,
}: TabsComponentProps) {
  const offerSelections = prospect.offerSelections ?? {};
  const offerName = prospect.offerName ?? `${prospect.nom} — Offre personnalisée`;
  const offerTotal = Object.values(offerSelections).reduce((sum, value) => sum + value, 0);

  return (
    <>
      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-3 text-sm">
        {[
          { id: "coordonnees", label: "Coordonnées" },
          { id: "offre", label: "Offre personnalisée" },
          { id: "documents", label: "Documents" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setDetailTab(tab.id as typeof detailTab)}
            className={cn(
              "rounded-full px-4 py-1.5",
              detailTab === tab.id ? "bg-white/10 text-white" : "text-white/60 hover:text-white"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {detailTab === "coordonnees" && (
        <div className="grid gap-4 pt-4 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-4">
            <div className="rounded-xl bg-[#1B2A4A]/60 p-4">
              <div className="text-sm font-semibold text-white">Entreprise</div>
              <div className="mt-2 text-sm text-white/70">SIRET : {prospect.siret || "—"}</div>
              <div className="text-sm text-white/70">Adresse : {prospect.adresse || "—"}</div>
              <div className="text-sm text-white/70">Secteur : {prospect.secteur}</div>
              <div className="mt-2 text-sm text-white/70">Valeur estimée :</div>
              <div className="text-lg font-bold text-[#C8102E]">
                {prospect.valeur.toLocaleString("fr-FR")}€
              </div>
            </div>
            <div className="rounded-xl bg-[#1B2A4A]/60 p-4">
              <div className="text-sm font-semibold text-white">Contact principal</div>
              <div className="mt-2 text-lg font-bold text-white">{prospect.contact}</div>
              <a
                className="text-sm text-blue-300"
                href={`mailto:${prospect.contactEmail || ""}`}
              >
                {prospect.contactEmail || "Email non renseigné"}
              </a>
              <div className="text-sm text-white/70">
                <a href={`tel:${prospect.contactTel || ""}`}>{prospect.contactTel || "Téléphone non renseigné"}</a>
              </div>
              <Textarea
                value={prospect.notes || ""}
                onChange={(event) => updateProspect(prospect.id, { notes: event.target.value })}
                placeholder="Notes"
                className="mt-3 border-white/10 bg-white/5 text-white"
              />
            </div>
          </div>
          <div className="space-y-4">
            <div className="rounded-xl bg-[#1B2A4A]/60 p-4">
              <div className="text-sm font-semibold text-white">Pipeline</div>
              <div className="mt-2 text-sm text-white/70">
                Colonne actuelle : {columns.find((column) => column.id === prospect.columnId)?.label || "—"}
              </div>
              <select
                value={prospect.columnId}
                onChange={(event) => moveCard(prospect.id, event.target.value)}
                className="mt-3 w-full rounded-lg border border-white/10 bg-white/10 px-2 py-1 text-xs text-white/70"
              >
                {columns.map((col) => (
                  <option key={col.id} value={col.id} className="text-black">
                    {col.label}
                  </option>
                ))}
              </select>
              <div className="mt-3 text-xs text-white/60">
                Date de création :{" "}
                {prospect.createdAt
                  ? new Date(prospect.createdAt).toLocaleDateString("fr-FR")
                  : "—"}
              </div>
              <div className="text-xs text-white/60">
                Dernière modification :{" "}
                {prospect.updatedAt
                  ? new Date(prospect.updatedAt).toLocaleDateString("fr-FR")
                  : "—"}
              </div>
            </div>
            <div className="rounded-xl bg-[#1B2A4A]/60 p-4">
              <div className="text-sm font-semibold text-white">Modalité</div>
              <div className="mt-3">
                <Select
                  value={prospect.paymentMode || paymentMode}
                  onValueChange={(value) => updateProspect(prospect.id, { paymentMode: value })}
                >
                  <SelectTrigger className="border-white/10 bg-white/5 text-white">
                    <SelectValue placeholder="Mode de paiement" />
                  </SelectTrigger>
                  <SelectContent className="border-white/10 bg-[#111] text-white">
                    {[
                      "Virement bancaire",
                      "Chèque",
                      "Espèces",
                      "Prélèvement mensuel",
                      "Prélèvement trimestriel",
                    ].map((mode) => (
                      <SelectItem key={mode} value={mode}>
                        {mode}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="mt-3">
                <Select
                  value={prospect.partnershipType || "sponsoring"}
                  onValueChange={(value) =>
                    updateProspect(prospect.id, { partnershipType: value as ProspectCard["partnershipType"] })
                  }
                >
                  <SelectTrigger className="border-white/10 bg-white/5 text-white">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent className="border-white/10 bg-[#111] text-white">
                    {[
                      { value: "sponsoring", label: "Sponsoring" },
                      { value: "mecenat", label: "Mécénat" },
                      { value: "both", label: "Les deux" },
                    ].map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      )}

      {detailTab === "offre" && (
        <div className="grid gap-4 pt-4 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-4">
            <div className="text-sm font-semibold text-white">Sélectionnez les prestations</div>
            {offerSections.map((section) => (
              <details key={section.title} className="rounded-xl bg-[#1B2A4A]/40 p-4">
                <summary className="cursor-pointer text-sm font-semibold text-white">{section.title}</summary>
                <div className="mt-3 space-y-2 text-sm text-white/70">
                  {section.items.map((item) => {
                    const isIncluded = item.included;
                    const isSelected = Object.prototype.hasOwnProperty.call(offerSelections, item.id);
                    return (
                      <div key={item.id} className="grid items-center gap-3 md:grid-cols-[auto_1fr_auto]">
                        <input
                          type="checkbox"
                          checked={isIncluded || isSelected}
                          disabled={isIncluded}
                          onChange={(event) => {
                            const checked = event.target.checked;
                            const next = { ...offerSelections };
                            if (!checked) {
                              delete next[item.id];
                            } else {
                              next[item.id] = item.price;
                            }
                            updateProspect(prospect.id, { offerSelections: next });
                          }}
                        />
                        <span>{item.label}</span>
                        {isIncluded ? (
                          <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-300">
                            INCLUS
                          </span>
                        ) : (
                          <span>{(offerSelections[item.id] ?? item.price).toLocaleString("fr-FR")}€</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </details>
            ))}
          </div>
          <div className="sticky top-6 h-fit rounded-xl bg-[#1B2A4A]/60 p-4">
            <div className="text-sm font-semibold text-white">Votre offre</div>
            <Input
              value={offerName}
              onChange={(event) => updateProspect(prospect.id, { offerName: event.target.value })}
              placeholder="Nom de l'offre"
              className="mt-3 border-white/10 bg-white/5 text-white"
            />
            <div className="mt-3 space-y-2 text-sm text-white/70">
              {Object.entries(offerSelections).length === 0 && (
                <div className="text-xs text-white/50">Aucune prestation sélectionnée.</div>
              )}
              {Object.entries(offerSelections).map(([id, price]) => {
                const label =
                  offerSections.flatMap((section) => section.items).find((item) => item.id === id)
                    ?.label || id;
                return (
                  <div key={id} className="flex items-center justify-between">
                    <span>{label}</span>
                    <div className="flex items-center gap-2">
                      <span>{price.toLocaleString("fr-FR")}€</span>
                      <button
                        className="text-white/60 hover:text-white"
                        onClick={() => {
                          const next = { ...offerSelections };
                          delete next[id];
                          updateProspect(prospect.id, { offerSelections: next });
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="my-4 h-px bg-white/10" />
            <div className="text-xl font-black text-[#C8102E] lg:text-3xl">
              {offerTotal.toLocaleString("fr-FR")}€ HT
            </div>
            <div className="text-sm text-white/60">
              TTC : {(offerTotal * 1.2).toLocaleString("fr-FR")}€
            </div>
            <button
              className="mt-4 w-full rounded-full bg-[#C8102E] px-4 py-2 text-sm text-white"
              onClick={generateCustomOfferPdf}
            >
              Générer le contrat PDF
            </button>
            <button
              className="mt-2 w-full rounded-full bg-white/10 px-4 py-2 text-sm text-white"
              onClick={handleSendOfferEmail}
            >
              Envoyer par email
            </button>
          </div>
        </div>
      )}

      {detailTab === "documents" && (
        <div className="space-y-4 pt-4">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="text-sm font-semibold text-white">Documents générés</div>
            {documents.length === 0 ? (
              <div className="mt-2 text-sm text-white/60">Aucun document pour le moment.</div>
            ) : (
              <div className="mt-3 space-y-2 text-sm text-white/70">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between rounded-lg bg-white/5 p-3">
                    <div>
                      <div className="font-medium text-white">{doc.name}</div>
                      <div className="text-xs text-white/50">{doc.date}</div>
                    </div>
                    <div className="flex gap-2">
                      <button className="rounded-full bg-white/10 px-3 py-1 text-xs text-white">
                        Télécharger
                      </button>
                      <button className="rounded-full bg-white/10 px-3 py-1 text-xs text-white">
                        Envoyer par email
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="text-sm font-semibold text-white">Contrat de sponsoring</div>
            <button
              className="mt-3 rounded-full bg-white/10 px-4 py-2 text-sm text-white"
              onClick={generateSponsoringPdf}
            >
              Générer contrat sponsoring
            </button>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">
            Facture (à venir)
          </div>
        </div>
      )}
    </>
  );
}

export default function ClubTunnelPage() {
  const status = useClubGuard();
  const [columns, setColumns] = useState<Column[]>(initialColumns);
  const [clubId, setClubId] = useState<string | null>(null);
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [columnDraft, setColumnDraft] = useState("");
  const [showColumnDialog, setShowColumnDialog] = useState(false);
  const [newColumnLabel, setNewColumnLabel] = useState("");
  const [showProspectDialog, setShowProspectDialog] = useState(false);
  const [prospectStep, setProspectStep] = useState<"coordonnees" | "offre">("coordonnees");
  const [newOfferSelections, setNewOfferSelections] = useState<Record<string, number>>({
    "dives-platform": 0,
  });
  const [newOfferName, setNewOfferName] = useState("");
  const [selectedProspect, setSelectedProspect] = useState<ProspectCard | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailTab, setDetailTab] = useState<"coordonnees" | "offre" | "documents">("coordonnees");
  const [siret, setSiret] = useState("");
  const [siretStatus, setSiretStatus] = useState<"idle" | "loading" | "found" | "not_found" | "error">("idle");
  const [siretMessage, setSiretMessage] = useState("");
  const [formValues, setFormValues] = useState({
    nom: "",
    secteur: "Banque",
    adresse: "",
    valeur: 0,
    contactPrenom: "",
    contactNom: "",
    contactEmail: "",
    contactTel: "",
    notes: "",
    columnId: "prospects",
  });
  const [partnershipTypes, setPartnershipTypes] = useState({
    sponsoring: false,
    mecenat: false,
    dives: true,
  });
  const [mecenatAmount, setMecenatAmount] = useState(0);
  const [sponsorSelections, setSponsorSelections] = useState<Record<string, number>>({});
  const [paymentMode, setPaymentMode] = useState("Virement bancaire");
  const [sponsorshipRates, setSponsorshipRates] = useState<Record<string, number>>({});
  const [documents, setDocuments] = useState<
    { id: string; type: "mecenat" | "sponsoring" | "offer"; name: string; date: string }[]
  >([]);
  const [currentUserName, setCurrentUserName] = useState("Responsable");
  const [currentUserEmail, setCurrentUserEmail] = useState("contact@club.fr");

  const columnsWithCards = columns;

  useEffect(() => {
    const load = async () => {
      const clubData = await getMyClub();
      if (!clubData) return;
      setClubId(clubData.id);
      const partners = await getClubPartners(clubData.id);
      const grouped = {
        prospects: partners.filter((partner) => partner.colonne_tunnel === "prospects"),
        premier_contact: partners.filter((partner) => partner.colonne_tunnel === "premier_contact"),
        presentation: partners.filter((partner) => partner.colonne_tunnel === "presentation"),
        negociation: partners.filter((partner) => partner.colonne_tunnel === "negociation"),
        signature: partners.filter((partner) => partner.colonne_tunnel === "signature"),
        perdu: partners.filter((partner) => partner.colonne_tunnel === "perdu"),
      };
      setColumns((prev) =>
        prev.map((col) => ({
          ...col,
          cards: (grouped[col.id] || []).map((partner) => ({
            id: partner.id,
            nom: partner.nom,
            secteur: partner.secteur,
            valeur: partner.valeur || 0,
            contact: `${partner.contact_prenom || ""} ${partner.contact_nom || ""}`.trim() || "—",
            contactEmail: partner.contact_email || partner.contactEmail,
            contactTel: partner.contact_tel || partner.contactTel,
            adresse: partner.adresse,
            siret: partner.siret,
            notes: partner.notes,
            lastAction: partner.last_action || partner.updated_at || "—",
            columnId: col.id,
            createdAt: partner.created_at,
            updatedAt: partner.updated_at,
            offerName: partner.offer_name,
            offerSelections: partner.offer_selections || {},
            partnershipType: partner.partnership_type,
            paymentMode: partner.payment_mode,
          })),
        }))
      );
    };
    load();
  }, []);
  

  useEffect(() => {
    setDetailTab("coordonnees");
    setPartnershipTypes({ sponsoring: false, mecenat: false, dives: true });
    setMecenatAmount(0);
    setSponsorSelections({});
    setPaymentMode("Virement bancaire");
  }, [selectedProspect]);

  useEffect(() => {
    if (!showProspectDialog) return;
    setProspectStep("coordonnees");
    setNewOfferSelections({ "dives-platform": 0 });
    setNewOfferName("");
  }, [showProspectDialog]);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("club_sponsorship_rates") : null;
    if (stored) {
      try {
        setSponsorshipRates(JSON.parse(stored));
      } catch {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const { data } = await fetch("/api/auth/session").then((res) => res.json()).catch(() => ({ data: null }));
        if (data?.user?.email) {
          setCurrentUserEmail(data.user.email);
          const name = data.user.full_name?.split(" ")[0] || data.user.email.split("@")[0];
          setCurrentUserName(name || "Responsable");
        }
      } catch {
        // ignore
      }
    };
    loadUser();
  }, []);

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over) return;
    setColumns((prev) => {
      const findColumnByCard = (cardId: string) =>
        prev.find((column) => column.cards.some((card) => card.id === cardId));
      const activeColumn = findColumnByCard(String(active.id));
      if (!activeColumn) return prev;
      const activeCard = activeColumn.cards.find((card) => card.id === active.id);
      if (!activeCard) return prev;
      const overColumn =
        prev.find((column) => column.id === over.id) || findColumnByCard(String(over.id));
      if (!overColumn) return prev;

      if (activeColumn.id === overColumn.id) {
        const oldIndex = activeColumn.cards.findIndex((card) => card.id === activeCard.id);
        const newIndex = activeColumn.cards.findIndex((card) => card.id === over.id);
        if (newIndex === -1) return prev;
        const reordered = arrayMove(activeColumn.cards, oldIndex, newIndex);
        return prev.map((column) =>
          column.id === activeColumn.id ? { ...column, cards: reordered } : column
        );
      }

      return prev.map((column) => {
        if (column.id === activeColumn.id) {
          return { ...column, cards: column.cards.filter((card) => card.id !== activeCard.id) };
        }
        if (column.id === overColumn.id) {
          return {
            ...column,
            cards: [
              ...column.cards,
              { ...activeCard, columnId: overColumn.id, updatedAt: new Date().toISOString() },
            ],
          };
        }
        return column;
      });
    });
  };

  const addColumn = () => {
    const newId = newColumnLabel.toLowerCase().replace(/\s+/g, "-");
    if (!newId) return;
    setColumns((prev) => [...prev, { id: newId, label: newColumnLabel, couleur: "#6B7280", cards: [] }]);
    setNewColumnLabel("");
    setShowColumnDialog(false);
  };

  const saveProspect = () => {
    const now = new Date().toISOString();
    const newCard: ProspectCard = {
      id: `${formValues.nom}-${Date.now()}`.toLowerCase().replace(/\s+/g, "-"),
      nom: formValues.nom,
      secteur: formValues.secteur,
      adresse: formValues.adresse,
      siret: siret.replace(/\D/g, "") || undefined,
      valeur: Number(formValues.valeur),
      contact: `${formValues.contactPrenom} ${formValues.contactNom}`.trim(),
      contactEmail: formValues.contactEmail,
      contactTel: formValues.contactTel,
      notes: formValues.notes,
      offerName: newOfferName || `${formValues.nom} — Offre personnalisée`,
      offerSelections: newOfferSelections,
      lastAction: "À l’instant",
      columnId: formValues.columnId,
      createdAt: now,
      updatedAt: now,
    };
    setColumns((prev) =>
      prev.map((column) =>
        column.id === formValues.columnId
          ? { ...column, cards: [newCard, ...column.cards] }
          : column
      )
    );
    setShowProspectDialog(false);
    setProspectStep("coordonnees");
    setNewOfferSelections({ "dives-platform": 0 });
    setNewOfferName("");
    setFormValues({
      nom: "",
      secteur: "Banque",
      adresse: "",
      valeur: 0,
      contactPrenom: "",
      contactNom: "",
      contactEmail: "",
      contactTel: "",
      notes: "",
      columnId: "prospect",
    });
    setSiret("");
    setSiretStatus("idle");
    setSiretMessage("");
  };

  const updateProspect = (id: string, changes: Partial<ProspectCard>) => {
    const updatedAt = new Date().toISOString();
    setColumns((prev) =>
      prev.map((column) => ({
        ...column,
        cards: column.cards.map((card) =>
          card.id === id ? { ...card, ...changes, updatedAt } : card
        ),
      }))
    );
    setSelectedProspect((prev) => (prev && prev.id === id ? { ...prev, ...changes, updatedAt } : prev));
  };

  const moveCard = (cardId: string, newColumnId: string) => {
    setColumns((prev) => {
      const card = prev.flatMap((column) => column.cards).find((item) => item.id === cardId);
      if (!card) return prev;
      return prev.map((column) => {
        if (column.id === newColumnId) {
          return {
            ...column,
            cards: [...column.cards.filter((item) => item.id !== cardId), { ...card, columnId: newColumnId }],
          };
        }
        return { ...column, cards: column.cards.filter((item) => item.id !== cardId) };
      });
    });
    setSelectedProspect((prev) => (prev && prev.id === cardId ? { ...prev, columnId: newColumnId } : prev));
    updatePartner(cardId, { colonne_tunnel: newColumnId });
  };

  const mapNafToSector = (code: string) => {
    const prefix = code?.slice(0, 2);
    if (!prefix) return "Autre";
    const mapping: Record<string, string> = {
      "01": "Agriculture",
      "10": "Agroalimentaire",
      "41": "BTP",
      "45": "Automobile",
      "47": "Commerce",
      "49": "Transport",
      "55": "Hôtellerie",
      "56": "Restauration",
      "64": "Banque",
      "65": "Assurance",
      "68": "Immobilier",
      "70": "Conseil",
      "71": "Ingénierie",
      "85": "Éducation",
      "86": "Santé",
      "88": "Social",
    };
    return mapping[prefix] ?? "Autre";
  };

  const applySiretResult = (payload: { nom?: string; adresse?: string; naf?: string }) => {
    setFormValues((prev) => ({
      ...prev,
      nom: payload.nom || prev.nom,
      adresse: payload.adresse || prev.adresse,
      secteur: payload.naf ? mapNafToSector(payload.naf) : prev.secteur,
    }));
  };

  const lookupSiret = async () => {
    const cleanSiret = siret.replace(/\D/g, "");
    if (cleanSiret.length !== 14) {
      setSiretStatus("error");
      setSiretMessage("Numéro SIRET invalide");
      return;
    }
    setSiretStatus("loading");
    setSiretMessage("Recherche en cours...");
    const inseeToken = process.env.NEXT_PUBLIC_INSEE_API_TOKEN;
    const pappersToken = process.env.NEXT_PUBLIC_PAPPERS_API_TOKEN;
    const endpoints: Array<{ url: string; headers?: HeadersInit }> = [];
    if (inseeToken) {
      endpoints.push({
        url: `https://api.insee.fr/entreprises/sirene/V3.11/siret/${cleanSiret}`,
        headers: { Authorization: `Bearer ${inseeToken}` },
      });
    }
    if (pappersToken) {
      endpoints.push({
        url: `https://api.pappers.fr/v2/entreprise?siret=${cleanSiret}&api_token=${pappersToken}`,
      });
    }
    endpoints.push({
      url: `https://entreprise.data.gouv.fr/api/sirene/v1/siret/${cleanSiret}`,
    });

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint.url, { headers: endpoint.headers });
        if (!response.ok) continue;
        const data = await response.json();
        const etablissement =
          data?.etablissement ||
          data?.unite_legale?.etablissement ||
          data?.etablissement_siege ||
          data?.entreprise ||
          data?.records?.[0]?.fields ||
          data?.etablissements?.[0];
        const nom =
          etablissement?.unite_legale?.denomination ||
          etablissement?.denomination ||
          data?.entreprise?.denomination ||
          data?.raison_sociale ||
          data?.denomination;
        const naf =
          etablissement?.unite_legale?.activite_principale ||
          etablissement?.activite_principale ||
          data?.activite_principale ||
          data?.naf;
        const adresseParts = [
          etablissement?.numero_voie,
          etablissement?.type_voie,
          etablissement?.libelle_voie,
          etablissement?.code_postal,
          etablissement?.libelle_commune,
        ].filter(Boolean);
        const adresse =
          adresseParts.join(" ") ||
          etablissement?.adresse ||
          data?.adresse ||
          data?.siege?.adresse;
        if (nom) {
          applySiretResult({ nom, adresse, naf });
          setSiretStatus("found");
          setSiretMessage("SIRET trouvé");
          return;
        }
      } catch {
        // try next endpoint
      }
    }

    setSiretStatus("not_found");
    setSiretMessage("SIRET introuvable, remplissez manuellement");
  };

  const selectedSponsorTotal = useMemo(() => {
    return Object.values(sponsorSelections).reduce((sum, value) => sum + value, 0);
  }, [sponsorSelections]);

  const sponsorshipSections = useMemo(() => {
    return baseSponsorshipSections.map((section) => ({
      ...section,
      items: section.items.map((item) => ({
        ...item,
        price: sponsorshipRates[item.id] ?? item.price,
      })),
    }));
  }, [sponsorshipRates]);

  const offerSections = useMemo(() => {
    return [
      ...sponsorshipSections,
      {
        title: "Dives Développement",
        items: [
          {
            id: "dives-platform",
            label: "Accès plateforme Beyond Network",
            price: 0,
            included: true,
          },
        ],
      },
    ];
  }, [sponsorshipSections]);

  const totalPartnership = selectedSponsorTotal + (partnershipTypes.mecenat ? mecenatAmount : 0);

  const generateMecenatPdf = () => {
    if (!selectedProspect) return;
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setTextColor("#C8102E");
    doc.text("CONVENTION DE MÉCÉNAT", 105, 20, { align: "center" });
    doc.setDrawColor("#1B2A4A");
    doc.line(15, 25, 195, 25);
    doc.setFont("helvetica", "normal");
    doc.setTextColor("#1B2A4A");
    doc.text(`Date : ${new Date().toLocaleDateString("fr-FR")}`, 15, 35);
    doc.text(`Convention n° MC-${Date.now().toString().slice(-6)}`, 15, 42);
    doc.text("Bénéficiaire : SU Dives Cabourg Football", 15, 55);
    doc.text(`Mécène : ${selectedProspect.nom}`, 15, 62);
    doc.text(`Montant du don : ${mecenatAmount.toLocaleString("fr-FR")}€`, 15, 75);
    doc.text(
      "Objet : Soutien aux activités sportives du SU Dives Cabourg Football, évoluant en National 3",
      15,
      90,
      { maxWidth: 180 }
    );
    doc.text(
      "Conformément à l'article 238 bis du CGI, votre don ouvre droit à une réduction d'impôt de 60% du montant versé.",
      15,
      105,
      { maxWidth: 180 }
    );
    doc.text("Contreparties : visibilité sur supports du club", 15, 125);
    doc.text("Modalité de paiement : virement bancaire", 15, 135);
    doc.line(15, 245, 195, 245);
    doc.text("Signature club", 30, 260);
    doc.text("Signature mécène", 130, 260);
    doc.setFontSize(10);
    doc.text("SU Dives Cabourg Football — Association loi 1901", 105, 285, { align: "center" });
    doc.save(`convention-mecenat-${selectedProspect.nom}.pdf`);
    setDocuments((prev) => [
      ...prev,
      {
        id: `mecenat-${Date.now()}`,
        type: "mecenat",
        name: "Convention de mécénat",
        date: new Date().toLocaleDateString("fr-FR"),
      },
    ]);
  };

  const generateSponsoringPdf = () => {
    if (!selectedProspect) return;
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setTextColor("#1B2A4A");
    doc.text("CONTRAT DE SPONSORING", 105, 20, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.text(`Partenaire : ${selectedProspect.nom}`, 15, 32);
    doc.text(`Date : ${new Date().toLocaleDateString("fr-FR")}`, 15, 40);
    doc.setDrawColor("#C8102E");
    doc.line(15, 45, 195, 45);
    let y = 55;
    doc.setFont("helvetica", "bold");
    doc.text("Emplacement", 15, y);
    doc.text("Tarif HT", 130, y);
    doc.text("Tarif TTC", 165, y);
    doc.setFont("helvetica", "normal");
    y += 8;
    Object.entries(sponsorSelections).forEach(([id, price]) => {
      const label =
        sponsorshipSections
          .flatMap((section) => section.items)
          .find((item) => item.id === id)?.label || id;
      doc.text(label, 15, y, { maxWidth: 110 });
      doc.text(`${price.toLocaleString("fr-FR")}€`, 130, y);
      doc.text(`${Math.round(price * 1.2).toLocaleString("fr-FR")}€`, 165, y);
      y += 8;
    });
    doc.setFont("helvetica", "bold");
    doc.setTextColor("#C8102E");
    doc.text(`Total : ${selectedSponsorTotal.toLocaleString("fr-FR")}€`, 15, y + 6);
    doc.setTextColor("#1B2A4A");
    doc.setFontSize(9);
    doc.text("Conditions générales applicables. Voir annexe.", 15, y + 18);
    doc.text("Signature club", 30, 260);
    doc.text("Signature partenaire", 130, 260);
    doc.save(`contrat-sponsoring-${selectedProspect.nom}.pdf`);
    setDocuments((prev) => [
      ...prev,
      {
        id: `sponsoring-${Date.now()}`,
        type: "sponsoring",
        name: "Contrat de sponsoring",
        date: new Date().toLocaleDateString("fr-FR"),
      },
    ]);
  };

  const generateCustomOfferPdf = () => {
    if (!selectedProspect) return;
    const selections = selectedProspect.offerSelections ?? {};
    const selectedItems = Object.entries(selections).map(([id, price]) => ({
      id,
      price,
      label:
        offerSections
          .flatMap((section) => section.items)
          .find((item) => item.id === id)?.label || id,
    }));
    const totalHt = selectedItems.reduce((sum, item) => sum + item.price, 0);
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setTextColor("#C8102E");
    doc.text("CONTRAT DE PARTENARIAT SPORTIF", 105, 20, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setTextColor("#1B2A4A");
    doc.text(`Partenaire : ${selectedProspect.nom}`, 15, 35);
    doc.text("SU Dives Cabourg Football", 15, 42);
    doc.line(15, 48, 195, 48);
    let y = 58;
    doc.setFont("helvetica", "bold");
    doc.text("Prestation", 15, y);
    doc.text("Tarif HT", 160, y);
    doc.setFont("helvetica", "normal");
    y += 8;
    selectedItems.forEach((item) => {
      doc.text(item.label, 15, y, { maxWidth: 130 });
      doc.text(`${item.price.toLocaleString("fr-FR")}€`, 160, y);
      y += 8;
    });
    doc.setFont("helvetica", "bold");
    doc.setTextColor("#C8102E");
    doc.text(`Total HT : ${totalHt.toLocaleString("fr-FR")}€`, 15, y + 6);
    doc.text(`TVA 20% : ${(totalHt * 0.2).toLocaleString("fr-FR")}€`, 15, y + 14);
    doc.text(`Total TTC : ${(totalHt * 1.2).toLocaleString("fr-FR")}€`, 15, y + 22);
    doc.setTextColor("#1B2A4A");
    doc.setFontSize(9);
    doc.text("Conditions de paiement : à convenir entre les parties.", 15, y + 34);
    doc.text("Signature club", 30, 260);
    doc.text("Signature partenaire", 130, 260);
    doc.save(`contrat-partenariat-${selectedProspect.nom}.pdf`);
    setDocuments((prev) => [
      ...prev,
      {
        id: `offer-${Date.now()}`,
        type: "offer",
        name: "Contrat de partenariat sportif",
        date: new Date().toLocaleDateString("fr-FR"),
      },
    ]);
  };

  const handleSendOfferEmail = () => {
    if (!selectedProspect) return;
    const selections = selectedProspect.offerSelections ?? {};
    const totalHt = Object.values(selections).reduce((sum, value) => sum + value, 0);
    const subject = encodeURIComponent("Offre personnalisée — SU Dives Cabourg");
    const body = encodeURIComponent(
      `Bonjour ${selectedProspect.contact?.split(" ")[0] || ""},\n\n` +
        `Veuillez trouver ci-dessous notre offre personnalisée.\n\n` +
        `Total HT : ${totalHt.toLocaleString("fr-FR")}€\n` +
        `Total TTC : ${(totalHt * 1.2).toLocaleString("fr-FR")}€\n\n` +
        `Cordialement,\n${currentUserName}\n${currentUserEmail}\nSU Dives Cabourg Football`
    );
    const mailto = `mailto:${selectedProspect.contactEmail || ""}?subject=${subject}&body=${body}`;
    window.open(mailto, "_blank");
  };

  const handleSendMecenatEmail = () => {
    if (!selectedProspect) return;
    const reduction = Math.round(mecenatAmount * 0.6);
    const subject = encodeURIComponent("Convention de mécénat — SU Dives Cabourg");
    const body = encodeURIComponent(
      `Bonjour ${selectedProspect.contact?.split(" ")[0] || ""},\n\n` +
        `Veuillez trouver ci-joint la convention de mécénat pour votre engagement auprès du SU Dives Cabourg.\n\n` +
        `Montant : ${mecenatAmount}€\n` +
        `Avantage fiscal : ${reduction}€ de réduction d'impôt\n\n` +
        `N'hésitez pas à nous contacter pour toute question.\n\n` +
        `Cordialement,\n${currentUserName}\n${currentUserEmail}\nSU Dives Cabourg Football`
    );
    const mailto = `mailto:${selectedProspect.contactEmail || ""}?subject=${subject}&body=${body}`;
    window.open(mailto, "_blank");
  };

  if (status !== "allowed") {
    return null;
  }

  const totalContacts = columns.reduce((sum, col) => sum + (col.cards?.length || 0), 0);
  const caPrevisionnel = columns.reduce(
    (sum, col) => sum + (col.cards || []).reduce((s, card) => s + (card.valeur || 0), 0),
    0
  );
  const caRealise = (columns.find((column) => column.id === "signature")?.cards || []).reduce(
    (sum, card) => sum + (card.valeur || 0),
    0
  );

  type OfferItem = { id: string; label: string; price: number; included?: boolean };
  type OfferSection = { title: string; items: OfferItem[] };

  const offerItemMap = offerSections
    .flatMap((section) => section.items.map((item) => ({ ...item, section: section.title })))
    .reduce(
      (acc, item) => {
        acc[item.id] = item;
        return acc;
      },
      {} as Record<string, { id: string; label: string; price: number; included?: boolean; section: string }>
    );
  const newOfferItems = Object.entries(newOfferSelections).map(([id, price]) => ({
    id,
    price,
    label: offerItemMap[id]?.label ?? id,
    included: offerItemMap[id]?.included ?? false,
  }));
  const prospectOfferSections: OfferSection[] = [
    {
      title: "Match Day",
      items: offerSections
        .filter((section) => section.title.startsWith("Match Day"))
        .flatMap((section) => section.items),
    },
    {
      title: "Training",
      items: offerSections.find((section) => section.title === "Training")?.items ?? [],
    },
    {
      title: "Digital",
      items: offerSections.find((section) => section.title === "Digital")?.items ?? [],
    },
    {
      title: "Stade",
      items: offerSections.find((section) => section.title === "Stade")?.items ?? [],
    },
    {
      title: "Dives Développement",
      items: offerSections.find((section) => section.title === "Dives Développement")?.items ?? [],
    },
  ];
  const newOfferTotal = newOfferItems.reduce((sum, item) => sum + (item.included ? 0 : item.price), 0);
  const newOfferTva = newOfferTotal * 0.2;
  const newOfferTtc = newOfferTotal * 1.2;

  return (
    <ClubLayout activeItem="Tunnel de vente">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-lg font-semibold text-white lg:text-2xl">Tunnel de vente</h1>
        <div className="flex flex-wrap gap-3">
          <button
            className="rounded-full px-5 py-2 text-sm font-semibold text-white"
            style={{ backgroundColor: "var(--club-primary)" }}
            onClick={() => setShowProspectDialog(true)}
          >
            + Nouveau prospect
          </button>
          <button
            className="rounded-full bg-white/10 px-5 py-2 text-sm font-semibold text-white"
            onClick={() => setShowColumnDialog(true)}
          >
            + Colonne
          </button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-[#1B2A4A]/60 p-5 backdrop-blur">
          <div className="mb-1 text-xs text-white/60">Contacts total</div>
          <div className="text-xl font-black text-white lg:text-3xl">{totalContacts}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#1B2A4A]/60 p-5 backdrop-blur">
          <div className="mb-1 text-xs text-white/60">CA prévisionnel</div>
          <div className="text-xl font-black text-blue-300 lg:text-3xl">
            {caPrevisionnel.toLocaleString("fr-FR")}€
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#1B2A4A]/60 p-5 backdrop-blur">
          <div className="mb-1 text-xs text-white/60">CA réalisé</div>
          <div className="text-xl font-black text-[#C8102E] lg:text-3xl">
            {caRealise.toLocaleString("fr-FR")}€
          </div>
        </div>
      </div>

      <DndContext onDragEnd={handleDragEnd}>
        <div className="mt-6 flex gap-4 overflow-x-auto snap-x snap-mandatory -mx-4 px-4 pb-4 lg:mx-0 lg:px-0">
          {columnsWithCards.map((column) => (
            <div
              key={column.id}
              className="min-w-[280px] w-[280px] flex-shrink-0 snap-start rounded-2xl border border-white/10 bg-[#111] p-4 lg:w-auto lg:flex-1"
            >
              <div className="mb-3 flex items-center justify-between">
                {editingColumnId === column.id ? (
                  <input
                    value={columnDraft}
                    onChange={(event) => setColumnDraft(event.target.value)}
                    onBlur={() => {
                      setColumns((prev) =>
                        prev.map((col) =>
                          col.id === column.id ? { ...col, label: columnDraft || col.label } : col
                        )
                      );
                      setEditingColumnId(null);
                    }}
                    className="w-full rounded-md bg-white/5 px-2 py-1 text-sm text-white"
                  />
                ) : (
                  <button
                    className="text-sm font-semibold"
                    style={{ color: column.couleur }}
                    onClick={() => {
                      setEditingColumnId(column.id);
                      setColumnDraft(column.label);
                    }}
                  >
                    {column.label}
                  </button>
                )}
                <span className="text-xs text-white/40">{column.cards.length}</span>
              </div>
              <div className="mb-2 text-xs text-white/40">
                {column.cards
                  .reduce((sum, card) => sum + card.valeur, 0)
                  .toLocaleString("fr-FR")}€
              </div>
              <SortableContext items={column.cards.map((card) => card.id)}>
                <ColumnDropZone id={column.id}>
                  {column.cards.map((card) => (
                    <SortableCard
                      key={card.id}
                      card={card}
                      columns={columns}
                      onMove={moveCard}
                      setSelectedProspect={setSelectedProspect}
                      setShowDetailModal={setShowDetailModal}
                    />
                  ))}
                </ColumnDropZone>
              </SortableContext>
              <button className="mt-3 w-full rounded-full bg-white/10 px-3 py-1.5 text-xs text-white/70">
                + Ajouter
              </button>
            </div>
          ))}
        </div>
      </DndContext>

      <Dialog open={showColumnDialog} onOpenChange={setShowColumnDialog}>
        <DialogContent className="bg-[#111] text-white">
          <DialogHeader>
            <DialogTitle>Nouvelle colonne</DialogTitle>
          </DialogHeader>
          <Input
            value={newColumnLabel}
            onChange={(event) => setNewColumnLabel(event.target.value)}
            placeholder="Nom de la colonne"
            className="border-white/10 bg-white/5 text-white"
          />
          <DialogFooter>
            <button
              className="rounded-full bg-white/10 px-4 py-2 text-sm"
              onClick={() => setShowColumnDialog(false)}
            >
              Annuler
            </button>
            <button
              className="rounded-full px-4 py-2 text-sm text-white"
              style={{ backgroundColor: "var(--club-primary)" }}
              onClick={addColumn}
            >
              Sauvegarder
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showProspectDialog} onOpenChange={setShowProspectDialog}>
        <DialogContent className="bg-[#111] text-white">
          <DialogHeader>
            <DialogTitle>Nouveau prospect / Modifier</DialogTitle>
          </DialogHeader>
          {prospectStep === "coordonnees" && (
            <>
              <div className="space-y-4">
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs text-white/60">Étape 1 — Recherche SIRET</div>
                  <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto]">
                    <Input
                      value={siret}
                      onChange={(event) => setSiret(event.target.value)}
                      placeholder="Numéro SIRET"
                      className="border-white/10 bg-white/5 text-white"
                    />
                    <button
                      className="rounded-full bg-white/10 px-4 py-2 text-sm text-white"
                      onClick={lookupSiret}
                      type="button"
                    >
                      Rechercher
                    </button>
                  </div>
                  {siretMessage && <div className="mt-2 text-xs text-white/70">{siretMessage}</div>}
                  {siretStatus === "idle" && (
                    <button
                      className="mt-3 text-xs text-white/60 underline"
                      onClick={() => setSiretStatus("not_found")}
                      type="button"
                    >
                      Saisie manuelle
                    </button>
                  )}
                </div>

                {(siretStatus === "found" || siretStatus === "not_found" || siretStatus === "error") && (
                  <div className="grid gap-3 md:grid-cols-2">
                    <Input
                      value={formValues.nom}
                      onChange={(event) => setFormValues({ ...formValues, nom: event.target.value })}
                      placeholder="Nom entreprise"
                      className="border-white/10 bg-white/5 text-white"
                    />
                    <Select
                      value={formValues.secteur}
                      onValueChange={(value) => setFormValues({ ...formValues, secteur: value })}
                    >
                      <SelectTrigger className="border-white/10 bg-white/5 text-white">
                        <SelectValue placeholder="Secteur" />
                      </SelectTrigger>
                      <SelectContent className="border-white/10 bg-[#111] text-white">
                        {[
                          "Banque",
                          "Automobile",
                          "RH",
                          "Restauration",
                          "Santé",
                          "Immobilier",
                          "Énergie",
                          "Sport",
                          "Hôtellerie",
                          "Assurance",
                          "Transport",
                          "Autre",
                        ].map((sector) => (
                          <SelectItem key={sector} value={sector}>
                            {sector}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      value={formValues.adresse}
                      onChange={(event) => setFormValues({ ...formValues, adresse: event.target.value })}
                      placeholder="Adresse"
                      className="border-white/10 bg-white/5 text-white"
                    />
                    <Input
                      type="number"
                      value={formValues.valeur}
                      onChange={(event) => setFormValues({ ...formValues, valeur: Number(event.target.value) })}
                      placeholder="Valeur estimée €/an"
                      className="border-white/10 bg-white/5 text-white"
                    />
                    <Input
                      value={formValues.contactPrenom}
                      onChange={(event) => setFormValues({ ...formValues, contactPrenom: event.target.value })}
                      placeholder="Prénom contact"
                      className="border-white/10 bg-white/5 text-white"
                    />
                    <Input
                      value={formValues.contactNom}
                      onChange={(event) => setFormValues({ ...formValues, contactNom: event.target.value })}
                      placeholder="Nom contact"
                      className="border-white/10 bg-white/5 text-white"
                    />
                    <Input
                      value={formValues.contactEmail}
                      onChange={(event) => setFormValues({ ...formValues, contactEmail: event.target.value })}
                      placeholder="Email"
                      className="border-white/10 bg-white/5 text-white"
                    />
                    <Input
                      value={formValues.contactTel}
                      onChange={(event) => setFormValues({ ...formValues, contactTel: event.target.value })}
                      placeholder="Téléphone"
                      className="border-white/10 bg-white/5 text-white"
                    />
                    <Select
                      value={formValues.columnId}
                      onValueChange={(value) => setFormValues({ ...formValues, columnId: value })}
                    >
                      <SelectTrigger className="border-white/10 bg-white/5 text-white">
                        <SelectValue placeholder="Colonne" />
                      </SelectTrigger>
                      <SelectContent className="border-white/10 bg-[#111] text-white">
                        {columns.map((column) => (
                          <SelectItem key={column.id} value={column.id}>
                            {column.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {(siretStatus === "found" || siretStatus === "not_found" || siretStatus === "error") && (
                  <Textarea
                    value={formValues.notes}
                    onChange={(event) => setFormValues({ ...formValues, notes: event.target.value })}
                    placeholder="Notes"
                    className="border-white/10 bg-white/5 text-white"
                  />
                )}
              </div>
              <DialogFooter>
                <button
                  className="rounded-full bg-white/10 px-4 py-2 text-sm"
                  onClick={() => setShowProspectDialog(false)}
                >
                  Annuler
                </button>
                <button
                  className="rounded-full px-4 py-2 text-sm text-white"
                  style={{ backgroundColor: "var(--club-primary)" }}
                  onClick={() => setProspectStep("offre")}
                >
                  Étape suivante →
                </button>
              </DialogFooter>
            </>
          )}

          {prospectStep === "offre" && (
            <>
              <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
                <div className="space-y-4">
                  {prospectOfferSections.map((section) => (
                    <div key={section.title} className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <details open>
                        <summary className="cursor-pointer text-sm font-semibold text-white">
                          {section.title}
                        </summary>
                        <div className="mt-3 space-y-2 text-sm text-white/70">
                          {section.items.map((item: { id: string; label: string; price: number; included?: boolean }) => {
                            const isIncluded = Boolean(item.included);
                            const checked = isIncluded || Object.prototype.hasOwnProperty.call(newOfferSelections, item.id);
                            const price = item.price;
                            return (
                              <label key={item.id} className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    disabled={isIncluded}
                                    onChange={(event) => {
                                      const isChecked = event.target.checked;
                                      setNewOfferSelections((prev) => {
                                        if (!isChecked) {
                                          const next = { ...prev };
                                          delete next[item.id];
                                          return next;
                                        }
                                        return { ...prev, [item.id]: price };
                                      });
                                    }}
                                  />
                                  <span>{item.label}</span>
                                  {isIncluded && (
                                    <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-300">
                                      INCLUS
                                    </span>
                                  )}
                                </div>
                                {!isIncluded && (
                                  <span>{(price || 0).toLocaleString("fr-FR")}€</span>
                                )}
                              </label>
                            );
                          })}
                        </div>
                      </details>
                    </div>
                  ))}
                </div>
                <div className="sticky top-4 h-fit rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="text-sm font-semibold text-white">Offre pour {formValues.nom || "le prospect"}</div>
                  <div className="mt-3 space-y-2 text-sm text-white/70">
                    {newOfferItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between">
                        <span>{item.label}</span>
                        <div className="flex items-center gap-2">
                          {item.included ? (
                            <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-300">
                              INCLUS
                            </span>
                          ) : (
                            <>
                              <span>{item.price.toLocaleString("fr-FR")}€</span>
                              <button
                                className="text-white/50"
                                onClick={() =>
                                  setNewOfferSelections((prev) => {
                                    const next = { ...prev };
                                    delete next[item.id];
                                    return next;
                                  })
                                }
                              >
                                ✕
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="my-3 h-px bg-white/10" />
                  <div className="text-sm text-white/60">Total HT : {newOfferTotal.toLocaleString("fr-FR")}€</div>
                  <div className="text-sm text-white/60">TVA 20% : {newOfferTva.toLocaleString("fr-FR")}€</div>
                  <div className="text-lg font-black text-[#C8102E] lg:text-2xl">
                    {newOfferTtc.toLocaleString("fr-FR")}€
                  </div>
                </div>
              </div>
              <DialogFooter>
                <button
                  className="rounded-full bg-white/10 px-4 py-2 text-sm"
                  onClick={() => setProspectStep("coordonnees")}
                >
                  ← Retour
                </button>
                <button
                  className="rounded-full px-4 py-2 text-sm text-white"
                  style={{ backgroundColor: "var(--club-primary)" }}
                  onClick={saveProspect}
                >
                  Créer le prospect
                </button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {showDetailModal && selectedProspect && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[90vh] w-full max-w-[95vw] overflow-y-auto rounded-2xl border border-white/10 bg-[#0d1b2e] p-4 lg:max-w-4xl lg:p-6">
            <div className="mb-6 flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-full text-lg font-black text-white"
                  style={{ backgroundColor: sectorColors[selectedProspect.secteur] || "#475569" }}
                >
                  {getInitials(selectedProspect.nom)}
                </div>
                <div>
                  <div className="text-lg font-black text-white lg:text-2xl">{selectedProspect.nom}</div>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-white/10 px-3 py-1 text-white/80">
                      {selectedProspect.secteur}
                    </span>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-white/80">
                      {columns.find((column) => column.id === selectedProspect.columnId)?.label || "—"}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-lg text-white/60 hover:text-white lg:text-2xl"
              >
                ✕
              </button>
            </div>
            <TabsComponent
              prospect={selectedProspect}
              detailTab={detailTab}
              setDetailTab={setDetailTab}
              columns={columns}
              moveCard={moveCard}
              updateProspect={updateProspect}
              partnershipTypes={partnershipTypes}
              setPartnershipTypes={setPartnershipTypes}
              mecenatAmount={mecenatAmount}
              setMecenatAmount={setMecenatAmount}
              sponsorSelections={sponsorSelections}
              setSponsorSelections={setSponsorSelections}
              offerSections={offerSections}
              totalPartnership={totalPartnership}
              paymentMode={paymentMode}
              setPaymentMode={setPaymentMode}
              generateMecenatPdf={generateMecenatPdf}
              handleSendMecenatEmail={handleSendMecenatEmail}
              documents={documents}
              generateSponsoringPdf={generateSponsoringPdf}
              generateCustomOfferPdf={generateCustomOfferPdf}
              handleSendOfferEmail={handleSendOfferEmail}
            />
          </div>
        </div>
      )}
    </ClubLayout>
  );
}
