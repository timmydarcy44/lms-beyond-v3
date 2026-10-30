"use client";

import { useState } from "react";
import { toast } from "sonner";
import { EmptyState, TxRow } from "@/components/salarie/employee-fiche-blocks";
import { SoftSkillRanking } from "@/components/salarie/employee-skills";
import { AXES_LABELS, IDMC_AXIS_KEYS, resolveIdmcAxisMasteryLevel } from "@/lib/idmc/idmc-display";
import { EXPECTED_SOFT_SKILLS_COMPETENCE_COUNT } from "@/lib/soft-skills/resolve-soft-skills-result";

type DiscScores = { D: number; I: number; S: number; C: number };

const BEHAVIOR = [
  { key: "D" as const, label: "Décisionnel", color: "#07080B", sentence: "Privilégie l'action, les décisions rapides et les objectifs clairs." },
  { key: "I" as const, label: "Relationnel", color: "#6E5BFF", sentence: "Mise sur la communication, l'enthousiasme et la mobilisation des autres." },
  { key: "S" as const, label: "Stable", color: "#9A9DA6", sentence: "Recherche la stabilité, l'écoute et un rythme de travail régulier." },
  { key: "C" as const, label: "Structuré", color: "#C4B8A5", sentence: "Valorise la rigueur, la qualité et le respect des procédures." },
];

