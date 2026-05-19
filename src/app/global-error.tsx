"use client";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error;
  reset?: () => void;
}) {
  const handleReload = () => {
    if (typeof reset === "function") {
      reset();
      return;
    }
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  return (
    <html lang="fr">
      <body className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0A0A0A] via-[#111111] to-[#1A1A1A] text-white">
        <div className="flex max-w-md flex-col items-center gap-6 px-6 text-center">
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold">Quelque chose a mal tourné</h1>
            <p className="text-white/70">
              L&apos;application a rencontré une erreur inattendue. Essayez de rafraîchir la page.
            </p>
          </div>
          <Button onClick={handleReload} className="rounded-full bg-white text-black hover:bg-white/90">
            Recharger
          </Button>
          {process.env.NODE_ENV !== "production" ? (
            <pre className="w-full max-w-md overflow-auto rounded-xl border border-white/10 bg-black/30 p-3 text-left text-xs text-white/70">
              {String(error?.message ?? error)}
            </pre>
          ) : null}
        </div>
      </body>
    </html>
  );
}


