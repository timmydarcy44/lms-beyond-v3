import type { SupabaseClient } from "@supabase/supabase-js";
import {
  BPF_FUNDER_TYPES,
  BPF_LEARNER_STATUSES,
  type BpfFunderType,
  type BpfLearnerStatus,
} from "@/lib/formation-dossier/constants";
import {
  BPF_CHARGE_LABELS,
  BPF_FUNDER_LABELS,
  BPF_LEARNER_LABELS,
  BPF_OBJECTIVE_LABELS,
} from "@/lib/formation-bpf/labels";

export type BpfAnomaly = {
  code: string;
  message: string;
  dossier_id?: string;
  href?: string;
};

export type BpfLine = {
  key: string;
  label: string;
  value: number;
  unit: "eur_ht" | "count" | "hours";
  sources: Array<{ id: string; label: string; href?: string; amount?: number }>;
};

export type BpfDraft = {
  period: { start: string; end: string };
  cadre_a: Record<string, string | null>;
  cadre_b: Record<string, string | null>;
  cadre_c: BpfLine[];
  cadre_d: BpfLine[];
  cadre_e: BpfLine[];
  cadre_f1: BpfLine[];
  cadre_f2: BpfLine[];
  cadre_f3: BpfLine[];
  cadre_f4: BpfLine[];
  cadre_g: BpfLine[];
  totals: {
    products_ht_cents: number;
    invoices_ht_cents: number;
    learner_hours: number;
    signature_hours: number;
  };
  anomalies: BpfAnomaly[];
};

function emptyFunderMap(): Record<BpfFunderType, number> {
  return Object.fromEntries(BPF_FUNDER_TYPES.map((k) => [k, 0])) as Record<BpfFunderType, number>;
}

function emptyLearnerMap(): Record<BpfLearnerStatus, { count: number; hours: number }> {
  return Object.fromEntries(
    BPF_LEARNER_STATUSES.map((k) => [k, { count: 0, hours: 0 }]),
  ) as Record<BpfLearnerStatus, { count: number; hours: number }>;
}

function halfDayHours(): number {
  return 3.5; // convention pédagogique courante
}

function inPeriod(iso: string | null | undefined, start: string, end: string): boolean {
  if (!iso) return false;
  const d = iso.slice(0, 10);
  return d >= start && d <= end;
}

