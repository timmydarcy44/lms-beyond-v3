"use client";

import { useMemo, useState } from "react";
import { ACHIEVEMENT_TYPES, achievementLabel, type BadgeBuilderState, type ValidityMode } from "@/lib/openbadges/badge-builder";
import { DOMAIN_COLORS, DOMAIN_ICONS, nextSeriesLevel, seriesPrerequisite, suggestDomain } from "@/lib/openbadges/badge-catalog";

type CourseOption = { id: string; title: string };

type Props = {
  name: string;
  onName: (value: string) => void;
  level: string;
  onLevel: (value: string) => void;
  description: string;
  onDescription: (value: string) => void;
  imageUploading: boolean;
  organizationId: string;
  onPickImage: (file: File) => void;
  onGenerateImage: () => void;
  builder: BadgeBuilderState;
  onBuilder: (patch: Partial<BadgeBuilderState>) => void;
  customMonths: string;
  onCustomMonths: (value: string) => void;
  organizations: { id: string; name: string }[];
  organizationName: (name: string) => string;
  onOrganization: (id: string) => void;
  courses: CourseOption[];
  requiresEnrollment: boolean;
  onRequiresEnrollment: (value: boolean) => void;
  requiredCourseId: string | null;
  onRequiredCourse: (id: string | null) => void;
  failureCourseId: string | null;
  onFailureCourse: (id: string | null) => void;
  errors: Record<string, string>;
  domains?: Array<{ id: string; name: string; color: string; icon: string }>;
  series?: Array<{ id: string; name: string }>;
  siblingBadges?: Array<{ id: string; name: string; seriesName?: string | null; level?: number | null }>;
  selfId?: string | null;
  onCreateDomain?: (domain: { name: string; color: string; icon: string }) => void;
  onCreateSeries?: (name: string) => void;
  compact?: boolean;
};

function FieldLabel({ children }: { children: string }) {
  return <p className="mb-2 text-sm font-medium text-[#A9B0CC]">{children}</p>;
}

function CourseRow({
  label,
  hint,
  value,
  courses,
  onChange,
}: {
  label: string;
  hint: string;
  value: string;
  courses: CourseOption[];
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1A2340] py-3">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-[#8C94B2]">{hint}</p>
      </div>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="max-w-xs rounded-full border border-[#26304F] bg-[#0B1122] px-4 py-2 text-sm">
        <option value="">Aucune</option>
        {courses.map((course) => (
          <option key={course.id} value={course.id}>{course.title}</option>
        ))}
      </select>
    </div>
  );
}

