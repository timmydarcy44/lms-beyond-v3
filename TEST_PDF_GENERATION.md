# Test de génération PDF

## Problème
Le fichier PDF n'arrive pas dans le bucket "public" de Supabase Storage.

## Diagnostic

### 1. Vérifier les logs
Chercher dans les logs du serveur :
- `[drive/documents] POST request body:` - Vérifier si `status === "shared"`
- `[drive/documents] Document created successfully:` - Vérifier si le document est créé
- `[drive/documents] Checking if PDF generation is needed:` - Vérifier si la condition est remplie
- `[drive/documents] ✓ Document is shared, generating PDF synchronously for:` - Vérifier si la génération est déclenchée
- `[generate-pdf-utils]` - Vérifier les logs de génération PDF

### 2. Vérifier le bucket "public"
Dans Supabase Dashboard > Storage > Policies :
- Le bucket "public" doit exister
- Les politiques RLS doivent permettre l'upload via le service role client

### 3. Tester manuellement
Créer un nouveau document avec `status: "shared"` et vérifier :
1. Les logs du serveur
2. Si le document est créé dans la base de données
3. Si le PDF est généré et uploadé dans le bucket

### 4. Utiliser l'endpoint de régénération
Si des documents existent sans PDF, utiliser :
```bash
POST /api/drive/documents/regenerate-pdfs
Body: {}
```

## Actions à effectuer

1. **Créer un nouveau document partagé** et vérifier les logs
2. **Vérifier les logs** pour voir si la génération PDF est déclenchée
3. **Vérifier les erreurs** dans les logs (chercher `Error generating PDF`)
4. **Vérifier le bucket** dans Supabase Dashboard
5. **Tester l'endpoint de régénération** si nécessaire


