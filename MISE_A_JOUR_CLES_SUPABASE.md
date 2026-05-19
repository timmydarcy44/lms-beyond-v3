# 🔑 Mise à jour des clés Supabase

## ⚠️ Problème identifié

Supabase a mis à jour son système de clés API. Vous devez mettre à jour votre fichier `.env.local` avec les nouvelles clés.

## 📋 Étapes à suivre

### 1. Récupérer les nouvelles clés depuis le dashboard Supabase

1. **Allez sur** : https://supabase.com/dashboard/project/zmcefidiiqqppowymoxt/settings/api
2. **Dans la section "Clé publiable"** :
   - Copiez la clé complète (commence par `sb_publishable_...`)
   - C'est votre nouvelle `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   
3. **Dans la section "Clés secrètes"** :
   - Cliquez sur l'icône 👁️ pour révéler la clé secrète
   - Copiez la clé complète (commence par `sb_secret_...`)
   - C'est votre nouvelle `SUPABASE_SERVICE_ROLE_KEY`

### 2. Mettre à jour `.env.local`

Ouvrez le fichier `.env.local` à la racine du projet et mettez à jour :

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://zmcefidiiqqppowymoxt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_Gq5AoN45aV71xNDq2mvkCQ_x-UZTWZE
SUPABASE_SERVICE_ROLE_KEY=sb_secret_vf5Ab... (la clé complète révélée)
```

**⚠️ Important :**
- Copiez les clés **entièrement** (elles peuvent être longues)
- Pas d'espaces avant/après les `=`
- Pas de guillemets autour des valeurs
- La clé secrète doit être révélée (cliquez sur l'icône 👁️)

### 3. Redémarrer le serveur

Après avoir modifié `.env.local`, **vous DEVEZ redémarrer le serveur** :

```bash
# Arrêtez le serveur (Ctrl+C dans le terminal)
# Puis relancez :
npm run dev
```

## 🔍 Vérification

1. Redémarrez le serveur
2. Allez sur `/login`
3. Essayez de vous connecter
4. Les logs devraient montrer que la connexion fonctionne

## 📝 Note sur la compatibilité

Les nouvelles clés API de Supabase sont compatibles avec le code existant. Le format a changé mais l'utilisation reste la même.




