export const BTOB_SECTOR_OPTIONS = [
  { value: "agroalimentaire", label: "Agroalimentaire" },
  { value: "industrie", label: "Industrie" },
  { value: "aeronautique", label: "Aéronautique" },
  { value: "btp", label: "BTP" },
  { value: "logistique", label: "Logistique" },
  { value: "pharmacie", label: "Pharmacie" },
  { value: "retail", label: "Retail" },
  { value: "services", label: "Services" },
  { value: "autre", label: "Autre" },
] as const;

export const BTOB_EMPLOYEE_COUNT_OPTIONS = [
  { value: "50-200", label: "50–200" },
  { value: "200-500", label: "200–500" },
  { value: "500-1000", label: "500–1000" },
  { value: "1000+", label: "1000+" },
] as const;

export const BTOB_PRIORITY_OPTIONS = [
  { value: "haute", label: "Haute" },
  { value: "moyenne", label: "Moyenne" },
  { value: "standard", label: "Standard" },
] as const;

export const BTOB_APPROACH_CHANNEL_OPTIONS = [
  { value: "linkedin", label: "LinkedIn" },
  { value: "telephone", label: "Téléphone" },
  { value: "reseau", label: "Réseau" },
  { value: "evenement", label: "Événement" },
  { value: "inbound", label: "Inbound" },
] as const;

export const BTOB_BUDGET_OPTIONS = [
  { value: "5 000-10 000 €", label: "5 000–10 000 €" },
  { value: "10 000-30 000 €", label: "10 000–30 000 €" },
  { value: "30 000+ €", label: "30 000+ €" },
  { value: "NC", label: "NC" },
] as const;

export function priorityBadgeClass(priority: string | null | undefined): string {
  switch (priority) {
    case "haute":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "moyenne":
      return "bg-amber-100 text-amber-900 border-amber-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

export function sectorBadgeClass(sector: string | null | undefined): string {
  if (!sector) return "bg-slate-100 text-slate-600";
  const map: Record<string, string> = {
    agroalimentaire: "bg-lime-100 text-lime-900",
    industrie: "bg-blue-100 text-blue-900",
    aeronautique: "bg-indigo-100 text-indigo-900",
    btp: "bg-orange-100 text-orange-900",
    logistique: "bg-cyan-100 text-cyan-900",
    pharmacie: "bg-violet-100 text-violet-900",
    retail: "bg-pink-100 text-pink-900",
    services: "bg-teal-100 text-teal-900",
  };
  return map[sector] ?? "bg-slate-100 text-slate-700";
}

export function isNextActionOverdue(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false;
  const d = new Date(`${dateStr}T12:00:00`);
  if (Number.isNaN(d.getTime())) return false;
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  return d < today;
}
