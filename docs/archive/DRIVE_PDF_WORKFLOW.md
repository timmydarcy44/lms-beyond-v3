# Workflow de génération PDF pour les documents Drive

## Workflow actuel

### 1. Création d'un document partagé (Apprenant)
- **Endpoint**: `POST /api/drive/documents`
- **Body**: `{ title, content, status: "shared", ... }`
- **Processus**:
  1. Le document est créé dans la base de données avec `status = "shared"` et `file_url = null`
  2. Si `status === "shared"`, la génération PDF est **déclenchée de manière asynchrone** (ne bloque pas la réponse)
  3. La génération PDF utilise le **service role client** pour bypasser RLS
  4. Le PDF est généré, uploadé dans le bucket "public" de Supabase Storage
  5. Le document est mis à jour avec l'URL du PDF dans `file_url`

### 2. Mise à jour d'un document en partagé (Apprenant)
- **Endpoint**: `PATCH /api/drive/documents/[documentId]`
- **Body**: `{ status: "shared", ... }`
- **Processus**: Identique à la création

### 3. Consultation du document (Formateur/Admin)
- **Endpoint**: `GET /api/drive/documents/[documentId]` (via `getFormateurDriveDocumentById`)
- Le document est récupéré avec son `file_url` qui pointe vers le PDF dans Supabase Storage

## Corrections apportées

### ✅ Utilisation du service role client
- La génération PDF utilise maintenant `getServiceRoleClient()` pour bypasser RLS
- Cela permet d'uploader le PDF et de mettre à jour le document même si RLS bloque

### ✅ Logs détaillés
- Ajout de logs à chaque étape pour diagnostiquer les problèmes :
  - `[drive/documents] Document is shared, scheduling PDF generation for:`
  - `[drive/documents] Starting PDF generation for document:`
  - `[generate-pdf-utils] Generating PDF for document:`
  - `[generate-pdf-utils] PDF buffer generated, size:`
  - `[generate-pdf-utils] Uploading to bucket:`
  - `[generate-pdf-utils] Upload successful:`
  - `[generate-pdf-utils] PDF generated and uploaded successfully:`

### ✅ Gestion des erreurs améliorée
- Les erreurs sont maintenant loggées avec plus de détails (message, stack trace)
- Le document est créé/mis à jour même si la génération PDF échoue

## Vérifications à faire

### 1. Vérifier que le bucket "public" existe
```sql
SELECT id, name, public, created_at
FROM storage.buckets
WHERE name = 'public';
```

### 2. Vérifier les politiques RLS du bucket
- Dans Supabase Dashboard > Storage > Policies
- Le bucket "public" doit permettre l'upload de fichiers PDF
- Ou utiliser le service role client (qui bypass RLS)

### 3. Vérifier les logs du serveur
Chercher dans les logs :
- `[drive/documents] Document is shared, scheduling PDF generation for:`
- `[generate-pdf-utils]` pour voir les erreurs éventuelles

### 4. Tester avec un nouveau document
1. Créer un nouveau document avec `status: "shared"`
2. Vérifier les logs pour voir si la génération est déclenchée
3. Vérifier dans la base de données si `file_url` est mis à jour
4. Vérifier dans Supabase Storage si le PDF est présent dans le bucket "public"

## Régénération des PDFs manquants

Si des documents partagés n'ont pas de PDF, utiliser l'endpoint de régénération :

```bash
POST /api/drive/documents/regenerate-pdfs
Body: {}  # Régénère tous les documents partagés sans PDF

# Ou pour des documents spécifiques
POST /api/drive/documents/regenerate-pdfs
Body: { "documentIds": ["id1", "id2", ...] }
```

**Note**: Cet endpoint est accessible uniquement aux admins/super admins.

## Problèmes potentiels

### 1. La génération PDF n'est pas déclenchée
- **Cause**: Le document n'est pas créé avec `status: "shared"`
- **Solution**: Vérifier les logs `[drive/documents] Document is shared, scheduling PDF generation for:`

### 2. Erreur d'upload
- **Cause**: Le bucket "public" n'existe pas ou n'a pas les bonnes permissions
- **Solution**: Vérifier que le bucket existe et que le service role client peut y uploader

### 3. Erreur de mise à jour
- **Cause**: RLS bloque la mise à jour du document
- **Solution**: Utiliser le service role client (déjà fait dans le code)

### 4. La génération est asynchrone et peut échouer silencieusement
- **Cause**: La fonction asynchrone peut échouer sans que l'utilisateur le sache
- **Solution**: Vérifier les logs du serveur pour voir les erreurs

## Prochaines étapes

1. ✅ Créer le bucket "public" (fait)
2. ✅ Utiliser le service role client (fait)
3. ✅ Ajouter des logs détaillés (fait)
4. ⏳ Tester avec un nouveau document
5. ⏳ Vérifier les logs pour voir si la génération est déclenchée
6. ⏳ Régénérer les PDFs manquants si nécessaire


