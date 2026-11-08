/** Résolution des montants catalogue (training_courses) pour devis / demandes. */

/** Prix catalogue training_courses / libellés « 2 490 € » → centimes. */
export function parseEuroLabelToCents(raw: string | number | null | undefined): number | null {
  if (raw == null) return null;
  if (typeof raw === "number") {
    if (!Number.isFinite(raw) || raw <= 0) return null;
    return Math.round(raw * 100);
  }
  const cleaned = String(raw)
    .replace(/\u00a0/g, " ")
    .replace(/[^\d,.\s]/g, "")
    .trim();
  if (!cleaned) return null;
  const normalized = cleaned.replace(/\s/g, "").replace(",", ".");
  const euros = Number(normalized);
  if (!Number.isFinite(euros) || euros <= 0) return null;
  return Math.round(euros * 100);
}

export function amountsFromHtCents(htCents: number | null | undefined): {
  ht: number;
  tva: number;
  ttc: number;
} | null {
  if (htCents == null || !Number.isFinite(htCents) || htCents <= 0) return null;
  const ht = Math.round(htCents);
  const tva = Math.round(ht * 0.2);
  return { ht, tva, ttc: ht + tva };
}

/**
 * Montant HT devis pour une demande entreprise.
 * Intra = forfait session ; inter = prix × participants.
 */
export function quoteHtCentsFromCatalog(opts: {
  intraPrice?: number | null;
  interPrice?: number | null;
  startingPriceLabel?: string | null;
  modality?: "intra" | "inter" | null;
  participants?: number | null;
}): number | null {
  const modality = opts.modality ?? "intra";
  const qty = Math.max(1, Math.round(opts.participants ?? 1) || 1);
  const intra = parseEuroLabelToCents(opts.intraPrice ?? null);
  const inter = parseEuroLabelToCents(opts.interPrice ?? null);
  const fallback = parseEuroLabelToCents(opts.startingPriceLabel ?? null);

  if (modality === "inter") {
    const unit = inter ?? intra ?? fallback;
    return unit != null ? unit * qty : null;
  }
  // Intra / forfait — ne pas multiplier par le nombre de participants
  return intra ?? fallback ?? (inter != null ? inter * qty : null);
}

export function unitCentsFromTrainingCourse(course: {
  intra_price?: number | null;
  inter_price?: number | null;
}): number | null {
  return (
    parseEuroLabelToCents(course.intra_price ?? null) ??
    parseEuroLabelToCents(course.inter_price ?? null)
  );
}
