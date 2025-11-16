# 🔧 Étapes d'Intégration du Tracking de Sessions

## ✅ Script SQL Exécuté
Le schéma de la base de données est maintenant prêt !

---

## 📋 Pages à Modifier

Vous devez intégrer le composant `LearningSessionTracker` dans les pages où les **apprenants visualisent le contenu**.

### 1. **Parcours (PRIORITÉ 1)** ✅

**Fichier** : `src/app/dashboard/parcours/[slug]/page.tsx`

**Modification** :

```tsx
// Ajouter l'import en haut
import { LearningSessionTracker } from "@/components/learning-session-tracker";

// Dans le composant, trouver le return et wrapper le contenu :
export default async function LearnerParcoursDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  // ... votre code existant ...
  
  const parcoursCard = data.parcours.find((item) => item.slug === resolvedSlug);
  if (!parcoursCard) {
    notFound();
  }

  // ... votre code existant ...

  return (
    <LearningSessionTracker
      contentType="path"
      contentId={parcoursCard.id}  // ← Utiliser l'ID du parcours
      showIndicator={false}  // Optionnel : true pour voir le timer
    >
      <DashboardShell>
        {/* Votre contenu existant */}
      </DashboardShell>
    </LearningSessionTracker>
  );
}
```

---

### 2. **Tests (PRIORITÉ 2)** ✅

**Fichier** : `src/app/dashboard/tests/[slug]/page.tsx`

**Modification** :

```tsx
// Ajouter l'import en haut
import { LearningSessionTracker } from "@/components/learning-session-tracker";

// Dans le composant :
export default async function TestPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  // ... votre code existant pour récupérer le test ...
  
  const testDetail = await getLearnerContentDetail(slug, "test");
  if (!testDetail) {
    notFound();
  }

  return (
    <LearningSessionTracker
      contentType="test"
      contentId={testDetail.id}  // ← Utiliser l'ID du test
      showIndicator={false}
    >
      <DashboardShell>
        <TestExperience 
          slug={slug}
          title={testDetail.title}
          questions={testDetail.questions}
          // ... autres props ...
        />
      </DashboardShell>
    </LearningSessionTracker>
  );
}
```

---

### 3. **Cours/Formations (PRIORITÉ 3)** ⚠️ À CRÉER SI NÉCESSAIRE

Si vous avez une page pour que les apprenants visualisent un cours, intégrez-y le tracking.

**Exemple** (si la page existe) :
```tsx
import { LearningSessionTracker } from "@/components/learning-session-tracker";

<LearningSessionTracker
  contentType="course"
  contentId={courseId}
>
  {/* Contenu du cours */}
</LearningSessionTracker>
```

---

### 4. **Ressources (PRIORITÉ 4)** ⚠️ À CRÉER SI NÉCESSAIRE

Si vous avez une page pour que les apprenants visualisent une ressource, intégrez-y le tracking.

**Exemple** :
```tsx
import { LearningSessionTracker } from "@/components/learning-session-tracker";

<LearningSessionTracker
  contentType="resource"
  contentId={resourceId}
>
  {/* Contenu de la ressource */}
</LearningSessionTracker>
```

---

## 🎯 Checklist d'Intégration

- [ ] **Parcours** : Intégrer dans `src/app/dashboard/parcours/[slug]/page.tsx`
- [ ] **Tests** : Intégrer dans `src/app/dashboard/tests/[slug]/page.tsx`
- [ ] **Cours** : Intégrer dans la page de visualisation des cours (si elle existe)
- [ ] **Ressources** : Intégrer dans la page de visualisation des ressources (si elle existe)

---

## 🧪 Test Rapide

Après avoir intégré le tracking :

1. **Ouvrir une page avec le tracking** (ex: un parcours)
2. **Ouvrir la console du navigateur** (F12)
3. **Bouger la souris** → Vous devriez voir des requêtes vers `/api/learning-sessions`
4. **Vérifier dans Supabase** :
   ```sql
   SELECT * FROM learning_sessions 
   ORDER BY started_at DESC 
   LIMIT 5;
   ```

---

## 💡 Optionnel : Afficher le Timer

Si vous voulez que les apprenants voient leur temps de session en temps réel :

```tsx
<LearningSessionTracker
  contentType="path"
  contentId={parcoursCard.id}
  showIndicator={true}  // ← Active l'affichage du timer
>
  {/* Contenu */}
</LearningSessionTracker>
```

Un indicateur apparaîtra en **bas à droite** avec :
- ⏱️ Temps total
- 🟢 Temps actif (vert si actif, gris si inactif)

---

## ⚠️ Important

- Le tracking démarre **automatiquement** quand la page se charge
- Il se termine **automatiquement** quand l'utilisateur quitte la page
- Le temps actif est **mis en pause** après 5 minutes d'inactivité
- Les données sont **sauvegardées toutes les 30 secondes**

---

**Commencez par intégrer dans les parcours et tests, puis testez ! 🚀**




