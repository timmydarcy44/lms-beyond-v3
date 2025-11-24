# Comment Tester l'Envoi d'Emails

## 🧪 Méthodes pour Tester les Emails

### 1. Utiliser les Logs Supabase (Méthode la plus simple)

Supabase enregistre tous les emails envoyés dans les logs. C'est la méthode la plus simple pour tester.

#### Étapes :

1. **Aller dans le Dashboard Supabase**
   - Connectez-vous à [supabase.com](https://supabase.com)
   - Sélectionnez votre projet

2. **Vérifier les logs d'authentification**
   - Allez dans **Logs** > **Auth Logs**
   - Vous verrez tous les événements d'authentification, y compris les emails envoyés

3. **Vérifier les emails envoyés**
   - Dans les logs, cherchez les événements `signup` ou `email_confirmation`
   - Vous verrez si l'email a été envoyé avec succès

### 2. Utiliser un Email de Test (Recommandé pour le développement)

Supabase permet de configurer un email de test qui recevra tous les emails au lieu de les envoyer réellement.

#### Configuration :

1. **Aller dans Project Settings > Auth**
2. **Trouver "Email Testing"** ou "Test Email"
3. **Ajouter votre email de test** (ex: `test@example.com`)
4. **Activer le mode test**

⚠️ **Note** : En mode test, tous les emails seront envoyés à cet email de test au lieu des emails réels des utilisateurs.

### 3. Utiliser Mailtrap (Service de test d'email)

Mailtrap est un service qui capture les emails en développement sans les envoyer réellement.

#### Configuration :

1. **Créer un compte Mailtrap** : [mailtrap.io](https://mailtrap.io)

2. **Obtenir les credentials SMTP**
   - Dans Mailtrap, allez dans **Email Testing** > **Inboxes**
   - Créez une nouvelle inbox
   - Copiez les credentials SMTP

3. **Configurer dans Supabase**
   - Allez dans **Project Settings** > **Auth** > **SMTP Settings**
   - Configurez avec les credentials Mailtrap :
     - **Host** : `smtp.mailtrap.io`
     - **Port** : `2525` (ou `587`)
     - **Username** : votre username Mailtrap
     - **Password** : votre password Mailtrap
     - **Sender email** : `noreply@votre-domaine.com`
     - **Sender name** : `Jessica Contentin`

4. **Tester**
   - Créez un compte sur votre site
   - L'email apparaîtra dans Mailtrap au lieu d'être envoyé réellement

### 4. Utiliser MailHog (Local - Avancé)

MailHog est un serveur SMTP local qui capture tous les emails.

#### Installation :

```bash
# Avec Docker
docker run -d -p 1025:1025 -p 8025:8025 mailhog/mailhog

# Ou avec Homebrew (Mac)
brew install mailhog
mailhog
```

#### Configuration dans Supabase :

1. **Aller dans Project Settings > Auth > SMTP Settings**
2. **Configurer** :
   - **Host** : `localhost` (ou votre IP locale)
   - **Port** : `1025`
   - **Username** : (laisser vide)
   - **Password** : (laisser vide)

3. **Accéder à l'interface MailHog**
   - Ouvrez `http://localhost:8025` dans votre navigateur
   - Tous les emails envoyés apparaîtront ici

### 5. Tester avec un Email Réel (Production)

Pour tester en conditions réelles :

1. **Utiliser un email de test réel**
   - Créez un compte avec un email que vous contrôlez (ex: Gmail)
   - Vérifiez votre boîte de réception
   - Vérifiez aussi les **spams/courrier indésirable**

2. **Vérifier les logs Supabase**
   - Allez dans **Logs** > **Auth Logs**
   - Vérifiez que l'email a été envoyé avec succès

3. **Vérifier le statut de l'email**
   - Dans les logs, vous verrez le statut : `sent`, `failed`, etc.

## 🔍 Vérifier les Emails Envoyés

### Dans Supabase Dashboard :

1. **Logs d'authentification**
   - **Logs** > **Auth Logs**
   - Filtrez par `email_confirmation` ou `signup`
   - Vous verrez tous les emails envoyés

2. **Statistiques**
   - **Authentication** > **Users**
   - Vous pouvez voir quels utilisateurs ont confirmé leur email

### Vérifier le contenu de l'email :

1. **Templates d'email**
   - **Authentication** > **Email Templates**
   - Vous pouvez voir et modifier les templates

2. **Variables disponibles**
   - `{{ .ConfirmationURL }}` : URL de confirmation
   - `{{ .Email }}` : Email de l'utilisateur
   - `{{ .Token }}` : Token de confirmation

## 🐛 Dépanner les Problèmes

### L'email n'est pas envoyé :

1. **Vérifier les logs Supabase**
   - Allez dans **Logs** > **Auth Logs**
   - Cherchez les erreurs

2. **Vérifier la configuration SMTP**
   - **Project Settings** > **Auth** > **SMTP Settings**
   - Vérifiez que les credentials sont corrects

3. **Vérifier les limites de taux**
   - Supabase limite le nombre d'emails par défaut
   - Vérifiez dans **Project Settings** > **Usage**

### L'email arrive en spam :

1. **Configurer SPF/DKIM**
   - Pour un domaine personnalisé, configurez les enregistrements DNS
   - Vérifiez dans **Project Settings** > **Auth** > **Email**

2. **Utiliser un service SMTP professionnel**
   - SendGrid, Mailgun, etc.
   - Ils ont de meilleures délivrabilités

### L'URL de confirmation ne fonctionne pas :

1. **Vérifier l'URL de redirection**
   - **Authentication** > **URL Configuration**
   - Assurez-vous que votre domaine est dans la liste

2. **Vérifier le template d'email**
   - L'URL doit utiliser `{{ .ConfirmationURL }}`
   - Vérifiez dans **Authentication** > **Email Templates**

## 📝 Exemple de Test Complet

### Scénario de test :

1. **Créer un compte de test**
   ```bash
   # Sur votre site
   - Aller sur /jessica-contentin/inscription
   - Remplir le formulaire avec un email de test
   - Soumettre
   ```

2. **Vérifier les logs**
   ```bash
   # Dans Supabase Dashboard
   - Aller dans Logs > Auth Logs
   - Chercher l'événement "signup"
   - Vérifier que l'email a été envoyé
   ```

3. **Vérifier l'email**
   ```bash
   # Si vous utilisez Mailtrap/MailHog
   - Ouvrir l'interface
   - Vérifier que l'email est présent
   - Vérifier le contenu
   ```

4. **Tester le lien de confirmation**
   ```bash
   # Cliquer sur le lien dans l'email
   - Vérifier que vous êtes redirigé vers /auth/callback
   - Vérifier que le compte est confirmé
   - Vérifier que vous êtes connecté
   ```

## 🎯 Checklist de Test

- [ ] Email de confirmation envoyé après inscription
- [ ] Email de réinitialisation de mot de passe envoyé
- [ ] Email de changement d'email envoyé
- [ ] Les liens dans les emails fonctionnent
- [ ] Les templates d'email sont corrects
- [ ] Les emails arrivent dans la boîte de réception (pas en spam)
- [ ] Les variables dans les templates sont remplacées correctement
- [ ] Les URLs de redirection sont correctes

## 💡 Astuces

1. **En développement** : Utilisez Mailtrap ou MailHog pour éviter d'envoyer de vrais emails
2. **En production** : Testez toujours avec un email réel avant de lancer
3. **Logs** : Consultez toujours les logs Supabase en cas de problème
4. **Templates** : Testez les templates avec différents contenus
5. **Rate limiting** : Faites attention aux limites d'envoi d'emails


