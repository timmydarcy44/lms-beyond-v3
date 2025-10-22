'use client';

import { useEffect } from 'react';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }, reset: () => void }) {
  useEffect(() => {
    // Important: visible dans les logs Vercel (Serverless/Edge)
    // N'y mets pas d'infos sensibles (tokens, clés)
    console.error('[global-error]', {
      message: error?.message,
      digest: (error as any)?.digest,
      name: error?.name,
      stack: error?.stack,
    });
  }, [error]);

  return (
    <html>
      <body className="min-h-screen bg-[#252525] text-neutral-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full space-y-3 text-center">
          <h1 className="text-2xl font-semibold">Oups, une erreur est survenue</h1>
          <p className="text-neutral-400">Notre équipe a été notifiée. Vous pouvez réessayer.</p>
          { (error as any)?.digest && (
            <p className="text-xs text-neutral-500">Digest: {(error as any).digest}</p>
          )}
          <button
            onClick={() => reset()}
            className="mt-2 inline-flex items-center rounded-xl px-4 py-2 border border-white/10 hover:bg-white/5 transition"
          >
            Réessayer
          </button>
        </div>
      </body>
    </html>
  );
}
