 "use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import {
  ChevronDown,
  ChevronUp,
  Circle,
  Handshake,
  LineChart,
  Link2,
  Radar,
  Share2,
  Target,
  TrendingUp,
} from "lucide-react";

import { Button } from "@/components/ui/button";

type ProofLink = { id: string; title: string };
type ExploreIntent = { id: string; title: string };

const intentIcons: Record<string, ReactNode> = {
  decider: <LineChart className="h-4 w-4 text-white/60" />,
  influencer: <Handshake className="h-4 w-4 text-white/60" />,
  piloter: <Share2 className="h-4 w-4 text-white/60" />,
  critique: <Radar className="h-4 w-4 text-white/60" />,
  mesurer: <Target className="h-4 w-4 text-white/60" />,
  structurer: <TrendingUp className="h-4 w-4 text-white/60" />,
};

const proofIcons: Record<string, ReactNode> = {
  "data-driven-decision": <LineChart className="h-4 w-4 text-white/60" />,
  "negociation-complexe": <Handshake className="h-4 w-4 text-white/60" />,
  "supply-chain": <Share2 className="h-4 w-4 text-white/60" />,
  "marketing-sportif": <Target className="h-4 w-4 text-white/60" />,
  "impact-rse": <Radar className="h-4 w-4 text-white/60" />,
  "pilotage-projet-complexe": <TrendingUp className="h-4 w-4 text-white/60" />,
};

type BnsPrivateHeaderProps = {
  inProgressProofs?: ProofLink[];
  exploreIntents?: ExploreIntent[];
  onScrollToProof?: (id: string) => void;
  onOpenIntent?: (id: string) => void;
};

export function BnsPrivateHeader({
  inProgressProofs = [],
  exploreIntents = [],
  onScrollToProof,
  onOpenIntent,
}: BnsPrivateHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-[80] border-b border-white/10 bg-[#0b0b10]/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4 sm:px-12 lg:px-24">
        <div className="flex items-center gap-4 text-white">
          <div className="h-10 w-10 rounded-full bg-white/10" />
          <span className="text-xs uppercase tracking-[0.35em] text-white/70">
            Beyond No School
          </span>
        </div>

        <div className="flex items-center gap-6 text-xs uppercase tracking-[0.32em] text-white/60">
          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="flex items-center gap-2 text-xs uppercase tracking-[0.32em] text-white/70 hover:text-white"
          >
            Preuves
            {isMenuOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>

        <div className="flex items-center gap-3">
          <Button
            asChild
            variant="outline"
            className="rounded-full border-white/20 bg-transparent px-3 text-white/70 hover:text-white"
            title="Connecter mes preuves à Beyond Connect"
          >
            <Link href="/beyond-no-school/open-badges" aria-label="Connecter mes preuves à Beyond Connect">
              <Link2 className="h-4 w-4" />
            </Link>
          </Button>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white/70"
          >
            <span className="sr-only">Profil</span>
            <div className="h-3 w-3 rounded-full bg-white/70" />
          </button>
        </div>
      </div>

      {isMenuOpen ? (
        <div className="border-t border-white/10 bg-[#0b0b10]">
          <div className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-8 text-white/80 sm:px-12 lg:grid-cols-3 lg:px-24">
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                Mes preuves en cours
              </p>
              <div className="space-y-3">
                {inProgressProofs.length ? (
                  inProgressProofs.map((proof) => (
                    <button
                      key={proof.id}
                      type="button"
                      onClick={() => {
                        onScrollToProof?.(proof.id);
                        setIsMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-3 text-left text-sm text-white/70 hover:text-white"
                    >
                      {proofIcons[proof.id] ?? <Circle className="h-2 w-2 text-white/40" />}
                      {proof.title}
                    </button>
                  ))
                ) : (
                  <p className="text-sm text-white/50">Aucune preuve en cours.</p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                Explorer d’autres preuves
              </p>
              <div className="space-y-3">
                {exploreIntents.map((intent) => (
                  <button
                    key={intent.id}
                    type="button"
                    onClick={() => {
                      onOpenIntent?.(intent.id);
                      setIsMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-3 text-left text-sm text-white/70 hover:text-white"
                  >
                    {intentIcons[intent.id] ?? <Circle className="h-2 w-2 text-white/40" />}
                    {intent.title}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">Raccourcis utiles</p>
              <div className="space-y-3 text-sm">
                <Link
                  href="/beyond-no-school/reprendre#badges"
                  className="block text-white/70 hover:text-white"
                >
                  Comprendre la validation
                </Link>
                <Link
                  href="/beyond-no-school/open-badges"
                  className="block text-white/70 hover:text-white"
                >
                  Mes Open Badges
                </Link>
                <Link
                  href="/beyond-no-school/compte"
                  className="block text-white/70 hover:text-white"
                >
                  Mon profil
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}

