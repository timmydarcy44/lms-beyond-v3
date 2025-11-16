# 🎯 Différence entre Admin et Super Admin

## 📊 Distinction Conceptuelle

### **Admin** (`profiles.role = 'admin'`)
- **Rôle** : Administrateur d'une **organisation spécifique**
- **Portée** : Limitée à son organisation
- **Accès** : 
  - Gère les membres de son organisation
  - Gère les contenus de son organisation
  - Ne peut pas voir les autres organisations
  - Route : `/admin` (admin d'organisation)

### **Super Admin** (table `super_admins`)
- **Rôle** : Administrateur **global du système**
- **Portée** : **TOUTES** les organisations et utilisateurs
- **Accès** :
  - Voir et gérer **TOUTES** les organisations
  - Voir et gérer **TOUS** les utilisateurs
  - Créer des organisations
  - Créer des utilisateurs
  - Accès complet via bypass RLS
  - Route : `/admin/super` (super admin global)

---

## 🗂️ Structure Actuelle

### Routes Existantes :

1. **`/admin`** → Admin d'organisation
   - Dashboard avec statistiques de son organisation
   - Gestion des apprenants de son organisation
   - Gestion des groupes de son organisation
   - **Limité à son organisation uniquement**

2. **`/admin/super`** → Super Admin global
   - Dashboard avec statistiques **globales**
   - Gestion de **TOUTES** les organisations
   - Gestion de **TOUS** les utilisateurs
   - Création d'organisations
   - **Accès complet à tout le système**

---

## 🔐 Vérifications d'Accès

### Pour `/admin` :
```typescript
// Vérifie si l'utilisateur a le rôle "admin" dans son organisation
const userRole = await getUserRole(); // "admin" dans org_memberships
if (userRole !== "admin") {
  redirect("/dashboard");
}
```

### Pour `/admin/super` :
```typescript
// Vérifie si l'utilisateur est dans super_admins
const isSuperAdmin = await isSuperAdmin(); // Vérifie table super_admins
if (!isSuperAdmin) {
  redirect("/dashboard");
}
```

---

## 💡 Cas d'Usage

### Un **Admin** peut :
- ✅ Gérer les apprenants de son organisation
- ✅ Créer des groupes dans son organisation
- ✅ Voir les statistiques de son organisation
- ❌ Voir les autres organisations
- ❌ Créer des organisations
- ❌ Voir tous les utilisateurs du système

### Un **Super Admin** peut :
- ✅ Voir **TOUTES** les organisations
- ✅ Créer des organisations
- ✅ Voir **TOUS** les utilisateurs
- ✅ Créer des utilisateurs
- ✅ Gérer n'importe quelle organisation
- ✅ Accéder à toutes les données (RLS bypass)

---

## ⚠️ Problème Actuel

Les deux utilisent `/admin` comme base, ce qui peut créer de la confusion.

### Solution Recommandée :

**Option 1 : Garder la structure actuelle mais clarifier**
- `/admin` → Admin d'organisation
- `/admin/super` → Super Admin (plus explicite)

**Option 2 : Séparer complètement**
- `/admin` → Admin d'organisation
- `/super` → Super Admin (route dédiée)

**Option 3 : Préfixe clair**
- `/admin/organisation` → Admin d'organisation
- `/admin/global` ou `/admin/super` → Super Admin

---

## ✅ Recommandation

**Garder `/admin/super`** pour les Super Admins car :
- ✅ C'est déjà implémenté
- ✅ Le préfixe `/admin/super` est explicite
- ✅ Pas de confusion avec `/admin` seul

**Mais clarifier dans l'interface** :
- Afficher clairement "Super Admin" vs "Admin Organisation" dans les menus
- Ajouter des badges visuels distincts



