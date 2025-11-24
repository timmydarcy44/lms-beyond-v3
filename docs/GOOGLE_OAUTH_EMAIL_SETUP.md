# Configuration Google OAuth et Emails de Confirmation

## 🔐 Configuration Google OAuth

### 1. Configurer Google OAuth dans Supabase

1. **Aller dans le Dashboard Supabase**
   - Connectez-vous à [supabase.com](https://supabase.com)
   - Sélectionnez votre projet

2. **Activer le provider Google**
   - Allez dans **Authentication** > **Providers**
   - Trouvez **Google** et activez-le

3. **Configurer les credentials Google**
   - Allez sur [Google Cloud Console](https://console.cloud.google.com/)
   - Créez un nouveau projet ou sélectionnez un projet existant
   - Allez dans **APIs & Services** > **Credentials**
   - Cliquez sur **Create Credentials** > **OAuth client ID**
   - Sélectionnez **Web application**
   - Ajoutez les URLs autorisées :
     - **Authorized JavaScript origins** :
       - `http://localhost:3000` (pour le développement)
       - `https://votre-domaine.com` (pour la production)
     - **Authorized redirect URIs** :
       - `http://localhost:3000/auth/callback` (pour le développement)
       - `https://votre-domaine.com/auth/callback` (pour la production)
       - `https://[votre-projet-supabase].supabase.co/auth/v1/callback` (URL Supabase)

4. **Copier les credentials dans Supabase**
   - Copiez le **Client ID** et le **Client Secret** depuis Google Cloud Console
   - Collez-les dans Supabase > Authentication > Providers > Google
   - Sauvegardez

### 2. Configurer l'URL de redirection dans Supabase

1. Dans Supabase, allez dans **Authentication** > **URL Configuration**
2. Ajoutez dans **Redirect URLs** :
   - `http://localhost:3000/auth/callback` (développement)
   - `https://votre-domaine.com/auth/callback` (production)

## 📧 Configuration des Emails de Confirmation

### 1. Activer l'envoi d'emails dans Supabase

1. **Aller dans Authentication > Email Templates**
   - Vous pouvez personnaliser les templates d'email ici

2. **Configurer les paramètres d'email**
   - Allez dans **Project Settings** > **Auth**
   - Sous **Email Auth**, vérifiez que :
     - ✅ **Enable email confirmations** est activé
     - ✅ **Secure email change** est activé (optionnel)

### 2. Configurer le service d'email (optionnel)

Par défaut, Supabase utilise son propre service d'email. Pour utiliser un service personnalisé :

1. **Utiliser SendGrid, Mailgun, etc.**
   - Allez dans **Project Settings** > **Auth** > **SMTP Settings**
   - Configurez votre service SMTP :
     - **Host** : smtp.sendgrid.net (exemple pour SendGrid)
     - **Port** : 587
     - **Username** : votre nom d'utilisateur SMTP
     - **Password** : votre mot de passe SMTP
     - **Sender email** : noreply@votre-domaine.com
     - **Sender name** : Jessica Contentin

### 3. Personnaliser les templates d'email

1. **Aller dans Authentication > Email Templates**
2. Personnalisez les templates :
   - **Confirm signup** : Email de confirmation d'inscription
   - **Magic Link** : Lien de connexion magique
   - **Change Email Address** : Changement d'email
   - **Reset Password** : Réinitialisation de mot de passe

### 4. Variables disponibles dans les templates

- `{{ .ConfirmationURL }}` : URL de confirmation
- `{{ .Email }}` : Email de l'utilisateur
- `{{ .Token }}` : Token de confirmation
- `{{ .TokenHash }}` : Hash du token
- `{{ .SiteURL }}` : URL du site

### 5. Exemple de template personnalisé

```html
<h2>Bienvenue sur Jessica Contentin !</h2>
<p>Merci de vous être inscrit. Cliquez sur le lien ci-dessous pour confirmer votre compte :</p>
<p><a href="{{ .ConfirmationURL }}">Confirmer mon compte</a></p>
<p>Si le lien ne fonctionne pas, copiez et collez cette URL dans votre navigateur :</p>
<p>{{ .ConfirmationURL }}</p>
```

## 🔄 Flux d'authentification Google

1. L'utilisateur clique sur "Continuer avec Google"
2. Il est redirigé vers Google pour se connecter
3. Google redirige vers `/auth/callback?code=...`
4. La page de callback échange le code contre une session
5. Le profil utilisateur est créé/mis à jour si nécessaire
6. L'utilisateur est redirigé vers la page demandée

## 🔄 Flux d'inscription avec email

1. L'utilisateur remplit le formulaire d'inscription
2. Un compte est créé dans Supabase Auth
3. Un email de confirmation est envoyé automatiquement
4. L'utilisateur clique sur le lien dans l'email
5. Il est redirigé vers `/auth/callback?token_hash=...`
6. Le compte est confirmé
7. L'utilisateur peut se connecter

## ⚠️ Notes importantes

- **En développement** : Les emails peuvent être désactivés dans Supabase pour faciliter les tests
- **En production** : Assurez-vous que les emails sont bien configurés
- **Rate limiting** : Supabase limite le nombre d'emails envoyés par défaut
- **Domain verification** : Pour utiliser un domaine personnalisé pour les emails, vous devrez peut-être vérifier votre domaine

## 🧪 Tester l'authentification Google

1. Assurez-vous que Google OAuth est configuré dans Supabase
2. Cliquez sur "Continuer avec Google" sur la page de login/inscription
3. Vous devriez être redirigé vers Google
4. Après connexion, vous devriez être redirigé vers `/auth/callback`
5. Puis vers la page ressources

## 🧪 Tester les emails de confirmation

1. Créez un compte avec un email valide
2. Vérifiez votre boîte email (et les spams)
3. Cliquez sur le lien de confirmation
4. Vous devriez être redirigé et connecté automatiquement

### Méthodes de test détaillées

Pour des instructions complètes sur le test des emails, consultez le document **[TESTER_ENVOI_EMAILS.md](./TESTER_ENVOI_EMAILS.md)** qui explique :
- Comment utiliser les logs Supabase
- Comment configurer un email de test
- Comment utiliser Mailtrap ou MailHog
- Comment dépanner les problèmes

