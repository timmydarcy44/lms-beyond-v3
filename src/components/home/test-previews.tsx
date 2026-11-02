import { AXES_LABELS, IDMC_AXIS_KEYS, type AxisKey } from "@/lib/idmc/idmc-display";
import { SOFT_SKILLS } from "@/lib/soft-skills/questions";

/**
 * Aperçus décoratifs. Les noms viennent du produit.
 * Soft skills : les 5 premiers du classement fictif portent les titres réels du test.
 * L'écran de résultats affiche un pourcentage ; ici le niveau tient en 5 points, sans pourcentage.
 * IDMC : 8 axes réels et 4 niveaux de maîtrise (pas les 4 dimensions du brief).
 * DISC : le produit dit Dominant, Influent, Stable, Consciencieux.
 * Le brief fige les quatre noms : Dominance, Influence, Stabilité, Conformité.
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
      <ol className="space-y-2">
        {SOFT_RANK.map((name, index) => (
          <li key={name} className="flex items-center gap-2">
            <span className="w-4 text-[11px] font-extrabold text-white/50">{index + 1}</span>
            <span className="min-w-0 flex-1 truncate text-[12px] font-bold text-white">{skillTitle(name)}</span>
            <span className="flex gap-1">
              {Array.from({ length: 5 }, (_, dot) => (
                <span
                  key={dot}
                  className={dot < SOFT_DOTS[index] ? "h-1.5 w-1.5 rounded-full bg-[#B9AFFF]" : "h-1.5 w-1.5 rounded-full bg-white/15"}
                />
              ))}
            </span>
          </li>
        ))}
      </ol>
    </Screen>
  );
}

export function IdmcPreview() {
  return (
    <Screen title="Mon profil d'apprentissage" pill="IDMC">
      <ul className="space-y-1.5">
        {IDMC_AXIS_KEYS.map((key) => {
          const filled = IDMC_FILLED[key];
          return (
            <li key={key} className="flex items-center gap-2">
              <span className="w-[42%] truncate text-[10px] font-bold text-white">{AXES_LABELS[key]}</span>
              <span className="flex w-14 gap-0.5">
                {Array.from({ length: 4 }, (_, index) => (
                  <span key={index} className={index < filled ? "h-1.5 flex-1 rounded-full bg-[#8DB8FF]" : "h-1.5 flex-1 rounded-full bg-white/15"} />
                ))}
              </span>
              <span
                className={
                  filled <= 1
                    ? "min-w-0 flex-1 truncate text-right text-[9px] font-bold text-white/45"
                    : filled === 2
                      ? "min-w-0 flex-1 truncate text-right text-[9px] font-bold text-[#F2CF6B]"
                      : "min-w-0 flex-1 truncate text-right text-[9px] font-bold text-[#8DB8FF]"
                }
              >
                {IDMC_LEVELS[4 - filled]}
              </span>
            </li>
          );
        })}
      </ul>
    </Screen>
  );
}

const DISC = [
  { name: "Dominance", hot: false },
  { name: "Influence", hot: true },
  { name: "Conformité", hot: false },
  { name: "Stabilité", hot: false },
] as const;

export function BehaviorPreview() {
  return (
    <Screen title="Mon style de communication" pill="DISC">
      <div className="grid h-full grid-rows-[1fr_auto] gap-2">
        <div className="grid grid-cols-2 gap-1.5">
          {DISC.map((item) => (
            <div
              key={item.name}
              className={item.hot ? "flex items-center justify-center rounded-xl bg-[#5EDCC3] px-2 text-center text-[11px] font-extrabold text-[#0B0C10]" : "flex items-center justify-center rounded-xl bg-white/10 px-2 text-center text-[11px] font-extrabold text-white/70"}
            >
              {item.name}
            </div>
          ))}
        </div>
        <p className="text-[11px] font-bold leading-snug text-white">
          Style dominant : Influence. Vous créez du lien et embarquez les autres.
        </p>
      </div>
    </Screen>
  );
}
