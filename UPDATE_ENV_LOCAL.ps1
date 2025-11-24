# Script PowerShell pour mettre à jour .env.local avec les nouvelles clés Supabase
# Utilisation: .\UPDATE_ENV_LOCAL.ps1

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Mise à jour des clés Supabase dans .env.local" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier si .env.local existe
if (-not (Test-Path .env.local)) {
    Write-Host "❌ Le fichier .env.local n'existe pas !" -ForegroundColor Red
    exit 1
}

Write-Host "📋 Instructions:" -ForegroundColor Yellow
Write-Host "1. Allez sur: https://supabase.com/dashboard/project/fqqqejpakbccwvrlolpc/settings/api" -ForegroundColor White
Write-Host "2. Copiez la 'Clé publiable' (commence par sb_publishable_)" -ForegroundColor White
Write-Host "3. Révélez et copiez la 'Clé secrète' (commence par sb_secret_)" -ForegroundColor White
Write-Host ""

# Demander les nouvelles clés
$newAnonKey = Read-Host "Collez la nouvelle clé publiable (sb_publishable_...)"
$newServiceKey = Read-Host "Collez la nouvelle clé secrète (sb_secret_...)"

# Vérifier le format
if (-not $newAnonKey.StartsWith("sb_publishable_")) {
    Write-Host "⚠️  Attention: La clé publiable devrait commencer par 'sb_publishable_'" -ForegroundColor Yellow
    $confirm = Read-Host "Continuer quand même? (o/n)"
    if ($confirm -ne "o") {
        Write-Host "❌ Annulé" -ForegroundColor Red
        exit 1
    }
}

if (-not $newServiceKey.StartsWith("sb_secret_")) {
    Write-Host "⚠️  Attention: La clé secrète devrait commencer par 'sb_secret_'" -ForegroundColor Yellow
    $confirm = Read-Host "Continuer quand même? (o/n)"
    if ($confirm -ne "o") {
        Write-Host "❌ Annulé" -ForegroundColor Red
        exit 1
    }
}

# Lire le contenu actuel
$content = Get-Content .env.local -Raw

# Remplacer les anciennes clés
$content = $content -replace "NEXT_PUBLIC_SUPABASE_ANON_KEY=.*", "NEXT_PUBLIC_SUPABASE_ANON_KEY=$newAnonKey"
$content = $content -replace "SUPABASE_SERVICE_ROLE_KEY=.*", "SUPABASE_SERVICE_ROLE_KEY=$newServiceKey"

# Sauvegarder
$content | Set-Content .env.local -NoNewline

Write-Host ""
Write-Host "✅ Fichier .env.local mis à jour !" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  IMPORTANT: Redémarrez le serveur pour appliquer les changements:" -ForegroundColor Yellow
Write-Host "   1. Arrêtez le serveur (Ctrl+C)" -ForegroundColor White
Write-Host "   2. Relancez: npm run dev" -ForegroundColor White
Write-Host ""




