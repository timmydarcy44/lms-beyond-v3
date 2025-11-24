# Configuration Supabase CORS pour jessicacontentin.fr

## Problème

L'erreur CORS se produit car Supabase bloque les requêtes depuis `https://www.jessicacontentin.fr` car ce domaine n'est pas autorisé dans les paramètres Supabase.

## Solution

Vous devez configurer Supabase pour autoriser votre domaine de production.

### Étapes à suivre :

1. **Connectez-vous à votre dashboard Supabase** :
   - Allez sur https://supabase.com/dashboard
   - Sélectionnez votre projet

2. **Configurez les URLs autorisées** :
   - Allez dans **Authentication** → **URL Configuration**
   - Dans **Site URL**, ajoutez : `https://www.jessicacontentin.fr`
   - Dans **Redirect URLs**, ajoutez les URLs suivantes :
     ```
     https://www.jessicacontentin.fr/**
     https://www.jessicacontentin.fr/auth/callback
     https://www.jessicacontentin.fr/jessica-contentin/login
     https://www.jessicacontentin.fr/jessica-contentin/inscription
     https://www.jessicacontentin.fr/jessica-contentin/ressources
     https://www.jessicacontentin.fr/jessica-contentin/mon-compte
     ```

3. **Vérifiez les CORS** :
   - Allez dans **Settings** → **API**
   - Dans **CORS**, assurez-vous que `https://www.jessicacontentin.fr` est dans la liste des origines autorisées
   - Si ce n'est pas le cas, ajoutez-le

4. **Sauvegardez les modifications**

5. **Redéployez l'application** (si nécessaire)

## URLs à ajouter dans Supabase

### Site URL
```
https://www.jessicacontentin.fr
```

### Redirect URLs
```
https://www.jessicacontentin.fr/**
https://www.jessicacontentin.fr/auth/callback
https://www.jessicacontentin.fr/jessica-contentin/**
```

### CORS Origins
```
https://www.jessicacontentin.fr
https://jessicacontentin.fr
```

## Vérification

Après avoir configuré Supabase, testez la connexion sur `https://www.jessicacontentin.fr/jessica-contentin/login`. L'erreur CORS devrait disparaître.

## Note importante

Si vous utilisez aussi `jessicacontentin.fr` (sans www), ajoutez également ce domaine dans les configurations Supabase.

