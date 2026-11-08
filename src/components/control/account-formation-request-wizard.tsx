"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { SidePanel, Field, fieldClass } from "./chrome";

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

type Props = {
  orgId: string;
  orgName: string;
  contactEmail?: string | null;
  contactName?: string | null;
  people: Person[];
  onClose: () => void;
  onDone: (message: string, dossierId?: string) => void;
};

type Step = 1 | 2 | 3 | 4;

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

export function AccountFormationRequestWizard({
  orgId,
  orgName,
  contactEmail,
  contactName,
  people,
  onClose,
  onDone,
}: Props) {
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<TrainingCourse[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [courseId, setCourseId] = useState("");
  const [selectedPeople, setSelectedPeople] = useState<string[]>([]);
  const [deferParticipants, setDeferParticipants] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [location, setLocation] = useState("");
  const [modality, setModality] = useState<"presentiel" | "distanciel" | "hybride">("presentiel");
  const [devisEmail, setDevisEmail] = useState(contactEmail?.trim() || "");
  const [devisName, setDevisName] = useState(contactName?.trim() || orgName);
  const [error, setError] = useState<string | null>(null);

  const selectablePeople = useMemo(
    () => people.filter((p) => p.email?.includes("@") && !p.userId.startsWith("employee:")),
    [people],
  );

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

  const amounts = useMemo(() => {
    const qty = deferParticipants ? 1 : Math.max(1, selectedPeople.length || 1);
    const unit = Math.round(Number(selectedCourse?.inter_price ?? selectedCourse?.intra_price ?? 0) * 100);
    const ht = unit * qty;
    const tva = Math.round(ht * 0.2);
    return { qty, unit, ht, tva, ttc: ht + tva };
  }, [selectedCourse, selectedPeople.length, deferParticipants]);

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
    setLoading(true);
    setError(null);
    try {
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
          funding_type: "direct",
          notes: `Demande créée depuis le compte client · ${amounts.qty} participant(s)`,
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
          const slotRes = await fetch("/api/super-admin/crm/formation-slots", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              dossier_id: dossierId,
              slot_date: slotDate,
              day_part: dayPart,
              location_label: location.trim() || null,
              modality_presence: modality,
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
                      {[course.duration, course.inter_price != null ? `${course.inter_price} € HT / pax` : null]
                        .filter(Boolean)
                        .join(" · ") || "Catalogue"}
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
              <p className="text-sm text-[#8A93AE]">Collaborateurs du compte</p>
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
          <Field label="Lieu">
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Intra — adresse / visio"
              className={fieldClass}
            />
          </Field>
          <Field label="Modalité">
            <select
              value={modality}
              onChange={(e) => setModality(e.target.value as typeof modality)}
              className={fieldClass}
            >
              <option value="presentiel">Présentiel</option>
              <option value="distanciel">Distanciel</option>
              <option value="hybride">Hybride</option>
            </select>
          </Field>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-full border border-[#26304F] px-4 py-2 text-sm"
              onClick={() => setStep(2)}
            >
              Retour
            </button>
            <button
              type="button"
              className="rounded-full bg-[#6E5BFF] px-4 py-2 text-sm font-semibold disabled:opacity-50"
              disabled={!startDate || !endDate}
              onClick={() => setStep(4)}
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
              {location ? ` · ${location}` : ""} · {modality}
            </p>
            <p className="mt-1 text-xs">
              {deferParticipants
                ? "Participants à compléter"
                : `${selectedPeople.length} participant(s)`}{" "}
              ·{" "}
              {(amounts.ttc / 100).toLocaleString("fr-FR", {
                style: "currency",
                currency: "EUR",
              })}{" "}
              TTC estimé
            </p>
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
