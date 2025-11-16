# Audit de Nettoyage du Code - LMS Beyond v3

**Date :** 2025-01-16  
**Objectif :** Identifier le code et les ressources non utilisés pouvant être nettoyés en toute sécurité

---

## 📋 Résumé Exécutif

### ✅ Éléments sûrs à supprimer
- **Dossiers vides** : 3 dossiers identifiés
- **Fichiers de documentation** : ~100 fichiers .md (à archiver ou déplacer)
- **Fichiers SQL de diagnostic** : Scripts temporaires dans `/supabase`

### ⚠️ Éléments à vérifier avant suppression
- Composants potentiellement non utilisés
- Types/interfaces non référencés
- Fonctions utilitaires non utilisées

---

## 🗂️ 1. Dossiers Vides

### ✅ Sûrs à supprimer

1. **`src/components/formations/`**
   - **Statut :** Vide
   - **Action :** Supprimer le dossier

2. **`src/components/tests/`**
   - **Statut :** Vide
   - **Action :** Supprimer le dossier

3. **`src/app/(beyond-note)/`**
   - **Statut :** Vide (route group non utilisé)
   - **Action :** Supprimer le dossier

---

## 📄 2. Fichiers de Documentation (.md)

### 📚 Documentation à archiver/déplacer

**Total : ~100 fichiers .md**

#### Documentation technique (à garder dans `/docs`)
- `GUIDE_DEPLOIEMENT_GITHUB.md`
- `GITHUB_VERCEL_SETUP.md`
- `DEPLOYMENT_CHECKLIST.md`
- `VERCEL_DEPLOYMENT.md`
- `STRIPE_SETUP.md`
- `GOOGLE_VISION_SETUP.md`
- `BEYOND_NOTE_SETUP.md`
- `BEYOND_NOTE_TROUBLESHOOTING.md`
- `CMS_SYSTEM_DOCUMENTATION.md`
- `CMS_INTEGRATION_INSTRUCTIONS.md`
- `GUIDE_CONFIGURATION_EMAIL.md`
- `GUIDE_UPLOAD_VIDEOS_GAMIFICATION.md`
- `GUIDE_IMPORT_QUESTIONNAIRE_CHATGPT.md`
- `GUIDE_FONCTIONNALITES_PREMIUM.md`
- `GUIDE_TRACKING_SESSIONS.md`
- `GUIDE_MIGRATION_DB.md`
- `GUIDE_GESTION_ROLES.md`
- `CONFIGURER_VERCEL.md`
- `CONNEXION_DB_INSTRUCTIONS.md`
- `SETUP_DB.md`
- `INSTALLATION_IA.md`
- `OPENAI_USAGE_IN_LMS.md`

#### Documentation Supabase (à garder dans `/supabase/docs`)
- `supabase/INSTRUCTIONS_EXECUTION_ACCESSIBILITY_TABLE.md`
- `supabase/INSTRUCTIONS_EXECUTION_AI_TABLES.md`
- `supabase/CONNEXION_IA_COMPLETE.md`

#### Documentation IA (à garder dans `/docs/ia`)
- `docs/IA_CONFIGURATION.md`
- `docs/DEBUG_IA.md`
- `docs/DIAGNOSTIC_IA.md`
- `docs/CONFIGURATION_ANTHROPIC.md`
- `docs/CONFIGURATION_PROVIDERS_IA_FINALE.md`
- `docs/RECAP_CONFIGURATION_IA.md`
- `docs/RESUME_FONCTIONNALITES_IA.md`
- `docs/CHOIX_PROVIDERS_IA.md`
- `docs/ETAT_PROVIDERS_IA_COMPLET.md`
- `docs/ETAT_PROVIDERS_IA.md`
- `docs/LISTE_FONCTIONNALITES_IA.md`
- `docs/BIAS_DETECTION_SYSTEM.md`
- `src/app/super/ia/STATUT_ADMIN_SUPER.md`
- `src/app/super/ia/EXPLICATION_PROMPTS.md`

