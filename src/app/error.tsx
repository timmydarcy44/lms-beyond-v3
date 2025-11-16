"use client";

import { Button } from "@/components/ui/button";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 bg-gradient-to-br from-[#0A0A0A] via-[#111111] to-[#1A1A1A] px-6 text-center text-white">
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">Oups, une erreur est survenue</h1>
        <p className="text-white/70">
          La page n&apos;a pas pu se charger correctement. Vous pouvez réessayer ou revenir plus tard.
        </p>
      </div>
      <Button onClick={() => reset()} className="rounded-full bg-white text-black hover:bg-white/90">
        Réessayer
      </Button>
    </div>
  );
}


