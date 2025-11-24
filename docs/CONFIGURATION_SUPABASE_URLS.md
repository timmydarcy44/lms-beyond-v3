# Configuration des URLs dans Supabase

## Où configurer les URLs autorisées

**CORS n'est pas toujours visible dans Supabase**, mais la configuration se fait dans **Authentication → URL Configuration**.

### Étapes détaillées :

1. **Connectez-vous à Supabase** :
   - Allez sur https://supabase.com/dashboard
   - Sélectionnez votre projet

2. **Allez dans Authentication** :
   - Dans le menu de gauche, cliquez sur **Authentication**
   - Puis cliquez sur **URL Configuration** (sous-menu)

3. **Configurez les URLs** :

   **Site URL** (optionnel - peut être vide si vous avez plusieurs sites) :
   ```
   https://www.jessicacontentin.fr
   ```

   **Redirect URLs** (ajoutez TOUTES vos URLs, une par ligne) :
   ```
   https://www.jessicacontentin.fr/**
   https://jessicacontentin.fr/**
   http://localhost:3000/**
   https://localhost:3000/**
   https://*.vercel.app/**
   ```

   Le pattern `/**` signifie "toutes les routes sous ce domaine"

4. **Sauvegardez** : Cliquez sur "Save" en bas de la page

## Pour plusieurs sites

Vous pouvez ajouter **autant d'URLs que nécessaire** dans Redirect URLs. Chaque URL doit être sur une ligne séparée :

```
https://www.jessicacontentin.fr/**
https://jessicacontentin.fr/**
https://autre-site.com/**
https://encore-un-autre-site.com/**
http://localhost:3000/**
https://localhost:3000/**
```

## CORS (si visible)

Si vous voyez une section **CORS** dans **Settings → API**, vous pouvez aussi ajouter vos origines :

```
https://www.jessicacontentin.fr,https://jessicacontentin.fr,http://localhost:3000
```

**Note** : Si vous ne voyez pas CORS, ce n'est pas grave. La configuration dans Authentication → URL Configuration est suffisante.

## Vérification

Après avoir configuré, testez la connexion. L'erreur CORS devrait disparaître.

## Capture d'écran de l'emplacement

1. Dashboard Supabase
2. Menu gauche → **Authentication**
3. Sous-menu → **URL Configuration**
4. Section **Redirect URLs** → Ajoutez vos URLs

