/** Palette officielle EDGE — design system premium */

export const EDGE_COLORS = {
  navy: "#0A1628",
  navyMid: "#0D1F3C",
  navyLight: "#152A4A",
  purple: "#635BFF",
  purpleLight: "#7B74FF",
  indigo: "#3B5BDB",
  gold: "#C9A227",
  green: "#10B981",
  orange: "#F59E0B",
  red: "#EF4444",
  black: "#050505",
  cream: "#F7F7F5",
  white: "#FFFFFF",
} as const;

export const EDGE_STATUS_COLORS = {
  pending: { bg: "#F1F5F9", text: "#475569", border: "#E2E8F0" },
  approved: { bg: "#ECFDF5", text: "#047857", border: "#A7F3D0" },
  rejected: { bg: "#FEF2F2", text: "#B91C1C", border: "#FECACA" },
  needs_info: { bg: "#FFFBEB", text: "#B45309", border: "#FDE68A" },
  certified: { bg: "#EEF2FF", text: "#4338CA", border: "#C7D2FE" },
  active: { bg: "#ECFDF5", text: "#047857", border: "#A7F3D0" },
  inactive: { bg: "#F1F5F9", text: "#64748B", border: "#E2E8F0" },
} as const;

export type EdgeStatusKey = keyof typeof EDGE_STATUS_COLORS;

/** Classes Tailwind pour badges / chips de statut */
export const EDGE_STATUS_CLASSES: Record<EdgeStatusKey, string> = {
  pending: "bg-slate-100 text-slate-600 border-slate-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
  needs_info: "bg-amber-50 text-amber-800 border-amber-200",
  certified: "bg-indigo-50 text-indigo-700 border-indigo-200",
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  inactive: "bg-slate-100 text-slate-500 border-slate-200",
};

export const EDGE_CHIP_CLASSES = {
  default: "rounded-lg border border-slate-200/80 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm",
  purple: "rounded-lg border border-[#635BFF]/20 bg-[#635BFF]/8 px-3 py-1.5 text-xs font-semibold text-[#635BFF]",
  navy: "rounded-lg border border-[#0A1628]/10 bg-[#0A1628]/5 px-3 py-1.5 text-xs font-medium text-[#0A1628]",
  gold: "rounded-lg border border-[#C9A227]/25 bg-[#C9A227]/10 px-3 py-1.5 text-xs font-semibold text-[#92710C]",
} as const;
