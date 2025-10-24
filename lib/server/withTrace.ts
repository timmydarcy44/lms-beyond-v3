import { logger } from './logger';
import * as Sentry from '@sentry/nextjs';

export async function withTrace<T>(req: Request, fn: () => Promise<T>) {
  const start = Date.now();
  const url = new URL(req.url);
  
  // Ajouter des tags Sentry pour le contexte
  Sentry.setTag('api.path', url.pathname);
  Sentry.setTag('api.method', req.method);
  
  try {
    const res = await fn();
    const duration = Date.now() - start;
    
    logger.info({ 
      path: url.pathname, 
      method: req.method, 
      ms: duration, 
      ok: true 
    });
    
    // Sentry performance tracking
    Sentry.setTag('api.status', 'success');
    Sentry.setTag('api.duration', duration);
    
    return res;
  } catch (e: any) {
    const duration = Date.now() - start;
    
    logger.error({ 
      path: url.pathname, 
      method: req.method, 
      ms: duration, 
      err: e?.message,
      stack: e?.stack 
    });
    
    // Capturer l'erreur dans Sentry avec contexte
    Sentry.setTag('api.status', 'error');
    Sentry.setTag('api.duration', duration);
    Sentry.captureException(e);
    
    throw e;
  }
}
