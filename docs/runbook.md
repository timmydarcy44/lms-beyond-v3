# Runbook LMS - Guide Opérationnel

## 🚨 Urgences (First Aid)

### **Application Down**
```bash
# 1. Vérifier le statut Vercel
vercel status

# 2. Consulter les logs en temps réel
vercel logs --follow

# 3. Rollback immédiat si nécessaire
vercel rollback

# 4. Redéployer la version stable
git checkout main
vercel --prod
```

### **Erreurs 500 en masse**
```bash
# 1. Identifier la cause dans les logs
vercel logs --follow | grep "ERROR"

# 2. Vérifier les variables d'environnement
vercel env ls

# 3. Rollback si problème récent
vercel rollback

# 4. Redémarrer les fonctions
vercel --prod --force
```

### **Problèmes d'authentification**
```bash
# 1. Vérifier les clés Supabase
vercel env ls | grep SUPABASE

# 2. Tester la connexion Supabase
curl -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  "$SUPABASE_URL/rest/v1/"

# 3. Regénérer les clés si nécessaire
# (Dans le dashboard Supabase)
```

### **Cache React Query problématique**
```bash
# 1. Vider le cache côté client
# (Redémarrer l'application)

# 2. Invalider les previews Vercel
vercel --prod --force

# 3. Vider le cache CDN
# (Dans le dashboard Vercel → Settings → Functions)
```

## 🔧 Maintenance Routinière

### **Mises à jour de sécurité**
```bash
# 1. Vérifier les vulnérabilités
npm audit

# 2. Mettre à jour les dépendances
npm update

# 3. Tester localement
npm run test
npm run build

# 4. Déployer
vercel --prod
```

### **Rotation des clés**
```bash
# 1. Générer nouvelles clés Supabase
# (Dashboard Supabase → Settings → API)

# 2. Mettre à jour les variables Vercel
vercel env add SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY

# 3. Redéployer
vercel --prod
```

### **Backup base de données**
```bash
# 1. Créer un backup Supabase
supabase db dump --file backup-$(date +%Y%m%d).sql

# 2. Stocker le backup sécurisé
# (Cloud storage ou local sécurisé)

# 3. Tester la restauration
supabase db reset --backup=backup-YYYYMMDD.sql
```

## 📊 Monitoring & Observabilité

### **Logs Vercel**
```bash
# Logs en temps réel
vercel logs --follow

# Logs d'une fonction spécifique
vercel logs --follow --function=api/parcours

# Logs avec filtres
vercel logs --follow | grep "ERROR"
```

### **Métriques Sentry**
- **Erreurs** : Dashboard Sentry → Issues
- **Performance** : Dashboard Sentry → Performance
- **Releases** : Dashboard Sentry → Releases

### **Métriques Vercel**
- **Functions** : Dashboard Vercel → Functions
- **Analytics** : Dashboard Vercel → Analytics
- **Speed Insights** : Dashboard Vercel → Speed Insights

## 🔄 Procédures de Déploiement

### **Déploiement Standard**
```bash
# 1. Tests locaux
npm run test
npm run build

# 2. Push vers main
git push origin main

# 3. Déploiement automatique (via GitHub Actions)
# Ou déploiement manuel :
vercel --prod

# 4. Smoke tests post-déploiement
./scripts/smoke.sh https://your-app.vercel.app
```

### **Déploiement d'urgence**
```bash
# 1. Hotfix sur une branche
git checkout -b hotfix/critical-fix
# ... faire les corrections ...

# 2. Merge et déploiement immédiat
git checkout main
git merge hotfix/critical-fix
git push origin main

# 3. Déploiement forcé
vercel --prod --force
```

### **Rollback**
```bash
# 1. Rollback Vercel (recommandé)
vercel rollback

# 2. Rollback Git + redéploiement
git revert HEAD
git push origin main

# 3. Rollback base de données (si nécessaire)
supabase db reset --backup=backup-YYYYMMDD.sql
```

## 🗄️ Gestion des Données

### **Migrations Supabase**
```bash
# 1. Créer une migration
supabase migration new migration_name

# 2. Appliquer les migrations
supabase db push

# 3. Vérifier le statut
supabase db diff

# 4. Rollback si problème
supabase db reset
```

### **RLS Policies**
```sql
-- Vérifier les policies actives
SELECT * FROM pg_policies WHERE tablename = 'formations';

-- Désactiver temporairement une policy
DROP POLICY "policy_name" ON table_name;

-- Recréer une policy
CREATE POLICY "policy_name" ON table_name
  FOR SELECT USING (condition);
```

## 🔐 Sécurité

### **Audit des accès**
```bash
# 1. Vérifier les variables sensibles
vercel env ls | grep -E "(KEY|SECRET|TOKEN)"

# 2. Auditer les logs d'accès
vercel logs --follow | grep "auth"

# 3. Vérifier les permissions Supabase
# (Dashboard Supabase → Authentication → Users)
```

### **Incident de sécurité**
```bash
# 1. Rotation immédiate des clés
# (Dashboard Supabase → Settings → API)

# 2. Mise à jour des variables Vercel
vercel env add SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY

# 3. Redéploiement d'urgence
vercel --prod --force

# 4. Audit des logs
vercel logs --follow | grep "ERROR"
```

## 📞 Contacts & Escalade

### **Niveaux d'urgence**
- **P0** (Critique) : Application down → DevOps + CTO
- **P1** (Élevé) : Fonctionnalités majeures cassées → DevOps
- **P2** (Moyen) : Bugs mineurs → Dev Team
- **P3** (Faible) : Améliorations → Product Team

### **Contacts**
- **DevOps** : [email] / [phone]
- **CTO** : [email] / [phone]
- **Supabase Support** : [email]
- **Vercel Support** : [email]

### **Escalade**
1. **Niveau 1** : Dev Team (0-2h)
2. **Niveau 2** : DevOps (2-4h)
3. **Niveau 3** : CTO (4-8h)
4. **Niveau 4** : External Support (8h+)

## 📋 Checklist Post-Incident

### **Après résolution**
- [ ] Documenter l'incident
- [ ] Identifier la cause racine
- [ ] Mettre en place des mesures préventives
- [ ] Tester les procédures de rollback
- [ ] Mettre à jour le runbook si nécessaire
- [ ] Communiquer aux stakeholders

### **Amélioration continue**
- [ ] Revue mensuelle des incidents
- [ ] Mise à jour des procédures
- [ ] Formation de l'équipe
- [ ] Tests de disaster recovery
