# Architecture d'Assignation de Contenu - Comment ça fonctionne ?

## 🎯 Modèle Hybride : Organisation + Assignation Directe

Le système fonctionne avec **deux niveaux complémentaires** :

### 1️⃣ **L'Organisation comme Base d'Isolation** (Niveau 1)

**Principe** : Chaque contenu appartient à une organisation (`org_id`)

- ✅ **Tous les contenus** (formations, parcours, ressources, tests) ont un `org_id`
- ✅ **Tous les utilisateurs** sont membres d'organisations via `org_memberships`
- ✅ **Isolation** : Un formateur de l'org A ne voit que les apprenants de l'org A
- ✅ **Permissions de base** : L'appartenance à une org définit les permissions

**Tables clés** :
- `organizations` : Les organisations
- `org_memberships` : Qui appartient à quelle org avec quel rôle

**Dans le code** :
```typescript
// Les formateurs voient les apprenants de leur(s) organisation(s)
const orgIds = instructorMemberships.map(m => m.org_id);
const learners = await supabase
  .from("org_memberships")
  .select("user_id, org_id")
  .in("org_id", orgIds)
  .eq("role", "learner");
```

---

### 2️⃣ **L'Assignation Directe par le Formateur** (Niveau 2)

**Principe** : Le formateur assigne **explicitement** du contenu aux apprenants

- ✅ Le formateur choisit **quel contenu** assigner à **quel apprenant**
- ✅ Les assignations sont stockées dans des tables dédiées :
  - `enrollments` : Pour les formations (`course_id` + `user_id`)
  - `path_progress` : Pour les parcours (`path_id` + `user_id`)
  - `resource_views` / `resource_assignments` : Pour les ressources
  - `test_attempts` / `test_assignments` : Pour les tests

**Sécurité** : Le formateur ne peut assigner que :
- Le contenu qu'il **possède** (`owner_id` ou `creator_id` = formateur)
- Le contenu de **son organisation** (`org_id` = org du formateur)

**Dans le code** :
```typescript
// Vérification que le parcours appartient au formateur
const { data: path } = await supabase
  .from("paths")
  .select("id, owner_id, creator_id")
  .eq("id", pathId)
  .single();

if (path && (path.owner_id === authData.user.id || path.creator_id === authData.user.id)) {
  // Assigner via path_progress
  await supabase.from("path_progress").upsert({
    path_id: pathId,
    user_id: learnerId,
    progress_percent: 0,
  });
}
```

---

## 🔄 Flux Complet d'Assignation

### Scénario : Formateur assigne un parcours à un apprenant

1. **Vérification Organisation** :
   - ✅ Le formateur est `instructor` dans une org
   - ✅ L'apprenant est `learner` dans la **même** org
   - ❌ Sinon : L'apprenant n'est pas visible par le formateur

2. **Vérification Propriété** :
   - ✅ Le parcours a `owner_id` ou `creator_id` = formateur
   - ✅ Le parcours a `org_id` = org du formateur
   - ❌ Sinon : Le formateur ne peut pas assigner ce parcours

3. **Assignation** :
   - ✅ Création d'un enregistrement dans `path_progress`
   - ✅ L'apprenant peut maintenant voir le parcours dans son dashboard

4. **Visibilité pour l'Apprenant** :
   - ✅ Le parcours apparaît car il y a un enregistrement dans `path_progress`
   - ✅ Les contenus du parcours (formations, tests, ressources) apparaissent via les tables de liaison (`path_courses`, `path_tests`, `path_resources`)

---

## 🎓 Réponse à Votre Question

**"C'est l'organisation la référence ou ce sont les formateurs ?"**

### Réponse : **Les deux, mais de manière complémentaire**

#### L'Organisation définit :
- ✅ **Qui peut voir qui** : Le formateur voit les apprenants de sa/ces organisation(s)
- ✅ **L'isolation des données** : Les contenus sont isolés par organisation
- ✅ **Les permissions de base** : Qui peut créer/modifier quoi dans quelle org

#### Le Formateur définit :
- ✅ **Quel contenu assigner** : Le formateur choisit quelles formations/parcours/ressources assigner
- ✅ **À quel apprenant** : Le formateur choisit à qui assigner le contenu
- ✅ **Le contrôle fin** : Un formateur peut avoir plusieurs apprenants mais assigner des contenus différents à chacun

---

## 💡 Exemple Concret

**Organisation "Beyond Learning"** :
- Formateur : `timmydarcy44@gmail.com` (rôle `instructor`)
- Apprenant : `j.contentin@laposte.net` (rôle `learner`)

**Processus** :
1. Les deux sont membres de la même org → Le formateur voit l'apprenant
2. Le formateur crée un parcours "Négociateur Technico Commercial" → `org_id` = org de Beyond Learning, `owner_id` = timmydarcy44
3. Le formateur assigne le parcours à j.contentin → Création dans `path_progress`
4. L'apprenant voit le parcours dans son dashboard → Récupération via `path_progress` où `user_id` = j.contentin

**Si un autre formateur** (`autreformateur@email.com`) de la **même** organisation :
- ✅ Peut voir j.contentin (même org)
- ❌ Ne peut **pas** assigner le parcours de timmydarcy44 (pas le propriétaire)
- ✅ Peut créer ses propres parcours et les assigner à j.contentin

**Si un formateur** d'une **autre** organisation :
- ❌ Ne voit **pas** j.contentin (org différente)
- ❌ Ne peut **pas** assigner de contenu à j.contentin (isolation)

---

## 🔐 Sécurité Multi-Niveaux

Le système est sécurisé à plusieurs niveaux :

1. **RLS Policies** : Vérifient automatiquement :
   - L'appartenance à l'organisation (`org_memberships`)
   - L'assignation explicite (`path_progress`, `enrollments`, etc.)

2. **Code applicatif** : Vérifie :
   - La propriété du contenu (`owner_id` / `creator_id`)
   - Les permissions du formateur (`role = 'instructor'` dans l'org)

3. **Base de données** : Contraintes :
   - `org_id` NOT NULL sur tous les contenus
   - Clés étrangères pour garantir l'intégrité

---

## ✅ Conclusion

**Le système fonctionne pour TOUS les utilisateurs** car :

1. **Dynamique** : Les vérifications utilisent `auth.uid()` (utilisateur actuel)
2. **Générique** : Les fonctions utilisent des paramètres (`p_user_id`, `p_path_id`)
3. **Scalable** : Fonctionne avec 1 ou 1000 formateurs/apprenants
4. **Isolé** : Chaque organisation est indépendante
5. **Flexible** : Les formateurs contrôlent finement l'assignation

**C'est un système multi-tenant où l'organisation définit le périmètre, et le formateur décide de l'assignation précise.**



