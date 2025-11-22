# Séparation BtoB/BtoC - Beyond Connect

## ✅ Protection complète implémentée

### Principe fondamental
- **Beyond Connect** : Uniquement les clients **BtoC** (Beyond No School) peuvent apparaître
- **LMS/Organisations** : Les apprenants **BtoB** (avec organisation) n'apparaissent QUE dans leur organisation
- **Exception** : Beyond Care (si l'entreprise le décide)

---

## 🔒 Routes API protégées

### 1. `/api/beyond-connect/candidates/search`
**Filtrage BtoC :**
- ✅ Filtre uniquement les utilisateurs avec rôle `learner` ou `student`
- ✅ Exclut tous les utilisateurs ayant une entrée dans `org_memberships` (BtoB)
- ✅ Respecte le paramètre `is_searchable` dans `beyond_connect_profile_settings`
- ✅ Ne retourne que les utilisateurs BtoC sans organisation

**Code de vérification :**
```typescript
// Récupère uniquement les learners/students
const { data: b2cProfiles } = await supabase
  .from("profiles")
  .select("id")
  .in("role", ["learner", "student"]);

// Exclut ceux qui ont une organisation
const { data: orgMemberships } = await supabase
  .from("org_memberships")
  .select("user_id")
  .in("user_id", b2cUserIds);

const usersWithOrg = new Set(orgMemberships?.map(m => m.user_id) || []);
const b2cOnlyUserIds = b2cUserIds.filter(id => !usersWithOrg.has(id));
```

---

### 2. `/api/beyond-connect/candidates/[userId]`
**Vérification BtoC :**
- ✅ Vérifie que le candidat a le rôle `learner` ou `student`
- ✅ Vérifie que le candidat n'a PAS d'organisation
- ✅ Retourne une erreur 403 si l'utilisateur est BtoB

**Code de vérification :**
```typescript
// Vérifie le rôle
const { data: profile } = await supabase
  .from("profiles")
  .select("*")
  .eq("id", candidateUserId)
  .in("role", ["learner", "student"])
  .single();

// Vérifie qu'il n'a pas d'organisation
const { data: membership } = await supabase
  .from("org_memberships")
  .select("id")
  .eq("user_id", candidateUserId)
  .maybeSingle();

if (membership) {
  return NextResponse.json({ error: "Ce profil n'est pas accessible (utilisateur BtoB)" }, { status: 403 });
}
```

---

### 3. `/api/beyond-connect/matches/calculate`
**Calcul de matching BtoC uniquement :**
- ✅ Récupère uniquement les utilisateurs BtoC (sans organisation)
- ✅ Calcule les matchings uniquement pour ces utilisateurs
- ✅ Respecte le paramètre `is_searchable`

**Code de vérification :**
```typescript
// Récupère uniquement les learners/students
const { data: b2cProfiles } = await supabase
  .from("profiles")
  .select("id")
  .in("role", ["learner", "student"]);

// Exclut ceux qui ont une organisation
const usersWithOrg = new Set(orgMemberships?.map(m => m.user_id) || []);
const b2cOnlyUserIds = b2cUserIds.filter(id => !usersWithOrg.has(id));
```

---

### 4. `/api/beyond-connect/matches`
**Filtrage des matchings retournés :**
- ✅ Filtre les résultats pour ne garder que les utilisateurs BtoC
- ✅ Vérifie que chaque profil dans les matchings n'a pas d'organisation

**Code de vérification :**
```typescript
// Vérifie que tous les utilisateurs sont BtoC
const { data: orgMemberships } = await supabase
  .from("org_memberships")
  .select("user_id")
  .in("user_id", userIds);

const usersWithOrg = new Set(orgMemberships?.map(m => m.user_id) || []);

// Filtre les matchings pour ne garder que ceux avec des utilisateurs BtoC
const b2cMatches = matches.filter((m: any) => {
  const userId = m.profiles?.id;
  return userId && !usersWithOrg.has(userId);
});
```

---

## 🔐 Permissions utilisateur (is_searchable)

### Principe
Les utilisateurs BtoC doivent **explicitement autoriser** leur profil à être visible dans Beyond Connect via le paramètre `is_searchable` dans `beyond_connect_profile_settings`.

### Comportement
- Si `is_searchable = true` : Le profil apparaît dans les recherches
- Si `is_searchable = false` ou `NULL` : Le profil n'apparaît PAS dans les recherches
- Par défaut : Les profils ne sont pas searchable (sécurité par défaut)

### Implémentation
Toutes les routes de recherche vérifient `is_searchable = true` :
```typescript
const { data: profileSettings } = await supabase
  .from("beyond_connect_profile_settings")
  .select("user_id")
  .eq("is_searchable", true)
  .in("user_id", b2cOnlyUserIds);
```

---

## 🚫 Utilisateurs BtoB exclus

### Exemples d'utilisateurs BtoB qui ne doivent JAMAIS apparaître dans Beyond Connect :
- `timmydarcy44@gmail.com` (appartient à une organisation)
- `j.contentin@laposte.net` (appartient à une organisation)
- Tous les apprenants avec une entrée dans `org_memberships`

### Où apparaissent-ils ?
- ✅ **LMS** : Dans leur organisation uniquement
- ✅ **Beyond Care** : Si l'entreprise le décide (exception)
- ❌ **Beyond Connect** : JAMAIS

---

## ✅ Routes sécurisées pour les utilisateurs BtoC

Les routes suivantes permettent aux utilisateurs BtoC de gérer leur propre profil (RLS en place) :
- `/api/beyond-connect/experiences` (GET, POST, PATCH, DELETE)
- `/api/beyond-connect/education` (GET, POST, PATCH, DELETE)
- `/api/beyond-connect/skills` (GET, POST, PATCH, DELETE)
- `/api/beyond-connect/certifications` (GET, POST, PATCH, DELETE)
- `/api/beyond-connect/projects` (GET, POST, PATCH, DELETE)
- `/api/beyond-connect/languages` (GET, POST, PATCH, DELETE)
- `/api/beyond-connect/badges` (GET)
- `/api/beyond-connect/test-results` (GET)

**Note :** Ces routes utilisent RLS (Row Level Security) pour s'assurer que chaque utilisateur ne peut accéder qu'à ses propres données.

---

## 📋 Checklist de vérification

- [x] Route `/api/beyond-connect/candidates/search` filtre BtoC uniquement
- [x] Route `/api/beyond-connect/candidates/[userId]` vérifie BtoC uniquement
- [x] Route `/api/beyond-connect/matches/calculate` calcule uniquement pour BtoC
- [x] Route `/api/beyond-connect/matches` filtre les résultats BtoC uniquement
- [x] Respect du paramètre `is_searchable` partout
- [x] Exclusion des utilisateurs avec `org_memberships`
- [x] Vérification du rôle `learner` ou `student`

---

## 🔄 Maintenance future

### Si vous ajoutez une nouvelle route Beyond Connect qui retourne des profils :
1. ✅ Vérifier que seuls les utilisateurs BtoC sont retournés
2. ✅ Exclure les utilisateurs avec `org_memberships`
3. ✅ Respecter le paramètre `is_searchable`
4. ✅ Vérifier le rôle `learner` ou `student`

### Pattern à suivre :
```typescript
// 1. Récupérer les utilisateurs BtoC
const { data: b2cProfiles } = await supabase
  .from("profiles")
  .select("id")
  .in("role", ["learner", "student"]);

// 2. Exclure ceux qui ont une organisation
const { data: orgMemberships } = await supabase
  .from("org_memberships")
  .select("user_id")
  .in("user_id", b2cUserIds);

const usersWithOrg = new Set(orgMemberships?.map(m => m.user_id) || []);
const b2cOnlyUserIds = b2cUserIds.filter(id => !usersWithOrg.has(id));

// 3. Respecter is_searchable
const { data: profileSettings } = await supabase
  .from("beyond_connect_profile_settings")
  .select("user_id")
  .eq("is_searchable", true)
  .in("user_id", b2cOnlyUserIds);
```

---

## ✅ Conclusion

La séparation BtoB/BtoC est **stable et complète**. Les utilisateurs BtoB ne peuvent **JAMAIS** apparaître dans Beyond Connect, sauf dans le cadre de Beyond Care si l'entreprise le décide.

Les utilisateurs BtoC doivent **explicitement autoriser** leur profil via `is_searchable = true` pour apparaître dans les recherches Beyond Connect.

