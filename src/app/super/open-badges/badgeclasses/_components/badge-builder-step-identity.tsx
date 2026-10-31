"use client";

import { Sparkles } from "lucide-react";
import { ACHIEVEMENT_TYPES, BADGE_DOMAINS, type BadgeBuilderState, type ValidityMode } from "@/lib/openbadges/badge-builder";

type CourseOption = { id: string; title: string };

type Props = {
  aiPrompt: string;
  aiGenerating: boolean;
  onAiPrompt: (value: string) => void;
  onGenerate: () => void;
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
  const levels = ["1", "2", "3"];
  if (props.level && !levels.includes(props.level)) levels.push(props.level);

  return (
    <div className="space-y-5">
      <section className="rounded-[28px] border border-[#6E5BFF]/40 bg-gradient-to-br from-[#241C4A] to-[#15182B] p-5">
        <div className="mb-3 flex items-center gap-2 text-[#B9B2FF]">
          <Sparkles className="h-4 w-4" />
          <h2 className="text-base font-semibold">Partir d&apos;une description</h2>
        </div>
        <p className="mb-3 text-sm text-[#A9B0CC]">
          L&apos;IA remplit le nom, la description, les critères et propose l&apos;épreuve. Tout reste modifiable.
        </p>
        <textarea
          value={props.aiPrompt}
          onChange={(event) => props.onAiPrompt(event.target.value)}
          rows={3}
          placeholder="Badge niveau 1 pour valider la capacité à rédiger des prompts efficaces…"
          className="w-full rounded-2xl border border-[#26304F] bg-[#0B1122] px-4 py-3 text-sm outline-none"
        />
        <button
          type="button"
          onClick={props.onGenerate}
          disabled={props.aiGenerating}
          className="bb-white mt-3 rounded-full px-4 py-2 text-sm font-semibold disabled:opacity-50"
        >
          {props.aiGenerating ? "Génération…" : "Générer"}
        </button>
      </section>

      <section className="rounded-[28px] border border-[#1A2340] bg-[#111831] p-5">
        <h2 className="mb-4 text-lg font-semibold">Le badge</h2>
        <FieldLabel>Nom du badge</FieldLabel>
        <input id="field-name" value={props.name} onChange={(event) => props.onName(event.target.value)} className="mb-4 w-full rounded-2xl border px-4 py-3 outline-none" />
        {props.errors.name ? <p className="mb-3 text-sm text-[#F2C15A]">{props.errors.name}</p> : null}
        <FieldLabel>Niveau</FieldLabel>
        <div id="field-level" className="mb-4 flex w-fit rounded-full border border-[#26304F] bg-[#0B1122] p-1">
          {levels.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => props.onLevel(item)}
              className={`h-9 w-10 rounded-full text-sm font-semibold ${props.level === item ? "bg-[#6E5BFF] text-white" : "text-[#A9B0CC]"}`}
            >
              {item}
            </button>
          ))}
        </div>
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
            <select
              value={props.builder.domain ?? ""}
              onChange={(event) => props.onBuilder({ domain: event.target.value || null })}
              className="w-full rounded-2xl border px-4 py-3"
            >
              <option value="">Choisir</option>
              {BADGE_DOMAINS.map((domain) => (
                <option key={domain} value={domain}>{domain}</option>
              ))}
            </select>
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
        <h2 className="mb-2 text-lg font-semibold">Formation liée</h2>
        <CourseRow
          label="Formation associée"
          hint="Le badge est proposé à la fin de cette formation."
          value={props.builder.associatedCourseId ?? ""}
          courses={props.courses}
          onChange={(id) => props.onBuilder({ associatedCourseId: id || null })}
        />
        <CourseRow
          label="En cas d'échec"
          hint="Formation proposée sur l'écran de résultat."
          value={props.failureCourseId ?? ""}
          courses={props.courses}
          onChange={(id) => props.onFailureCourse(id || null)}
        />
        <div className="flex flex-wrap items-center justify-between gap-3 py-3">
          <div>
            <p className="text-sm font-medium">Formation obligatoire avant l&apos;épreuve</p>
            <p className="text-xs text-[#8C94B2]">L&apos;apprenant doit l&apos;avoir suivie avant de commencer.</p>
          </div>
          <div className="flex rounded-full border border-[#26304F] bg-[#0B1122] p-1">
            {([false, true] as const).map((value) => (
              <button
                key={String(value)}
                type="button"
                onClick={() => props.onRequiresEnrollment(value)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold ${props.requiresEnrollment === value ? "bg-[#6E5BFF] text-white" : "text-[#A9B0CC]"}`}
              >
                {value ? "Oui" : "Non"}
              </button>
            ))}
          </div>
        </div>
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
  );
}
