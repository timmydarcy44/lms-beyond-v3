// Utilitaire minimal pour tracer les erreurs côté serveur (visible dans Vercel Logs)
export function logServerError(scope: string, error: unknown, extra?: Record<string, any>) {
  const payload = {
    scope,
    message: (error as any)?.message ?? String(error),
    stack: (error as any)?.stack ?? null,
    extra: extra ?? null,
  };
  // eslint-disable-next-line no-console
  console.error('[SERVER_ERROR]', JSON.stringify(payload));
}
