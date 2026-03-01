"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { DebriefPanel } from "@/components/beyond-fc/DebriefPanel";
import { MoneyInput } from "@/components/beyond-fc/MoneyInput";
import { TourIntroModal } from "@/components/beyond-fc/TourIntroModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import {
  AppliedDecisions,
  JERSEY_SIZES,
  SliderDecision,
  turnTemplates,
} from "@/modules/beyond-play";
import { useGameSession } from "@/modules/beyond-play/ui/GameSessionContext";

type SizeAllocationState = Record<string, number>;

const INTRO_SESSION_KEY_T1 = "beyondfc_seen_intro_t1";
const INTRO_VIDEO_SRC =
  "https://fqqqejpakbccwvrlolpc.supabase.co/storage/v1/object/public/Center/openbadge.mp4";

export default function BeyondFCTurnPage() {
  const router = useRouter();
  const params = useParams<{ turnNumber?: string | string[] }>();
  const { worldBible, history, runTurn } = useGameSession();

  const turnParam = Array.isArray(params?.turnNumber)
    ? params?.turnNumber[0]
    : params?.turnNumber;
  const parsedTurn = Number.parseInt(turnParam ?? "1", 10);
  const turnNumber = Number.isNaN(parsedTurn) ? 1 : parsedTurn;
  const template = useMemo(
    () => turnTemplates.find((turn) => turn.turnNumber === turnNumber),
    [turnNumber],
  );
  const hasNextTurn = useMemo(
    () => turnTemplates.some((turn) => turn.turnNumber === turnNumber + 1),
    [turnNumber],
  );
  const previousEntry = useMemo(
    () => history.find((entry) => entry.turnNumber === turnNumber - 1),
    [history, turnNumber],
  );

  const navigateNext = () => {
    if (hasNextTurn) {
      router.push(`/beyond-fc/tour/${turnNumber + 1}`);
    } else {
      router.push("/beyond-fc");
    }
  };

  const handleRun = async (decisions: AppliedDecisions) => {
    await runTurn(turnNumber, decisions);
    navigateNext();
  };

  if (!Number.isFinite(turnNumber) || !template) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Card className="border-white/10 bg-slate-900/70 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Tour indisponible</CardTitle>
            <CardDescription>
              Ce tour n'est pas encore disponible dans la verticale Beyond FC.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/beyond-fc")}>Retour à l’accueil</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-8 pb-24">
      <header className="space-y-2">
        <Badge variant="outline" className="border-blue-400/40 bg-blue-500/10 text-blue-100">
          Tour {turnNumber}
        </Badge>
        <h1 className="text-3xl font-semibold">{template.title}</h1>
        {template.learningGoal ? (
          <p className="max-w-3xl text-sm text-white/70">{template.learningGoal}</p>
        ) : null}
      </header>

      {turnNumber > 1 ? <DebriefPanel previousEntry={previousEntry} /> : null}

      <DecisionPanel
        turnNumber={turnNumber}
        template={template}
        worldBible={worldBible}
        onSubmit={handleRun}
      />
    </div>
  );
}

type DecisionPanelProps = {
  turnNumber: number;
  template: (typeof turnTemplates)[number];
  worldBible: ReturnType<typeof useGameSession>["worldBible"];
  onSubmit: (decisions: AppliedDecisions) => Promise<void>;
};

function DecisionPanel({ turnNumber, template, worldBible, onSubmit }: DecisionPanelProps) {
  if (turnNumber === 1) {
    return (
      <TurnOneDecisionForm
        template={template}
        worldBible={worldBible}
        onSubmit={onSubmit}
      />
    );
  }

  if (turnNumber === 2) {
    return (
      <TurnTwoDecisionForm
        template={template}
        onSubmit={onSubmit}
      />
    );
  }

  return (
    <Card className="border-white/10 bg-slate-900/70 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>Tour non configuré</CardTitle>
        <CardDescription>
          Ce tour n’a pas encore de formulaire de décisions dans l’interface apprenant.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-white/70">
          Retrouvez l’expérience complète dans la console super-admin pour calibrer les tours
          suivants.
        </p>
      </CardContent>
    </Card>
  );
}

type TurnOneDecisionFormProps = {
  template: (typeof turnTemplates)[number];
  worldBible: ReturnType<typeof useGameSession>["worldBible"];
  onSubmit: (decisions: AppliedDecisions) => Promise<void>;
};

