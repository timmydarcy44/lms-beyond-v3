import {
  BPF_REQUIRED_FOR_MISE_EN_PLACE,
  FORMATION_DOSSIER_STATUSES,
  type FormationDossierStatus,
} from "@/lib/formation-dossier/constants";

export type TransitionDossierInput = {
  currentStatus: FormationDossierStatus;
  toStatus: FormationDossierStatus;
  motif?: string | null;
  /** Champs dossier pour contrôles BPF / sous-traitance / verrous Lot 5. */
  dossier: {
    bpf_funder_type?: string | null;
    subcontracting?: string | null;
    partner_of_name?: string | null;
    training_course_id?: string | null;
    participantBpfStatuses?: Array<string | null | undefined>;
    participantCount?: number;
    /** Convention signée (formation_documents). */
    conventionSigned?: boolean;
    /** Formateur choisi (validation humaine). */
    trainerAssigned?: boolean;
    /** Tous les créneaux de la session ont une clôture formateur. */
    allSlotsClosed?: boolean;
    /** Pas de créneau (session non programmée) — allSlotsClosed ignoré si true et count=0. */
    slotCount?: number;
    /** Facture validée / émise. */
    invoiceValidated?: boolean;
    /** Pièces Qualiopi cœur présentes (convention signée + émargements clôturés + certificat généré). */
    qualiopiCoreReady?: boolean;
  };
};

export type TransitionDossierOk = {
  ok: true;
  from: FormationDossierStatus;
  to: FormationDossierStatus;
  direction: "forward" | "backward" | "noop";
};

export type TransitionDossierErr = {
  ok: false;
  code:
    | "invalid_status"
    | "skip_forbidden"
    | "motif_required"
    | "bpf_incomplete"
    | "subcontracting_incomplete"
    | "convention_required"
    | "trainer_required"
    | "attendance_incomplete"
    | "invoice_required"
    | "qualiopi_incomplete";
  message: string;
};

export type TransitionDossierResult = TransitionDossierOk | TransitionDossierErr;

function statusIndex(status: string): number {
  return FORMATION_DOSSIER_STATUSES.indexOf(status as FormationDossierStatus);
}

export function assertBpfReadyForMiseEnPlace(dossier: TransitionDossierInput["dossier"]): TransitionDossierErr | null {
  for (const key of BPF_REQUIRED_FOR_MISE_EN_PLACE) {
    const value = dossier[key];
    if (!value || !String(value).trim()) {
      return {
        ok: false,
        code: "bpf_incomplete",
        message: `Champ BPF requis avant Mise en place : ${key}`,
      };
    }
  }

  if (dossier.subcontracting === "recue") {
    if (dossier.bpf_funder_type !== "autres_of") {
      return {
        ok: false,
        code: "bpf_incomplete",
        message: 'Sous-traitance reçue : financeur BPF forcé à "autres organismes de formation".',
      };
    }
    if (!dossier.partner_of_name?.trim()) {
      return {
        ok: false,
        code: "subcontracting_incomplete",
        message: "Sous-traitance reçue : OF donneur d'ordre obligatoire.",
      };
    }
  }

  if (dossier.subcontracting === "confiee" && !dossier.partner_of_name?.trim()) {
    return {
      ok: false,
      code: "subcontracting_incomplete",
      message: "Sous-traitance confiée : OF partenaire obligatoire.",
    };
  }

  // Statuts BPF apprenants : saisis plus tard (émargement / clôture), pas un frein à la mise en place.

  return null;
}

/**
 * Règles pures de transition.
 * Lot 5 : convention signée, formateur, émargements clôturés, facture, Qualiopi.
 */
export function evaluateFormationDossierTransition(
  input: TransitionDossierInput,
): TransitionDossierResult {
  const from = input.currentStatus;
  const to = input.toStatus;

  if (statusIndex(from) < 0 || statusIndex(to) < 0) {
    return { ok: false, code: "invalid_status", message: "Statut inconnu." };
  }

  if (from === to) {
    return { ok: true, from, to, direction: "noop" };
  }

  const fromIdx = statusIndex(from);
  const toIdx = statusIndex(to);
  const delta = toIdx - fromIdx;

  if (Math.abs(delta) !== 1) {
    return {
      ok: false,
      code: "skip_forbidden",
      message: "Pas de saut d'étape : avancez ou reculez d'un statut à la fois.",
    };
  }

  if (delta < 0) {
    const motif = String(input.motif ?? "").trim();
    if (!motif) {
      return {
        ok: false,
        code: "motif_required",
        message: "Retour arrière : motif obligatoire.",
      };
    }
    return { ok: true, from, to, direction: "backward" };
  }

  // Convention → Mise en place : BPF + convention signée
  if (from === "convention" && to === "mise_en_place") {
    const bpfErr = assertBpfReadyForMiseEnPlace(input.dossier);
    if (bpfErr) return bpfErr;
    if (!input.dossier.conventionSigned) {
      return {
        ok: false,
        code: "convention_required",
        message: "Convention signée requise avant Mise en place / convocations.",
      };
    }
  }

  // Mise en place → Session : formateur choisi
  if (from === "mise_en_place" && to === "session") {
    if (!input.dossier.trainerAssigned) {
      return {
        ok: false,
        code: "trainer_required",
        message: "Choisissez un formateur avant de passer en Session.",
      };
    }
    if (!input.dossier.conventionSigned) {
      return {
        ok: false,
        code: "convention_required",
        message: "Convention signée requise.",
      };
    }
  }

  // Session → Fin : tous les créneaux clôturés (s'il y en a)
  if (from === "session" && to === "fin") {
    const slots = input.dossier.slotCount ?? 0;
    if (slots > 0 && !input.dossier.allSlotsClosed) {
      return {
        ok: false,
        code: "attendance_incomplete",
        message: "Tous les créneaux doivent être clôturés par le formateur avant Fin.",
      };
    }
  }

  // Fin → Clôturé : facture validée + pièces Qualiopi
  if (from === "fin" && to === "cloture") {
    if (!input.dossier.invoiceValidated) {
      return {
        ok: false,
        code: "invoice_required",
        message: "Validez et émettez la facture avant de clôturer le dossier.",
      };
    }
    if (!input.dossier.qualiopiCoreReady) {
      return {
        ok: false,
        code: "qualiopi_incomplete",
        message:
          "Pièces Qualiopi incomplètes : convention signée, émargements clôturés, certificat généré.",
      };
    }
  }

  return { ok: true, from, to, direction: "forward" };
}
