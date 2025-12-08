# Guide de connexion du domaine beyondcenter.fr à Vercel

## 📋 Prérequis

- ✅ Nom de domaine `beyondcenter.fr` acheté
- ✅ Projet Vercel configuré (`lms-beyond-v3`)
- ✅ Accès au registrar du domaine (où vous avez acheté le domaine)

---

## 🚀 Étapes de configuration

### 1. Ajouter le domaine dans Vercel

1. **Aller sur le Dashboard Vercel** : https://vercel.com/dashboard
2. **Sélectionner le projet** `lms-beyond-v3`
3. **Aller dans Settings** → **Domains**
4. **Cliquer sur "Add Domain"**
5. **Entrer le domaine** : `beyondcenter.fr`
6. **Ajouter aussi** : `www.beyondcenter.fr` (optionnel mais recommandé)

### 2. Configurer les enregistrements DNS

Vercel vous donnera des instructions spécifiques, mais généralement vous devrez ajouter :

#### Option A : Configuration avec CNAME (Recommandé)

Dans votre registrar (où vous avez acheté le domaine), ajoutez :

**Pour `www.beyondcenter.fr` :**
- **Type** : `CNAME`
- **Nom** : `www`
- **Valeur** : `cname.vercel-dns.com.` (ou la valeur fournie par Vercel)

**Pour `beyondcenter.fr` (domaine racine) :**
- **Type** : `A`
- **Nom** : `@` ou laisser vide
- **Valeur** : `76.76.21.21` (ou l'IP fournie par Vercel)

OU

- **Type** : `ALIAS` ou `ANAME` (si supporté par votre registrar)
- **Nom** : `@` ou laisser vide
- **Valeur** : `cname.vercel-dns.com.`

#### Option B : Configuration avec Nameservers Vercel (Plus simple)

1. Dans Vercel, allez dans **Settings** → **Domains** → `beyondcenter.fr`
2. Cliquez sur **"Use Vercel DNS"**
3. Vercel vous donnera des nameservers (ex: `ns1.vercel-dns.com`, `ns2.vercel-dns.com`)
4. Dans votre registrar, changez les nameservers du domaine pour utiliser ceux de Vercel

---

## ⚙️ Configuration dans le code

### Ajouter Beyond Center dans la configuration des tenants (si nécessaire)

Si Beyond Center doit être détecté comme un tenant spécifique, ajoutez-le dans `src/lib/tenant/config.ts` :

```typescript
'beyondcenter.fr': {
  id: 'beyond-center', // À ajouter dans TenantId si nécessaire
  domain: 'beyondcenter.fr',
  name: 'Beyond Center',
  superAdminEmail: 'timdarcypro@gmail.com', // À adapter
  features: {
    catalog: true, // Beyond Center a probablement un catalogue
    beyondCare: false,
    beyondNote: false,
    beyondConnect: false,
  },
  subscriptionPlans: {
    monthly: 0, // À définir selon vos besoins
    yearly: 0,
  },
},
'www.beyondcenter.fr': {
  // Même configuration que ci-dessus
},
```

**Note** : Si Beyond Center est le LMS principal (pas un tenant), vous n'avez pas besoin de l'ajouter dans la config des tenants. Il fonctionnera automatiquement sur `beyondcenter.fr`.

---

## 🔍 Vérification

### 1. Vérifier la propagation DNS

Utilisez un outil comme https://dnschecker.org pour vérifier que les enregistrements DNS sont propagés :
- Entrez `beyondcenter.fr`
- Vérifiez que les enregistrements pointent vers Vercel

### 2. Vérifier dans Vercel

1. Dans **Settings** → **Domains**
2. Vérifiez que le statut est **"Valid Configuration"** (cela peut prendre quelques minutes à quelques heures)

### 3. Tester l'accès

Une fois la configuration validée :
- Accédez à `https://beyondcenter.fr`
- Vérifiez que le site se charge correctement
- Vérifiez que `https://www.beyondcenter.fr` redirige vers `https://beyondcenter.fr` (ou vice versa)

---

## 🔒 Configuration SSL/HTTPS

Vercel configure automatiquement le certificat SSL (HTTPS) pour votre domaine. Cela peut prendre quelques minutes après la validation du domaine.

---

## 📝 Notes importantes

1. **Propagation DNS** : La propagation DNS peut prendre de **quelques minutes à 48 heures**. En général, c'est entre 1 et 4 heures.

2. **Redirection www** : Vercel peut configurer automatiquement la redirection entre `www.beyondcenter.fr` et `beyondcenter.fr`. Vérifiez dans les paramètres du domaine.

3. **Variables d'environnement** : Assurez-vous que `NEXT_PUBLIC_APP_URL` est configuré avec `https://beyondcenter.fr` dans Vercel.

4. **Supabase** : N'oubliez pas d'ajouter `https://beyondcenter.fr` dans les URLs autorisées de Supabase :
   - Supabase Dashboard → Authentication → URL Configuration
   - Ajouter dans **Site URL** : `https://beyondcenter.fr`
   - Ajouter dans **Redirect URLs** : `https://beyondcenter.fr/**`

---

## 🆘 Dépannage

### Le domaine ne se charge pas

1. Vérifiez que les enregistrements DNS sont correctement configurés
2. Vérifiez que le domaine est validé dans Vercel
3. Attendez la propagation DNS (peut prendre jusqu'à 48h)
4. Vérifiez les logs Vercel pour les erreurs

### Erreur "Invalid Configuration"

1. Vérifiez que les enregistrements DNS correspondent exactement à ce que Vercel demande
2. Vérifiez que vous n'avez pas d'autres enregistrements qui entrent en conflit
3. Contactez le support Vercel si le problème persiste

### Le site se charge mais certaines fonctionnalités ne marchent pas

1. Vérifiez que `NEXT_PUBLIC_APP_URL` est configuré avec `https://beyondcenter.fr`
2. Vérifiez que les URLs Supabase incluent `beyondcenter.fr`
3. Vérifiez les logs Vercel pour les erreurs spécifiques

---

## 📞 Support

- **Documentation Vercel** : https://vercel.com/docs/concepts/projects/domains
- **Support Vercel** : https://vercel.com/support

