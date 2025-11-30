# Bot d'Analyse Concurrentielle

## 🚀 Utilisation

### Option 1 : Version Simple (Recommandée)

La version simple n'utilise que Node.js natif, pas besoin d'installer Puppeteer.

```bash
# 1. Éditer le fichier scripts/competitor-analyzer-simple.js
# 2. Ajouter les URLs des concurrents dans COMPETITOR_URLS
# 3. Exécuter :
node scripts/competitor-analyzer-simple.js
```

### Option 2 : Version Complète (avec Puppeteer)

La version complète peut rechercher automatiquement les concurrents sur Google.

```bash
# 1. Installer Puppeteer (si pas déjà installé)
npm install puppeteer

# 2. Éditer le fichier scripts/competitor-analyzer.js
# 3. Optionnel : Ajouter des URLs manuelles dans COMPETITOR_URLS
# 4. Exécuter :
node scripts/competitor-analyzer.js
```

## 📋 Comment obtenir les URLs des concurrents

### Méthode 1 : Recherche Google Manuelle

1. Aller sur Google.fr
2. Rechercher : "psychopédagogue Caen"
3. Noter les 10 premiers résultats (sites web uniquement, pas Doctolib/PagesJaunes)
4. Répéter pour chaque mot-clé :
   - "troubles DYS Caen"
   - "TDA-H Caen"
   - "harcèlement scolaire Caen"
   - etc.

### Méthode 2 : Utiliser le bot (version complète)

Le bot peut automatiquement rechercher sur Google pour chaque mot-clé défini dans `TARGET_KEYWORDS`.

## 📊 Résultats

Le bot génère deux fichiers :

1. **`competitor-analysis-report.json`** : Rapport détaillé en JSON
2. **`COMPETITOR_ANALYSIS_REPORT.md`** : Rapport lisible en Markdown

## 🔍 Données Analysées

Pour chaque concurrent, le bot analyse :

- ✅ SEO (Title, Meta Description, H1, H2)
- ✅ Structured Data (Schema.org)
- ✅ Performance (temps de chargement)
- ✅ Mobile-friendly
- ✅ Sitemap
- ✅ Contenu (nombre de mots, liens, images)
- ✅ Fonctionnalités (Blog, FAQ, Témoignages, Contact, RDV)
- ✅ Structure (H1, H2)

## ⚠️ Notes

- Le bot respecte les robots.txt et fait des pauses entre les requêtes
- Certains sites peuvent bloquer les bots (erreurs possibles)
- Le temps d'analyse dépend du nombre de concurrents (environ 1-2 secondes par site)

## 📝 Exemple d'utilisation

```javascript
// Dans competitor-analyzer-simple.js
const COMPETITOR_URLS = [
  'https://psychopedagogue-caen-exemple.fr',
  'https://accompagnement-dys-caen.fr',
  'https://cabinet-psychopedagogie-normandie.fr',
];
```

Puis exécuter :
```bash
node scripts/competitor-analyzer-simple.js
```

