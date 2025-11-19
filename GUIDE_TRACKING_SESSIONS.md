# 📊 Guide d'Intégration du Tracking de Sessions

## ✅ Système Implémenté

Le système de tracking de temps de connexion et de temps actif (basé sur les mouvements de souris) est maintenant **complet**.

---

## 🎯 Fonctionnalités

### 1. **Tracking Automatique**
- ✅ Détection des mouvements de souris
- ✅ Détection des clics et touches
- ✅ Détection du scroll
- ✅ Détection du focus/blur de la fenêtre
- ✅ Détection d'inactivité après 5 minutes

### 2. **Temps Total vs Temps Actif**
- **Temps total** : Temps écoulé depuis le début de la session
- **Temps actif** : Temps réellement passé à interagir (souris, clavier, focus)
- Le système pause automatiquement le compteur actif après 5 minutes d'inactivité

### 3. **Synchronisation**
- Sauvegarde automatique toutes les 30 secondes
- Sauvegarde à la fermeture de la page/component

---

## 📦 Composants Créés

### 1. `useLearningSession` Hook
**Fichier** : `src/hooks/use-learning-session.ts`

**Usage** :
```tsx
const {
  totalDuration,
  activeDuration,
  totalDurationFormatted,
  activeDurationFormatted,
  isActive,
  isIdle,
} = useLearningSession({
  contentType: "course",
  contentId: "course-uuid",
});
```

### 2. `LearningSessionTracker` Component
**Fichier** : `src/components/learning-session-tracker.tsx`

**Usage** :
```tsx
<LearningSessionTracker
  contentType="course"
  contentId={courseId}
  showIndicator={true} // Optionnel : affiche un indicateur en bas à droite
>
  <YourContent />
</LearningSessionTracker>
```

### 3. API Route
**Fichier** : `src/app/api/learning-sessions/route.ts`

**Endpoints** :
- `POST /api/learning-sessions` - Créer une session
- `PATCH /api/learning-sessions` - Mettre à jour une session

---

## 🔧 Installation

### Étape 1 : Corriger le schéma de la base de données

Exécuter dans **Supabase Studio SQL Editor** :
```sql
-- Fichier : supabase/FIX_LEARNING_SESSIONS_SCHEMA.sql
```

Ce script va :
- Ajouter `duration_seconds` et `duration_active_seconds` si elles n'existent pas
- Migrer les données de `duration_minutes` vers `duration_seconds` si nécessaire
- Ajouter `content_type` et `content_id` pour la compatibilité

### Étape 2 : Intégrer dans les pages de contenu

#### Pour un cours :
```tsx
// src/app/dashboard/formations/[courseId]/page.tsx
import { LearningSessionTracker } from "@/components/learning-session-tracker";

export default function CoursePage({ params }: { params: { courseId: string } }) {
  const { courseId } = params;
  
  return (
    <LearningSessionTracker
      contentType="course"
      contentId={courseId}
    >
      {/* Votre contenu du cours */}
    </LearningSessionTracker>
  );
}
```

#### Pour un parcours :
```tsx
// src/app/dashboard/parcours/[pathId]/page.tsx
import { LearningSessionTracker } from "@/components/learning-session-tracker";

export default function PathPage({ params }: { params: { pathId: string } }) {
  const { pathId } = params;
  
  return (
    <LearningSessionTracker
      contentType="path"
      contentId={pathId}
    >
      {/* Votre contenu du parcours */}
    </LearningSessionTracker>
  );
}
```

#### Pour une ressource :
```tsx
import { LearningSessionTracker } from "@/components/learning-session-tracker";

<LearningSessionTracker
  contentType="resource"
  contentId={resourceId}
>
  {/* Contenu de la ressource */}
</LearningSessionTracker>
```

#### Pour un test :
```tsx
import { LearningSessionTracker } from "@/components/learning-session-tracker";

<LearningSessionTracker
  contentType="test"
  contentId={testId}
>
  {/* Contenu du test */}
</LearningSessionTracker>
```

---

## 📊 Données Collectées

### Table `learning_sessions`

