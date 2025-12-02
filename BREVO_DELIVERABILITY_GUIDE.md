# Guide d'amélioration de la délivrabilité Brevo

## Problème : Les emails arrivent en spam

Pour améliorer la délivrabilité et éviter que les emails arrivent en spam, vous devez configurer correctement votre domaine dans Brevo.

## Configuration requise dans Brevo

### 1. Vérifier votre domaine d'envoi

1. Connectez-vous à votre compte Brevo : https://app.brevo.com
2. Allez dans **Settings** > **Senders & IP**
3. Cliquez sur **Domains**
4. Ajoutez votre domaine (ex: `jessicacontentin.fr` ou `beyond-connect.fr`)

### 2. Configurer les enregistrements DNS

Brevo vous fournira des enregistrements DNS à ajouter à votre domaine :

#### SPF (Sender Policy Framework)
```
Type: TXT
Name: @ (ou votre sous-domaine)
Value: v=spf1 include:spf.brevo.com ~all
```

#### DKIM (DomainKeys Identified Mail)
Brevo vous fournira une clé DKIM unique à ajouter :
```
Type: TXT
Name: brevo._domainkey
Value: [clé fournie par Brevo]
```

#### DMARC (Domain-based Message Authentication)
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:votre-email@votre-domaine.com
```

### 3. Vérifier la configuration

Une fois les enregistrements DNS ajoutés, Brevo vérifiera automatiquement votre domaine (cela peut prendre jusqu'à 48h).

### 4. Utiliser votre domaine vérifié

Une fois le domaine vérifié, modifiez l'email d'expéditeur dans le code :

**Fichier : `src/lib/emails/brevo.ts`**

Remplacez :
```typescript
email: "contentin.cabinet@gmail.com"
```

Par :
```typescript
email: "noreply@votre-domaine-verifie.fr" // Utilisez votre domaine vérifié
```

## Améliorations déjà implémentées

✅ Headers email pour améliorer la délivrabilité :
- `X-Mailer`: Identifie l'application
- `List-Unsubscribe`: Permet la désinscription
- `List-Unsubscribe-Post`: Support de la désinscription en un clic

✅ Contenu optimisé :
- Texte clair et professionnel
- Évite les mots déclencheurs de spam
- Structure HTML propre

✅ Tags appropriés :
- Tags Brevo pour catégoriser les emails
- Facilite le tracking et l'analyse

## Actions immédiates

1. **Vérifiez votre domaine dans Brevo** : https://app.brevo.com/settings/senders/domains
2. **Ajoutez les enregistrements DNS** fournis par Brevo
3. **Attendez la vérification** (jusqu'à 48h)
4. **Testez l'envoi** une fois le domaine vérifié

## Note importante

Même avec un domaine vérifié, certains emails peuvent arriver en spam si :
- Le destinataire n'a jamais reçu d'email de vous
- Le contenu contient des mots déclencheurs
- Le taux d'ouverture est faible

**Recommandation** : Demandez aux utilisateurs d'ajouter votre adresse email à leurs contacts pour améliorer la délivrabilité.

