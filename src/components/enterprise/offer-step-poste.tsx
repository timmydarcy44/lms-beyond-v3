"use client";

import { useEffect, useId, useState } from "react";
import { toast } from "sonner";
import { ChoicePills, Segmented } from "@/components/builder/fiche-builder-chrome";
import { CFA_SPECIALIZATIONS } from "@/lib/cfa-applications";
import {
  CONTRACT_TYPES,
  EDUCATION_LEVELS,
  EXPERIENCE_LEVELS,
  WORK_MODES,
} from "@/lib/entreprise/offer-publish";
import type { OfferPoste } from "@/lib/entreprise/offer-poste";

const fieldClass =
  "h-14 w-full rounded-2xl border border-[#E3E0D8] bg-white px-4 text-[17px] font-bold text-[#07080B] outline-none focus:border-[#07080B]";
const areaClass =
  "min-h-[168px] w-full resize-y rounded-2xl border border-[#E3E0D8] bg-white px-4 py-3 text-base text-[#07080B] outline-none focus:border-[#07080B]";

type PlaceHit = { label: string };
type SchoolHit = { name: string };

export function OfferStepPoste({
  draft,
  onChange,
}: {
  draft: OfferPoste;
  onChange: (patch: Partial<OfferPoste>) => void;
}) {
  const [places, setPlaces] = useState<PlaceHit[]>([]);
  const [schools, setSchools] = useState<SchoolHit[]>([]);
  const [placeOpen, setPlaceOpen] = useState(false);
  const [schoolOpen, setSchoolOpen] = useState(false);
  const [proposal, setProposal] = useState<string | null>(null);
  const [assisting, setAssisting] = useState(false);
  const contract = String(draft.contract_type ?? "");
  const alternance = contract === "Alternance";
  const timed = contract === "CDD" || contract === "Stage" || contract === "Intérim";
  const jobContracts = CONTRACT_TYPES.filter((item) => item !== "Alternance");
  const contractOptions = jobContracts.includes(contract as (typeof jobContracts)[number]) || !contract
    ? jobContracts
    : [...jobContracts, contract];

  useEffect(() => {
    const query = String(draft.city ?? "").trim();
    if (query.length < 2) {
      setPlaces([]);
      return;
    }
    const timer = window.setTimeout(() => {
      void fetch(`/api/dashboard/entreprise/job-offers/places?q=${encodeURIComponent(query)}`, { credentials: "include" })
        .then((res) => res.json())
        .then((json: { places?: PlaceHit[] }) => setPlaces(json.places ?? []))
        .catch(() => setPlaces([]));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [draft.city]);

  useEffect(() => {
    if (!alternance) return;
    const query = String(draft.alternance_school ?? "").trim();
    const timer = window.setTimeout(() => {
      void fetch(`/api/dashboard/entreprise/job-offers/schools?q=${encodeURIComponent(query)}`, { credentials: "include" })
        .then((res) => res.json())
        .then((json: { schools?: SchoolHit[] }) => setSchools(json.schools ?? []))
        .catch(() => setSchools([{ name: "Byound School" }]));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [alternance, draft.alternance_school]);

  const assist = async (mode: "from_title" | "missions") => {
    const title = String(draft.title ?? "").trim();
    if (title.length < 2 || title === "Sans titre") {
      toast.error("Indiquez d'abord l'intitulé du poste.");
      document.getElementById("offer-title")?.focus();
      return;
    }
    setAssisting(true);
    try {
      const res = await fetch("/api/dashboard/entreprise/job-offers/assist", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          title,
          contract_type: contract,
          description: String(draft.description ?? ""),
        }),
      });
      const json = (await res.json()) as { text?: string; error?: string };
      if (!res.ok || !json.text) throw new Error(json.error ?? "Rédaction indisponible");
      setProposal(json.text);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Rédaction indisponible");
    } finally {
      setAssisting(false);
    }
  };

  return (
    <div className="mt-8 space-y-6">
      <div>
        <label htmlFor="offer-title" className="mb-2 block text-sm font-semibold">
          Intitulé du poste
        </label>
        <input
          id="offer-title"
          value={draft.title === "Sans titre" ? "" : String(draft.title ?? "")}
          onChange={(event) => onChange({ title: event.target.value })}
          placeholder="Account manager junior"
          className={fieldClass}
        />
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold">Nature de l&apos;offre</p>
        <Segmented
          label="Nature de l'offre"
          value={alternance ? "Liée à un cursus" : "Offre d'emploi"}
          options={["Offre d'emploi", "Liée à un cursus"]}
          onChange={(value) => {
            if (value === "Liée à un cursus") {
              onChange({ contract_type: "Alternance" });
              return;
            }
            onChange({
              contract_type: contract === "Alternance" ? "CDI" : contract || "CDI",
              diploma_prepared: "",
              alternance_school: "",
              work_rhythm: "",
            });
          }}
        />
        <p className="mt-2 text-sm text-[#6B6F7A]">
          {alternance
            ? "L'offre est rattachée à un cursus Byound, pour un contrat d'alternance."
            : "Offre d'emploi classique, sans lien avec l'alternance."}
        </p>
      </div>

      {alternance ? null : (
      <div>
        <p className="mb-2 text-sm font-semibold">Type de contrat</p>
        <ChoicePills label="Type de contrat" value={contract === "Alternance" ? "CDI" : contract} options={contractOptions} onChange={(value) => onChange({ contract_type: value, diploma_prepared: "" })} />
      </div>
      )}

      {alternance ? (
        <div className="rounded-[20px] bg-[#F1EFFF] p-5">
          <div className="mb-4 flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#6E5BFF] text-xs font-bold text-white">A</span>
            <p className="font-semibold">Cursus</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold">
              Cursus
              <select
                className={`${fieldClass} mt-2`}
                value={CFA_SPECIALIZATIONS.find((item) => item.label === String(draft.diploma_prepared ?? "").trim() || item.value === String(draft.diploma_prepared ?? "").trim())?.value ?? ""}
                onChange={(event) => {
                  const chosen = CFA_SPECIALIZATIONS.find((item) => item.value === event.target.value);
                  onChange({ diploma_prepared: chosen?.label ?? "" });
                }}
              >
                <option value="">Choisir un cursus</option>
                {CFA_SPECIALIZATIONS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="relative">
              <Field label="École" value={draft.alternance_school} onFocus={() => setSchoolOpen(true)} onChange={(value) => { setSchoolOpen(true); onChange({ alternance_school: value }); }} placeholder="Byound School" />
              {schoolOpen && schools.length > 0 ? (
                <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-2xl border border-[#E3E0D8] bg-white p-1 shadow-sm">
                  {schools.map((school) => (
                    <li key={school.name}>
                      <button type="button" className="w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-[#F4F4F1]" onClick={() => { onChange({ alternance_school: school.name }); setSchoolOpen(false); }}>
                        {school.name}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
            <Field label="Rythme" value={draft.work_rhythm} onChange={(value) => onChange({ work_rhythm: value })} placeholder="3 semaines entreprise / 1 semaine école" />
            <Field label="Durée du contrat" value={draft.contract_duration} onChange={(value) => onChange({ contract_duration: value })} placeholder="12 mois" />
          </div>
        </div>
      ) : null}

      {timed ? <Field label="Durée" value={draft.contract_duration} onChange={(value) => onChange({ contract_duration: value })} placeholder="6 mois" /> : null}

      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <div className="relative">
          <Field id="offer-city" label="Lieu" value={draft.city} onChange={(value) => { setPlaceOpen(true); onChange({ city: value }); }} placeholder="Caen (14)" />
          {placeOpen && places.length > 0 ? (
            <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-2xl border border-[#E3E0D8] bg-white p-1 shadow-sm">
              {places.map((place) => (
                <li key={place.label}>
                  <button type="button" className="w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-[#F4F4F1]" onClick={() => { onChange({ city: place.label }); setPlaceOpen(false); }}>
                    {place.label}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <div>
          <p id="offer-mode" className="mb-2 text-sm font-semibold">Modalité</p>
          <Segmented label="Modalité" value={String(draft.work_mode ?? "")} options={[...WORK_MODES]} onChange={(value) => onChange({ work_mode: value })} />
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-end justify-between gap-3">
          <label htmlFor="offer-description" className="text-sm font-semibold">Description du poste</label>
          <span className="text-xs text-[#6B6F7A]">Contexte, missions, environnement</span>
        </div>
        <textarea
          id="offer-description"
          rows={6}
          value={String(draft.description ?? "")}
          onChange={(event) => onChange({ description: event.target.value })}
          className={areaClass}
        />
        <div className="mt-3 flex flex-wrap gap-3">
          <button type="button" disabled={assisting} onClick={() => void assist("from_title")} className="text-sm font-semibold text-[#4B3BD1] disabled:opacity-50">
            ✦ Rédiger à partir de l'intitulé
          </button>
          <button type="button" disabled={assisting} onClick={() => void assist("missions")} className="text-sm font-semibold text-[#4B3BD1] disabled:opacity-50">
            ✦ Structurer en missions
          </button>
        </div>
        {proposal ? (
          <div className="mt-4 rounded-2xl bg-[#F4F4F1] p-4">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#3A3D45]">{proposal}</p>
            <div className="mt-4 flex gap-2">
              <button type="button" className="h-10 rounded-full bg-[#07080B] px-4 text-sm font-semibold text-white" onClick={() => { onChange({ description: proposal }); setProposal(null); }}>
                Remplacer
              </button>
              <button type="button" className="h-10 rounded-full border border-[#E3E0D8] bg-white px-4 text-sm font-semibold" onClick={() => setProposal(null)}>
                Annuler
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold">Expérience souhaitée</p>
        <ChoicePills label="Expérience souhaitée" value={String(draft.experience_level ?? "")} options={[...EXPERIENCE_LEVELS]} allowEmpty onChange={(value) => onChange({ experience_level: value })} />
      </div>

      {alternance ? null : (
        <div>
          <p className="mb-2 text-sm font-semibold">Niveau de formation <span className="font-medium text-[#6B6F7A]">facultatif</span></p>
          <ChoicePills label="Niveau de formation" value={String(draft.education_level ?? "")} options={[...EDUCATION_LEVELS]} allowEmpty onChange={(value) => onChange({ education_level: value })} />
        </div>
      )}
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  onFocus,
  placeholder,
}: {
  id?: string;
  label: string;
  value?: string | null;
  onChange: (value: string) => void;
  onFocus?: () => void;
  placeholder: string;
}) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <div>
      <label htmlFor={fieldId} className="mb-2 block text-sm font-semibold">
        {label}
      </label>
      <input id={fieldId} value={String(value ?? "")} placeholder={placeholder} onFocus={onFocus} onChange={(event) => onChange(event.target.value)} className={fieldClass} />
    </div>
  );
}
