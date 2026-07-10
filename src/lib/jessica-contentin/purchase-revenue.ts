/** Montant CA affiché pour une ligne d'achat Jessica (cabinet ou en ligne). */
export function resolveJessicaPurchaseAmount(params: {
  accessStatus?: string | null;
  purchaseAmount?: number | string | null;
  catalogPrice?: number | string | null;
}): number {
  const manual = params.purchaseAmount;
  if (manual != null && manual !== "" && !Number.isNaN(Number(manual))) {
    return Math.max(0, Number(manual));
  }
  if (params.accessStatus === "purchased") {
    const p = Number(params.catalogPrice ?? 0);
    return Number.isFinite(p) ? Math.max(0, p) : 0;
  }
  return 0;
}

export function sumJessicaPurchaseAmounts(
  items: Array<{
    accessStatus?: string | null;
    purchaseAmount?: number | string | null;
    catalogPrice?: number | string | null;
    price?: number;
  }>,
): number {
  return items.reduce((sum, item) => {
    if (typeof item.price === "number" && Number.isFinite(item.price)) {
      return sum + item.price;
    }
    return (
      sum +
      resolveJessicaPurchaseAmount({
        accessStatus: item.accessStatus,
        purchaseAmount: item.purchaseAmount,
        catalogPrice: item.catalogPrice,
      })
    );
  }, 0);
}
