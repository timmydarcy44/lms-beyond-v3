import { logger } from './logger';

export async function withTrace<T>(req: Request, fn: () => Promise<T>) {
  const start = Date.now();
  const url = new URL(req.url);
  
  try {
    const res = await fn();
    logger.info({ 
      path: url.pathname, 
      method: req.method, 
      ms: Date.now() - start, 
      ok: true 
    });
    return res;
  } catch (e: any) {
    logger.error({ 
      path: url.pathname, 
      method: req.method, 
      ms: Date.now() - start, 
      err: e?.message,
      stack: e?.stack 
    });
    throw e;
  }
}
