# Script pour vérifier si les clés API sont sur une seule ligne
$content = Get-Content .env.local -Raw

# Vérifier NEXT_PUBLIC_SUPABASE_ANON_KEY
if ($content -match 'NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*?)(\r?\n)([A-Z_]|$)') {
    Write-Host "PROBLEME DETECTE: La clé ANON_KEY semble avoir un retour à la ligne"
    Write-Host "Capture: $($matches[1])"
} else {
    Write-Host "OK: NEXT_PUBLIC_SUPABASE_ANON_KEY semble être sur une seule ligne"
}

# Compter les lignes du fichier
$lines = ($content -split "`r?`n").Where({ $_.Trim() -ne "" })
Write-Host "`nNombre de lignes non vides: $($lines.Count)"

# Afficher la longueur de chaque ligne
Write-Host "`nDétails des lignes:"
for ($i = 0; $i -lt [Math]::Min($lines.Count, 5); $i++) {
    $lineLength = $lines[$i].Length
    $preview = if ($lineLength -gt 80) { $lines[$i].Substring(0, 80) + "..." } else { $lines[$i] }
    Write-Host "Ligne $($i+1): $lineLength caractères - $preview"
}




