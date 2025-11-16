# Script pour mettre à jour .env.local avec la clé anon complète

$url = "https://fqqqejpakbccwvrlolpc.supabase.co"
$anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxcXFlanBha2JjY3d2cmxvbHBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2NTQwMDUsImV4cCI6MjA3NjIzMDAwNX0.2HIll5PWNU_N2uJm9aZnwTbRRpXu0pB8gKnuyNKs0xc"

Write-Host "Mise à jour de .env.local..."
Write-Host "Longueur de la clé: $($anonKey.Length) caractères"

# Lire le fichier existant pour préserver les autres variables
$existingContent = ""
if (Test-Path .env.local) {
    $existingContent = Get-Content .env.local -Raw
}

# Construire le nouveau contenu
$newContent = @()
$newContent += "NEXT_PUBLIC_SUPABASE_URL=$url"
$newContent += "NEXT_PUBLIC_SUPABASE_ANON_KEY=$anonKey"

# Préserver SUPABASE_SERVICE_ROLE_KEY si elle existe
if ($existingContent -match 'SUPABASE_SERVICE_ROLE_KEY=([^\r\n]+)') {
    $serviceRoleValue = $matches[1]
    $newContent += "SUPABASE_SERVICE_ROLE_KEY=$serviceRoleValue"
    Write-Host "Service Role Key préservée"
}

# Préserver OPENAI_API_KEY si elle existe
if ($existingContent -match 'OPENAI_API_KEY=([^\r\n]+)') {
    $openaiValue = $matches[1]
    $newContent += "OPENAI_API_KEY=$openaiValue"
    Write-Host "OpenAI API Key préservée"
}

# Écrire le fichier
$newContent -join "`r`n" | Out-File -FilePath .env.local -Encoding utf8

Write-Host ""
Write-Host "Fichier .env.local mis a jour avec succes!"
Write-Host "Redemarrez le serveur: npm run dev"

