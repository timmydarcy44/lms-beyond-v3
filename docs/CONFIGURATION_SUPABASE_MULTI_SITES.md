# Configuration Supabase pour plusieurs sites

## Problème

Vous avez plusieurs sites sur ce développement et vous vous inquiétez que mettre `jessicacontentin.fr` dans URL configuration va bloquer les autres sites.

## Solution

**Supabase permet de configurer PLUSIEURS URLs** dans les paramètres. Vous pouvez ajouter toutes vos URLs sans problème.

## Configuration Supabase pour plusieurs sites

### 1. Authentication → URL Configuration

Dans **Site URL**, vous pouvez mettre votre URL principale (ou laisser vide si vous avez plusieurs sites).

Dans **Redirect URLs**, ajoutez **TOUTES** vos URLs avec le pattern `/**` :

```
https://www.jessicacontentin.fr/**
https://jessicacontentin.fr/**
https://votre-autre-site.com/**
https://localhost:3000/**
http://localhost:3000/**
```

### 2. Settings → API → CORS

Dans la section **CORS**, ajoutez **TOUTES** vos origines autorisées, séparées par des virgules :

```
https://www.jessicacontentin.fr,https://jessicacontentin.fr,https://votre-autre-site.com,http://localhost:3000,https://localhost:3000
```

## Exemple de configuration complète

### Site URL (optionnel - peut être vide)
```
https://www.jessicacontentin.fr
```

### Redirect URLs (toutes vos URLs)
```
https://www.jessicacontentin.fr/**
https://jessicacontentin.fr/**
https://votre-autre-site.com/**
https://localhost:3000/**
http://localhost:3000/**
https://*.vercel.app/**
```

### CORS Origins (toutes vos origines)
```
https://www.jessicacontentin.fr
https://jessicacontentin.fr
https://votre-autre-site.com
http://localhost:3000
https://localhost:3000
https://*.vercel.app
```

## Note importante

- Le pattern `/**` dans Redirect URLs signifie "toutes les routes sous ce domaine"
- Vous pouvez ajouter autant d'URLs que nécessaire
- Les URLs de développement (localhost) et de production peuvent coexister
- Les URLs Vercel (`*.vercel.app`) peuvent être ajoutées avec le wildcard `*`

## Où trouver CORS dans Supabase

1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Allez dans **Settings** (icône d'engrenage en bas à gauche)
4. Cliquez sur **API** dans le menu de gauche
5. Faites défiler jusqu'à la section **CORS** (ou cherchez "CORS" avec Ctrl+F)

## Vérification

Après avoir configuré, testez la connexion sur chaque site. Tous devraient fonctionner.