export async function computeBpfDraft(
  service: SupabaseClient,
  period?: { start?: string; end?: string },
): Promise<BpfDraft> {
  const { data: ofRow } = await service.from("of_settings").select("*").limit(1).maybeSingle();

  const start =
    period?.start ||
    (ofRow?.fiscal_year_start ? String(ofRow.fiscal_year_start).slice(0, 10) : null) ||
    `${new Date().getFullYear() - 1}-01-01`;
  const end =
    period?.end ||
    (ofRow?.fiscal_year_end ? String(ofRow.fiscal_year_end).slice(0, 10) : null) ||
    `${new Date().getFullYear() - 1}-12-31`;

  const anomalies: BpfAnomaly[] = [];

  const cadre_a = {
    legal_name: ofRow?.legal_name ? String(ofRow.legal_name) : null,
    nda: ofRow?.nda ? String(ofRow.nda) : null,
    siret: ofRow?.siret ? String(ofRow.siret) : null,
    siren: ofRow?.siren ? String(ofRow.siren) : null,
    address: [ofRow?.address_line, ofRow?.address_zip, ofRow?.address_city]
      .filter(Boolean)
      .join(", ") || null,
  };
  const cadre_b = {
    vat_intra: ofRow?.vat_intra ? String(ofRow.vat_intra) : null,
    fiscal_year_start: start,
    fiscal_year_end: end,
  };
  if (!cadre_a.legal_name || !cadre_a.nda || !cadre_a.siret) {
    anomalies.push({
      code: "of_identity_incomplete",
      message: "Paramètres OF incomplets (raison sociale, NDA ou SIRET).",
      href: "/super/parametres",
    });
  }

  // --- Factures formation de l'exercice ---
  const { data: invoices } = await service
    .from("org_billing_documents")
    .select(
      "id, number, amount_ht_cents, bpf_funder_type, formation_dossier_id, issued_at, sale_type, status, org_id",
    )
    .eq("doc_type", "invoice")
    .eq("sale_type", "formation")
    .in("status", ["issued", "paid", "overdue"])
    .gte("issued_at", `${start}T00:00:00`)
    .lte("issued_at", `${end}T23:59:59`);

  const funderProducts = emptyFunderMap();
  const invoiceSources: Record<BpfFunderType, BpfLine["sources"]> = Object.fromEntries(
    BPF_FUNDER_TYPES.map((k) => [k, [] as BpfLine["sources"]]),
  ) as Record<BpfFunderType, BpfLine["sources"]>;

  let invoicesHt = 0;
  for (const inv of invoices ?? []) {
    const ht = Number(inv.amount_ht_cents ?? 0);
    invoicesHt += ht;
    const funder = (BPF_FUNDER_TYPES.includes(String(inv.bpf_funder_type) as BpfFunderType)
      ? String(inv.bpf_funder_type)
      : "autres_produits") as BpfFunderType;
    funderProducts[funder] += ht;
    invoiceSources[funder].push({
      id: String(inv.id),
      label: inv.number ? `Facture ${inv.number}` : `Facture ${String(inv.id).slice(0, 8)}`,
      amount: ht,
      href: inv.formation_dossier_id
        ? `/super/crm/programmation?dossier=${inv.formation_dossier_id}`
        : undefined,
    });
  }

  const cadre_c: BpfLine[] = BPF_FUNDER_TYPES.map((key) => ({
    key,
    label: BPF_FUNDER_LABELS[key],
    value: funderProducts[key],
    unit: "eur_ht" as const,
    sources: invoiceSources[key],
  }));

  // --- Charges (Cadre D) ---
  const { data: charges } = await service
    .from("bpf_charge_entries")
    .select("*")
    .eq("fiscal_year_start", start)
    .eq("fiscal_year_end", end);

  const chargeMap = {
    total_charges: 0,
    salaires_formateurs: 0,
    achats_prestations_formation: 0,
  };
  for (const c of charges ?? []) {
    const kind = String(c.kind) as keyof typeof chargeMap;
    if (kind in chargeMap) chargeMap[kind] += Number(c.amount_ht_cents ?? 0);
  }
  const cadre_d: BpfLine[] = (
    Object.keys(BPF_CHARGE_LABELS) as Array<keyof typeof BPF_CHARGE_LABELS>
  ).map((key) => ({
    key,
    label: BPF_CHARGE_LABELS[key],
    value: chargeMap[key],
    unit: "eur_ht" as const,
    sources: (charges ?? [])
      .filter((c) => c.kind === key)
      .map((c) => ({
        id: String(c.id),
        label: c.label || BPF_CHARGE_LABELS[key],
        amount: Number(c.amount_ht_cents ?? 0),
      })),
  }));

  // --- Dossiers clôturés / fin sur la période ---
  const { data: dossiers } = await service
    .from("formation_dossiers")
    .select(
      "id, course_title, status, bpf_funder_type, subcontracting, partner_of_name, amount_ht_cents, training_course_id, session_id, organization_id, invoice_validated_at, updated_at, created_at",
    )
    .in("status", ["fin", "cloture", "session"]);

  const dossierIds = (dossiers ?? []).map((d) => String(d.id));
  const sessionIds = Array.from(
    new Set((dossiers ?? []).map((d) => d.session_id).filter(Boolean).map(String)),
  );

  const { data: slots } = sessionIds.length
    ? await service
        .from("formation_slots")
        .select("id, session_id, slot_date")
        .in("session_id", sessionIds)
    : { data: [] as Array<{ id: string; session_id: string; slot_date: string }> };

  const slotsInPeriod = (slots ?? []).filter((s) => inPeriod(String(s.slot_date), start, end));
  const slotIds = slotsInPeriod.map((s) => String(s.id));

  const { data: closures } = slotIds.length
    ? await service.from("attendance_closures").select("slot_id").in("slot_id", slotIds)
    : { data: [] as Array<{ slot_id: string }> };
  const closedSlots = new Set((closures ?? []).map((c) => String(c.slot_id)));

  const { data: signatures } = slotIds.length
    ? await service
        .from("attendance_signatures")
        .select("slot_id, profile_id, status")
        .in("slot_id", slotIds)
        .in("status", ["ok", "a_verifier"])
    : { data: [] as Array<{ slot_id: string; profile_id: string; status: string }> };

  const { data: participants } = dossierIds.length
    ? await service
        .from("formation_participants")
        .select("id, dossier_id, profile_id, bpf_learner_status")
        .in("dossier_id", dossierIds)
    : { data: [] as Array<Record<string, unknown>> };

  const courseIds = Array.from(
    new Set((dossiers ?? []).map((d) => d.training_course_id).filter(Boolean).map(String)),
  );
  const { data: courses } = courseIds.length
    ? await service
        .from("training_courses")
        .select("id, bpf_objective, nsf_code, nsf_label, title")
        .in("id", courseIds)
    : { data: [] as Array<Record<string, unknown>> };
  const courseById = new Map((courses ?? []).map((c) => [String(c.id), c]));

  // Cadre E — formateurs (internes = trainer_user_id staff)
  const { data: trainers } = await service
    .from("formation_dossiers")
    .select("id, trainer_user_id, session_id")
    .not("trainer_user_id", "is", null);

  const trainerIds = Array.from(
    new Set((trainers ?? []).map((t) => String(t.trainer_user_id)).filter(Boolean)),
  );
  const trainerHours = new Map<string, number>();
  for (const t of trainers ?? []) {
    const sid = t.session_id ? String(t.session_id) : null;
    if (!sid) continue;
    const n = slotsInPeriod.filter((s) => String(s.session_id) === sid).length;
    const tid = String(t.trainer_user_id);
    trainerHours.set(tid, (trainerHours.get(tid) ?? 0) + n * halfDayHours());
  }

  const cadre_e: BpfLine[] = [
    {
      key: "formateurs_internes_count",
      label: "Nombre de formateurs internes",
      value: trainerIds.length,
      unit: "count",
      sources: trainerIds.map((id) => ({
        id,
        label: `Formateur ${id.slice(0, 8)}`,
        amount: trainerHours.get(id) ?? 0,
      })),
    },
    {
      key: "formateurs_internes_heures",
      label: "Heures de face-à-face (formateurs internes)",
      value: Array.from(trainerHours.values()).reduce((a, b) => a + b, 0),
      unit: "hours",
      sources: [],
    },
    {
      key: "formateurs_externes_count",
      label: "Nombre de formateurs externes",
      value: 0,
      unit: "count",
      sources: [],
    },
    {
      key: "formateurs_externes_heures",
      label: "Heures de face-à-face (formateurs externes)",
      value: 0,
      unit: "hours",
      sources: [],
    },
  ];

  // Cadre F / G
  const f1 = emptyLearnerMap();
  const f1Sources: Record<string, BpfLine["sources"]> = {};
  const f3 = new Map<string, { count: number; hours: number; sources: BpfLine["sources"] }>();
  const f4 = new Map<string, { count: number; hours: number; label: string; sources: BpfLine["sources"] }>();
  let f2Hours = 0;
  let f2Count = 0;
  const f2Sources: BpfLine["sources"] = [];
  let gCount = 0;
  let gHours = 0;
  const gSources: BpfLine["sources"] = [];

  let signatureHours = 0;
  const sigByProfile = new Map<string, Set<string>>();
  for (const s of signatures ?? []) {
    if (!closedSlots.has(String(s.slot_id))) continue;
    const pid = String(s.profile_id);
    const set = sigByProfile.get(pid) ?? new Set();
    set.add(String(s.slot_id));
    sigByProfile.set(pid, set);
  }
  for (const set of sigByProfile.values()) {
    signatureHours += set.size * halfDayHours();
  }

  const dossiersInScope = (dossiers ?? []).filter((d) => {
    // Inclure si au moins un slot de la session dans la période, ou facture liée, ou updated dans période
    const sid = d.session_id ? String(d.session_id) : null;
    if (sid && slotsInPeriod.some((s) => String(s.session_id) === sid)) return true;
    if ((invoices ?? []).some((i) => String(i.formation_dossier_id) === String(d.id))) return true;
    return inPeriod(String(d.updated_at ?? d.created_at), start, end);
  });

  for (const d of dossiersInScope) {
    const dossierId = String(d.id);
    const href = `/super/crm/programmation?dossier=${dossierId}`;
    const title = d.course_title || "Dossier formation";
    const parts = (participants ?? []).filter((p) => String(p.dossier_id) === dossierId);

    if (!d.bpf_funder_type) {
      anomalies.push({
        code: "missing_funder",
        message: `Financeur BPF manquant — ${title}`,
        dossier_id: dossierId,
        href,
      });
    }

    const course = d.training_course_id ? courseById.get(String(d.training_course_id)) : null;
    if (!course?.bpf_objective) {
      anomalies.push({
        code: "missing_objective",
        message: `Objectif BPF catalogue manquant — ${title}`,
        dossier_id: dossierId,
        href,
      });
    }
    if (!course?.nsf_code) {
      anomalies.push({
        code: "missing_nsf",
        message: `Spécialité NSF manquante — ${title}`,
        dossier_id: dossierId,
        href,
      });
    }

    const sid = d.session_id ? String(d.session_id) : null;
    const dossierSlots = sid
      ? slotsInPeriod.filter((s) => String(s.session_id) === sid)
      : [];
    for (const slot of dossierSlots) {
      if (!closedSlots.has(String(slot.id))) {
        anomalies.push({
          code: "slot_not_closed",
          message: `Émargement non clôturé (${slot.slot_date}) — ${title}`,
          dossier_id: dossierId,
          href,
        });
      }
    }

    for (const p of parts) {
      const status = String(p.bpf_learner_status || "") as BpfLearnerStatus;
      if (!BPF_LEARNER_STATUSES.includes(status)) {
        anomalies.push({
          code: "missing_learner_status",
          message: `Statut BPF apprenant manquant — ${title}`,
          dossier_id: dossierId,
          href,
        });
      }
      const hours =
        (sigByProfile.get(String(p.profile_id))?.size ?? 0) * halfDayHours();

      const isRecue = d.subcontracting === "recue";
      if (isRecue) {
        gCount += 1;
        gHours += hours;
        gSources.push({ id: dossierId, label: `${title} · participant`, href, amount: hours });
        continue;
      }

      if (BPF_LEARNER_STATUSES.includes(status)) {
        f1[status].count += 1;
        f1[status].hours += hours;
        const list = f1Sources[status] ?? [];
        list.push({ id: dossierId, label: title, href, amount: hours });
        f1Sources[status] = list;
      }

      if (d.subcontracting === "confiee") {
        f2Count += 1;
        f2Hours += hours;
        f2Sources.push({
          id: dossierId,
          label: `${title}${d.partner_of_name ? ` → ${d.partner_of_name}` : ""}`,
          href,
          amount: hours,
        });
      }

      const obj = String(course?.bpf_objective || "autre");
      const objRow = f3.get(obj) ?? { count: 0, hours: 0, sources: [] };
      objRow.count += 1;
      objRow.hours += hours;
      objRow.sources.push({ id: dossierId, label: title, href, amount: hours });
      f3.set(obj, objRow);

      const nsf = String(course?.nsf_code || "sans_nsf");
      const nsfRow = f4.get(nsf) ?? {
        count: 0,
        hours: 0,
        label: course?.nsf_label ? `${nsf} — ${course.nsf_label}` : nsf,
        sources: [],
      };
      nsfRow.count += 1;
      nsfRow.hours += hours;
      nsfRow.sources.push({ id: dossierId, label: title, href, amount: hours });
      f4.set(nsf, nsfRow);
    }
  }

  const cadre_f1: BpfLine[] = BPF_LEARNER_STATUSES.flatMap((key) => [
    {
      key: `${key}_count`,
      label: `${BPF_LEARNER_LABELS[key]} — nombre`,
      value: f1[key].count,
      unit: "count" as const,
      sources: f1Sources[key] ?? [],
    },
    {
      key: `${key}_hours`,
      label: `${BPF_LEARNER_LABELS[key]} — heures-stagiaires`,
      value: f1[key].hours,
      unit: "hours" as const,
      sources: f1Sources[key] ?? [],
    },
  ]);

  const cadre_f2: BpfLine[] = [
    {
      key: "confiee_count",
      label: "Stagiaires dont la formation a été confiée à un autre OF — nombre",
      value: f2Count,
      unit: "count",
      sources: f2Sources,
    },
    {
      key: "confiee_hours",
      label: "Heures-stagiaires confiées à un autre OF",
      value: f2Hours,
      unit: "hours",
      sources: f2Sources,
    },
  ];

  const cadre_f3: BpfLine[] = Array.from(f3.entries()).flatMap(([key, row]) => [
    {
      key: `${key}_count`,
      label: `${BPF_OBJECTIVE_LABELS[key] || key} — nombre`,
      value: row.count,
      unit: "count" as const,
      sources: row.sources,
    },
    {
      key: `${key}_hours`,
      label: `${BPF_OBJECTIVE_LABELS[key] || key} — heures-stagiaires`,
      value: row.hours,
      unit: "hours" as const,
      sources: row.sources,
    },
  ]);

  const cadre_f4: BpfLine[] = Array.from(f4.entries())
    .sort((a, b) => b[1].hours - a[1].hours)
    .slice(0, 10)
    .flatMap(([key, row]) => [
      {
        key: `${key}_count`,
        label: `${row.label} — nombre`,
        value: row.count,
        unit: "count" as const,
        sources: row.sources,
      },
      {
        key: `${key}_hours`,
        label: `${row.label} — heures-stagiaires`,
        value: row.hours,
        unit: "hours" as const,
        sources: row.sources,
      },
    ]);

  const cadre_g: BpfLine[] = [
    {
      key: "g_count",
      label: "Stagiaires formés pour le compte d'un autre OF — nombre",
      value: gCount,
      unit: "count",
      sources: gSources,
    },
    {
      key: "g_hours",
      label: "Heures-stagiaires (cadre G)",
      value: gHours,
      unit: "hours",
      sources: gSources,
    },
  ];

  const productsHt = Object.values(funderProducts).reduce((a, b) => a + b, 0);
  const learnerHours =
    Object.values(f1).reduce((a, b) => a + b.hours, 0) + f2Hours + gHours;

  if (Math.abs(productsHt - invoicesHt) > 1) {
    anomalies.push({
      code: "products_vs_invoices",
      message: `Produits BPF (${(productsHt / 100).toFixed(2)} €) ≠ total factures formation (${(invoicesHt / 100).toFixed(2)} €).`,
    });
  }
  if (Math.abs(learnerHours - signatureHours) > 0.1) {
    anomalies.push({
      code: "hours_vs_signatures",
      message: `Heures-stagiaires agrégées (${learnerHours}) ≠ somme émargements clôturés (${signatureHours}).`,
    });
  }

  return {
    period: { start, end },
    cadre_a,
    cadre_b,
    cadre_c,
    cadre_d,
    cadre_e,
    cadre_f1,
    cadre_f2,
    cadre_f3,
    cadre_f4,
    cadre_g,
    totals: {
      products_ht_cents: productsHt,
      invoices_ht_cents: invoicesHt,
      learner_hours: learnerHours,
      signature_hours: signatureHours,
    },
    anomalies,
  };
}
