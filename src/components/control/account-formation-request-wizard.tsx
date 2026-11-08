"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { SidePanel, Field, fieldClass } from "./chrome";
import {
  formatByoundPostalAddress,
  formatPostalAddress,
} from "@/lib/formation-documents/postal-address";

type TrainingCourse = {
  id: string;
  title: string;
  duration: string | null;
  inter_price: number | null;
  intra_price: number | null;
  is_active: boolean | null;
};

type Person = {
  userId: string;
  name: string;
  email: string;
  invited?: boolean;
};

type OrgAddress = {
  addressLine: string | null;
  addressZip: string | null;
  addressCity: string | null;
  siret?: string | null;
};

type Props = {
  orgId: string;
  orgName: string;
  contactEmail?: string | null;
  contactName?: string | null;
  orgAddress?: OrgAddress | null;
  people: Person[];
  onClose: () => void;
  onDone: (message: string, dossierId?: string) => void;
  onAddressSaved?: (address: OrgAddress) => void;
};

type Step = 1 | 2 | 3 | 4;
type LocationMode = "client" | "byound" | "other";

function eachDateInclusive(start: string, end: string): string[] {
  const out: string[] = [];
  const a = new Date(`${start}T12:00:00`);
  const b = new Date(`${end}T12:00:00`);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime()) || a > b) return out;
  for (let d = new Date(a); d <= b; d.setDate(d.getDate() + 1)) {
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

const BYOUND_ADDRESS = formatByoundPostalAddress();

export function AccountFormationRequestWizard({
  orgId,
  orgName,
  contactEmail,
  contactName,
  orgAddress: orgAddressProp,
  people,
  onClose,
  onDone,
  onAddressSaved,
}: Props) {
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<TrainingCourse[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [courseId, setCourseId] = useState("");
  const [selectedPeople, setSelectedPeople] = useState<string[]>([]);
  const [deferParticipants, setDeferParticipants] = useState(false);
  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [startDate, setStartDate] = useState(todayIso);
  const [endDate, setEndDate] = useState(todayIso);
  const initialHasAddress = Boolean(
    orgAddressProp?.addressLine?.trim() &&
      orgAddressProp?.addressZip?.trim() &&
      orgAddressProp?.addressCity?.trim(),
  );
  const [locationMode, setLocationMode] = useState<LocationMode>(
    initialHasAddress ? "client" : "byound",
  );
  const [locationOther, setLocationOther] = useState("");
  const [modality, setModality] = useState<"presentiel" | "distanciel" | "hybride">("presentiel");
  const [fundingType, setFundingType] = useState<"direct" | "opco">("direct");
  const [morningStart, setMorningStart] = useState("10:00");
  const [morningEnd, setMorningEnd] = useState("13:30");
  const [afternoonStart, setAfternoonStart] = useState("14:30");
  const [afternoonEnd, setAfternoonEnd] = useState("18:00");
  const [devisEmail, setDevisEmail] = useState(contactEmail?.trim() || "");
  const [devisName, setDevisName] = useState(contactName?.trim() || orgName);
  const [error, setError] = useState<string | null>(null);
  const [addressLine, setAddressLine] = useState(orgAddressProp?.addressLine ?? "");
  const [addressZip, setAddressZip] = useState(orgAddressProp?.addressZip ?? "");
  const [addressCity, setAddressCity] = useState(orgAddressProp?.addressCity ?? "");
  const [siret, setSiret] = useState(orgAddressProp?.siret ?? "");
  const [savingAddress, setSavingAddress] = useState(false);

  const selectablePeople = useMemo(
    () =>
      // Membres + invités (employee:…) — on n’exclut que les fiches sans e-mail
      people.filter((p) => p.email?.includes("@")),
    [people],
  );

  const clientAddressLabel = useMemo(
    () =>
      formatPostalAddress({
        address_line: addressLine,
        address_zip: addressZip,
        address_city: addressCity,
      }),
    [addressLine, addressZip, addressCity],
  );

  const hasClientAddress = Boolean(addressLine.trim() && addressZip.trim() && addressCity.trim());

  const resolvedLocation = useMemo(() => {
    if (modality === "distanciel") return "Distanciel / visio";
    if (locationMode === "client") {
      return clientAddressLabel
        ? `Chez le client — ${clientAddressLabel}`
        : "Chez le client";
    }
    if (locationMode === "byound") return `Chez Byound — ${BYOUND_ADDRESS}`;
    return locationOther.trim();
  }, [modality, locationMode, clientAddressLabel, locationOther]);

  const selectedCourse = courses.find((c) => c.id === courseId) ?? null;

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setCoursesLoading(true);
      try {
        const res = await fetch("/api/super/training-courses");
        const json = (await res.json()) as { courses?: TrainingCourse[]; error?: string };
        if (!res.ok) throw new Error(json.error || "Catalogue indisponible");
        const list = (json.courses ?? []).filter((c) => c.is_active !== false);
        if (!cancelled) {
          setCourses(list);
          if (list[0] && !courseId) setCourseId(list[0].id);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Catalogue indisponible");
      } finally {
        if (!cancelled) setCoursesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (modality === "distanciel") return;
    if (!locationMode && modality === "presentiel") setLocationMode("client");
  }, [modality, locationMode]);

  const amounts = useMemo(() => {
    const qty = deferParticipants ? 1 : Math.max(1, selectedPeople.length || 1);
    // Intra = forfait session ; inter = × participants
    const intra = selectedCourse?.intra_price;
    const inter = selectedCourse?.inter_price;
    const unitEuros =
      intra != null && Number(intra) > 0
        ? Number(intra)
        : inter != null && Number(inter) > 0
          ? Number(inter)
          : 0;
    const unit = Math.round((Number.isFinite(unitEuros) ? unitEuros : 0) * 100);
    const ht =
      intra != null && Number(intra) > 0
        ? unit
        : unit * qty;
    const tva = Math.round(ht * 0.2);
    return { qty, unit, unitEuros, ht, tva, ttc: ht + tva };
  }, [selectedCourse, selectedPeople.length, deferParticipants]);

  function slotTimes(dayPart: "matin" | "apres_midi", slotDate: string) {
    const start = dayPart === "matin" ? morningStart : afternoonStart;
    const end = dayPart === "matin" ? morningEnd : afternoonEnd;
    return {
      starts_at: `${slotDate}T${start}:00`,
      ends_at: `${slotDate}T${end}:00`,
    };
  }

  async function saveClientAddress(): Promise<boolean> {
    if (!addressLine.trim() || !addressZip.trim() || !addressCity.trim()) {
      setError("Renseignez l'adresse postale complète de l'entreprise.");
      return false;
    }
    const siretDigits = siret.replace(/\D/g, "");
    if (siretDigits.length !== 14) {
      setError("SIRET à 14 chiffres requis.");
      return false;
    }
    setSavingAddress(true);
    setError(null);
    try {
      const res = await fetch(`/api/super/comptes-clients/${orgId}/address`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address_line: addressLine.trim(),
          address_zip: addressZip.trim(),
          address_city: addressCity.trim(),
          address_country: "FR",
          siret: siretDigits,
        }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error || "Adresse non enregistrée");
      onAddressSaved?.({
        addressLine: addressLine.trim(),
        addressZip: addressZip.trim(),
        addressCity: addressCity.trim(),
        siret: siret.replace(/\D/g, "") || null,
      });
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Adresse non enregistrée");
      return false;
    } finally {
      setSavingAddress(false);
    }
  }

  function goToStep4() {
    const start = startDate || todayIso;
    const end = endDate || start;
    if (!startDate) setStartDate(start);
    if (!endDate) setEndDate(end);
    if (end < start) {
      setError("La date de fin doit être après la date de début.");
      return;
    }
    if (!morningStart || !morningEnd || !afternoonStart || !afternoonEnd) {
      setError("Renseignez les horaires matin et après-midi (requis pour la convention).");
      return;
    }
    if (morningEnd <= morningStart || afternoonEnd <= afternoonStart) {
      setError("Vérifiez les plages horaires (fin après début).");
      return;
    }
    if (modality !== "distanciel" && locationMode === "other" && !locationOther.trim()) {
      setError("Précisez le lieu (autre), ou choisissez Chez le client / Chez Byound.");
      return;
    }
    // Adresse + SIRET toujours requis pour la convention (bénéficiaire).
    if (!hasClientAddress) {
      setError("Adresse postale de l'entreprise requise pour la convention.");
      return;
    }
    const siretDigits = siret.replace(/\D/g, "");
    if (siretDigits.length !== 14) {
      setError("SIRET à 14 chiffres requis pour la convention.");
      return;
    }
    setError(null);
    void saveClientAddress().catch(() => false);
    setStep(4);
  }

  async function submit() {
    if (!selectedCourse) {
      setError("Choisissez une formation du catalogue.");
      return;
    }
    if (!startDate || !endDate) {
      setError("Indiquez les dates de session.");
      return;
    }
    if (!devisEmail.includes("@")) {
      setError("E-mail de devis requis.");
      return;
    }
    if (amounts.ht <= 0) {
      setError(
        "Montant catalogue à 0 € — renseignez le prix de la formation (intra) avant d'envoyer le devis.",
      );
      return;
    }
    if (!hasClientAddress) {
      setError("Adresse entreprise requise pour la convention.");
      return;
    }
    if (siret.replace(/\D/g, "").length !== 14) {
      setError("SIRET à 14 chiffres requis pour la convention.");
      return;
    }
    if (!morningStart || !morningEnd || !afternoonStart || !afternoonEnd) {
      setError("Horaires de session requis.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (hasClientAddress) {
        await saveClientAddress().catch(() => false);
      }

      const createRes = await fetch("/api/super-admin/crm/formation-dossiers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organization_id: orgId,
          source: "manual",
          training_course_id: selectedCourse.id,
          course_title: selectedCourse.title,
          amount_ht_cents: amounts.ht,
          amount_tva_cents: amounts.tva,
          amount_ttc_cents: amounts.ttc,
          contact_name: devisName || orgName,
          contact_email: devisEmail.trim().toLowerCase(),
          modality_intra_inter: "intra",
          modality_presence: modality,
          funding_type: fundingType,
          notes: [
            `Demande créée depuis le compte client · ${amounts.qty} participant(s)`,
            `Financement: ${fundingType === "opco" ? "OPCO" : "fonds propres"}`,
            `Horaires: ${morningStart}-${morningEnd} / ${afternoonStart}-${afternoonEnd}`,
            resolvedLocation ? `Lieu: ${resolvedLocation}` : null,
          ]
            .filter(Boolean)
            .join("\n"),
        }),
      });
      const createJson = (await createRes.json()) as { dossier?: { id: string }; error?: string };
      if (!createRes.ok || !createJson.dossier?.id) {
        throw new Error(createJson.error || "Création du dossier impossible");
      }
      const dossierId = createJson.dossier.id;

      const dates = eachDateInclusive(startDate, endDate);
      for (const slotDate of dates) {
        for (const dayPart of ["matin", "apres_midi"] as const) {
          const times = slotTimes(dayPart, slotDate);
          const slotRes = await fetch("/api/super-admin/crm/formation-slots", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              dossier_id: dossierId,
              slot_date: slotDate,
              day_part: dayPart,
              location_label: resolvedLocation || null,
              modality_presence: modality,
              starts_at: times.starts_at,
              ends_at: times.ends_at,
            }),
          });
          if (!slotRes.ok) {
            const j = (await slotRes.json()) as { error?: string };
            throw new Error(j.error || "Créneau impossible");
          }
        }
      }

      if (!deferParticipants) {
        for (const userId of selectedPeople) {
          const person = selectablePeople.find((p) => p.userId === userId);
          if (!person?.email) continue;
          const [first, ...rest] = person.name.trim().split(/\s+/);
          const partRes = await fetch(
            `/api/super-admin/crm/formation-dossiers/${dossierId}/participants`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: person.email,
                first_name: first || person.name,
                last_name: rest.join(" ") || "",
              }),
            },
          );
          if (!partRes.ok) {
            const j = (await partRes.json()) as { error?: string };
            throw new Error(j.error || `Participant ${person.email} impossible`);
          }
        }
      }

      const devisRes = await fetch(
        `/api/super-admin/crm/formation-dossiers/${dossierId}/validate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "devis" }),
        },
      );
      if (!devisRes.ok) {
        const sendRes = await fetch(
          `/api/super-admin/crm/formation-dossiers/${dossierId}/documents/send`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ kind: "devis", to: devisEmail.trim().toLowerCase() }),
          },
        );
        if (!sendRes.ok) {
          const j = (await sendRes.json()) as { error?: string };
          throw new Error(
            j.error ||
              "Dossier créé mais envoi du devis impossible — renvoyez depuis le dossier.",
          );
        }
      }

      onDone(
        `Demande créée · devis envoyé à ${devisEmail.trim().toLowerCase()}.`,
        dossierId,
      );
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Création impossible");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SidePanel title="Nouvelle demande formation" onClose={onClose}>
      <div className="mb-4 flex gap-1 text-xs font-semibold text-[#8A93AE]">
        {[1, 2, 3, 4].map((n) => (
          <span
            key={n}
            className={`rounded-full px-2.5 py-1 ${
              step === n ? "bg-[#6E5BFF] text-white" : "bg-[#1A2340]"
            }`}
          >
            {n === 1 ? "Formation" : n === 2 ? "Participants" : n === 3 ? "Session" : "Envoi"}
          </span>
        ))}
      </div>

      {error ? <p className="mb-3 text-sm text-[#FF8A9B]">{error}</p> : null}

      {step === 1 ? (
        <div className="space-y-3">
          <p className="text-sm text-[#C9D2E8]">Choisissez une formation du catalogue Byound.</p>
          {coursesLoading ? (
            <p className="flex items-center gap-2 text-sm text-[#8A93AE]">
              <Loader2 className="h-4 w-4 animate-spin" /> Chargement…
            </p>
          ) : (
            <div className="max-h-72 space-y-2 overflow-auto">
              {courses.map((course) => (
                <label
                  key={course.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-3 py-3 text-sm ${
                    courseId === course.id
                      ? "border-[#6E5BFF] bg-[#17122E]"
                      : "border-[#26304F] bg-[#111831]"
                  }`}
                >
                  <input
                    type="radio"
                    name="course"
                    checked={courseId === course.id}
                    onChange={() => setCourseId(course.id)}
                    className="mt-1"
                  />
                  <span>
                    <span className="font-semibold text-white">{course.title}</span>
                    <span className="mt-0.5 block text-xs text-[#8A93AE]">
                      {[
                        course.duration,
                        course.intra_price != null
                          ? `${course.intra_price} € HT intra`
                          : course.inter_price != null
                            ? `${course.inter_price} € HT inter`
                            : "Prix à renseigner",
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          )}
          <button
            type="button"
            disabled={!courseId}
            className="rounded-full bg-[#6E5BFF] px-4 py-2 text-sm font-semibold disabled:opacity-50"
            onClick={() => setStep(2)}
          >
            Continuer
          </button>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm text-[#C9D2E8]">
            <input
              type="checkbox"
              checked={deferParticipants}
              onChange={(e) => {
                setDeferParticipants(e.target.checked);
                if (e.target.checked) setSelectedPeople([]);
              }}
            />
            L&apos;entreprise complétera les participants plus tard
          </label>
          {!deferParticipants ? (
            <>
              <p className="text-sm text-[#8A93AE]">
                Collaborateurs &amp; invités du compte ({selectablePeople.length})
              </p>
              <div className="max-h-56 space-y-1 overflow-auto">
                {selectablePeople.length === 0 ? (
                  <p className="text-sm text-[#8A93AE]">
                    Aucun collaborateur avec e-mail — cochez « complétera plus tard » ou invitez des
                    membres.
                  </p>
                ) : (
                  selectablePeople.map((person) => (
                    <label key={person.userId} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={selectedPeople.includes(person.userId)}
                        onChange={(e) =>
                          setSelectedPeople((cur) =>
                            e.target.checked
                              ? [...cur, person.userId]
                              : cur.filter((id) => id !== person.userId),
                          )
                        }
                      />
                      <span>
                        {person.name}
                        {person.invited || person.userId.startsWith("employee:") ? (
                          <span className="ml-1 text-[10px] uppercase tracking-wide text-[#F2CF6B]">
                            invité
                          </span>
                        ) : null}
                        <span className="text-[#8A93AE]"> · {person.email}</span>
                      </span>
                    </label>
                  ))
                )}
              </div>
            </>
          ) : null}
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-full border border-[#26304F] px-4 py-2 text-sm"
              onClick={() => setStep(1)}
            >
              Retour
            </button>
            <button
              type="button"
              className="rounded-full bg-[#6E5BFF] px-4 py-2 text-sm font-semibold disabled:opacity-50"
              disabled={!deferParticipants && selectedPeople.length === 0}
              onClick={() => setStep(3)}
            >
              Continuer
            </button>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Date de début">
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (!endDate) setEndDate(e.target.value);
                }}
                className={fieldClass}
              />
            </Field>
            <Field label="Date de fin">
              <input
                type="date"
                required
                value={endDate}
                min={startDate || undefined}
                onChange={(e) => setEndDate(e.target.value)}
                className={fieldClass}
              />
            </Field>
          </div>
          <Field label="Modalité">
            <select
              value={modality}
              onChange={(e) => {
                const next = e.target.value as typeof modality;
                setModality(next);
                if (next === "distanciel") setLocationMode("other");
                else if (locationMode === "other" && !locationOther) setLocationMode("client");
              }}
              className={fieldClass}
            >
              <option value="presentiel">Présentiel</option>
              <option value="distanciel">Distanciel</option>
              <option value="hybride">Hybride</option>
            </select>
          </Field>

          <Field label="Financement">
            <select
              value={fundingType}
              onChange={(e) => setFundingType(e.target.value as "direct" | "opco")}
              className={fieldClass}
            >
              <option value="direct">Fonds propres</option>
              <option value="opco">Prise en charge OPCO</option>
            </select>
          </Field>

          <div className="rounded-2xl border border-[#26304F] bg-[#111831] p-3">
            <p className="mb-2 text-sm font-semibold text-white">Horaires de session</p>
            <p className="mb-3 text-xs text-[#8A93AE]">
              Repris sur la convention (article dates &amp; horaires) et les créneaux d&apos;émargement.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Matin (début → fin)">
                <div className="flex gap-2">
                  <input
                    type="time"
                    required
                    value={morningStart}
                    onChange={(e) => setMorningStart(e.target.value)}
                    className={fieldClass}
                  />
                  <input
                    type="time"
                    required
                    value={morningEnd}
                    onChange={(e) => setMorningEnd(e.target.value)}
                    className={fieldClass}
                  />
                </div>
              </Field>
              <Field label="Après-midi (début → fin)">
                <div className="flex gap-2">
                  <input
                    type="time"
                    required
                    value={afternoonStart}
                    onChange={(e) => setAfternoonStart(e.target.value)}
                    className={fieldClass}
                  />
                  <input
                    type="time"
                    required
                    value={afternoonEnd}
                    onChange={(e) => setAfternoonEnd(e.target.value)}
                    className={fieldClass}
                  />
                </div>
              </Field>
            </div>
          </div>

          {modality !== "distanciel" ? (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-white">Lieu de formation</p>
              <label className="flex items-start gap-2 rounded-2xl border border-[#26304F] bg-[#111831] p-3 text-sm">
                <input
                  type="radio"
                  checked={locationMode === "client"}
                  onChange={() => setLocationMode("client")}
                  className="mt-1"
                />
                <span>
                  <span className="font-semibold">Chez le client</span>
                  <span className="mt-0.5 block text-xs text-[#8A93AE]">
                    {hasClientAddress ? clientAddressLabel : "Adresse entreprise à renseigner"}
                  </span>
                </span>
              </label>
              <label className="flex items-start gap-2 rounded-2xl border border-[#26304F] bg-[#111831] p-3 text-sm">
                <input
                  type="radio"
                  checked={locationMode === "byound"}
                  onChange={() => setLocationMode("byound")}
                  className="mt-1"
                />
                <span>
                  <span className="font-semibold">Chez Byound</span>
                  <span className="mt-0.5 block text-xs text-[#8A93AE]">{BYOUND_ADDRESS}</span>
                </span>
              </label>
              <label className="flex items-start gap-2 rounded-2xl border border-[#26304F] bg-[#111831] p-3 text-sm">
                <input
                  type="radio"
                  checked={locationMode === "other"}
                  onChange={() => setLocationMode("other")}
                  className="mt-1"
                />
                <span className="font-semibold">Autre lieu</span>
              </label>
              {locationMode === "other" ? (
                <Field label="Précisez le lieu">
                  <input
                    value={locationOther}
                    onChange={(e) => setLocationOther(e.target.value)}
                    placeholder="Adresse ou salle"
                    className={fieldClass}
                  />
                </Field>
              ) : null}
            </div>
          ) : null}

          <div className="space-y-2 rounded-2xl border border-[#6E5BFF]/40 bg-[#17122E] p-3">
            <p className="text-sm font-semibold text-white">Bénéficiaire (convention)</p>
            <p className="text-xs text-[#8A93AE]">
              Adresse + SIRET obligatoires pour générer devis et convention.
            </p>
            <Field label="Adresse">
              <input
                value={addressLine}
                onChange={(e) => setAddressLine(e.target.value)}
                placeholder="N° et rue"
                className={fieldClass}
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-[100px_1fr]">
              <Field label="CP">
                <input
                  value={addressZip}
                  onChange={(e) => setAddressZip(e.target.value)}
                  className={fieldClass}
                />
              </Field>
              <Field label="Ville">
                <input
                  value={addressCity}
                  onChange={(e) => setAddressCity(e.target.value)}
                  className={fieldClass}
                />
              </Field>
            </div>
            <Field label="SIRET">
              <input
                value={siret}
                onChange={(e) => setSiret(e.target.value)}
                placeholder="14 chiffres"
                className={fieldClass}
              />
            </Field>
            {!hasClientAddress ||
            siret.replace(/\D/g, "").length !== 14 ||
            addressLine !== (orgAddressProp?.addressLine ?? "") ||
            addressZip !== (orgAddressProp?.addressZip ?? "") ||
            addressCity !== (orgAddressProp?.addressCity ?? "") ? (
              <button
                type="button"
                disabled={savingAddress}
                className="rounded-full border border-[#26304F] px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
                onClick={() => void saveClientAddress()}
              >
                {savingAddress ? "Enregistrement…" : "Enregistrer sur le compte"}
              </button>
            ) : null}
          </div>

          {error ? <p className="text-sm text-[#FF8A9B]">{error}</p> : null}
          <div className="sticky bottom-0 z-10 -mx-1 flex gap-2 bg-[#111831]/95 py-3 backdrop-blur">
            <button
              type="button"
              className="rounded-full border border-[#26304F] px-4 py-2 text-sm"
              onClick={() => setStep(2)}
            >
              Retour
            </button>
            <button
              type="button"
              className="rounded-full bg-[#6E5BFF] px-4 py-2 text-sm font-semibold"
              onClick={goToStep4}
            >
              Continuer
            </button>
          </div>
        </div>
      ) : null}

      {step === 4 ? (
        <div className="space-y-3">
          <div className="rounded-2xl border border-[#26304F] bg-[#111831] p-3 text-sm text-[#C9D2E8]">
            <p className="font-semibold text-white">{selectedCourse?.title}</p>
            <p className="mt-1 text-xs">
              {startDate}
              {endDate !== startDate ? ` → ${endDate}` : ""}
              {resolvedLocation ? ` · ${resolvedLocation}` : ""} · {modality}
            </p>
            <p className="mt-1 text-xs">
              Horaires {morningStart}–{morningEnd} / {afternoonStart}–{afternoonEnd}
            </p>
            <p className="mt-1 text-xs">
              {deferParticipants
                ? "Participants à compléter"
                : `${selectedPeople.length} participant(s)`}{" "}
              ·{" "}
              {(amounts.ht / 100).toLocaleString("fr-FR", {
                style: "currency",
                currency: "EUR",
              })}{" "}
              HT catalogue
            </p>
            <ul className="mt-3 space-y-1 text-[11px] text-[#8A93AE]">
              <li>✓ Formation + montant catalogue</li>
              <li>✓ Dates + horaires + lieu</li>
              <li>✓ Adresse + SIRET bénéficiaire</li>
              <li>
                {deferParticipants
                  ? "○ Participants à compléter après devis"
                  : "✓ Participants"}
              </li>
            </ul>
          </div>
          <Field label="Destinataire du devis">
            <input
              value={devisName}
              onChange={(e) => setDevisName(e.target.value)}
              className={fieldClass}
              placeholder="Nom"
            />
          </Field>
          <Field label="E-mail devis">
            <input
              type="email"
              required
              value={devisEmail}
              onChange={(e) => setDevisEmail(e.target.value)}
              className={fieldClass}
            />
          </Field>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-full border border-[#26304F] px-4 py-2 text-sm"
              onClick={() => setStep(3)}
              disabled={loading}
            >
              Retour
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full bg-[#6E5BFF] px-4 py-2 text-sm font-semibold disabled:opacity-50"
              disabled={loading}
              onClick={() => void submit()}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Créer et envoyer le devis
            </button>
          </div>
        </div>
      ) : null}
    </SidePanel>
  );
}
