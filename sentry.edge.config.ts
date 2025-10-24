import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  debug: process.env.NODE_ENV === 'development',
  beforeSend(event) {
    // Filtrer les erreurs sensibles
    if (event.exception) {
      const error = event.exception.values?.[0];
      if (error?.value?.includes('SUPABASE_SERVICE_ROLE_KEY')) {
        return null; // Ne pas envoyer les erreurs contenant des secrets
      }
    }
    return event;
  },
});
