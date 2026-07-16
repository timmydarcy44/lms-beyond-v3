export const JESSICA_INVOICE_SECTION_TITLE_DEFAULT = "Consultation psychopédagogique";

export const JESSICA_PRESTATION_OPTIONS = [
  { value: "consultation", label: "Consultation", defaultPrice: 90 },
  { value: "test_mai", label: "Test MAI", defaultPrice: 120 },
  { value: "test_stress", label: "Test de stress", defaultPrice: 80 },
  { value: "formation", label: "Formation", defaultPrice: 0 },
  { value: "autre", label: "Autres", defaultPrice: 0 },
] as const;

export type JessicaPrestationType = (typeof JESSICA_PRESTATION_OPTIONS)[number]["value"];

export type JessicaInvoiceLineItem = {
  prestation_type: JessicaPrestationType;
  designation: string;
  quantity: number;
  unit_price_cents: number;
  service_date: string;
  formation_id?: string | null;
  custom_label?: string | null;
};

export function prestationLabel(type: JessicaPrestationType): string {
  return JESSICA_PRESTATION_OPTIONS.find((p) => p.value === type)?.label ?? type;
}

export function defaultPriceForPrestation(type: JessicaPrestationType): number {
  return JESSICA_PRESTATION_OPTIONS.find((p) => p.value === type)?.defaultPrice ?? 0;
}

export function lineItemTotalCents(line: JessicaInvoiceLineItem): number {
  return Math.round(line.quantity * line.unit_price_cents);
}

export function linesTotalCents(lines: JessicaInvoiceLineItem[]): number {
  return lines.reduce((sum, l) => sum + lineItemTotalCents(l), 0);
}

export function emptyInvoiceLine(today = new Date().toISOString().slice(0, 10)): JessicaInvoiceLineItem {
  return {
    prestation_type: "consultation",
    designation: "Consultation",
    quantity: 1,
    unit_price_cents: 9000,
    service_date: today,
  };
}
