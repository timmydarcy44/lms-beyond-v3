# Guide de dépannage Beyond Note

## Problème : Erreur 500 lors de l'upload

### Étape 1 : Vérifier la configuration

Exécutez le script de vérification dans **Supabase SQL Editor** :
```sql
-- Exécutez : supabase/VERIFY_BEYOND_NOTE_SETUP.sql
```

Ce script vous indiquera exactement ce qui manque.

### Étape 2 : Scripts SQL à exécuter (dans l'ordre)

#### 1. Créer les tables
**Fichier** : `supabase/CREATE_BEYOND_NOTE_TABLES.sql`
- ✅ Déjà exécuté (vous avez confirmé)

#### 2. Créer le bucket Storage
**Option A - Via SQL** (recommandé) :
- Exécutez : `supabase/CREATE_BEYOND_NOTE_STORAGE.sql`
- Ce script crée le bucket ET configure les policies RLS

**Option B - Manuellement** :
1. Aller dans **Supabase Dashboard > Storage**
2. Cliquer sur **"New bucket"**
3. Configurer :
   - **Nom** : `beyond-note`
   - **Public** : `Oui` ✅
   - **File size limit** : `52428800` (50 MB)
   - **Allowed MIME types** : `image/jpeg, image/png, image/gif, image/webp, application/pdf`
4. Cliquer sur **"Create bucket"**
5. **Puis** exécutez `CREATE_BEYOND_NOTE_STORAGE.sql` pour les policies RLS

### Étape 3 : Vérifier les logs serveur

Après avoir exécuté les scripts, relancez l'upload et vérifiez :

1. **Console du navigateur** : Devrait afficher des détails d'erreur plus précis
2. **Terminal serveur** (où tourne `npm run dev`) : Cherchez les logs `[beyond-note/upload]`

### Messages d'erreur courants

#### "Bucket not found" ou "404"
→ Le bucket `beyond-note` n'existe pas
→ **Solution** : Créez-le (voir Étape 2)

#### "new row violates row-level security policy"
→ Les policies RLS ne sont pas configurées
→ **Solution** : Exécutez `CREATE_BEYOND_NOTE_STORAGE.sql`

#### "Table beyond_note_documents does not exist"
→ Les tables n'ont pas été créées
→ **Solution** : Exécutez `CREATE_BEYOND_NOTE_TABLES.sql`

### Checklist finale

- [ ] Tables créées (`beyond_note_documents`, `beyond_note_ai_results`)
- [ ] Bucket `beyond-note` créé dans Storage
- [ ] Policies RLS pour les tables configurées
- [ ] Policies RLS pour le storage configurées
- [ ] Script de vérification exécuté et tout est ✅

### Si le problème persiste

1. Vérifiez les logs serveur dans le terminal
2. Vérifiez la console du navigateur pour les détails d'erreur
3. Exécutez le script de vérification pour identifier ce qui manque
4. Assurez-vous que vous êtes bien connecté (session valide)



