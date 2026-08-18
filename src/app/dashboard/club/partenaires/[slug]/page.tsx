"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ClubLayout } from "@/components/club/club-layout";
import { ClubGuardGate, useClubGuard } from "@/components/club/use-club-guard";
import { PartnerFormModal, type PartnerFormMode } from "@/components/club/partner-form-modal";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { clubPartners } from "@/lib/mocks/club-partners";
import type { ClubPartner } from "@/lib/mocks/club-partners";
import { cn } from "@/lib/utils";
import { usePartnerOffers } from "@/lib/club/partner-offers-store";
import {
  findClubPartnerLocal,
  subscribeClubPartners,
} from "@/lib/club/club-partners-store";
import { inferPack } from "@/lib/club/club-packs";

const statusStyles: Record<string, string> = {
  "Signé": "bg-emerald-500/20 text-emerald-300",
  "Prospect": "bg-gray-500/20 text-gray-300",
  "En négociation": "bg-yellow-500/20 text-yellow-300",
  "À renouveler": "bg-red-500/20 text-red-300",
};

function formatDate(value?: string) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("fr-FR");
}

export default function ClubPartnerDetailPage() {
  const status = useClubGuard();
  const params = useParams();
  const slug = String(params?.slug ?? "");
  const [partner, setPartner] = useState<ClubPartner | null>(null);
  const [activeTab, setActiveTab] = useState<"fiche" | "offres">("fiche");
  const [formMode, setFormMode] = useState<PartnerFormMode | null>(null);
  const [showMessage, setShowMessage] = useState(false);
  const [showRelance, setShowRelance] = useState(false);
  const [message, setMessage] = useState({ subject: "", body: "" });
  const partnerOffers = usePartnerOffers(partner?.nom);

  useEffect(() => {
    const read = () => {
      const fromStore = findClubPartnerLocal(slug);
      const fromSeed = clubPartners.find((item) => item.slug === slug);
      setPartner(fromStore ?? fromSeed ?? null);
    };
    read();
    const unsubscribe = subscribeClubPartners(read);
    return () => {
      unsubscribe();
    };
  }, [slug]);

  const packLabel = partner?.pack || inferPack(partner?.valeur ?? 0);
  const prestations = partner?.prestations?.length
    ? partner.prestations
    : ["Prestations à définir"];

  const defaultMessage = useMemo(() => {
    if (!partner) return { subject: "", body: "" };
    return {
      subject: `Football Club Rochelais — ${partner.nom}`,
      body: `Bonjour ${partner.contact_prenom || ""},\n\nJe reviens vers vous au sujet de notre partenariat.\n\nCordialement,\nFootball Club Rochelais`,
    };
  }, [partner]);

  const openMessage = () => {
    setMessage(defaultMessage);
    setShowMessage(true);
  };

  const sendMail = (subject: string, body: string) => {
    if (!partner?.contact_email) {
      toast.error("Aucun email de contact renseigné.");
      return;
    }
    window.location.href = `mailto:${partner.contact_email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    toast.success("Ouverture de votre messagerie");
  };

  return (
    <ClubGuardGate status={status}>
      {!partner ? (
      <ClubLayout activeItem="Partenaires">
        <div className="rounded-2xl border border-white/10 bg-[#111] p-4 text-white/70 lg:p-8">
          Partenaire introuvable.
        </div>
      </ClubLayout>
      ) : (
    <ClubLayout activeItem="Partenaires">
      <div className="p-4 lg:p-8 pt-6 lg:pt-8">
        <Link href="/dashboard/club/partenaires" className="text-sm text-white/60 hover:text-white">
          ← Retour
        </Link>

      <div className="mt-6">
        <div className="flex flex-wrap gap-2">
          {[
            { id: "fiche", label: "Fiche partenaire" },
            { id: "offres", label: "Offres" },
          ].map((tab) => (
            <button
              key={tab.id}
              className={cn(
                "rounded-full px-4 py-2 text-sm",
                activeTab === tab.id
                  ? "bg-white/15 text-white"
                  : "bg-white/5 text-white/60 hover:text-white"
              )}
              onClick={() => setActiveTab(tab.id as "fiche" | "offres")}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "fiche" && (
        <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
            <div className="rounded-2xl bg-[#1a1a1a] p-6">
              <div className="flex items-center gap-4">
                <div
                  className="flex h-20 w-20 items-center justify-center rounded-full text-lg font-semibold text-white lg:text-2xl"
                  style={{ backgroundColor: partner.logo_couleur }}
                >
                  {partner.logo_initiales}
                </div>
                <div>
                  <div className="text-xl font-black text-white lg:text-3xl">{partner.nom}</div>
                  <span
                    className="mt-2 inline-flex rounded-full px-3 py-1 text-xs"
                    style={{ backgroundColor: "color-mix(in srgb, var(--club-primary) 20%, transparent)", color: "var(--club-primary)" }}
                  >
                    {partner.secteur}
                  </span>
                  <div className="mt-2 text-sm text-white/60">{partner.adresse}</div>
                </div>
              </div>
              <div className="mt-6 text-sm text-white/60">Prestations proposées</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {prestations.map((item) => (
                  <span key={item} className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/70">
                    {item}
                  </span>
                ))}
              </div>
              <button
                className="mt-4 rounded-full bg-white/10 px-4 py-2 text-sm text-white"
                onClick={() => setFormMode("fiche")}
              >
                Modifier la fiche
              </button>
            </div>

            <div className="rounded-2xl bg-[#1a1a1a] p-6">
              <div className="text-xl font-bold text-white">Contact principal</div>
              <div className="mt-3 text-white">
                {partner.contact_prenom} {partner.contact_nom}
              </div>
              <a href={`mailto:${partner.contact_email}`} className="mt-1 block text-sm text-blue-300">
                {partner.contact_email}
              </a>
              <a href={`tel:${partner.contact_tel}`} className="mt-1 block text-sm text-white/70">
                {partner.contact_tel}
              </a>
              <button
                className="mt-4 rounded-full px-4 py-2 text-sm text-white"
                style={{ backgroundColor: "var(--club-primary)" }}
                onClick={openMessage}
              >
                Envoyer un message
              </button>
            </div>

            <div className="rounded-2xl bg-[#1a1a1a] p-6">
              <div className="text-xl font-bold text-white">Historique</div>
              <div className="mt-4 space-y-3 text-sm text-white/70">
                <div>
                  {partner.date_signature
                    ? `Signé le ${formatDate(partner.date_signature)} — ${partner.valeur.toLocaleString("fr-FR")}€`
                    : `Montant actuel — ${partner.valeur.toLocaleString("fr-FR")}€`}
                </div>
                <div>Renouvellement prévu {partner.renouvellement || "—"}</div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
          <div className="rounded-2xl bg-[#1a1a1a] p-6">
            <div className="text-sm text-white/60">Contrat</div>
            <div className="mt-2 text-2xl font-black lg:text-4xl" style={{ color: "var(--club-primary)" }}>
              {partner.valeur.toLocaleString("fr-FR")}€
            </div>
            <div className="mt-3">
              <span className={cn("rounded-full px-3 py-1 text-xs", statusStyles[partner.statut])}>
                {partner.statut}
              </span>
            </div>
            <div className="mt-3 text-sm text-white/60">Date signature : {formatDate(partner.date_signature)}</div>
            <div className="text-sm text-white/60">Renouvellement : {partner.renouvellement || "—"}</div>
            <div className="text-sm text-white/60">Paiement : {partner.modalite_paiement || "Virement"}</div>
            {partner.statut === "À renouveler" && (
              <button
                className="mt-4 rounded-full bg-red-500/20 px-4 py-2 text-sm text-red-300"
                onClick={() => {
                  setMessage({
                    subject: `Renouvellement partenariat — ${partner.nom}`,
                    body: `Bonjour ${partner.contact_prenom || ""},\n\nVotre partenariat arrive à échéance (${partner.renouvellement}). Souhaitez-vous le renouveler pour la saison à venir ?\n\nCordialement,\nFootball Club Rochelais`,
                  });
                  setShowRelance(true);
                }}
              >
                Envoyer une relance
              </button>
            )}
            <button
              className="mt-3 w-full rounded-full bg-white/10 px-4 py-2 text-sm text-white"
              onClick={() => setFormMode("contract")}
            >
              Modifier le contrat
            </button>
          </div>

          <div className="rounded-2xl bg-[#1a1a1a] p-6">
            <div className="text-lg font-semibold text-white">ROI estimé</div>
            <div className="mt-3 space-y-2 text-sm text-white/70">
              <div>Visibilité : 45 000 impressions/mois</div>
              <div>Deals générés : 3</div>
              <div>Valeur deals : 12 000€</div>
            </div>
          </div>

          <div className="rounded-2xl bg-[#1a1a1a] p-6">
            <div className="text-lg font-semibold text-white">Pack souscrit</div>
            <div className="mt-2 text-sm text-white/70">Pack {packLabel}</div>
            <div className="mt-3 space-y-2 text-sm">
              {prestations.map((item) => (
                <div key={item} className="text-white/70">
                  <span style={{ color: "var(--club-primary)" }}>✓</span> {item}
                </div>
              ))}
            </div>
            <button
              className="mt-4 w-full rounded-full bg-white/10 px-4 py-2 text-sm text-white"
              onClick={() => setFormMode("offer")}
            >
              Modifier l'offre
            </button>
          </div>
          </div>
        </div>
      )}

        {activeTab === "offres" && (
          <div className="mt-6 rounded-2xl bg-[#1a1a1a] p-6">
            <div className="text-xl font-bold text-white">Offres</div>
            {partnerOffers.length === 0 ? (
              <div className="mt-3 text-sm text-white/60">
                Aucune offre sauvegardée pour ce partenaire.
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {partnerOffers.map((offer) => (
                  <div key={offer.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white/5 p-4">
                    <div>
                      <div className="text-white">{offer.name}</div>
                      <div className="text-sm text-white/60">
                        Total HT : {offer.totalHt.toLocaleString("fr-FR")}€ ·{" "}
                        {new Date(offer.createdAt).toLocaleDateString("fr-FR")}
                      </div>
                    </div>
                    <Link
                      href="/dashboard/club/offres"
                      className="rounded-full bg-white/10 px-4 py-2 text-xs text-white"
                    >
                      Voir le catalogue
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <PartnerFormModal
        open={formMode !== null}
        onOpenChange={(open) => {
          if (!open) setFormMode(null);
        }}
        mode={formMode ?? "fiche"}
        partner={partner}
        onSaved={setPartner}
      />

      <Dialog open={showMessage} onOpenChange={setShowMessage}>
        <DialogContent className="bg-[#1A0A0D] text-white sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Envoyer un message</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input value={partner.contact_email} disabled className="border-white/10 bg-white/5 text-white/70" />
            <Input
              value={message.subject}
              onChange={(event) => setMessage((prev) => ({ ...prev, subject: event.target.value }))}
              placeholder="Objet"
              className="border-white/10 bg-white/5 text-white"
            />
            <Textarea
              rows={6}
              value={message.body}
              onChange={(event) => setMessage((prev) => ({ ...prev, body: event.target.value }))}
              className="border-white/10 bg-white/5 text-white"
            />
          </div>
          <DialogFooter>
            <button className="rounded-full bg-white/10 px-4 py-2 text-sm" onClick={() => setShowMessage(false)}>
              Annuler
            </button>
            <button
              className="rounded-full px-4 py-2 text-sm text-white"
              style={{ backgroundColor: "var(--club-primary)" }}
              onClick={() => {
                sendMail(message.subject, message.body);
                setShowMessage(false);
              }}
            >
              Envoyer
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRelance} onOpenChange={setShowRelance}>
        <DialogContent className="bg-[#1A0A0D] text-white sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Relance renouvellement</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-white/60">
            Un e-mail de relance sera préparé vers {partner.contact_email || "le contact"}.
          </p>
          <Textarea
            rows={7}
            value={message.body}
            onChange={(event) => setMessage((prev) => ({ ...prev, body: event.target.value }))}
            className="border-white/10 bg-white/5 text-white"
          />
          <DialogFooter>
            <button className="rounded-full bg-white/10 px-4 py-2 text-sm" onClick={() => setShowRelance(false)}>
              Annuler
            </button>
            <button
              className="rounded-full px-4 py-2 text-sm text-white"
              style={{ backgroundColor: "var(--club-primary)" }}
              onClick={() => {
                sendMail(message.subject, message.body);
                setShowRelance(false);
              }}
            >
              Envoyer la relance
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ClubLayout>
      )}
    </ClubGuardGate>
  );
}
