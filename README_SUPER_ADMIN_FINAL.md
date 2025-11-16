# 🚀 Espace Super Admin - Route Dédiée `/super`

## ✨ Caractéristiques

- **Route dédiée** : `/super` (pas `/admin/super`)
- **Design futuriste** : Interface avec effets néon cyan, animations, backdrop blur
- **Accès exclusif** : Seuls les super admins peuvent y accéder
- **Redirection automatique** : Après login, les super admins sont automatiquement redirigés vers `/super`

## 🎨 Design Futuriste

- **Couleurs** : Cyan (#00FFFF) avec accents multicolores
- **Effets** : 
  - Ombres néon (`shadow-[0_0_20px_rgba(0,255,255,0.3)]`)
  - Backdrop blur
  - Gradients animés
  - Bordures lumineuses
- **Typographie** : Font mono pour les labels, gradients pour les titres

## 📋 Pages Disponibles

- `/super` - Command Center (Dashboard)
- `/super/organisations` - Liste des organisations
- `/super/organisations/new` - Créer une organisation
- `/super/organisations/[id]` - Détails d'une organisation
- `/super/utilisateurs` - Liste des utilisateurs
- `/super/utilisateurs/new` - Créer un utilisateur
- `/super/utilisateurs/[id]` - Détails d'un utilisateur
- `/super/statistiques` - Statistiques globales
- `/super/parametres` - Configuration système

## 🔐 Sécurité

L'accès est protégé par le layout `/super/layout.tsx` qui vérifie la table `super_admins`.

## 🔄 Redirection Automatique

La route `/api/auth/session` détecte automatiquement les super admins et redirige vers `/super` au lieu du dashboard normal.



