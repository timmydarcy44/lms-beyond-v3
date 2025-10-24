# Tests Phase 3 - Interface Utilisateur Parcours

## 🎯 Objectif
Valider le fonctionnement complet de l'interface utilisateur pour la gestion des parcours d'apprentissage.

## 📋 Prérequis
- Serveur de développement lancé : `npm run dev`
- Variables d'environnement Supabase configurées
- Organisation avec des données de test (formations, ressources, tests, apprenants, groupes)

## 🧪 Tests API (curl)

### 1. Liste des parcours
```bash
curl -X GET "http://localhost:3000/api/parcours?org=test-org" \
  -H "Content-Type: application/json"
```

### 2. Création d'un parcours
```bash
curl -X POST "http://localhost:3000/api/parcours?org=test-org" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Parcours Test React",
    "description": "Formation complète React.js",
    "reading_mode": "linear"
  }'
```

### 3. Récupération d'un parcours
```bash
curl -X GET "http://localhost:3000/api/parcours/{PATHWAY_ID}" \
  -H "Content-Type: application/json"
```

### 4. Mise à jour des items d'un parcours
```bash
curl -X POST "http://localhost:3000/api/parcours/{PATHWAY_ID}/items" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "type": "formation",
        "id": "FORMATION_ID_1",
        "position": 0
      },
      {
        "type": "test",
        "id": "TEST_ID_1",
        "position": 1
      }
    ]
  }'
```

### 5. Assignation d'apprenants et groupes
```bash
curl -X POST "http://localhost:3000/api/parcours/{PATHWAY_ID}/assignments" \
  -H "Content-Type: application/json" \
  -d '{
    "learners": ["USER_ID_1", "USER_ID_2"],
    "groups": ["GROUP_ID_1"]
  }'
```

## 🖱️ Tests Interface Utilisateur

### Scénario 1 : Navigation vers les parcours
1. **Accès** : Aller sur `http://localhost:3000/admin/{org-slug}/parcours`
2. **Vérification** : 
   - ✅ Page se charge sans erreur
   - ✅ Liste des parcours s'affiche (ou état vide)
   - ✅ Bouton "Nouveau parcours" visible
   - ✅ Navigation dans le menu admin fonctionne

### Scénario 2 : Création d'un parcours
1. **Action** : Cliquer sur "Nouveau parcours"
2. **Vérification** :
   - ✅ Modal s'ouvre avec focus sur le champ titre
   - ✅ Validation : impossible de créer sans titre
   - ✅ Création réussie : modal se ferme, parcours apparaît dans la liste
   - ✅ Toast de succès affiché

### Scénario 3 : Édition d'un parcours
1. **Action** : Cliquer sur "Modifier" sur un parcours existant
2. **Navigation** : Aller sur `/admin/{org-slug}/parcours/{pathway-id}`
3. **Vérification** :
   - ✅ Page se charge avec les données du parcours
   - ✅ Formulaire pré-rempli avec les bonnes valeurs
   - ✅ Bouton "Retour" fonctionne

### Scénario 4 : Modification des informations générales
1. **Action** : Modifier le titre, description, mode de lecture
2. **Action** : Cliquer sur "Sauvegarder"
3. **Vérification** :
   - ✅ Validation Zod côté client (titre requis)
   - ✅ Sauvegarde réussie avec toast de succès
   - ✅ Données mises à jour en temps réel

### Scénario 5 : Gestion des éléments du parcours
1. **Action** : Cliquer sur "Ajouter" dans la section éléments
2. **Vérification** :
   - ✅ Modal s'ouvre avec onglets (Formations/Tests/Ressources)
   - ✅ Liste des éléments disponibles s'affiche
   - ✅ Recherche locale fonctionne dans chaque onglet
   - ✅ Sélection multiple possible

3. **Action** : Sélectionner des éléments et cliquer "Ajouter"
4. **Vérification** :
   - ✅ Éléments ajoutés à la liste avec badges de type
   - ✅ Drag & Drop fonctionne pour réorganiser
   - ✅ Bouton "Supprimer" sur chaque élément fonctionne

5. **Action** : Cliquer sur "Sauvegarder l'ordre"
6. **Vérification** :
   - ✅ Optimistic update : réorganisation immédiate
   - ✅ Sauvegarde réussie avec toast de succès
   - ✅ Rollback en cas d'erreur

### Scénario 6 : Assignation d'apprenants et groupes
1. **Action** : Utiliser les sélecteurs multi-choix
2. **Vérification** :
   - ✅ Liste des apprenants s'affiche avec emails
   - ✅ Liste des groupes s'affiche avec noms
   - ✅ Recherche locale fonctionne
   - ✅ Sélection multiple possible
   - ✅ Pills de sélection avec bouton de suppression

3. **Action** : Cliquer sur "Sauvegarder les assignations"
4. **Vérification** :
   - ✅ Sauvegarde réussie avec toast de succès
   - ✅ Données persistées

### Scénario 7 : Gestion des erreurs
1. **Test** : Déconnecter la base de données ou modifier les variables d'env
2. **Vérification** :
   - ✅ Messages d'erreur clairs affichés
   - ✅ États de loading appropriés
   - ✅ Pas d'écran rouge, gestion gracieuse

## 🎨 Tests d'Accessibilité

### Navigation clavier
- ✅ Tab navigation fonctionne dans tous les composants
- ✅ Focus visible sur tous les éléments interactifs
- ✅ Escape ferme les modals
- ✅ Enter active les boutons et liens

### Screen readers
- ✅ Labels associés aux inputs
- ✅ ARIA-live pour les toasts
- ✅ Rôles appropriés (dialog, alert)
- ✅ Textes alternatifs pour les icônes

## 📱 Tests Responsive

### Mobile (< 768px)
- ✅ Layout s'adapte correctement
- ✅ Modals utilisent toute la largeur disponible
- ✅ Boutons et inputs restent utilisables
- ✅ Drag & Drop fonctionne sur tactile

### Desktop (> 768px)
- ✅ Sidebar visible et fonctionnelle
- ✅ Modals centrées avec taille appropriée
- ✅ Hover states fonctionnent
- ✅ Multi-sélection avec Ctrl/Cmd

## 🐛 Cas d'erreur à tester

1. **API indisponible** : Vérifier les messages d'erreur
2. **Données corrompues** : Gestion des réponses malformées
3. **Conflits de données** : Optimistic updates avec rollback
4. **Validation côté serveur** : Messages d'erreur Zod
5. **Timeout réseau** : Gestion des requêtes lentes

## ✅ Critères de succès

- [ ] Tous les scénarios fonctionnent sans erreur
- [ ] TypeScript compile sans erreur (`npm run typecheck`)
- [ ] Build Next.js réussit (`npm run build`)
- [ ] Performance acceptable (< 2s de chargement)
- [ ] Accessibilité de base respectée
- [ ] Responsive design fonctionnel
- [ ] Gestion d'erreur gracieuse

## 📝 Notes de débogage

### Logs utiles
- Console navigateur : erreurs JavaScript
- Network tab : requêtes API et réponses
- React Query DevTools : état du cache
- Vercel logs : erreurs serveur

### Variables d'environnement
```bash
# Vérifier que ces variables sont définies
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_URL=
SUPABASE_ANON_KEY=
```

### Commandes utiles
```bash
# Vérifier TypeScript
npm run typecheck

# Build de production
npm run build

# Lancer en production locale
npm run start

# Nettoyer le cache Next.js
rm -rf .next
```