const jerseyStyles = [
  {
    value: "TRADITIONAL",
    title: "Traditionnel",
    description: "Respect de l’histoire du club, rassurant pour les supporters fidèles.",
    img: "/beyond-fc/jerseys/traditional.png",
  },
  {
    value: "MODERN",
    title: "Moderne",
    description: "Design dynamique pour séduire un public plus jeune et connecté.",
    img: "/beyond-fc/jerseys/modern.png",
  },
  {
    value: "PREMIUM",
    title: "Premium",
    description: "Positionnement haut de gamme avec finitions exclusives.",
    img: "/beyond-fc/jerseys/premium.png",
  },
  {
    value: "RUPTURE",
    title: "Rupture",
    description: "Création audacieuse qui peut créer l’engouement… ou la polémique.",
    img: "/beyond-fc/jerseys/rupture.png",
  },
];

function TurnOneDecisionForm({ template, worldBible, onSubmit }: TurnOneDecisionFormProps) {
  const [introOpen, setIntroOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!sessionStorage.getItem(INTRO_SESSION_KEY_T1)) {
      setIntroOpen(true);
    }
  }, []);

  const dismissIntro = () => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(INTRO_SESSION_KEY_T1, "1");
    }
    setIntroOpen(false);
  };

  const slidersById = useMemo(() => {
    const map: Record<string, SliderDecision> = {};
    template.requiredDecisions.sliders.forEach((slider) => {
      map[slider.id] = slider;
    });
    return map;
  }, [template.requiredDecisions.sliders]);

  const defaultMix = worldBible.merchandising.jerseyDefaultSizeMix;
  const styleChoice = template.requiredDecisions.choices.find(
    (choice) => choice.id === "C_JERSEY_STYLE",
  );
  const defaultStyle =
    styleChoice?.options[0]?.id ?? jerseyStyles[0]?.value ?? "TRADITIONAL";

  const [style, setStyle] = useState<string>(defaultStyle);
  const [volume, setVolume] = useState<number>(
    slidersById["S_JERSEY_PRODUCTION_VOLUME"]?.defaultValue ?? 8000,
  );
  const [jerseyPrice, setJerseyPrice] = useState<number>(
    slidersById["S_JERSEY_PRICE_HT"]?.defaultValue ?? worldBible.referencePrices.jersey,
  );
  const [ticketVirage, setTicketVirage] = useState<number>(
    slidersById["S_TICKET_PRICE_VIRAGE"]?.defaultValue ?? worldBible.referencePrices.ticket.virage,
  );
  const [ticketCentrale, setTicketCentrale] = useState<number>(
    slidersById["S_TICKET_PRICE_CENTRALE"]?.defaultValue ??
      worldBible.referencePrices.ticket.centrale,
  );
  const [vipSeatPrice, setVipSeatPrice] = useState<number>(
    slidersById["S_VIP_SEAT_PRICE_HT"]?.defaultValue ??
      worldBible.vip?.defaultSeatPrice ??
      worldBible.referencePrices.ticket.hospitality,
  );
  const [vipBoxPrice, setVipBoxPrice] = useState<number>(
    slidersById["S_VIP_BOX_PACK_PRICE_HT"]?.defaultValue ??
      worldBible.vip?.defaultBoxPackPrice ??
      35000,
  );
  const [vipBoxesSold, setVipBoxesSold] = useState<number>(
    slidersById["S_VIP_BOXES_SOLD"]?.defaultValue ??
      Math.min(12, worldBible.vip?.vipBoxMaxSoldPerMatch ?? 12),
  );

  const [sizeAllocation, setSizeAllocation] = useState<SizeAllocationState>(() => {
    const initial: SizeAllocationState = {};
    JERSEY_SIZES.forEach((size) => {
      initial[size] = Math.round((defaultMix[size] ?? 0) * 100);
    });
    return initial;
  });

  const allocationSum = useMemo(
    () => JERSEY_SIZES.reduce((total, size) => total + (sizeAllocation[size] ?? 0), 0),
    [sizeAllocation],
  );
  const allocationValid = Math.abs(allocationSum - 100) <= 1;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!allocationValid) return;

    const decisions: AppliedDecisions = {
      choices: {
        C_JERSEY_STYLE: style,
      },
      sliders: {
        S_JERSEY_PRODUCTION_VOLUME: volume,
        S_JERSEY_PRICE_HT: jerseyPrice,
        S_TICKET_PRICE_VIRAGE: ticketVirage,
        S_TICKET_PRICE_CENTRALE: ticketCentrale,
        S_VIP_SEAT_PRICE_HT: vipSeatPrice,
        S_VIP_BOX_PACK_PRICE_HT: vipBoxPrice,
        S_VIP_BOXES_SOLD: vipBoxesSold,
        S_JERSEY_SIZE_XXS: sizeAllocation.XXS ?? 0,
        S_JERSEY_SIZE_XS: sizeAllocation.XS ?? 0,
        S_JERSEY_SIZE_S: sizeAllocation.S ?? 0,
        S_JERSEY_SIZE_M: sizeAllocation.M ?? 0,
        S_JERSEY_SIZE_L: sizeAllocation.L ?? 0,
        S_JERSEY_SIZE_XL: sizeAllocation.XL ?? 0,
        S_JERSEY_SIZE_XXL: sizeAllocation.XXL ?? 0,
      },
    };

    await onSubmit(decisions);
  };

  return (
    <>
      <TourIntroModal
        open={introOpen}
        title="Briefing — Lancement de la saison"
        description="Le board attend une révélation réussie du maillot. Ajustez production, prix et storytelling avant la conférence."
        videoSrc={INTRO_VIDEO_SRC}
        onSkip={dismissIntro}
        onContinue={dismissIntro}
      />

      <form onSubmit={handleSubmit} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)]">
        <Card className="border-white/10 bg-slate-900/70 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Identité du maillot</CardTitle>
            <CardDescription>
              Sélectionnez le concept créatif. Le style influencera la réaction des supporters lors du débrief.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {jerseyStyles.map((option) => (
                <JerseyStyleCard
                  key={option.value}
                  option={option}
                  selected={style === option.value}
                  onSelect={setStyle}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-slate-900/70 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Production de maillots</CardTitle>
            <CardDescription>
              Calibrez volume global et mix par taille. L’exécution influencera les KPIs du débrief suivant.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <SliderField
              label="Volume total (unités)"
              value={volume}
              slider={slidersById["S_JERSEY_PRODUCTION_VOLUME"]}
              formatValue={(val) => `${val.toLocaleString("fr-FR")} unités`}
              onChange={setVolume}
            />

            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <p className="font-medium text-white">Répartition par tailles (%)</p>
                <span className={cn("text-xs", allocationValid ? "text-emerald-300" : "text-amber-300")}>
                  Total : {allocationSum.toFixed(1)} %
                  {!allocationValid && " · Ajustez pour atteindre 100 %"}
                </span>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {JERSEY_SIZES.map((size) => {
                  const sliderId = `S_JERSEY_SIZE_${size}` as keyof typeof slidersById;
                  const config = slidersById[sliderId as string];
                  return (
                    <SliderField
                      key={size}
                      label={`Taille ${size}`}
                      value={sizeAllocation[size] ?? 0}
                      slider={
                        config ?? {
                          id: sliderId as string,
                          label: `Taille ${size}`,
                          metric: "custom",
                          unit: "%",
                          min: 0,
                          max: 40,
                          step: 1,
                          defaultValue: Math.round((defaultMix[size] ?? 0) * 100),
                        }
                      }
                      formatValue={(val) => `${val.toFixed(1)} %`}
                      onChange={(val) =>
                        setSizeAllocation((current) => ({
                          ...current,
                          [size]: val,
                        }))
                      }
                    />
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-slate-900/70 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Politique de prix</CardTitle>
            <CardDescription>
              Fixez vos prix sans prévisualisation : le débrief du prochain tour analysera la rentabilité réelle.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2 rounded-xl border border-blue-400/40 bg-blue-500/10 p-4 text-xs text-blue-100">
              <p>
                Chaque spectateur coûte{" "}
                <span className="font-semibold">
                  {worldBible.matchdayCosts.stadiumCostPerAttendee.toFixed(2)} € HT
                </span>{" "}
                en exploitation (sécurité, services, énergie).
              </p>
              <p>
                Les hospitalités mobilisent{" "}
                <span className="font-semibold">
                  {worldBible.vip?.vipHospitalityFixedCostPerMatch?.toLocaleString("fr-FR") ?? "75 000"} €
                </span>{" "}
                de charges fixes dès qu’elles sont ouvertes.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <MoneyInput
                label="Prix maillot (HT)"
                value={jerseyPrice}
                min={slidersById["S_JERSEY_PRICE_HT"]?.min}
                max={slidersById["S_JERSEY_PRICE_HT"]?.max}
                step={slidersById["S_JERSEY_PRICE_HT"]?.step}
                onChange={setJerseyPrice}
              />
              <MoneyInput
                label="Billetterie Virage"
                value={ticketVirage}
                min={slidersById["S_TICKET_PRICE_VIRAGE"]?.min}
                max={slidersById["S_TICKET_PRICE_VIRAGE"]?.max}
                step={slidersById["S_TICKET_PRICE_VIRAGE"]?.step}
                onChange={setTicketVirage}
              />
              <MoneyInput
                label="Billetterie Centrale"
                value={ticketCentrale}
                min={slidersById["S_TICKET_PRICE_CENTRALE"]?.min}
                max={slidersById["S_TICKET_PRICE_CENTRALE"]?.max}
                step={slidersById["S_TICKET_PRICE_CENTRALE"]?.step}
                onChange={setTicketCentrale}
              />
              <MoneyInput
                label="Siège VIP (HT)"
                value={vipSeatPrice}
                min={slidersById["S_VIP_SEAT_PRICE_HT"]?.min}
                max={slidersById["S_VIP_SEAT_PRICE_HT"]?.max}
                step={slidersById["S_VIP_SEAT_PRICE_HT"]?.step}
                onChange={setVipSeatPrice}
              />
              <MoneyInput
                label="Pack loge VIP (HT)"
                value={vipBoxPrice}
                min={slidersById["S_VIP_BOX_PACK_PRICE_HT"]?.min}
                max={slidersById["S_VIP_BOX_PACK_PRICE_HT"]?.max}
                step={slidersById["S_VIP_BOX_PACK_PRICE_HT"]?.step}
                onChange={setVipBoxPrice}
              />
            </div>

            <SliderField
              label="Loges vendues"
              value={vipBoxesSold}
              slider={slidersById["S_VIP_BOXES_SOLD"]}
              formatValue={(val) => `${Math.round(val)} loges`}
              onChange={(val) => setVipBoxesSold(Math.round(val))}
            />
          </CardContent>
        </Card>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-900/60 p-4">
          {!allocationValid ? (
            <p className="text-sm text-amber-300">
              Ajustez la répartition des tailles pour atteindre 100 %.
            </p>
          ) : (
            <p className="text-sm text-white/70">
              Validez le tour pour découvrir le débrief détaillé au prochain tour.
            </p>
          )}
          <Button type="submit" size="lg" disabled={!allocationValid}>
            Valider mes décisions
          </Button>
        </div>
      </form>
    </>
  );
}

type TurnTwoDecisionFormProps = {
  template: (typeof turnTemplates)[number];
  onSubmit: (decisions: AppliedDecisions) => Promise<void>;
};

function TurnTwoDecisionForm({ template, onSubmit }: TurnTwoDecisionFormProps) {
  const slidersById = useMemo(() => {
    const map: Record<string, SliderDecision> = {};
    template.requiredDecisions.sliders.forEach((slider) => {
      map[slider.id] = slider;
    });
    return map;
  }, [template.requiredDecisions.sliders]);

  const [ledPrice, setLedPrice] = useState<number>(
    slidersById["S_LED_PRICE_MATCH_HT"]?.defaultValue ?? 20000,
  );
  const [screenPrice, setScreenPrice] = useState<number>(
    slidersById["S_SCREEN_PRICE_MATCH_HT"]?.defaultValue ?? 12000,
  );
  const [matchdayPackPrice, setMatchdayPackPrice] = useState<number>(
    slidersById["S_MATCHDAY_PACK_PRICE_HT"]?.defaultValue ?? 24000,
  );
  const [instagramPostPrice, setInstagramPostPrice] = useState<number>(
    slidersById["S_IG_POST_PRICE_HT"]?.defaultValue ?? 3500,
  );
  const [instagramStoryPrice, setInstagramStoryPrice] = useState<number>(
    slidersById["S_IG_STORY_PRICE_HT"]?.defaultValue ?? 2800,
  );
  const [socialPackPrice, setSocialPackPrice] = useState<number>(
    slidersById["S_SOCIAL_PACK_PRICE_HT"]?.defaultValue ?? 7800,
  );
  const [positioning, setPositioning] = useState<string>(
    template.requiredDecisions.choices[0]?.options[0]?.id ?? "B",
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const decisions: AppliedDecisions = {
      choices: {
        C_SPONSOR_POSITIONING: positioning,
      },
      sliders: {
        S_LED_PRICE_MATCH_HT: ledPrice,
        S_SCREEN_PRICE_MATCH_HT: screenPrice,
        S_MATCHDAY_PACK_PRICE_HT: matchdayPackPrice,
        S_IG_POST_PRICE_HT: instagramPostPrice,
        S_IG_STORY_PRICE_HT: instagramStoryPrice,
        S_SOCIAL_PACK_PRICE_HT: socialPackPrice,
      },
    };

    await onSubmit(decisions);
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-6">
      <Card className="border-white/10 bg-slate-900/70 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Contexte marché</CardTitle>
          <CardDescription>
            Les partenaires comparent vos offres à d’autres clubs : un club de basket Pro&nbsp;B met
            en avant des packs LED agressifs, tandis qu’un club de rugby voisin valorise son écran
            géant et ses hospitalités. Côté digital, certains comptes rivalisent avec une portée bien
            plus forte, d’autres proposent des activations plus modestes mais flexibles.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card className="border-white/10 bg-slate-900/70 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Grille commerciale</CardTitle>
          <CardDescription>
            Fixez les tarifs des packs LED, écran géant, activation Instagram et offre matchday.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="grid gap-4 md:grid-cols-2">
            <MoneyInput
              label="LED bord terrain (HT/match)"
              value={ledPrice}
              onChange={setLedPrice}
            />
            <MoneyInput
              label="Écran géant (HT/match)"
              value={screenPrice}
              onChange={setScreenPrice}
            />
            <MoneyInput
              label="Pack matchday (loge + activation)"
              value={matchdayPackPrice}
              onChange={setMatchdayPackPrice}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <MoneyInput
              label="Post Instagram sponsorisé"
              value={instagramPostPrice}
              onChange={setInstagramPostPrice}
            />
            <MoneyInput
              label="Story Instagram sponsorisée"
              value={instagramStoryPrice}
              onChange={setInstagramStoryPrice}
            />
            <MoneyInput
              label="Pack social (bundle)"
              value={socialPackPrice}
              onChange={setSocialPackPrice}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-slate-900/70 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Positionnement commercial</CardTitle>
          <CardDescription>
            Choisissez la stratégie globale présentée aux partenaires. Le débrief du tour 3
            reflètera l’impact de votre choix.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {template.requiredDecisions.choices
            .find((choice) => choice.id === "C_SPONSOR_POSITIONING")
            ?.options.map((option) => (
              <button
                type="button"
                key={option.id}
                onClick={() => setPositioning(option.id)}
                className={cn(
                  "w-full rounded-lg border px-4 py-3 text-left transition",
                  positioning === option.id
                    ? "border-blue-400/60 bg-blue-500/10"
                    : "border-white/10 bg-white/5 hover:border-blue-300/40 hover:bg-blue-500/5",
                )}
              >
                <p className="text-sm font-semibold text-white">{option.label}</p>
                {option.hint ? (
                  <p className="text-xs text-white/60">{option.hint}</p>
                ) : null}
              </button>
            ))}
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-end gap-3 rounded-xl border border-white/10 bg-slate-900/60 p-4">
        <Button type="submit" size="lg">
          Valider mes décisions
        </Button>
      </div>
    </form>
  );
}

type SliderFieldProps = {
  label: string;
  value: number;
  slider?: SliderDecision;
  formatValue: (value: number) => string;
  onChange: (value: number) => void;
};

function SliderField({ label, value, slider, formatValue, onChange }: SliderFieldProps) {
  const min = slider?.min ?? 0;
  const max = slider?.max ?? 100;
  const step = slider?.step ?? 1;

  return (
    <div className="space-y-2 rounded-xl border border-white/10 bg-slate-900/60 p-4">
      <div className="flex items-center justify-between text-sm text-white/70">
        <span className="font-medium text-white">{label}</span>
        <span>{formatValue(value)}</span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(values) => onChange(values[0] ?? value)}
      />
      {slider?.recommendedRange ? (
        <p className="text-xs text-white/40">
          Recommandé : {slider.recommendedRange.min} -&gt; {slider.recommendedRange.max} {slider.unit ?? ""}
        </p>
      ) : null}
    </div>
  );
}

type JerseyStyleCardProps = {
  option: {
    value: string;
    title: string;
    description: string;
    img?: string;
  };
  selected: boolean;
  onSelect: (value: string) => void;
};

function JerseyStyleCard({ option, selected, onSelect }: JerseyStyleCardProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <button
      type="button"
      onClick={() => onSelect(option.value)}
      className={cn(
        "h-full rounded-xl border p-4 text-left transition",
        selected
          ? "border-blue-400/60 bg-blue-500/10"
          : "border-white/10 bg-white/5 hover:border-blue-300/40 hover:bg-blue-500/5",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-white">{option.title}</p>
          <p className="text-xs text-white/60">{option.description}</p>
        </div>
        {!imageError && option.img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={option.img}
            alt={option.title}
            className="h-16 w-16 rounded-lg object-cover"
            onError={() => setImageError(true)}
          />
        ) : null}
      </div>
    </button>
  );
}

