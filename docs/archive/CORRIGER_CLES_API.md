# 🔧 Correction des Clés API - Problème de Retour à la Ligne

## 🎯 Problème Identifié

Vos clés API dans `.env.local` sont **coupées sur plusieurs lignes**, ce qui les rend invalides. Les variables d'environnement doivent être sur **une seule ligne** chacune.

## ✅ Solution Manuelle (Recommandée)

### Étape 1 : Ouvrir `.env.local`

Ouvrez le fichier `.env.local` dans votre éditeur de code (VS Code, Notepad++, etc.).

### Étape 2 : Corriger Chaque Clé

Pour chaque clé API, vous devez **supprimer tous les retours à la ligne** et mettre la valeur sur **une seule ligne continue**.

**Format CORRECT :**
```env
NEXT_PUBLIC_SUPABASE_URL=https://zmcefidiiqqppowymoxt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxcXFlanBha2JjY3d2cmxvbHBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ2NzQ4NzQsImV4cCI6MjA1MDI1MDg3NH0.XXXXXXXXXXXX
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxcXFlanBha2JjY3d2cmxvbHBjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDY1NDAwNSwiZXhwIjoyMDc2MjMwMDA1fQ.XXXXXXXXXXXX
OPENAI_API_KEY=sk-proj-nrHef3KdV80WBYANb25kYZ2PQIi1BIdbDFf4gZpe7sYOQo5PaWa68L31y6fdRrNJSSDSLFzdbhT3E2PU2zspOwMI04igA
```

**Format INCORRECT (ce que vous avez actuellement) :**
```env
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3Mi01
mFub24iLCJpYXQiOjE3NjA2NTQwMDUsImV4cCI6MjA3NjIzMDAwNX0.2HI115PWNU_N2uJm9aZnwT
```

### Étape 3 : Instructions par Clé

1. **Pour `NEXT_PUBLIC_SUPABASE_ANON_KEY` :**
   - Trouvez la ligne qui commence par `NEXT_PUBLIC_SUPABASE_ANON_KEY=`
   - Copiez **toute la clé** depuis Supabase (Settings → API → anon/public key)
   - Collez-la **sur une seule ligne** après le `=`
   - Supprimez tous les retours à la ligne dans la valeur

2. **Pour `SUPABASE_SERVICE_ROLE_KEY` :**
   - Même chose : copiez toute la clé service_role depuis Supabase
   - Mettez-la sur **une seule ligne** après le `=`

3. **Pour `OPENAI_API_KEY` :**
   - Même principe : une seule ligne continue

### Étape 4 : Vérifier

Après correction, chaque ligne doit :
- ✅ Commencer par le nom de la variable
- ✅ Avoir un `=`
- ✅ Avoir la valeur complète **sans retour à la ligne**
- ✅ Terminer par un retour à la ligne (sauf pour la dernière ligne)

### Étape 5 : Redémarrer le Serveur

**Important :** Après modification de `.env.local`, redémarrez le serveur :

```bash
# Arrêtez le serveur (Ctrl+C)
# Puis relancez :
npm run dev
```

## 🔍 Comment Vérifier que c'est Correct

Dans votre éditeur de code :
1. Ouvrez `.env.local`
2. Pour chaque variable, placez le curseur à la fin de la valeur
3. Si vous appuyez sur `→` (flèche droite) et que le curseur passe à la ligne suivante **avant d'arriver au retour à la ligne**, c'est qu'il y a encore un problème
4. La valeur doit être une seule chaîne continue jusqu'au retour à la ligne final

## ⚠️ Erreurs Courantes

- ❌ **Copier-coller avec retour à la ligne automatique** → Supprimez les retours à la ligne
- ❌ **Espaces avant/après le `=`** → Pas d'espaces : `VARIABLE=valeur`
- ❌ **Guillemets autour de la valeur** → Pas de guillemets : `VARIABLE=valeur` (pas `VARIABLE="valeur"`)
- ❌ **Commentaires sur la même ligne** → Évitez les commentaires inline pour les clés sensibles

## 📝 Exemple de Fichier Correct

```env
NEXT_PUBLIC_SUPABASE_URL=https://zmcefidiiqqppowymoxt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxcXFlanBha2JjY3d2cmxvbHBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ2NzQ4NzQsImV4cCI6MjA1MDI1MDg3NH0.2HI115PWNU_N2uJm9aZnwTXXXXXXXXXXXX
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxcXFlanBha2JjY3d2cmxvbHBjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDY1NDAwNSwiZXhwIjoyMDc2MjMwMDA1fQ.PzN4y7bLldXUSTrXXXXXXXXXXXX
OPENAI_API_KEY=sk-proj-nrHef3KdV80WBYANb25kYZ2PQIi1BIdbDFf4gZpe7sYOQo5PaWa68L31y6fdRrNJSSDSLFzdbhT3E2PU2zspOwMI04igA
```

Chaque ligne est **continue** et **complète** !




