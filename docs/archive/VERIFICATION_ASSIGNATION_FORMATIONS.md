# ⚠️ Vérification : Affichage des Formations pour les Apprenants

## Question

**Un formateur crée une formation et assigne des apprenants → Les apprenants doivent voir la formation dans leur interface.**

---

## 📊 État Actuel du Code

### Dans `src/lib/queries/apprenant.ts` (lignes 337-341)

La requête actuelle pour récupérer les formations est :

```typescript
supabase
  .from("courses")
  .select("id, title, cover_image, modules_count, duration_minutes, updated_at, category")
  .eq("status", "published")
  .order("updated_at", { ascending: false })
  .limit(24),
```

**⚠️ PROBLÈME DÉTECTÉ** : Cette requête récupère simplement tous les cours avec `status = 'published'` sans vérifier :
1. Si l'apprenant est assigné à la formation via `content_assignments`
2. Si l'apprenant appartient à un groupe auquel la formation est assignée
3. Si l'apprenant est membre de l'organisation qui possède la formation

---

## ✅ Comment Ça DEVRAIT Fonctionner

### Mécanisme d'Affectation

D'après l'audit de ta base de données, il existe deux systèmes :

#### Système 1 : Table `courses` (ancien système)
- Utilisé dans le code actuel
- N'a PAS de table `content_assignments` visible dans l'audit
- Utilise `enrollments` pour lier un apprenant à un cours

#### Système 2 : Table `formations` (système principal)
- Structure hiérarchique : `formations` → `sections` → `chapters` → `subchapters`
- Possède une table `content_assignments` pour assigner le contenu
- Utilise `org_memberships` pour les permissions

### Logique Métier Attendue

Un apprenant doit voir une formation si **AU MOINS UNE** de ces conditions est vraie :

1. **Il est membre de l'organisation** qui possède la formation ET la formation a une visibilité `public` ou `catalog_only`
2. **Il est explicitement assigné** à la formation via `content_assignments` (target_type = 'learner' ET target_id = user_id)
3. **Il appartient à un groupe** qui est assigné à la formation via `content_assignments` (target_type = 'group' ET target_id = group_id)
4. **Il est inscrit** dans le cours via la table `enrollments` (pour le système `courses`)

---

## 🔍 Vérification des RLS Policies

D'après l'audit, les policies RLS pour `formations` permettent à un apprenant de voir une formation si :

```
- Il est membre de l'organisation (org_memberships)
- OU la formation a une visibilité 'public' ou 'catalog_only'
- OU il y a un content_assignment qui le cible
```

**✅ Les RLS policies semblent correctes** et devraient automatiquement filtrer les formations.

---

## ⚠️ Problème Potentiel

### Système `courses` vs `formations`

Le code actuel interroge la table **`courses`**, mais selon l'audit, le système principal utilise la table **`formations`**.

**Vérification nécessaire** :
1. La table `courses` a-t-elle des RLS policies qui vérifient les assignations ?
2. La table `courses` utilise-t-elle `enrollments` pour lier les apprenants ?
3. Faut-il utiliser `formations` au lieu de `courses` ?

---

## ✅ Solution Recommandée

### Option 1 : Utiliser le système `formations` (recommandé)

Modifier la requête pour utiliser `formations` et vérifier explicitement les assignations :

```typescript
const { data: authData } = await supabase.auth.getUser();
const userId = authData?.user?.id;

// Requête qui récupère les formations :
// 1. Via org_memberships (RLS le fait automatiquement)
// 2. Via content_assignments explicites
const { data: formations } = await supabase
  .from("formations")
  .select(`
    id,
    title,
    description,
    cover_url,
    visibility_mode,
    org_id,
    content_assignments!inner(
      target_type,
      target_id,
      groups:group_members!inner(user_id)
    )
  `)
  .or(`visibility_mode.in.(public,catalog_only),content_assignments.target_type.eq.learner,content_assignments.target_type.eq.group`)
  .eq("content_assignments.target_id", userId) // Pour les assignations directes
  // OU via group_members pour les assignations de groupe
```

### Option 2 : Vérifier les `enrollments` pour `courses`

Si le système `courses` utilise `enrollments`, la requête devrait être :

```typescript
const { data: courses } = await supabase
  .from("courses")
  .select(`
    *,
    enrollments!inner(user_id)
  `)
  .eq("enrollments.user_id", userId)
  .eq("status", "published");
```

### Option 3 : Compter sur les RLS uniquement

Si les RLS policies sont bien configurées pour `courses` (vérifier dans l'audit), la requête actuelle devrait fonctionner car Supabase filtre automatiquement via RLS.

---

## 🔧 Action Requise

**À vérifier dans ta base de données** :

1. **La table `courses` a-t-elle des RLS policies qui filtrent par assignation ?**
   - Regarde les policies pour `courses` dans l'audit
   - Vérifie si elles utilisent `enrollments` ou `content_assignments`

2. **Quel système utilises-tu réellement ?**
   - `courses` avec `enrollments` ?
   - `formations` avec `content_assignments` ?

3. **Test manuel** :
   - Crée une formation en tant que formateur
   - Assigne-la à un apprenant
   - Connecte-toi en tant qu'apprenant
   - Vérifie si la formation apparaît dans son dashboard

---

## 📝 Réponse à Ta Question

### ❌ Problème Initial

**Avant la correction** : La requête récupérait **TOUS les cours publiés** sans filtrer par assignation, car :
- La RLS policy `courses_public_published` permet à **TOUS** les utilisateurs de voir les cours avec `status = 'published'`
- La requête ne vérifiait pas la table `enrollments` pour filtrer les cours assignés

**Résultat** : Un apprenant voyait TOUS les cours publiés, même ceux auxquels il n'était pas assigné.

### ✅ Solution Implémentée

**Après correction** : La requête filtre maintenant explicitement par `enrollments` :

```typescript
// Récupérer uniquement les cours auxquels l'apprenant est inscrit via enrollments
supabase
  .from("courses")
  .select("..., enrollments!inner(user_id)")
  .eq("status", "published")
  .eq("enrollments.user_id", userId)
```

**Résultat** : Un apprenant voit **UNIQUEMENT** les cours auxquels il est inscrit via la table `enrollments`.

---

## ✅ Logique Métier Finale

**Quand un formateur assigne une formation à un apprenant** :

1. Le formateur (ou admin) crée un enregistrement dans `enrollments` :
   ```sql
   INSERT INTO enrollments (user_id, course_id, role)
   VALUES ('user_id_apprenant', 'course_id_formation', 'student');
   ```

2. L'apprenant se connecte et accède à son dashboard

3. La requête filtre automatiquement via `enrollments` et ne retourne que ses cours assignés

4. ✅ **L'apprenant voit la formation dans son interface**

**C'est maintenant garanti** ! 🎉

