# Guide de Déploiement LMS

## 📋 Checklist de Déploiement

### **Prérequis**
- [ ] Compte Vercel configuré
- [ ] Projet Supabase créé
- [ ] Variables d'environnement préparées
- [ ] Tests locaux passants (`npm run test`)

### **Configuration Vercel**

#### **1. Création du projet**
```bash
# Installer Vercel CLI
npm i -g vercel

# Login et init
vercel login
vercel
```

#### **2. Variables d'environnement**
**Production :**
```bash
# Supabase (requis)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Supabase Service Role (SERVEUR UNIQUEMENT)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Monitoring (optionnel)
SENTRY_DSN=https://xxx@sentry.io/xxx
SENTRY_ORG=your-org
SENTRY_PROJECT=lms

# Logs et Rate Limiting
LOG_LEVEL=info
RATE_LIMIT_MAX=60
RATE_LIMIT_WINDOW_MS=60000
```

**Preview :**
- Mêmes variables avec valeurs de test
- Base de données de test séparée

#### **3. Configuration Vercel**
```json
{
  "functions": {
    "api/**": {
      "runtime": "nodejs20.x",
      "memory": 1024,
      "maxDuration": 10
    }
  },
  "env": {
    "NODE_ENV": "production"
  }
}
```

### **Configuration Supabase**

#### **1. RLS Policies**
```sql
-- Activer RLS sur toutes les tables
ALTER TABLE formations ENABLE ROW LEVEL SECURITY;
ALTER TABLE pathways ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_memberships ENABLE ROW LEVEL SECURITY;

-- Policy exemple pour formations
CREATE POLICY "Users can view formations in their org" ON formations
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM org_memberships 
      WHERE user_id = auth.uid()
    )
  );
```

#### **2. Migrations**
```bash
# Appliquer migrations
supabase db push

# Vérifier le statut
supabase db diff
```

### **Déploiement**

#### **1. Déploiement initial**
```bash
# Pull des variables de production
vercel pull --yes --environment=production

# Build local pour vérifier
vercel build --prod

# Déploiement
vercel deploy --prebuilt --prod

# Vérifier les logs
vercel logs --follow
```

#### **2. Tests post-déploiement**
```bash
# Smoke tests
./scripts/smoke.sh https://your-app.vercel.app

# Tests E2E sur production
npm run test:e2e -- --config=playwright.prod.config.ts

# Test Sentry (optionnel)
curl https://your-app.vercel.app/api/_boom
# Vérifier dans le dashboard Sentry
```

### **Monitoring**

#### **1. Logs Vercel**
- Accès : Dashboard Vercel → Functions → Logs
- Format : JSON structuré avec Pino
- Filtres : Par fonction, niveau, timestamp

#### **2. Sentry (optionnel)**
- Erreurs automatiquement capturées
- Performance monitoring
- Release tracking

#### **3. Métriques clés**
- Temps de réponse API < 200ms
- Taux d'erreur < 1%
- Disponibilité > 99.9%

### **Rollback**

#### **1. Rollback rapide**
```bash
# Revenir à la version précédente
vercel rollback

# Ou revert Git + redeploy
git revert HEAD
git push
```

#### **2. Rollback base de données**
```bash
# Restaurer backup Supabase
supabase db reset --backup=backup.sql
```

### **Sécurité**

#### **1. Variables sensibles**
- ❌ `SUPABASE_SERVICE_ROLE_KEY` jamais exposée au client
- ✅ `NEXT_PUBLIC_*` uniquement pour les clés publiques
- ✅ Rotation régulière des clés

#### **2. Rate Limiting**
- 60 req/min par IP sur `/api/*`
- Headers `X-RateLimit-*` dans les réponses

#### **3. CORS**
- Domains autorisés uniquement
- Headers de sécurité configurés

### **Maintenance**

#### **1. Mises à jour**
```bash
# Mise à jour dépendances
npm update
npm audit fix

# Test local
npm run test
npm run build

# Déploiement
vercel --prod
```

#### **2. Monitoring continu**
- Vérifier logs quotidiens
- Alertes Sentry configurées
- Métriques de performance

### **Dépannage**

#### **1. Erreurs communes**
- **Build failed** : Vérifier TypeScript et dépendances
- **API 500** : Consulter logs Vercel Functions
- **Auth issues** : Vérifier variables Supabase
- **RLS errors** : Contrôler policies et membres

#### **2. Debug**
```bash
# Logs en temps réel
vercel logs --follow

# Debug local avec prod env
vercel env pull .env.local
npm run dev
```

### **Contacts**
- **DevOps** : [email]
- **Supabase** : [email]
- **Vercel** : [email]