#### Documentation historique/audit (à archiver dans `/docs/archive`)
- `ANALYSE_FORMATIONS_VS_COURSES.md`
- `ANALYSE_LOGIQUE_METIER_ET_CORRECTIONS.md`
- `ANALYSE_OPTIMISATION.md`
- `ANALYSE_SUPER_ADMIN.md`
- `ANALYSE_SUPER_ADMIN_PERFORMANCE.md`
- `ARCHITECTURE_ASSIGNATION_CONTENU.md`
- `AUDIT_DATABASE.md`
- `AUDIT_RESULT_ANALYSIS.md`
- `AUDIT_SUMMARY.md`
- `AUDIT_SUPER_ADMIN_ACTUEL.md`
- `CHECKLIST_POST_MIGRATION.md`
- `CORRECTIONS_NEEDED.md`
- `CORRECTION_REDIRECTION.md`
- `DIAGNOSTIC_CMS.md`
- `DIAGNOSTIC_MOCK_DATA.md`
- `DIAGNOSTIC_REDIRECTION.md`
- `DIAGNOSTIC_SESSION.md`
- `DIFFERENCE_ADMIN_VS_SUPER_ADMIN.md`
- `FIX_MIGRATION_ERROR.md`
- `INSTRUCTIONS_FIX_RLS.md`
- `INSTRUCTIONS_FIX_SECTIONS.md`
- `INSTRUCTIONS_MIGRATION_FINALE.md`
- `LOGIQUE_METIER_LMS.md`
- `MIGRATION_ADAPTEE.md`
- `PLAN_CORRECTION_STRUCTURE.md`
- `POURQUOI_MOCK_DATA.md`
- `RESUME_AUDIT_ET_CORRECTIONS.md`
- `RESUME_CORRECTIONS.md`
- `RESUME_INTEGRATION_TRACKING.md`
- `ROADMAP_SUPER_ADMIN_IMPLEMENTATION.md`
- `SOLUTION_LOCALE_ET_VERCEL.md`
- `SOLUTION_MIGRATION.md`
- `SOLUTION_REDIRECTION_LOGOUT.md`
- `SOLUTION_URGENTE_FORMATION_ID.md`
- `STATUS_FINAL.md`
- `TEST_TRACKING.md`
- `VERIFICATION_APRES_MIGRATION.md`
- `VERIFICATION_ASSIGNATION_FORMATIONS.md`
- `ETAT_FONCTIONNALITES_IA.md`
- `IMPLEMENTATION_IA_COMPLETE.md`
- `INTEGRATION_TRACKING_STEPS.md`
- `TEST_IA.md`
- `EXECUTER_MIGRATIONS.md`
- `ETAPE_FINALE.md`
- `Faire_Audit_Base_Donnees.md`
- `CORRIGER_CLES_API.md`
- `CORRIGER_ENV_LOCAL.md`
- `GUIDE_RESOLUTION_CMS.md`
- `GUIDE_FIX_BEYOND_CARE_SIDEBAR.md`
- `GUIDE_ENVOI_AUTOMATIQUE_QUESTIONNAIRES.md`
- `README_SUPER_ADMIN.md`
- `README_SUPER_ADMIN_FINAL.md`
- `RECAPITULATIF_FINAL.md`
- `TEST_PDF_GENERATION.md`
- `DRIVE_PDF_WORKFLOW.md`
- `DOSSIER_PRESENTATION_LMS.md`

#### Documentation utilisateurs (à garder dans `/docs/users`)
- `docs/SET_PASSWORD_DANY.md`
- `docs/RESET_PASSWORD_DANY.md`
- `docs/CREER_UTILISATEUR_DANY.md`
- `docs/CONFIGURATION_SUPABASE_REDIRECTS.md`

**Action recommandée :**
- Créer une structure `/docs` organisée
- Déplacer les fichiers pertinents
- Archiver les fichiers historiques dans `/docs/archive`
- Supprimer les doublons

---

## 🗄️ 3. Scripts SQL Supabase

### ⚠️ Scripts de diagnostic/temporaires (à vérifier)

**Localisation :** `/supabase/`

