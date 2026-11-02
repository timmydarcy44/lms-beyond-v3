import { BehaviorQuadrant, IdmcPreview as IdmcBars, SoftSkillsPreview as SkillList } from "@/components/site/test-illustrations";
import { AXES_LABELS, IDMC_AXIS_KEYS, type AxisKey } from "@/lib/idmc/idmc-display";
import { SOFT_SKILLS } from "@/lib/soft-skills/questions";

/**
 * Aperçus décoratifs de l'accueil. Les noms viennent du produit.
 * Soft skills : les 5 premiers du classement fictif portent les titres réels du test.
 * IDMC : 8 axes réels. Le test comportemental reprend les quatre styles du produit.
 */

const SOFT_RANK = [
  "Écoute active",
  "Adaptabilité",
  "Collaboration et travail en équipe",
  "Sens de l'organisation",
  "Gestion du stress",
] as const;

const SOFT_DOTS = [5, 5, 4, 4, 3] as const;

const IDMC_LEVELS = ["Maîtrise experte", "Maîtrise opérationnelle", "Maîtrise en développement", "Maîtrise à construire"] as const;

const IDMC_FILLED: Record<AxisKey, number> = {
  A1: 4,
  A2: 3,
  A3: 3,
  A4: 2,
  A5: 4,
  A6: 2,
  A7: 3,
  A8: 1,
};

function skillTitle(name: string) {
  return SOFT_SKILLS.find((skill) => skill.titre === name)?.titre ?? name;
}

function Screen({
  title,
  pill,
  children,
}: {
  title: string;
  pill: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-[260px] items-stretch p-[18px]" aria-hidden>
      <div className="flex min-h-0 w-full flex-col overflow-hidden rounded-[18px] border border-white/10 bg-[#0B0C10] p-4 shadow-[0_16px_40px_rgba(0,0,0,0.28)]">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[12px] font-extrabold text-white">{title}</p>
          <span className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-extrabold text-white/80">{pill}</span>
        </div>
        <div className="mt-3 min-h-0 flex-1 overflow-hidden">{children}</div>
      </div>
    </div>
  );
}

export function SoftSkillsPreview() {
  return (
    <Screen title="Mes 5 points forts" pill="Soft Skills">
      <SkillList
        showTitle={false}
        title="Mes 5 points forts"
        compact
        rows={SOFT_RANK.map((name, index) => ({ label: skillTitle(name), filled: SOFT_DOTS[index] }))}
      />
    </Screen>
  );
}

export function IdmcPreview() {
  return (
    <Screen title="Mon profil d'apprentissage" pill="IDMC">
      <IdmcBars
        layout="inline"
        rows={IDMC_AXIS_KEYS.map((key) => {
          const filled = IDMC_FILLED[key];
          const levelColor = filled <= 1 ? "rgba(255,255,255,0.45)" : filled === 2 ? "#F2CF6B" : "#8DB8FF";
          return { name: AXES_LABELS[key], filled, level: IDMC_LEVELS[4 - filled], levelColor };
        })}
      />
    </Screen>
  );
}

export function BehaviorPreview() {
  return (
    <Screen title="Mon style de communication" pill="DISC">
      <div className="grid h-full grid-rows-[1fr_auto] gap-2">
        <BehaviorQuadrant
          cells={[
            { label: "Dominance", tone: "idle" },
            { label: "Influence", tone: "dominant" },
            { label: "Conformité", tone: "idle" },
            { label: "Stabilité", tone: "idle" },
          ]}
        />
        <p className="text-[11px] font-bold leading-snug text-white">
          Style dominant : Influence. Vous créez du lien et embarquez les autres.
        </p>
      </div>
    </Screen>
  );
}