```sql
{
  id: uuid,
  user_id: uuid,
  content_type: 'course' | 'path' | 'resource' | 'test',
  content_id: uuid,
  started_at: timestamptz,
  ended_at: timestamptz | null,
  duration_seconds: integer,        // Temps total en secondes
  duration_active_seconds: integer, // Temps actif en secondes
  metadata: jsonb                   // Métadonnées additionnelles
}
```

### Table `learning_session_events` (optionnel, pour analyse détaillée)

Si vous voulez tracker chaque événement individuellement :
```sql
{
  id: uuid,
  session_id: uuid,
  event_type: 'start' | 'stop' | 'mousemove' | 'idle' | 'resume' | 'focus' | 'blur',
  payload: jsonb,
  happened_at: timestamptz
}
```

---

## 🔍 Utilisation dans les Analytics

### Super Admin Dashboard

Le code dans `src/lib/queries/super-admin.ts` utilise maintenant :
- `duration_active_seconds` pour calculer le temps moyen d'engagement
- Compatible avec `active_duration_minutes` (fallback automatique)

### Exemple de requête

```typescript
const { data: sessions } = await supabase
  .from("learning_sessions")
  .select("duration_seconds, duration_active_seconds")
  .eq("user_id", userId);

const avgActiveTime = sessions.reduce((sum, s) => 
  sum + (s.duration_active_seconds || 0), 0
) / sessions.length / 60; // en minutes
```

---

## ⚙️ Configuration

### Seuil d'inactivité

Par défaut : **5 minutes**

Pour modifier, éditer `src/hooks/use-learning-session.ts` :
```typescript
const IDLE_THRESHOLD = 5 * 60 * 1000; // Modifier ici
```

### Intervalle de synchronisation

Par défaut : **30 secondes**

Pour modifier, éditer `src/hooks/use-learning-session.ts` :
```typescript
const SYNC_INTERVAL = 30 * 1000; // Modifier ici
```

### Debounce des événements

Par défaut : **1 seconde**

Pour modifier, éditer `src/hooks/use-learning-session.ts` :
```typescript
const ACTIVITY_DEBOUNCE = 1000; // Modifier ici
```

---

## 🧪 Test

### 1. Vérifier que le schéma est correct

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'learning_sessions';
```

Vous devriez voir :
- `duration_seconds` (integer)
- `duration_active_seconds` (integer)
- `content_type` (text)
- `content_id` (uuid)

### 2. Tester dans une page

1. Ouvrir une page avec `LearningSessionTracker`
2. Bouger la souris → Le temps actif devrait augmenter
3. Attendre 5 minutes sans bouger → Le temps actif devrait se mettre en pause
4. Bouger à nouveau → Le temps actif reprend

### 3. Vérifier dans la base de données

```sql
SELECT 
  content_type,
  duration_seconds,
  duration_active_seconds,
  started_at,
  ended_at
FROM learning_sessions
ORDER BY started_at DESC
LIMIT 10;
```

---

## 🎨 Affichage Optionnel

Pour afficher un indicateur visuel du temps de session :

```tsx
<LearningSessionTracker
  contentType="course"
  contentId={courseId}
  showIndicator={true} // ← Active l'indicateur
>
  <CourseContent />
</LearningSessionTracker>
```

Un indicateur apparaîtra en bas à droite avec :
- Temps total écoulé
- Temps actif
- Statut (actif/inactif)

---

## ✅ Checklist d'Intégration

- [ ] Exécuter `supabase/FIX_LEARNING_SESSIONS_SCHEMA.sql`
- [ ] Intégrer `LearningSessionTracker` dans les pages de cours
- [ ] Intégrer `LearningSessionTracker` dans les pages de parcours
- [ ] Intégrer `LearningSessionTracker` dans les pages de ressources
- [ ] Intégrer `LearningSessionTracker` dans les pages de tests
- [ ] Tester le tracking (mouvements souris, inactivité)
- [ ] Vérifier les données dans la table `learning_sessions`

---

**Le système est prêt à être utilisé ! 🚀**





