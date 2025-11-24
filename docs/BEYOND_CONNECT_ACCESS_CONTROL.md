# Beyond Connect - Contrôle d'Accès

## 🎯 Principe

**Beyond Connect est uniquement accessible aux apprenants BtoC (Beyond No School).**

Les entreprises et autres utilisateurs n'ont pas accès à l'application, mais peuvent consulter la vitrine publique.

---

## ✅ Accès autorisés

### Apprenants BtoC (Beyond No School)
- ✅ **Rôle** : `learner` ou `student`
- ✅ **Organisation** : Aucune (pas d'entrée dans `org_memberships`)
- ✅ **Accès** : `/beyond-connect-app` (application complète)
- ✅ **Fonctionnalités** :
  - Gérer leur CV numérique
  - Ajouter expériences, compétences, certifications
  - Voir les offres d'emploi publiques
  - Postuler aux offres

---

## ❌ Accès refusés

### Utilisateurs BtoB (avec organisation)
- ❌ **Rôle** : `learner` ou `student` mais avec une organisation
- ❌ **Accès** : Redirigés vers `/beyond-connect?error=access_denied`
- ❌ **Raison** : Ils appartiennent à une organisation (CFA, entreprise, etc.)

### Formateurs / Admins
- ❌ **Rôle** : `instructor`, `admin`, `tutor`
- ❌ **Accès** : Redirigés vers `/beyond-connect?error=access_denied`
- ❌ **Raison** : Beyond Connect est réservé aux apprenants

---

## 🌐 Vitrine publique

### Route : `/beyond-connect`
- ✅ **Accès** : Public (aucune authentification requise)
- ✅ **Public cible** : Entreprises intéressées par Beyond Connect
- ✅ **Contenu** :
  - Présentation de Beyond Connect
  - Fonctionnalités
  - Comment ça fonctionne
  - Formulaire de contact
  - CTA pour demander une démo

---

## 🔒 Protection implémentée

### Layout : `src/app/beyond-connect-app/layout.tsx`

```typescript
// 1. Vérification de l'authentification
if (!session) {
  redirect("/login?next=/beyond-connect-app");
}

// 2. Vérification du rôle (learner ou student uniquement)
const { data: profile } = await supabase
  .from("profiles")
  .select("id, role")
  .eq("id", session.id)
  .single();

if (!profile || (profile.role !== "learner" && profile.role !== "student")) {
  redirect("/beyond-connect?error=access_denied");
}

// 3. Vérification BtoC (pas d'organisation)
const { data: membership } = await supabase
  .from("org_memberships")
  .select("id")
  .eq("user_id", session.id)
  .maybeSingle();

if (membership) {
  redirect("/beyond-connect?error=access_denied");
}
```

---

## 📋 Routes protégées

Toutes les routes sous `/beyond-connect-app` sont protégées :
- `/beyond-connect-app` - CV numérique de l'apprenant
- `/beyond-connect-app/cv` - Gestion du CV
- `/beyond-connect-app/jobs` - Offres d'emploi publiques

**Note** : Les routes `/beyond-connect-app/companies/*` sont également protégées par ce layout. 
Actuellement, seuls les apprenants BtoC peuvent y accéder. Si vous souhaitez permettre aux entreprises 
d'accéder à cette section à l'avenir, il faudra créer un layout séparé ou modifier la logique d'accès.

---

## 🚀 Accès depuis Beyond No School

Les apprenants BtoC peuvent accéder à Beyond Connect depuis leur dashboard Beyond No School via un lien ou un bouton dédié.

**Exemple d'intégration** :
```tsx
// Dans le dashboard Beyond No School
<Link href="/beyond-connect-app">
  <Button>Mon CV numérique - Beyond Connect</Button>
</Link>
```

---

## 📝 Messages d'erreur

### Erreur d'accès refusé
- **URL** : `/beyond-connect?error=access_denied`
- **Message affiché** : 
  > "Beyond Connect est actuellement réservé aux apprenants de Beyond No School. 
  > Si vous êtes une entreprise intéressée par nos services, veuillez nous contacter."

---

## 🔄 Évolutions futures

### Si vous souhaitez permettre aux entreprises d'accéder à Beyond Connect :

1. **Créer un layout séparé** pour `/beyond-connect-app/companies`
2. **Modifier la logique d'accès** pour permettre :
   - Apprenants BtoC → `/beyond-connect-app` (CV)
   - Entreprises (membres d'organisation) → `/beyond-connect-app/companies` (recrutement)
3. **Séparer les routes** :
   - `/beyond-connect-app` → Layout pour apprenants BtoC
   - `/beyond-connect-app/companies` → Layout pour entreprises

---

## ✅ Checklist de vérification

- [x] Layout vérifie l'authentification
- [x] Layout vérifie le rôle (learner/student uniquement)
- [x] Layout vérifie l'absence d'organisation (BtoC uniquement)
- [x] Redirection vers la vitrine en cas d'accès refusé
- [x] Vitrine publique accessible sans authentification
- [x] Message d'erreur informatif sur la vitrine


