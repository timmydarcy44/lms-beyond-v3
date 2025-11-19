# 🔒 Sécurité des clés Supabase

## ⚠️ PROBLÈME CRITIQUE : Clés identiques

**Si `NEXT_PUBLIC_SUPABASE_ANON_KEY` et `SUPABASE_SERVICE_ROLE_KEY` sont identiques, c'est un problème de sécurité MAJEUR.**

## 🔍 Comment vérifier si les clés sont identiques

### 1. Dans Vercel Dashboard

1. Allez sur **Settings → Environment Variables**
2. Comparez les valeurs de :
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

**⚠️ Si elles sont identiques, vous devez les régénérer immédiatement.**

### 2. Caractéristiques des clés

- **ANON KEY** : Commence généralement par `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
  - Longueur : ~200-300 caractères
  - Contient `"role":"anon"` dans le payload JWT décodé
  
- **SERVICE_ROLE KEY** : Commence également par `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
  - Longueur : ~200-300 caractères
  - Contient `"role":"service_role"` dans le payload JWT décodé
  - **NE DOIT JAMAIS être exposée côté client**

## 🚨 Pourquoi c'est dangereux

Si la clé SERVICE_ROLE est exposée (même si elle est dans `NEXT_PUBLIC_*`), n'importe qui peut :
- ✅ Bypasser toutes les politiques RLS (Row Level Security)
- ✅ Accéder à TOUTES les données de votre base
- ✅ Modifier/supprimer n'importe quelle donnée
- ✅ Créer/supprimer des utilisateurs
- ✅ Accéder à toutes les organisations

## 🔎 Comment savoir si les clés sont compromises

### Signes d'une compromission :

1. **Activité suspecte dans Supabase Dashboard**
   - Allez sur **Settings → API → API Usage**
   - Vérifiez les requêtes inhabituelles
   - Vérifiez les heures d'accès suspectes

2. **Logs Supabase**
   - Allez sur **Logs → Postgres Logs**
   - Cherchez des requêtes depuis des IPs inconnues
   - Cherchez des opérations de suppression/modification massives

3. **Vérifier les accès utilisateurs**
   - Allez sur **Authentication → Users**
   - Vérifiez les nouveaux utilisateurs suspects
   - Vérifiez les modifications de rôles

4. **Vérifier les données**
   - Vérifiez si des données ont été modifiées/supprimées
   - Vérifiez les organisations créées/modifiées

### Outils de vérification :

```bash
# Décoder le JWT pour voir le rôle
# Utilisez https://jwt.io pour décoder les clés
# Le payload doit contenir "role": "anon" pour ANON_KEY
# Le payload doit contenir "role": "service_role" pour SERVICE_ROLE_KEY
```

## ✅ Solution : Régénérer les clés

### 1. Dans Supabase Dashboard

1. Allez sur **https://app.supabase.com**
2. Sélectionnez votre projet
3. Allez sur **Settings → API**
4. **Régénérez la clé SERVICE_ROLE** :
   - Cliquez sur "Reset" à côté de "service_role key"
   - ⚠️ **Copiez immédiatement la nouvelle clé** (elle ne sera plus visible après)
5. **Vérifiez la clé ANON** :
   - La clé "anon/public" ne doit PAS être changée si elle fonctionne
   - Si elle est identique à SERVICE_ROLE, régénérez-la aussi

### 2. Mettre à jour dans Vercel

1. Allez sur **Vercel Dashboard → Settings → Environment Variables**
2. **Mettez à jour `SUPABASE_SERVICE_ROLE_KEY`** :
   - Cliquez sur la variable
   - Cliquez sur "Edit"
   - Collez la nouvelle clé SERVICE_ROLE
   - ⚠️ Assurez-vous qu'elle est dans "Production", "Preview", et "Development"
3. **Vérifiez `NEXT_PUBLIC_SUPABASE_ANON_KEY`** :
   - Vérifiez qu'elle est différente de SERVICE_ROLE
   - Si identique, mettez à jour avec la clé ANON correcte

### 3. Redéployer

```bash
# Redéployer pour que les nouvelles clés prennent effet
vercel --prod --yes
```

## 🛡️ Bonnes pratiques

### ✅ À FAIRE :

1. **SERVICE_ROLE_KEY** :
   - ✅ Utiliser uniquement côté serveur
   - ✅ Ne JAMAIS l'exposer dans `NEXT_PUBLIC_*`
   - ✅ Ne JAMAIS la commiter dans Git
   - ✅ Ne JAMAIS la logger dans la console

2. **ANON_KEY** :
   - ✅ Peut être dans `NEXT_PUBLIC_*` (c'est normal)
   - ✅ Protégée par les politiques RLS
   - ✅ Limite les permissions

3. **Vérifications régulières** :
   - ✅ Vérifier les logs Supabase régulièrement
   - ✅ Surveiller l'utilisation de l'API
   - ✅ Vérifier les accès utilisateurs

### ❌ À NE JAMAIS FAIRE :

1. ❌ Mettre SERVICE_ROLE_KEY dans `NEXT_PUBLIC_*`
2. ❌ Utiliser la même clé pour ANON et SERVICE_ROLE
3. ❌ Commiter les clés dans Git
4. ❌ Partager les clés SERVICE_ROLE
5. ❌ Logger les clés dans la console

## 🔐 Vérification finale

Après avoir régénéré les clés, vérifiez :

1. ✅ Les deux clés sont différentes
2. ✅ SERVICE_ROLE_KEY n'est PAS dans `NEXT_PUBLIC_*`
3. ✅ ANON_KEY est dans `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. ✅ SERVICE_ROLE_KEY est dans `SUPABASE_SERVICE_ROLE_KEY` (sans `NEXT_PUBLIC_`)
5. ✅ L'application fonctionne correctement après redéploiement

## 📞 En cas de compromission confirmée

Si vous confirmez qu'une clé SERVICE_ROLE a été compromise :

1. **Régénérez immédiatement** toutes les clés dans Supabase
2. **Changez tous les mots de passe** des utilisateurs admin
3. **Vérifiez les données** pour détecter des modifications
4. **Consultez les logs** pour identifier l'étendue de la compromission
5. **Contactez le support Supabase** si nécessaire