export function BadgeBuilderStepIdentity(props: Props) {
  const domains = props.domains ?? [];
  const series = props.series ?? [];
  const [domainText, setDomainText] = useState(props.builder.domain ?? "");
  const [seriesText, setSeriesText] = useState(props.builder.seriesName ?? "");
  const [domainColor, setDomainColor] = useState(props.builder.domainColor ?? DOMAIN_COLORS[0]);
  const [domainIcon, setDomainIcon] = useState(props.builder.domainIcon ?? DOMAIN_ICONS[0]);
  const domainMatch = useMemo(() => suggestDomain(domainText, domains), [domainText, domains]);
  const suggestedLevel = nextSeriesLevel((props.siblingBadges ?? []).filter((badge) => (badge.seriesName ?? "").toLowerCase() === seriesText.trim().toLowerCase()).map((badge) => badge.level ?? 0));
  const previous = seriesPrerequisite(seriesText, Number(props.level) || suggestedLevel, props.siblingBadges ?? [], props.selfId);
  const [wantsCourse, setWantsCourse] = useState(Boolean(props.builder.linkedCourseId));
  const [details, setDetails] = useState(false);
  const linked = wantsCourse;
  const courseTitle = props.courses.find((course) => course.id === props.builder.linkedCourseId)?.title;
  const validity = props.builder.validityMode === "12" ? "12 mois" : props.builder.validityMode === "24" ? "24 mois" : props.builder.validityMode === "custom" ? `${props.customMonths || "?"} mois` : "Permanent";

  return (
    <div className="space-y-5">
      <section className="rounded-[28px] border border-[#1A2340] bg-[#111831] p-5">
        <h2 className="mb-4 text-lg font-semibold">Le badge</h2>
        <FieldLabel>Nom du badge</FieldLabel>
        <input id="field-name" value={props.name} onChange={(event) => props.onName(event.target.value)} className="mb-4 w-full rounded-2xl border px-4 py-3 outline-none" />
        {props.errors.name ? <p className="mb-3 text-sm text-[#F2C15A]">{props.errors.name}</p> : null}
        {props.compact ? null : <>
        <FieldLabel>Série</FieldLabel>
        <input value={seriesText} onChange={(event) => setSeriesText(event.target.value)} onBlur={() => {
          const match = series.find((item) => item.name.toLowerCase() === seriesText.trim().toLowerCase());
          props.onBuilder({ seriesName: seriesText.trim() || null, seriesId: match?.id ?? null });
        }} placeholder="AI Prompting" className="mb-2 w-full rounded-2xl border px-4 py-3 outline-none" list="badge-series" />
        <datalist id="badge-series">{series.map((item) => <option key={item.id} value={item.name} />)}</datalist>
        {seriesText.trim() && !series.some((item) => item.name.toLowerCase() === seriesText.trim().toLowerCase()) ? (
          <button type="button" className="mb-3 text-sm text-[#B9B2FF]" onClick={() => { props.onCreateSeries?.(seriesText.trim()); props.onBuilder({ seriesName: seriesText.trim() }); }}>Créer la série « {seriesText.trim()} »</button>
        ) : null}
        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm text-[#A9B0CC]">
            Niveau
            <input id="field-level" type="number" min={1} value={props.level} onChange={(event) => props.onLevel(event.target.value)} className="mt-1 w-full rounded-2xl border px-4 py-3" />
          </label>
          <label className="text-sm text-[#A9B0CC]">
            Libellé du niveau
            <input value={props.builder.levelLabel ?? ""} onChange={(event) => props.onBuilder({ levelLabel: event.target.value || null })} placeholder="Initié, Confirmé, Expert…" className="mt-1 w-full rounded-2xl border px-4 py-3" />
          </label>
        </div>
        <button type="button" className="mb-4 text-sm text-[#B9B2FF]" onClick={() => { props.onLevel(String(suggestedLevel)); props.onBuilder({ seriesName: seriesText.trim() || null }); }}>Proposer le niveau {suggestedLevel}</button>
        {previous ? <p className="mb-4 text-sm text-[#F2C15A]">Le niveau {props.level || suggestedLevel} exige « {previous.name} ». Ce prérequis est ajouté automatiquement.</p> : null}
        </>}
        <div className="mb-1 flex items-center justify-between">
          <FieldLabel>Ce que le badge atteste</FieldLabel>
          <span className="text-xs text-[#8C94B2]">{props.description.length} / 300</span>
        </div>
        <textarea
          id="field-description"
          maxLength={300}
          rows={4}
          value={props.description}
          onChange={(event) => props.onDescription(event.target.value.slice(0, 300))}
          className="w-full rounded-2xl border px-4 py-3 outline-none"
        />
        <p className="mt-2 text-xs text-[#8C94B2]">Écrivez pour un recruteur.</p>
        {props.errors.description ? <p className="mt-2 text-sm text-[#F2C15A]">{props.errors.description}</p> : null}
        <div className="mt-5">
          <FieldLabel>Visuel</FieldLabel>
          <div className="flex flex-wrap gap-3">
            <label className="cursor-pointer rounded-full border border-[#26304F] px-4 py-2 text-sm font-semibold">
              Importer une image
              <input
                id="field-imageUrl"
                type="file"
                accept="image/png,image/svg+xml,image/jpeg"
                className="hidden"
                disabled={!props.organizationId || props.imageUploading}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) props.onPickImage(file);
                  event.target.value = "";
                }}
              />
            </label>
            <button type="button" onClick={props.onGenerateImage} disabled={props.imageUploading} className="rounded-full border border-[#6E5BFF] px-4 py-2 text-sm font-semibold text-[#B9B2FF] disabled:opacity-50">
              {props.imageUploading ? "Visuel…" : "Générer un visuel"}
            </button>
          </div>
          <p className="mt-2 text-xs text-[#8C94B2]">PNG ou SVG carré, 600 px minimum. Recadrage carré, placé au centre de l&apos;hologramme.</p>
          {props.errors.imageUrl ? <p className="mt-2 text-sm text-[#F2C15A]">{props.errors.imageUrl}</p> : null}
        </div>
      </section>

      {props.compact ? (
        <section className="rounded-[28px] border border-[#1A2340] bg-[#111831] p-5 text-sm">
          {courseTitle ? <p className="text-[#A9B0CC]">Lié à « {courseTitle} »{props.builder.courseRequiredBeforeExam ? " · formation requise avant l'épreuve" : ""} <button type="button" className="text-[#B9B2FF]" onClick={() => setDetails(true)}>Modifier</button></p> : null}
          <p className="mt-2 text-[#EEF0F7]">{[props.builder.domain, props.builder.seriesName ? `Série ${props.builder.seriesName} niveau ${props.level || suggestedLevel}` : null, achievementLabel(props.builder.achievementType), validity].filter(Boolean).join(" · ")} <button type="button" className="text-[#B9B2FF]" onClick={() => setDetails(true)}>Modifier</button></p>
        </section>
      ) : null}

      <div className={props.compact ? (details ? "fixed inset-y-0 right-0 z-50 w-full space-y-5 overflow-y-auto bg-[#0A0F1E] p-5 lg:w-[560px] lg:border-l lg:border-[#1A2340]" : "hidden") : "space-y-5"}>
      {props.compact && details ? <button type="button" className="text-sm text-[#A9B0CC]" onClick={() => setDetails(false)}>Fermer</button> : null}
      {props.compact ? (
        <section className="rounded-[28px] border border-[#1A2340] bg-[#111831] p-5">
          <FieldLabel>Série</FieldLabel>
          <input value={seriesText} onChange={(event) => setSeriesText(event.target.value)} onBlur={() => {
            const match = series.find((item) => item.name.toLowerCase() === seriesText.trim().toLowerCase());
            props.onBuilder({ seriesName: seriesText.trim() || null, seriesId: match?.id ?? null });
          }} placeholder="AI Prompting" className="mb-2 w-full rounded-2xl border px-4 py-3 outline-none" />
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm text-[#A9B0CC]">Niveau<input id="field-level" type="number" min={1} value={props.level} onChange={(event) => props.onLevel(event.target.value)} className="mt-1 w-full rounded-2xl border px-4 py-3" /></label>
            <label className="text-sm text-[#A9B0CC]">Libellé<input value={props.builder.levelLabel ?? ""} onChange={(event) => props.onBuilder({ levelLabel: event.target.value || null })} className="mt-1 w-full rounded-2xl border px-4 py-3" /></label>
          </div>
        </section>
      ) : null}
      <section className="rounded-[28px] border border-[#1A2340] bg-[#111831] p-5">
        <h2 className="mb-4 text-lg font-semibold">Cadre du badge</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <FieldLabel>Émetteur</FieldLabel>
            <select
              id="field-organizationId"
              value={props.organizationId}
              onChange={(event) => props.onOrganization(event.target.value)}
              className="w-full rounded-2xl border px-4 py-3"
            >
              {props.organizations.map((org) => (
                <option key={org.id} value={org.id}>{props.organizationName(org.name)}</option>
              ))}
            </select>
            <p className="mt-2 text-xs text-[#8C94B2]">Byound, ou une organisation qui a activé les badges internes.</p>
          </div>
          <div>
            <FieldLabel>Domaine</FieldLabel>
            <input value={domainText} onChange={(event) => setDomainText(event.target.value)} placeholder="Choisir ou créer" className="w-full rounded-2xl border px-4 py-3" list="badge-domains" />
            <datalist id="badge-domains">{domains.map((domain) => <option key={domain.id} value={domain.name} />)}</datalist>
            {domainMatch.exact ? (
              <button type="button" className="mt-2 text-sm text-[#B9B2FF]" onClick={() => props.onBuilder({ domain: domainMatch.exact?.name ?? null, domainId: domainMatch.exact?.id ?? null, domainColor: domainMatch.exact?.color ?? null, domainIcon: domainMatch.exact?.icon ?? null })}>Utiliser « {domainMatch.exact.name} »</button>
            ) : domainMatch.near ? (
              <p className="mt-2 text-sm text-[#F2C15A]">Vouliez-vous dire « {domainMatch.near.name} » ? <button type="button" className="text-[#B9B2FF]" onClick={() => { setDomainText(domainMatch.near?.name ?? ""); props.onBuilder({ domain: domainMatch.near?.name ?? null, domainId: domainMatch.near?.id ?? null, domainColor: domainMatch.near?.color ?? null, domainIcon: domainMatch.near?.icon ?? null }); }}>Oui</button></p>
            ) : domainText.trim() ? (
              <div className="mt-2 space-y-2">
                <p className="text-sm text-[#B9B2FF]">+ Créer « {domainText.trim()} »</p>
                <div className="flex flex-wrap gap-2">
                  {DOMAIN_COLORS.map((color) => <button key={color} type="button" aria-label={color} onClick={() => setDomainColor(color)} className="h-6 w-6 rounded-full" style={{ background: color, outline: domainColor === color ? "2px solid white" : "none" }} />)}
                </div>
                <div className="flex flex-wrap gap-2">
                  {DOMAIN_ICONS.map((icon) => <button key={icon} type="button" onClick={() => setDomainIcon(icon)} className={`rounded-full px-2 py-1 text-xs ${domainIcon === icon ? "bg-[#6E5BFF] text-white" : "border border-[#26304F]"}`}>{icon}</button>)}
                </div>
                <button type="button" className="rounded-full border border-[#26304F] px-3 py-1 text-sm" onClick={() => { props.onCreateDomain?.({ name: domainText.trim(), color: domainColor, icon: domainIcon }); props.onBuilder({ domain: domainText.trim(), domainColor, domainIcon }); }}>Créer le domaine</button>
              </div>
            ) : null}
          </div>
        </div>
        <div className="mt-4">
          <FieldLabel>Type de badge</FieldLabel>
          <div className="grid gap-3 md:grid-cols-3">
            {ACHIEVEMENT_TYPES.map((item) => {
              const selected = props.builder.achievementType === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => props.onBuilder({ achievementType: item.id })}
                  className={`rounded-2xl border px-4 py-3 text-left ${selected ? "border-[#6E5BFF] bg-[#6E5BFF]/15" : "border-[#1A2340] bg-[#0B1122]"}`}
                >
                  <span className="block text-sm font-semibold">{item.label}</span>
                  <span className="mt-1 block text-xs text-[#8C94B2]">{item.hint}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="mt-4">
          <FieldLabel>Validité</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {([
              ["permanent", "Permanent"],
              ["12", "12 mois"],
              ["24", "24 mois"],
              ["custom", "Personnalisé"],
            ] as const).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => props.onBuilder({ validityMode: id as ValidityMode })}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${props.builder.validityMode === id ? "bg-[#6E5BFF] text-white" : "border border-[#26304F] text-[#A9B0CC]"}`}
              >
                {label}
              </button>
            ))}
          </div>
          {props.builder.validityMode === "custom" ? (
            <input
              type="number"
              min={1}
              value={props.customMonths}
              onChange={(event) => props.onCustomMonths(event.target.value)}
              placeholder="Nombre de mois"
              className="mt-3 w-40 rounded-2xl border px-4 py-2"
            />
          ) : (
            <p className="mt-2 text-xs text-[#8C94B2]">La date de fin est calculée au moment de la délivrance.</p>
          )}
        </div>
      </section>

      <section className="rounded-[28px] border border-[#1A2340] bg-[#111831] p-5">
        <h2 className="mb-2 text-lg font-semibold">Ce badge est-il lié à une formation ?</h2>
        <div className="mb-3 flex w-fit rounded-full border border-[#26304F] bg-[#0B1122] p-1">
          {[false, true].map((value) => (
            <button key={String(value)} type="button" onClick={() => { setWantsCourse(value); props.onBuilder(value ? { courseRequiredBeforeExam: true } : { linkedCourseId: null, associatedCourseId: null, courseRequiredBeforeExam: false }); if (!value) { props.onRequiresEnrollment(false); props.onRequiredCourse(null); } }} className={`rounded-full px-4 py-1.5 text-sm font-semibold ${linked === value ? "bg-[#6E5BFF] text-white" : "text-[#A9B0CC]"}`}>{value ? "Oui" : "Non"}</button>
          ))}
        </div>
        {linked ? (
          <>
            <CourseRow
              label="Formation"
              hint="Le badge est proposé à la fin de cette formation."
              value={props.builder.linkedCourseId ?? ""}
              courses={props.courses}
              onChange={(id) => {
                props.onBuilder({ linkedCourseId: id || null, associatedCourseId: id || null, fallbackCourseId: props.builder.fallbackCourseId || id || null });
                props.onRequiredCourse(props.builder.courseRequiredBeforeExam ? id || null : null);
                props.onRequiresEnrollment(Boolean(id) && props.builder.courseRequiredBeforeExam);
                if (!props.failureCourseId) props.onFailureCourse(id || null);
              }}
            />
            <div className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div>
                <p className="text-sm font-medium">La formation doit être terminée avant de passer l&apos;épreuve</p>
                <p className="text-xs text-[#8C94B2]">Activé par défaut.</p>
              </div>
              <button type="button" onClick={() => {
                const next = !props.builder.courseRequiredBeforeExam;
                props.onBuilder({ courseRequiredBeforeExam: next });
                props.onRequiresEnrollment(next && Boolean(props.builder.linkedCourseId));
                props.onRequiredCourse(next ? props.builder.linkedCourseId : null);
              }} className={`rounded-full px-4 py-1.5 text-sm font-semibold ${props.builder.courseRequiredBeforeExam ? "bg-[#6E5BFF] text-white" : "border border-[#26304F] text-[#A9B0CC]"}`}>
                {props.builder.courseRequiredBeforeExam ? "Oui" : "Non"}
              </button>
            </div>
          </>
        ) : null}
        <CourseRow
          label="Formation proposée en cas d'échec"
          hint="Par défaut, la formation liée."
          value={props.failureCourseId ?? props.builder.linkedCourseId ?? ""}
          courses={props.courses}
          onChange={(id) => { props.onFailureCourse(id || null); props.onBuilder({ fallbackCourseId: id || null }); }}
        />
        {props.requiresEnrollment ? (
          <select
            id="field-requiredCourseId"
            value={props.requiredCourseId ?? ""}
            onChange={(event) => props.onRequiredCourse(event.target.value || null)}
            className="w-full rounded-2xl border px-4 py-3"
          >
            <option value="">Choisir la formation</option>
            {props.courses.map((course) => (
              <option key={course.id} value={course.id}>{course.title}</option>
            ))}
          </select>
        ) : null}
        {props.errors.requiredCourseId ? <p className="mt-2 text-sm text-[#F2C15A]">{props.errors.requiredCourseId}</p> : null}
      </section>
      </div>
    </div>
  );
}
