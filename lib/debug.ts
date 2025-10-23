export const isProd = process.env.NODE_ENV === 'production';
export const isDiag = () => process.env.DIAG === '1'; // active le mode diagnostic via variable d'env

export function logServer(scope: string, details: unknown) {
  // Affiche un JSON propre dans les logs Vercel
  // eslint-disable-next-line no-console
  console.error('[SERVER]', JSON.stringify({ scope, details }, null, 2));
}

export function toJSONSafe(v: unknown) {
  try { return JSON.parse(JSON.stringify(v)); } catch { return String(v); }
}
