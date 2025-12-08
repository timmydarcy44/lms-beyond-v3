# Configuration du domaine beyondcenter.fr pour Beyond Center

## 🎯 Objectif

Connecter le nom de domaine `beyondcenter.fr` à Vercel pour que Beyond Center soit accessible via ce domaine.

---

## 📋 Étape 1 : Ajouter le domaine dans Vercel

### Via le Dashboard Vercel (Recommandé)

1. **Connectez-vous à Vercel** : https://vercel.com/dashboard
2. **Sélectionnez le projet** `lms-beyond-v3`
3. **Allez dans** : **Settings** → **Domains**
4. **Cliquez sur** : **"Add Domain"**
5. **Entrez** : `beyondcenter.fr`
6. **Cliquez sur** : **"Add"**

### Via la CLI Vercel (Alternative)

```bash
vercel domains add beyondcenter.fr
```

---

## 📋 Étape 2 : Configurer les enregistrements DNS

Vercel vous donnera des instructions spécifiques après avoir ajouté le domaine. Voici les options :

### Option A : Utiliser les Nameservers Vercel (Plus simple) ⭐

1. Dans Vercel, après avoir ajouté le domaine, cliquez sur **"Use Vercel DNS"**
2. Vercel vous donnera des nameservers, par exemple :
   - `ns1.vercel-dns.com`
   - `ns2.vercel-dns.com`
3. **Dans votre registrar** (où vous avez acheté le domaine) :
   - Allez dans la gestion DNS du domaine
   - Remplacez les nameservers actuels par ceux fournis par Vercel
   - Sauvegardez

**Avantages** : Vercel gère tout automatiquement, y compris SSL/HTTPS

### Option B : Configuration manuelle DNS

Si vous préférez garder vos nameservers actuels, ajoutez ces enregistrements :

#### Pour le domaine racine (`beyondcenter.fr`) :

**Option 1 : Enregistrement A**
- **Type** : `A`
- **Nom** : `@` (ou laisser vide selon votre registrar)
- **Valeur** : `76.76.21.21` (IP Vercel - vérifiez dans Vercel Dashboard)

**Option 2 : Enregistrement ALIAS/ANAME** (si supporté)
- **Type** : `ALIAS` ou `ANAME`
- **Nom** : `@`
- **Valeur** : `cname.vercel-dns.com.`

#### Pour le sous-domaine www (`www.beyondcenter.fr`) :

- **Type** : `CNAME`
- **Nom** : `www`
- **Valeur** : `cname.vercel-dns.com.` (ou la valeur exacte fournie par Vercel)

---

## 📋 Étape 3 : Vérifier la configuration dans le code

Beyond Center n'est actuellement **pas configuré comme tenant** dans le code. Il fonctionne comme le LMS principal.

### Si Beyond Center doit rester le LMS principal :

✅ **Aucune modification nécessaire** - Le domaine fonctionnera automatiquement

### Si Beyond Center doit être un tenant spécifique :

Ajoutez la configuration dans `src/lib/tenant/config.ts` :

```typescript
// Ajouter 'beyond-center' dans TenantId
export type TenantId = 'beyond-noschool' | 'beyond-care' | 'beyond-note' | 'beyond-connect' | 'jessica-contentin' | 'jessica-contentin-app' | 'beyond-center';

// Ajouter dans TENANTS
'beyondcenter.fr': {
  id: 'beyond-center',
  domain: 'beyondcenter.fr',
  name: 'Beyond Center',
  superAdminEmail: 'timdarcypro@gmail.com', // À adapter
  features: {
    catalog: true,
    beyondCare: false,
    beyondNote: false,
    beyondConnect: false,
  },
  subscriptionPlans: {
    monthly: 0,
    yearly: 0,
  },
},
'www.beyondcenter.fr': {
  id: 'beyond-center',
  domain: 'beyondcenter.fr',
  name: 'Beyond Center',
  superAdminEmail: 'timdarcypro@gmail.com',
  features: {
    catalog: true,
    beyondCare: false,
    beyondNote: false,
    beyondConnect: false,
  },
  subscriptionPlans: {
    monthly: 0,
    yearly: 0,
  },
},
```

---

## 📋 Étape 4 : Mettre à jour les variables d'environnement

Dans **Vercel Dashboard** → **Settings** → **Environment Variables**, ajoutez ou mettez à jour :

```
NEXT_PUBLIC_APP_URL=https://beyondcenter.fr
```

**Important** : Cette variable est utilisée pour générer les URLs absolues dans l'application.

---

## 📋 Étape 5 : Configurer Supabase

1. **Allez dans Supabase Dashboard** : https://supabase.com/dashboard
2. **Sélectionnez votre projet**
3. **Allez dans** : **Authentication** → **URL Configuration**
4. **Ajoutez dans Site URL** : `https://beyondcenter.fr`
5. **Ajoutez dans Redirect URLs** : 
   - `https://beyondcenter.fr/**`
   - `https://www.beyondcenter.fr/**`

---

## ⏱️ Délais de propagation

- **Propagation DNS** : 1 à 48 heures (généralement 1-4 heures)
- **Validation Vercel** : Quelques minutes après la propagation DNS
- **Certificat SSL** : Automatique, quelques minutes après validation

---

## ✅ Vérification

### 1. Vérifier la propagation DNS

Utilisez https://dnschecker.org :
- Entrez `beyondcenter.fr`
- Sélectionnez le type d'enregistrement (A, CNAME, etc.)
- Vérifiez que les valeurs correspondent à celles de Vercel

### 2. Vérifier dans Vercel

1. **Settings** → **Domains**
2. Le statut doit être **"Valid Configuration"** ✅
3. Le certificat SSL doit être **"Valid"** ✅

### 3. Tester l'accès

- Accédez à `https://beyondcenter.fr`
- Vérifiez que le site se charge
- Vérifiez que `https://www.beyondcenter.fr` fonctionne (ou redirige)

---

## 🔍 Dépannage

### Le domaine ne se charge pas

1. ✅ Vérifiez que les enregistrements DNS sont corrects
2. ✅ Vérifiez que le domaine est validé dans Vercel
3. ✅ Attendez la propagation DNS (peut prendre jusqu'à 48h)
4. ✅ Vérifiez les logs Vercel : **Deployments** → Sélectionnez un déploiement → **Logs**

### Erreur "Invalid Configuration"

1. ✅ Vérifiez que les enregistrements DNS correspondent exactement à Vercel
2. ✅ Vérifiez qu'il n'y a pas de conflits avec d'autres enregistrements
3. ✅ Contactez le support Vercel si nécessaire

### Le site se charge mais certaines fonctionnalités ne marchent pas

1. ✅ Vérifiez que `NEXT_PUBLIC_APP_URL=https://beyondcenter.fr` est configuré
2. ✅ Vérifiez que les URLs Supabase incluent `beyondcenter.fr`
3. ✅ Vérifiez les logs Vercel pour les erreurs spécifiques

---

## 📞 Support

- **Documentation Vercel Domains** : https://vercel.com/docs/concepts/projects/domains
- **Support Vercel** : https://vercel.com/support

---

## 📝 Checklist finale

- [ ] Domaine ajouté dans Vercel
- [ ] Enregistrements DNS configurés
- [ ] Propagation DNS vérifiée
- [ ] Domaine validé dans Vercel
- [ ] Certificat SSL actif
- [ ] `NEXT_PUBLIC_APP_URL` configuré
- [ ] URLs Supabase mises à jour
- [ ] Site accessible sur `https://beyondcenter.fr`
- [ ] Site accessible sur `https://www.beyondcenter.fr`

