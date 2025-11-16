# 🔧 Corriger le fichier .env.local

## 🎯 Problème

L'erreur "Invalid API key" signifie que les clés API dans `.env.local` sont incorrectes ou incomplètes.

## ✅ Solution

### 1. Obtenir les bonnes clés depuis Supabase

1. **Allez sur** https://app.supabase.com
2. **Sélectionnez votre projet** (celui avec l'URL `https://fqqqejpakbccwvrlolpc.supabase.co`)
3. **Cliquez sur Settings (⚙️) → API** dans le menu de gauche
4. **Copiez les valeurs suivantes :**

   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY` (la clé complète, très longue !)
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (garde-la secrète !)

### 2. Mettre à jour .env.local

Ouvrez le fichier `.env.local` et remplacez par :

```env
NEXT_PUBLIC_SUPABASE_URL=https://fqqqejpakbccwvrlolpc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<collez la clé anon complète ici>
SUPABASE_SERVICE_ROLE_KEY=<collez la clé service_role complète ici>

# OpenAI (optionnel)
OPENAI_API_KEY=<votre clé OpenAI si vous en avez une>
```

**⚠️ Important :**
- Les clés JWT sont très longues (plusieurs centaines de caractères)
- Ne coupez pas la clé, copiez-la entièrement
- Pas d'espaces avant/après les `=`
- Pas de guillemets autour des valeurs

### 3. Redémarrer le serveur

Après avoir modifié `.env.local`, **vous DEVEZ redémarrer le serveur** :

```bash
# Arrêtez le serveur (Ctrl+C dans le terminal)
# Puis relancez :
npm run dev
```

## 🔍 Comment vérifier que ça marche

1. Redémarrez le serveur
2. Allez sur `/login`
3. Essayez de vous connecter
4. Si vous voyez toujours "Invalid API key", vérifiez que :
   - La clé `NEXT_PUBLIC_SUPABASE_ANON_KEY` est complète (très longue)
   - Vous avez bien redémarré le serveur après modification
   - Il n'y a pas d'espaces ou de retours à la ligne dans les valeurs



