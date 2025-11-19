# Script pour corriger le fichier .env.local
# Ce script supprime les retours à la ligne dans les valeurs des variables d'environnement

$envFile = ".env.local"
$outputFile = ".env.local.fixed"
$lines = Get-Content $envFile -Raw

# Diviser le fichier par lignes qui commencent par une variable (sans espaces avant)
$pattern = '(?m)^([A-Z_]+)='
$matches = [regex]::Matches($lines, $pattern)

$correctedContent = @()
$currentVariable = $null
$currentValue = ""

foreach ($line in $lines -split "`r?`n") {
    if ($line -match '^([A-Z_]+)=(.*)$') {
        # Nouvelle variable détectée
        # Sauvegarder la variable précédente si elle existe
        if ($currentVariable) {
            $correctedContent += "$currentVariable=$currentValue"
        }
        # Commencer une nouvelle variable
        $currentVariable = $matches[0].Groups[1].Value
        $currentValue = $matches[0].Groups[2].Value
    } else {
        # Ligne de continuation (partie de la valeur précédente)
        if ($currentVariable) {
            $currentValue += $line.Trim()
        }
    }
}

# Ajouter la dernière variable
if ($currentVariable) {
    $correctedContent += "$currentVariable=$currentValue"
}

# Écrire le fichier corrigé
$correctedContent | Out-File -FilePath $outputFile -Encoding utf8 -NoNewline

Write-Host "Fichier corrigé créé : $outputFile"
Write-Host "Vérifiez le contenu, puis remplacez .env.local par .env.local.fixed"
Write-Host ""
Write-Host "Pour remplacer :"
Write-Host "  Move-Item -Force .env.local.fixed .env.local"





