"use client";

import { useEffect, useState } from "react";
import { publishChecklist, type AccessMode, type BadgeBuilderState } from "@/lib/openbadges/badge-builder";

const ACCESS: Array<{ id: AccessMode | "course"; title: string }> = [
  { id: "all", title: "Tout le monde" },
  { id: "org", title: "Une organisation" },
  { id: "invite", title: "Sur invitation" },
  { id: "course", title: "Apprenants ayant terminé la formation" },
];

export function BadgeBuilderStepPublish({
  builder,
  onBuilder,
  checks,
  organizationId,
  authHeaders,
  currentBadgeId,
  locked,
  onCreateVersion,
  onComplete,
  courseRequired = false,
  onCourseRequired,
  essaiHref,
}: {
  builder: BadgeBuilderState;
  onBuilder: (patch: Partial<BadgeBuilderState>) => void;
  checks: ReturnType<typeof publishChecklist>;
  organizationId: string;
  authHeaders: Record<string, string>;
  currentBadgeId?: string;
  locked: boolean;
  onCreateVersion: () => void;
  onComplete: (step: number) => void;
  courseRequired?: boolean;
  onCourseRequired?: (value: boolean) => void;
  essaiHref?: string | null;
}) {
  const [badges, setBadges] = useState<Array<{ id: string; name: string }>>([]);
  const [accessOpen, setAccessOpen] = useState(false);
  const failing = checks.filter((item) => !item.ok);
  const ready = failing.length === 0;

  useEffect(() => {
    if (!organizationId) return;
    void fetch(`/api/admin/badgeclasses?organizationId=${encodeURIComponent(organizationId)}`, { headers: authHeaders })
      .then((response) => response.json())
      .then((payload: { badgeClasses?: Array<{ id?: string; name?: string }> }) => {
        const rows = Array.isArray(payload.badgeClasses) ? payload.badgeClasses : [];
        setBadges(rows.flatMap((item) => item.id && item.name && item.id !== currentBadgeId ? [{ id: item.id, name: item.name }] : []));
      })
      .catch(() => setBadges([]));
    // Les en-têtes sont recréés à chaque rendu. La liste suit l'organisation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId, currentBadgeId]);

  const patchExam = (patch: Partial<BadgeBuilderState["exam"]>) => onBuilder({ exam: { ...builder.exam, ...patch } });
  const lockedIds = new Set(builder.lockedPrerequisiteBadgeIds);
  const toggleBadge = (id: string) => {
    if (lockedIds.has(id)) return;
    const current = builder.exam.prerequisiteBadgeIds;
    patchExam({ prerequisiteBadgeIds: current.includes(id) ? current.filter((item) => item !== id) : [...current, id] });
  };

  const accessLabel = courseRequired
    ? "Apprenants ayant terminé la formation"
    : ACCESS.find((item) => item.id === builder.exam.accessMode)?.title ?? "Tout le monde";
  const criteriaCheck = checks.find((item) => item.id === "coverage" || item.id === "criteria");
  const examCheck = checks.find((item) => item.id === "exam");
  const expertCheck = checks.find((item) => item.id === "expert");

  return (
    <div className="space-y-5">
      <section className="rounded-[28px] border border-[#1A2340] bg-[#111831] p-5">
        {ready ? (
          <>
            <h2 className="text-lg font-semibold text-[#3DDCAB]">Tout est prêt</h2>
            <ul className="mt-3 space-y-2 text-sm text-[#3DDCAB]">
              <li>✓ Le badge</li>
              <li>✓ Critères{criteriaCheck ? ` · ${criteriaCheck.label}` : ""}</li>
              <li>✓ Épreuves{examCheck ? ` · ${examCheck.label}` : ""}</li>
              <li>✓ Expert{expertCheck ? ` · ${expertCheck.label}` : ""}</li>
            </ul>
          </>
        ) : (
          <>
            <h2 className="text-lg font-semibold">À corriger</h2>
            <ul className="mt-3 space-y-2">
              {failing.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className={item.required ? "text-[#F07178]" : "text-[#F2C15A]"}>{item.label}</span>
                  <button type="button" className="text-[#B9B2FF]" onClick={() => onComplete(item.step)}>Corriger</button>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section className="rounded-[28px] border border-[#1A2340] bg-[#111831] p-5 text-sm">
        <p>Qui peut le passer · {accessLabel} <button type="button" className="text-[#B9B2FF]" onClick={() => setAccessOpen((open) => !open)}>Modifier</button></p>
        {accessOpen ? (
          <div className="mt-3 grid gap-2">
            {ACCESS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (item.id === "course") onCourseRequired?.(true);
                  else {
                    onCourseRequired?.(false);
                    patchExam({ accessMode: item.id });
                  }
                  setAccessOpen(false);
                }}
                className="rounded-2xl border border-[#1A2340] px-3 py-2 text-left"
              >
                {item.title}
              </button>
            ))}
          </div>
        ) : null}
      </section>

      <section className="rounded-[28px] border border-[#1A2340] bg-[#111831] p-5">
        <h2 className="text-lg font-semibold">Prérequis</h2>
        <p className="mb-3 text-sm text-[#8C94B2]">D&apos;autres badges, avant de commencer. Les formations se règlent à l&apos;étape 1.</p>
        <div className="space-y-2">
          {badges.map((badge) => (
            <label key={badge.id} className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={builder.exam.prerequisiteBadgeIds.includes(badge.id)} disabled={lockedIds.has(badge.id)} onChange={() => toggleBadge(badge.id)} />
              {badge.name}{lockedIds.has(badge.id) ? " · exigé par la série" : ""}
            </label>
          ))}
          {badges.length === 0 ? <p className="text-sm text-[#8C94B2]">Aucun autre badge pour cette organisation.</p> : null}
        </div>
      </section>

      <section className="rounded-[28px] border border-[#1A2340] bg-[#111831] p-5 text-sm">
        {failing.length === 0 ? (
          <p className="text-[#3DDCAB]">✦ La relecture par l&apos;IA n&apos;a rien trouvé à corriger.</p>
        ) : (
          <ul className="space-y-1 text-[#F2C15A]">
            {failing.map((item) => <li key={item.id}>✦ {item.label}</li>)}
          </ul>
        )}
        {essaiHref ? <a href={essaiHref} target="_blank" rel="noreferrer" className="mt-3 inline-block text-[#B9B2FF]">Simuler 3 candidats</a> : null}
      </section>

      <section className="rounded-[28px] border border-[#F2C15A]/40 bg-[#F2C15A]/10 p-5 text-sm text-[#F2C15A]">
        Après publication, un badge déjà délivré garde la version qu&apos;il a reçue. Vous pourrez créer une nouvelle version.
        {locked ? (
          <button type="button" onClick={onCreateVersion} className="bb-white pointer-events-auto mt-3 block rounded-full px-4 py-2 font-semibold">
            Créer une nouvelle version
          </button>
        ) : null}
      </section>
    </div>
  );
}
