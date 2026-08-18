import { clubPartners, type ClubPartner } from "@/lib/mocks/club-partners";
import { inferPack } from "@/lib/club/club-packs";

const STORAGE_KEY = "club_partners_demo_v1";
const listeners = new Set<() => void>();

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

function initialsFromName(nom: string) {
  const parts = nom.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "PR";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function emit() {
  listeners.forEach((listener) => listener());
}

function seedPartners(): ClubPartner[] {
  return clubPartners.map((partner) => ({
    ...partner,
    id: partner.id ?? partner.slug,
    pack: partner.pack ?? inferPack(partner.valeur),
    date_signature: partner.date_signature ?? (partner.statut === "Signé" ? "2025-01-15" : ""),
    modalite_paiement: partner.modalite_paiement ?? "Virement",
  }));
}

function readStored(): ClubPartner[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ClubPartner[];
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function writeStored(partners: ClubPartner[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(partners));
}

let cache: ClubPartner[] | null = null;

export function getClubPartnersLocal(): ClubPartner[] {
  if (cache) return cache;
  cache = readStored() ?? seedPartners();
  return cache;
}

export function subscribeClubPartners(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function setClubPartnersLocal(partners: ClubPartner[]) {
  cache = partners;
  writeStored(partners);
  emit();
}

export function findClubPartnerLocal(slugOrId: string): ClubPartner | undefined {
  const partners = getClubPartnersLocal();
  return partners.find((partner) => partner.slug === slugOrId || partner.id === slugOrId);
}

export function upsertClubPartnerLocal(input: Partial<ClubPartner> & { nom: string }): ClubPartner {
  const partners = getClubPartnersLocal();
  const slug = input.slug?.trim() || slugify(input.nom) || `partenaire-${Date.now()}`;
  const existing = partners.find((partner) => partner.slug === slug || (input.id && partner.id === input.id));
  const next: ClubPartner = {
    id: existing?.id ?? input.id ?? slug,
    slug,
    nom: input.nom.trim(),
    secteur: input.secteur?.trim() || existing?.secteur || "Autre",
    valeur: Number(input.valeur ?? existing?.valeur ?? 0),
    statut: input.statut ?? existing?.statut ?? "Prospect",
    renouvellement: input.renouvellement ?? existing?.renouvellement ?? "—",
    date_signature: input.date_signature ?? existing?.date_signature ?? "",
    modalite_paiement: input.modalite_paiement ?? existing?.modalite_paiement ?? "Virement",
    pack: input.pack ?? existing?.pack ?? inferPack(Number(input.valeur ?? existing?.valeur ?? 0)),
    contact_prenom: input.contact_prenom ?? existing?.contact_prenom ?? "",
    contact_nom: input.contact_nom ?? existing?.contact_nom ?? "",
    contact_email: input.contact_email ?? existing?.contact_email ?? "",
    contact_tel: input.contact_tel ?? existing?.contact_tel ?? "",
    adresse: input.adresse ?? existing?.adresse ?? "",
    prestations: input.prestations ?? existing?.prestations ?? [],
    logo_initiales: input.logo_initiales ?? existing?.logo_initiales ?? initialsFromName(input.nom),
    logo_couleur: input.logo_couleur ?? existing?.logo_couleur ?? "#8B1A2B",
    colonne_tunnel: input.colonne_tunnel ?? existing?.colonne_tunnel,
  };

  const updated = existing
    ? partners.map((partner) => (partner.slug === existing.slug ? next : partner))
    : [next, ...partners];
  setClubPartnersLocal(updated);
  return next;
}
