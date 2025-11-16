# ✅ Solutions - Redirection et Déconnexion

## 🔧 Corrections Appliquées

### 1. Bouton de Déconnexion ✅

J'ai corrigé le bouton de déconnexion dans `sidebar.tsx`. Il utilise maintenant un formulaire qui appelle `/logout`.

**Test** : Le bouton devrait maintenant fonctionner.

### 2. Log de Debug pour le Rôle ✅

J'ai ajouté un log dans `session.ts` qui affiche le mapping des rôles en développement.

## 🔍 Diagnostic - Pourquoi vous êtes toujours redirigé vers Apprenant

Avec le rôle `"instructor"` dans la DB, vous devriez être redirigé vers `/dashboard/formateur`.

### Vérifications à Faire

1. **Redémarrez le serveur** :
   ```bash
   npm run dev
   ```

2. **Déconnectez-vous et reconnectez-vous** :
   - Utilisez le bouton de déconnexion (maintenant corrigé)
   - Reconnectez-vous avec `timmydarcy44@gmail.com`

3. **Vérifiez la console du serveur** (terminal où tourne `npm run dev`) :
   - Vous devriez voir : `[session] Role mapping: DB="instructor" → Frontend="formateur"`
   - Si vous voyez autre chose, dites-moi

4. **Vérifiez la console du navigateur** (F12) :
   - Cherchez les messages `[session]`
   - Cherchez les erreurs

## 🎯 Si Ça Ne Fonctionne Toujours Pas

### Option A : Vérifier le Cache de Session

Parfois la session est mise en cache. Essayez :
1. **Déconnectez-vous**
2. **Fermez complètement le navigateur**
3. **Rouvrez et reconnectez-vous**

### Option B : Vérifier Directement le Rôle dans la Session

Ajoutez temporairement dans `src/app/page.tsx` (pour debug) :

```tsx
export default async function Home() {
  const session = await getSession();
  
  if (!session) {
    redirect(AUTH_ROUTES.login);
  }

  // Debug temporaire
  console.log("[page] Session role:", session.role);
  console.log("[page] Dashboard route:", getDashboardRouteForRole(session.role));

  const dashboardRoute = getDashboardRouteForRole(session.role);
  redirect(dashboardRoute);
}
```

## 📝 Test Immédiat

1. **Redémarrez le serveur** : `npm run dev`
2. **Déconnectez-vous** (bouton devrait fonctionner maintenant)
3. **Reconnectez-vous**
4. **Regardez la console** du serveur et du navigateur
5. **Dites-moi** ce que vous voyez dans les logs

Si vous voyez encore "apprenant" malgré le rôle "instructor", copiez-moi les logs exacts et je corrigerai le problème.