#### Scripts de diagnostic (probablement temporaires)
- `CHECK_DRIVE_DOCUMENTS_STRUCTURE.sql`
- `CHECK_PDF_GENERATION.sql`
- `CHECK_BUCKET_PERMISSIONS.sql`
- `CHECK_*` (tous les scripts CHECK_*)
- `DIAGNOSTIC_*` (tous les scripts DIAGNOSTIC_*)
- `TEST_*` (tous les scripts TEST_*)
- `VERIFY_*` (tous les scripts VERIFY_*)
- `VERIFIER_*` (tous les scripts VERIFIER_*)

#### Scripts de correction (à garder si réutilisables)
- `FIX_*` (scripts de correction - à garder)
- `CREATE_*` (scripts de création - à garder)
- `ADD_*` (scripts d'ajout - à garder)
- `UPDATE_*` (scripts de mise à jour - à garder)

**Action recommandée :**
- Créer `/supabase/diagnostics/` pour les scripts de diagnostic
- Créer `/supabase/migrations/` pour les vraies migrations
- Garder les scripts de correction dans `/supabase/fixes/`
- Supprimer les scripts de diagnostic obsolètes

---

## 🔍 4. Code Potentiellement Non Utilisé

### ⚠️ À vérifier manuellement

#### Fichiers potentiellement non utilisés
1. **`src/app/auth/callback/route.ts`**
   - **Statut :** N'existe pas (déjà supprimé ?)
   - **Action :** Vérifier si nécessaire pour OAuth

2. **Composants avec peu d'imports**
   - Vérifier les composants dans `/src/components/` qui ne sont jamais importés
   - Utiliser un outil comme `ts-prune` ou `depcheck` pour identifier

3. **Types/interfaces non utilisés**
   - Vérifier les types dans `/src/types/` non référencés
   - Vérifier les types dans les fichiers de queries

4. **Fonctions utilitaires**
   - Vérifier `/src/lib/utils/` pour les fonctions non utilisées
   - Vérifier `/src/lib/ai/` pour les fonctions obsolètes

---

## 📊 5. Statistiques

### Fichiers identifiés
- **Dossiers vides :** 3
- **Fichiers .md :** ~100
- **Scripts SQL de diagnostic :** ~30-40
- **Composants à vérifier :** ~200+

### Espace potentiellement libéré
- **Dossiers vides :** ~0 KB
- **Documentation :** ~2-5 MB (estimation)
- **Scripts SQL :** ~100-200 KB

---

## ✅ 6. Plan d'Action Recommandé

### Phase 1 : Nettoyage sûr (immédiat)
1. ✅ Supprimer les 3 dossiers vides
2. ✅ Organiser la documentation dans `/docs`
3. ✅ Archiver les fichiers historiques

### Phase 2 : Vérification (après tests)
1. ⚠️ Vérifier les composants non utilisés avec `ts-prune`
2. ⚠️ Vérifier les types/interfaces non référencés
3. ⚠️ Vérifier les fonctions utilitaires non utilisées

### Phase 3 : Nettoyage Supabase (après vérification)
1. ⚠️ Organiser les scripts SQL
2. ⚠️ Supprimer les scripts de diagnostic obsolètes
3. ⚠️ Vérifier les tables/colonnes non utilisées dans Supabase

---

## 🛠️ 7. Outils Recommandés

### Pour identifier le code mort
```bash
# Installer ts-prune
npm install -g ts-prune

# Analyser le projet
ts-prune

# Ou utiliser depcheck
npm install -g depcheck
depcheck
```

### Pour analyser Supabase
- Vérifier les tables non référencées dans le code
- Vérifier les colonnes non utilisées
- Vérifier les fonctions/triggers obsolètes

---

## 📝 Notes

- **Ne pas supprimer** les fichiers de migration dans `/supabase/migrations/`
- **Garder** tous les fichiers de configuration
- **Archiver** plutôt que supprimer les fichiers historiques
- **Tester** après chaque phase de nettoyage

---

**Prochaine étape :** Commencer par la Phase 1 (nettoyage sûr)

