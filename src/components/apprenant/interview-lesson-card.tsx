"use client";

import { MessageCircle } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

type InterviewLessonCardProps = {
  entretienHref: string;
  chapterTitle?: string;
};

export function InterviewLessonCard({ entretienHref, chapterTitle }: InterviewLessonCardProps) {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 rounded-3xl border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 p-8 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-md">
          <MessageCircle className="h-6 w-6" />
        </span>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-violet-700">Entretien</p>
          <h3 className="text-xl font-bold text-slate-900">Entretien exp{"\u00e9"}rientiel</h3>
        </div>
      </div>
      <p className="text-sm leading-relaxed text-slate-600">
        {chapterTitle
          ? `Reliez ce que vous avez appris dans \u00ab ${chapterTitle} \u00bb \u00e0 votre pratique, en dialoguant avec l'assistant.`
          : "Reliez vos apprentissages \u00e0 votre pratique, en dialoguant avec l'assistant."}{" "}
        Pas de QCM : des questions ouvertes et un bilan personnalis\u00e9 \u00e0 la fin.
      </p>
      <Button
        asChild
        className="rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-8 py-2 text-xs font-bold uppercase tracking-[0.25em] text-white hover:opacity-95"
      >
        <Link href={entretienHref}>Commencer l&apos;entretien</Link>
      </Button>
    </div>
  );
}
