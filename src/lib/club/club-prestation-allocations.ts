import { flattenClubPrestations } from "@/lib/club/club-prestations";

const STORAGE_KEY = "club_prestation_allocations_v1";
const listeners = new Set<() => void>();

/** Démo : quelques emplacements déjà vendus. */
const SEED: Record<string, number> = {
  "maillot-principal": 1,
  "maillot-manche-droite": 1,
  "stade-3x1": 6,
  "stade-6x1": 4,
  "digital-logo": 3,
  "digital-newsletter": 1,
};

let snapshot: Record<string, number> | null = null;

function emit() {
  listeners.forEach((listener) => listener());
}

function read(): Record<string, number> {
  if (snapshot) return snapshot;
  if (typeof window === "undefined") {
    snapshot = { ...SEED };
    return snapshot;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED));
      snapshot = { ...SEED };
      return snapshot;
    }
    const parsed = JSON.parse(raw) as Record<string, number>;
    snapshot = parsed && typeof parsed === "object" ? parsed : { ...SEED };
    return snapshot;
  } catch {
    snapshot = { ...SEED };
    return snapshot;
  }
}

function write(next: Record<string, number>) {
  snapshot = next;
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  emit();
}

export function subscribePrestationAllocations(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getAllocationSnapshot(): Record<string, number> {
  return read();
}

export function getTakenCount(id: string): number {
  return read()[id] ?? 0;
}

export function remainingSlots(id: string, capacity: number): number {
  return Math.max(0, capacity - getTakenCount(id));
}

export function isFullyTaken(id: string, capacity: number): boolean {
  return remainingSlots(id, capacity) <= 0;
}

export function getAvailabilityStatus(
  id: string,
  capacity: number,
  takenMap: Record<string, number> = getAllocationSnapshot()
) {
  const taken = takenMap[id] ?? 0;
  const remaining = Math.max(0, capacity - taken);
  const fullyTaken = remaining <= 0;
  let label = "Disponible";
  if (fullyTaken) {
    label = "Déjà prise";
  } else if (taken > 0) {
    label = `${taken} / ${capacity} prises`;
  } else if (capacity > 1) {
    label = `${capacity} disponibles`;
  }
  return { taken, remaining, capacity, fullyTaken, label };
}

export function allocatePrestations(ids: string[]) {
  const next = { ...read() };
  const catalog = flattenClubPrestations();
  for (const id of ids) {
    const item = catalog.find((prestation) => prestation.id === id);
    const capacity = item?.quantity ?? 1;
    next[id] = Math.min(capacity, (next[id] ?? 0) + 1);
  }
  write(next);
}
