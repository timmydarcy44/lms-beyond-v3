export type JessicaInvoiceRevenueMonth = {
  key: string;
  label: string;
  totalCents: number;
  count: number;
};

/** Agrège le CA facturé par mois (invoice_date). */
export function buildJessicaInvoiceMonthlyRevenue(
  invoices: Array<{ amount_cents: number; invoice_date: string }>,
): JessicaInvoiceRevenueMonth[] {
  const map = new Map<string, { totalCents: number; count: number }>();

  for (const inv of invoices) {
    const date = inv.invoice_date?.slice(0, 7);
    if (!date || !/^\d{4}-\d{2}$/.test(date)) continue;
    const prev = map.get(date) ?? { totalCents: 0, count: 0 };
    prev.totalCents += inv.amount_cents || 0;
    prev.count += 1;
    map.set(date, prev);
  }

  return [...map.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, value]) => {
      const [year, month] = key.split("-");
      const label = new Date(Number(year), Number(month) - 1, 1).toLocaleDateString("fr-FR", {
        month: "long",
        year: "numeric",
      });
      return {
        key,
        label: label.charAt(0).toUpperCase() + label.slice(1),
        totalCents: value.totalCents,
        count: value.count,
      };
    });
}
