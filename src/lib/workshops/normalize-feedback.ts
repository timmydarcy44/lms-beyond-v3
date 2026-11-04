const STATUT_REUSSI = new Set(["reussi", "ok", "valide", "atteint", "succes", "success", "passed"]);

function plain(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z_]/g, "");
}

function rowOf(value: unknown) {
  return value && typeof value !== "undefined" && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function statutOf(value: unknown): "reussi" | "a_ameliorer" | null {
  const text = plain(value);
  if (STATUT_REUSSI.has(text)) return "reussi";
  if (text.includes("amelior") || text === "partiel" || text === "incomplete" || text === "fail" || text === "echec") {
    return "a_ameliorer";
  }
  return null;
}

/** Ramène les alias anglais ou accentués vers les clés lues par l'écran. */
export function normalizeWorkshopFeedback(raw: unknown) {
  const row = rowOf(raw);
  if (!row) return raw;
  const list = row.criteres ?? row.criteria ?? row.criteres_reussite;
  const items = Array.isArray(list) ? list : [];
  const criteres = items.flatMap((item) => {
    if (typeof item === "string" && item.trim()) {
      return [{ critere: item.trim(), statut: "a_ameliorer" as const, commentaire: "", suggestion: "" }];
    }
    const obj = rowOf(item);
    if (!obj) return [];
    const statut = statutOf(obj.statut ?? obj.status ?? obj.resultat ?? obj.result);
    const critere = String(obj.critere ?? obj.criterion ?? obj.label ?? obj.nom ?? obj.name ?? "").trim();
    if (!critere || !statut) return [];
    return [
      {
        critere,
        statut,
        commentaire: String(obj.commentaire ?? obj.comment ?? obj.feedback ?? "").trim(),
        suggestion: String(obj.suggestion ?? obj.conseil ?? obj.advice ?? "").trim(),
      },
    ];
  });
  const global = String(row.commentaire_global ?? row.commentaireGlobal ?? row.global_comment ?? row.summary ?? "")
    .trim()
    .slice(0, 600);
  return { criteres, commentaire_global: global };
}
