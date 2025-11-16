# 🧪 Test et Simulation du Tracking de Sessions

## 🎯 Méthodes de Test

### 1. **Test Manuel** (Recommandé)

#### A. Via l'Interface
1. Connectez-vous en tant qu'apprenant (`j.contentin@laposte.net`)
2. Ouvrez un **parcours** ou un **test**
3. Bougez la souris, cliquez, scrollez pendant 1-2 minutes
4. Ouvrez la console du navigateur (F12 → Network)
5. Vérifiez les requêtes :
   - `POST /api/learning-sessions` (création de session)
   - `PATCH /api/learning-sessions` (mises à jour périodiques)

#### B. Vérification dans Supabase
```sql
-- Voir les sessions récentes
SELECT 
  id,
  content_type,
  duration_seconds,
  duration_active_seconds,
  ROUND((duration_active_seconds::float / NULLIF(duration_seconds, 0)) * 100, 2) as engagement_ratio,
  started_at,
  ended_at
FROM learning_sessions
ORDER BY started_at DESC
LIMIT 10;

-- Vérifier que duration_active_seconds <= duration_seconds
SELECT 
  COUNT(*) FILTER (WHERE duration_active_seconds > duration_seconds) as incohérences,
  COUNT(*) as total_sessions
FROM learning_sessions;
```

---

### 2. **Test via API** (Simulation)

#### A. Créer une session de test
```bash
# Via curl (Windows PowerShell)
$headers = @{
  "Content-Type" = "application/json"
}

$body = @{
  content_type = "course"
  content_id = "votre-course-id"
  duration_seconds = 300
  duration_active_seconds = 240
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3000/api/test-learning-session" -Method POST -Headers $headers -Body $body
```

#### B. Voir les sessions existantes
```bash
# Via curl
Invoke-WebRequest -Uri "http://localhost:3000/api/test-learning-session?limit=5" -Method GET
```

#### C. Via l'interface navigateur
Ouvrez la console (F12) et exécutez :
```javascript
// Créer une session de test
fetch('/api/test-learning-session', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    content_type: 'course',
    content_id: 'votre-course-id-uuid',
    duration_seconds: 180,  // 3 minutes
    duration_active_seconds: 150  // 2.5 minutes actif
  })
})
.then(r => r.json())
.then(console.log);

// Voir les sessions
fetch('/api/test-learning-session?limit=5')
.then(r => r.json())
.then(console.log);
```

---

### 3. **Test Automatisé** (Script)

Créez un fichier `test-tracking.js` dans la racine :

```javascript
// test-tracking.js
const BASE_URL = 'http://localhost:3000';

async function testLearningSession() {
  try {
    // 1. Créer une session de test
    console.log('📝 Création d\'une session de test...');
    const createResponse = await fetch(`${BASE_URL}/api/test-learning-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content_type: 'course',
        content_id: 'test-course-id-' + Date.now(),
        duration_seconds: 300,
        duration_active_seconds: 250,
      }),
    });
    
    const createResult = await createResponse.json();
    console.log('✅ Session créée:', createResult);
    
    // 2. Vérifier les sessions
    console.log('\n📊 Récupération des sessions...');
    const getResponse = await fetch(`${BASE_URL}/api/test-learning-session?limit=5`);
    const getResult = await getResponse.json();
    console.log('✅ Sessions récupérées:', getResult);
    
    // 3. Vérifier la cohérence
    const hasIncoherence = getResult.sessions?.some(
      s => s.duration_active_seconds > s.duration_seconds
    );
    
    if (hasIncoherence) {
      console.error('❌ INCOHÉRENCE DÉTECTÉE: duration_active_seconds > duration_seconds');
    } else {
      console.log('✅ Toutes les sessions sont cohérentes');
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

testLearningSession();
```

**Exécuter** :
```bash
node test-tracking.js
```

---

## 🔍 Vérifications à Effectuer

### ✅ Checklist de Validation

#### 1. **Création de Session**
- [ ] Une session est créée quand on ouvre un parcours/test/formation
- [ ] L'ID de session est retourné
- [ ] `started_at` est défini
- [ ] `duration_seconds` et `duration_active_seconds` sont à 0 au début

#### 2. **Mise à Jour de Session**
- [ ] Les mises à jour se font toutes les 30 secondes
- [ ] `duration_seconds` augmente (temps total)
- [ ] `duration_active_seconds` augmente seulement si actif
- [ ] `duration_active_seconds` ≤ `duration_seconds`

#### 3. **Détection d'Inactivité**
- [ ] Après 5 minutes sans bouger, `duration_active_seconds` ne devrait plus augmenter
- [ ] `duration_seconds` continue d'augmenter
- [ ] Quand on bouge à nouveau, `duration_active_seconds` reprend

#### 4. **Fin de Session**
- [ ] Quand on quitte la page, `ended_at` est défini
- [ ] Les durées finales sont sauvegardées

---

## 📊 Exemple de Résultats Attendus

### Session Normale (Utilisateur Actif)
```
duration_seconds: 600          // 10 minutes total
duration_active_seconds: 580   // 9.67 minutes actif
engagement_ratio: 96.67%
```

### Session avec Inactivité
```
duration_seconds: 1200         // 20 minutes total
duration_active_seconds: 300    // 5 minutes actif (15 min d'inactivité)
engagement_ratio: 25%
```

---

## 🐛 Dépannage

### Problème : Aucune session créée
1. Vérifiez que vous êtes connecté
2. Vérifiez la console navigateur pour les erreurs
3. Vérifiez que l'API `/api/learning-sessions` fonctionne

### Problème : `duration_active_seconds` > `duration_seconds`
- **Cause** : Bug dans le calcul du temps
- **Solution** : Vérifier la logique dans `use-learning-session.ts`

### Problème : Les mises à jour ne se font pas
- **Cause** : Problème réseau ou erreur API
- **Solution** : Vérifier les logs serveur et la console navigateur

---

## 🎯 Test Rapide (30 secondes)

1. Ouvrez un parcours
2. Attendez 30 secondes en bougeant la souris
3. Vérifiez dans Supabase :
   ```sql
   SELECT duration_seconds, duration_active_seconds 
   FROM learning_sessions 
   ORDER BY started_at DESC 
   LIMIT 1;
   ```
4. Vous devriez voir :
   - `duration_seconds` ≈ 30
   - `duration_active_seconds` ≈ 30
   - Les deux proches l'un de l'autre

---

**Testez maintenant et vérifiez que tout fonctionne ! 🚀**



