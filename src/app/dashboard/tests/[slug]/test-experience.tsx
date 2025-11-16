"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LearnerDetail, LearnerCard } from "@/lib/queries/apprenant";

import TestFlow from "./test-flow";

import type { TestQuestion } from "@/hooks/use-test-sessions";

type TestExperienceProps = {
  card: LearnerCard;
  detail: LearnerDetail;
  questions: TestQuestion[];
};

export default function TestExperience({ card, detail, questions }: TestExperienceProps) {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (isActive) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }

    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, [isActive]);

  const handleClose = () => {
    setIsActive(false);
  };

  return (
    <div className="space-y-12">
      <section className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0B0B0B] via-[#040404] to-[#000000]">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="space-y-6 p-10 text-white">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs uppercase tracking-[0.35em] text-white/70">
              Test signature
              <span className="h-1 w-1 rounded-full bg-white/60" />
              {card.meta ?? "Experience immersive"}
            </div>
            <h1 className="text-3xl font-semibold leading-tight md:text-4xl">{detail.title}</h1>
            <p className="max-w-2xl text-sm text-white/70">{detail.description}</p>
            <div className="flex flex-wrap gap-3 text-xs uppercase tracking-[0.3em] text-white/50">
              {detail.meta.map((item) => (
                <Badge key={item} variant="secondary" className="rounded-full bg-white/10 px-4 py-1 text-white/60">
                  {item}
                </Badge>
              ))}
            </div>
            <div className="flex flex-wrap gap-3 pt-4">
              <Button
                onClick={() => setIsActive(true)}
                className="rounded-full bg-gradient-to-r from-[#FF512F] to-[#DD2476] px-6 text-xs font-semibold uppercase tracking-[0.35em] text-white hover:opacity-90"
              >
                Commencer le test
              </Button>
              <Button
                variant="ghost"
                className="rounded-full border border-white/25 bg-white/10 px-6 text-xs font-semibold uppercase tracking-[0.35em] text-white/80 hover:border-white/40 hover:text-white"
              >
                Ajouter à ma liste
              </Button>
            </div>
          </div>
          <div className="relative min-h-[280px]">
            <Image
              src={detail.backgroundImage}
              alt={detail.title}
              fill
              className="object-cover object-center"
              sizes="(min-width: 1024px) 40vw, 100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,0.6fr)_minmax(0,1.4fr)]">
        <Card className="border-white/10 bg-white/5 text-white">
          <CardContent className="space-y-4 p-6">
            <h2 className="text-lg font-semibold">Sommaire rapide</h2>
            <ul className="space-y-3 text-sm text-white/70">
              {detail.modules.map((module) => (
                <li key={module.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-white/40">{module.length}</p>
                  <p className="font-medium text-white">{module.title}</p>
                </li>
              ))}
            </ul>
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-white/80">Objectifs pédagogiques</h3>
              <ul className="space-y-2 text-sm text-white/60">
                {detail.objectives.map((objective) => (
                  <li key={objective} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#FF512F]" />
                    <span>{objective}</span>
                  </li>
                ))}
              </ul>
            </div>
            {detail.skills.length ? (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-white/80">Compétences développées</h3>
                <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.3em] text-white/50">
                  {detail.skills.map((skill) => (
                    <Badge key={skill} variant="outline" className="rounded-full border-white/30 text-white/70">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}
            {detail.badge ? (
              <div className="rounded-2xl border border-[#8E2DE2]/40 bg-[#8E2DE2]/10 p-4 text-white">
                <p className="text-xs uppercase tracking-[0.3em] text-white/60">Badge</p>
                <p className="text-sm font-medium">{detail.badge.label}</p>
                {detail.badge.description ? (
                  <p className="text-xs text-white/60">{detail.badge.description}</p>
                ) : null}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 text-white">
          <CardContent className="space-y-4 p-6">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">Préparez votre expérience</h2>
              <p className="text-sm text-white/70">
                Ce test se déroule en plein écran pour favoriser l’immersion. Comptez {card.meta ?? "15-20 minutes"} et pensez à conserver vos insights pour votre portfolio pédagogique.
              </p>
            </div>
            <ul className="space-y-2 text-sm text-white/60">
              <li>• Interface inspirée de Typeform, transitions fluides</li>
              <li>• Feedback immédiat et sauvegarde automatique dans votre espace "Mon compte"</li>
              <li>• Résultats partagés prochainement avec votre formateur, admin et tuteur</li>
            </ul>
            <Button
              onClick={() => setIsActive(true)}
              className="rounded-full bg-gradient-to-r from-[#00C6FF] to-[#0072FF] px-6 text-xs font-semibold uppercase tracking-[0.35em] text-white hover:opacity-90"
            >
              Lancer en plein écran
            </Button>
          </CardContent>
        </Card>
      </section>

      {isActive ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gradient-to-br from-black/95 via-[#030303]/95 to-[#06040C]/95 backdrop-blur-xl">
          <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-white/10 bg-transparent px-6 py-4 text-white md:px-10">
            <div className="text-xs uppercase tracking-[0.35em] text-white/60">Session en cours</div>
            <Button
              variant="ghost"
              onClick={handleClose}
              className="rounded-full border border-white/20 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/80 hover:border-white/40 hover:text-white"
            >
              <X className="mr-2 h-4 w-4" /> Quitter
            </Button>
          </div>
          <div className="mx-auto w-full max-w-5xl px-6 pb-16 pt-8 md:px-10">
            <TestFlow slug={card.slug} title={card.title} questions={questions} summary={detail.description} onClose={handleClose} fullscreen className="pb-10" />
          </div>
        </div>
      ) : null}
    </div>
  );
}