function formatDay(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

function levelColor(label: string) {
  const value = label.toLowerCase();
  if (value.includes("construire")) return "#E7782C";
  if (value.includes("développement") || value.includes("developpement")) return "#9A9DA6";
  if (value.includes("experte")) return "#1F9D57";
  return "#6E5BFF";
}

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function EmployeeTests({
  employeeId,
  firstName,
  shareConsent,
  shareConsentAt,
  disc,
  idmcScore,
  idmcAxes,
  softSkills,
  discAt,
  idmcAt,
  softSkillsAt,
}: {
  employeeId: string;
  firstName: string;
  shareConsent: boolean;
  shareConsentAt: string | null;
  disc: DiscScores | null;
  idmcScore: number | null;
  idmcAxes: Record<string, number> | null;
  softSkills: Array<{ skill: string; score: number }>;
  discAt: string | null;
  idmcAt: string | null;
  softSkillsAt: string | null;
}) {
  const [sending, setSending] = useState(false);
  const [softOpen, setSoftOpen] = useState(false);
  const name = firstName.trim() || "Ce collaborateur";

  if (!shareConsent) {
    return (
      <div className="mt-6">
        <EmptyState
          title="Résultats non partagés"
          detail={`Les résultats de tests ne sont visibles qu'avec l'accord de ${name}.`}
        />
      </div>
    );
  }

  const sharedAt = formatDay(shareConsentAt);
  const axes = IDMC_AXIS_KEYS.map((key) => {
    const score = Math.round(Number(idmcAxes?.[key] ?? 0));
    return { key, label: AXES_LABELS[key], score, mastery: resolveIdmcAxisMasteryLevel(score) };
  }).sort((a, b) => b.score - a.score);
  const axesShared = Boolean(idmcAxes && Object.values(idmcAxes).some((value) => Number(value) > 0));
  const idmcShared = idmcScore != null || axesShared;
  const idmcLevel = idmcScore != null ? resolveIdmcAxisMasteryLevel(Math.round(idmcScore)) : null;
  const softShared = softSkills.length > 0;
  const behavior = disc ? [...BEHAVIOR].sort((a, b) => Number(disc[b.key]) - Number(disc[a.key])) : [];
  const dominant = behavior[0] ?? null;
  const behaviorTotal = behavior.reduce((sum, item) => sum + Math.max(0, Number(disc?.[item.key] ?? 0)), 0);
  const hasAnyTest = idmcShared || softShared || Boolean(disc);
  const legend = [20, 50, 70, 90].map((score) => {
    const full = resolveIdmcAxisMasteryLevel(score);
    return { score, label: full.replace(/^Maîtrise\s+/i, ""), color: levelColor(full) };
  });

  const sendInvite = async () => {
    setSending(true);
    try {
      const res = await fetch("/api/dashboard/entreprise/diagnostics/remind", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employee_ids: [employeeId] }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Envoi impossible");
      toast.success("Invitation au diagnostic envoyée");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Envoi impossible");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mt-6 space-y-4">
      <div className="rounded-[26px] bg-[#E3F6EC] px-6 py-4 text-sm text-[#126B3B]">
        {name} a choisi de partager ses résultats avec son entreprise{sharedAt ? ` le ${sharedAt}` : ""}. Ce partage peut être retiré à tout moment.
      </div>

      <section className="rounded-[26px] bg-white px-6 py-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-extrabold text-[#07080B]">Tests passés</h2>
          <button
            type="button"
            onClick={() => void sendInvite()}
            disabled={sending}
            className="h-11 rounded-full bg-[#6E5BFF] px-4 text-sm font-semibold text-white disabled:opacity-60"
          >
            {sending ? "Envoi…" : "Envoyer un nouveau test"}
          </button>
        </div>
        {hasAnyTest ? (
          <div className="mt-2">
            {idmcShared ? (
              <TxRow
                tone="#6E5BFF"
                title="IDMC"
                detail={["Score global", formatDay(idmcAt)].filter(Boolean).join(" · ")}
                meta={idmcScore != null ? `${Math.round(idmcScore)} / 100` : "Axes"}
                onOpen={() => scrollToId("employee-idmc")}
              />
            ) : null}
            {softShared ? (
              <TxRow
                tone="#1F9D57"
                title="Soft skills"
                detail={["Référentiel Byound", `${softSkills.length} compétences`, formatDay(softSkillsAt)].filter(Boolean).join(" · ")}
                meta={`${softSkills.length} / ${EXPECTED_SOFT_SKILLS_COMPETENCE_COUNT}`}
                onOpen={() => scrollToId("employee-soft-skills")}
              />
            ) : null}
            {disc && dominant ? (
              <TxRow
                tone={dominant.color}
                title="Test comportemental"
                detail={[dominant.label, formatDay(discAt)].filter(Boolean).join(" · ")}
                meta={dominant.label}
                onOpen={() => scrollToId("employee-behavior")}
              />
            ) : null}
          </div>
        ) : (
          <p className="mt-4 text-sm text-[#6B6F7A]">Aucun test partagé pour le moment.</p>
        )}
      </section>

      {hasAnyTest ? (
        <div className="grid grid-cols-1 gap-4 min-[1100px]:grid-cols-[1.2fr_1fr]">
          {idmcShared ? (
            <section id="employee-idmc" className="rounded-[26px] bg-white px-6 py-5">
              <h2 className="text-lg font-extrabold text-[#07080B]">IDMC</h2>
              {idmcScore != null ? (
                <>
                  <p className="mt-3 text-[38px] font-extrabold leading-none text-[#07080B]">{Math.round(idmcScore)} / 100</p>
                  <p className="mt-3 max-w-md text-sm leading-relaxed text-[#3A3D45]">
                    Moyenne des huit axes : {idmcLevel ? `${idmcLevel.charAt(0).toLowerCase()}${idmcLevel.slice(1)}` : ""}. Le détail est dans les barres.
                  </p>
                </>
              ) : (
                <p className="mt-3 text-sm text-[#6B6F7A]">Score global non disponible.</p>
              )}
              <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
                {legend.map((item) => (
                  <li key={item.score} className="flex items-center gap-2 text-sm text-[#3A3D45]">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: item.color }} aria-hidden />
                    {item.label}
                  </li>
                ))}
              </ul>
              {axesShared ? (
                <div className="mt-5 space-y-3">
                  {axes.map((axis) => (
                    <div key={axis.key}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[#07080B]">{axis.label}</span>
                        <span className="font-semibold text-[#07080B]">{axis.score}</span>
                      </div>
                      <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-[#ECE9E1]" aria-hidden>
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${Math.max(0, Math.min(100, axis.score))}%`, background: levelColor(axis.mastery) }}
                        />
                      </div>
                      <p className="sr-only">
                        {axis.label} : {axis.score} sur 100, {axis.mastery}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-5 text-sm text-[#6B6F7A]">Seul le score global est partagé. Les axes ne sont pas disponibles.</p>
              )}
            </section>
          ) : (
            <EmptyState title="IDMC non partagé" detail={`${name} n'a pas partagé ce test.`} />
          )}

          {disc && dominant ? (
            <section id="employee-behavior" className="rounded-[26px] bg-white px-6 py-5">
              <p className="text-sm text-[#6B6F7A]">Dominante</p>
              <p className="mt-2 text-[38px] font-extrabold leading-none text-[#07080B]">{dominant.label}</p>
              <p className="mt-3 text-sm text-[#3A3D45]">{dominant.sentence}</p>
              <div className="mt-5 flex h-3.5 overflow-hidden rounded-full" aria-hidden>
                {behavior.map((item) => (
                  <span
                    key={item.key}
                    style={{
                      width: `${behaviorTotal > 0 ? (Math.max(0, Number(disc[item.key])) / behaviorTotal) * 100 : 25}%`,
                      background: item.color,
                    }}
                  />
                ))}
              </div>
              <ul className="mt-4 space-y-2">
                {behavior.map((item) => (
                  <li key={item.key} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-[#07080B]">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: item.color }} aria-hidden />
                      {item.label}
                    </span>
                    <span className="font-semibold">{Math.round(Number(disc[item.key]))}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : (
            <EmptyState title="Test comportemental non partagé" detail={`${name} n'a pas partagé ce test.`} />
          )}
        </div>
      ) : null}

      <div id="employee-soft-skills">
        {softShared ? (
          <SoftSkillRanking skills={softSkills} expanded={softOpen} onToggle={() => setSoftOpen((value) => !value)} />
        ) : (
          <div className="rounded-[26px] bg-white px-6 py-5">
            <h2 className="text-lg font-extrabold text-[#07080B]">Soft skills</h2>
            <p className="mt-2 text-sm text-[#6B6F7A]">Aucun soft skill partagé pour le moment.</p>
          </div>
        )}
      </div>
    </div>
  );
}
