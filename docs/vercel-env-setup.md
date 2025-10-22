# Variables d'environnement requises pour Vercel

## Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

## Site URL
NEXT_PUBLIC_SITE_URL=https://your-vercel-app.vercel.app

## Instructions pour Vercel
1. Allez sur vercel.com → votre projet → Settings → Environment Variables
2. Ajoutez toutes les variables ci-dessus
3. Redéployez le projet

## Vérification
- Testez /api/debug/server-components pour diagnostiquer
- Testez /test-server-components pour voir les erreurs détaillées
- Vérifiez les logs Vercel pour les erreurs spécifiques
