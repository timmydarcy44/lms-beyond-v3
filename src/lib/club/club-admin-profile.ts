export type ClubContractType = "sponsoring" | "mecenat";

export type ClubAdminProfile = {
  associationName: string;
  usageName: string;
  rna: string;
  siret: string;
  address: string;
  postalCode: string;
  city: string;
  phone: string;
  email: string;
  website: string;
  legalRepTitle: string;
  legalRepName: string;
  contractType: ClubContractType;
  vatLiable: boolean;
  vatNumber: string;
  vatRate: number;
  iban: string;
  bic: string;
  bank: string;
};

const STORAGE_KEY = "club_admin_profile_v1";
const listeners = new Set<() => void>();

export const DEFAULT_CLUB_ADMIN_PROFILE: ClubAdminProfile = {
  associationName: "Association Football Club Rochelais",
  usageName: "Football Club Rochelais",
  rna: "",
  siret: "",
  address: "",
  postalCode: "17000",
  city: "La Rochelle",
  phone: "",
  email: "",
  website: "",
  legalRepTitle: "Président",
  legalRepName: "",
  contractType: "sponsoring",
  vatLiable: true,
  vatNumber: "",
  vatRate: 20,
  iban: "",
  bic: "",
  bank: "",
};

let snapshot: ClubAdminProfile | null = null;

function emit() {
  listeners.forEach((listener) => listener());
}

function normalize(raw: Partial<ClubAdminProfile> | null | undefined): ClubAdminProfile {
  return {
    ...DEFAULT_CLUB_ADMIN_PROFILE,
    ...(raw ?? {}),
    vatLiable: raw?.vatLiable ?? DEFAULT_CLUB_ADMIN_PROFILE.vatLiable,
    vatRate: Number(raw?.vatRate) > 0 ? Number(raw?.vatRate) : 20,
    contractType: raw?.contractType === "mecenat" ? "mecenat" : "sponsoring",
  };
}

function read(): ClubAdminProfile {
  if (snapshot) return snapshot;
  if (typeof window === "undefined") {
    snapshot = DEFAULT_CLUB_ADMIN_PROFILE;
    return snapshot;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    snapshot = raw ? normalize(JSON.parse(raw) as Partial<ClubAdminProfile>) : DEFAULT_CLUB_ADMIN_PROFILE;
    return snapshot;
  } catch {
    snapshot = DEFAULT_CLUB_ADMIN_PROFILE;
    return snapshot;
  }
}

export function subscribeClubAdminProfile(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getClubAdminProfile(): ClubAdminProfile {
  return read();
}

export function saveClubAdminProfile(next: ClubAdminProfile) {
  snapshot = normalize(next);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  }
  emit();
}

export function contractTypeLabel(type: ClubContractType) {
  return type === "mecenat" ? "Mécénat" : "Sponsoring";
}
