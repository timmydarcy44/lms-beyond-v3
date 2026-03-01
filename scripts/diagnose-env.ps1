param()

$projectRoot = Get-Location
Write-Host ("Project root: {0}" -f $projectRoot)

$envFiles = @(
  ".env.local",
  ".env",
  ".env.development.local",
  ".env.production.local"
)

$varOccurrences = @{}

$primaryKeyName = "SUPABASE_SERVICE_ROLE_KEY"
$legacyKeyName = "SUPABASE_SERVICE_ROLE_KEY"

function Get-SafeValueInfo {
  param (
    [string] $Value
  )

  if ($null -eq $Value) {
    return @{ present = $false }
  }

  $trimmed = $Value.Trim()
  return @{
    present = $true
    length = $trimmed.Length
    startsWithEyJ = $trimmed.StartsWith("eyJ")
    containsSpace = $trimmed -match "\s"
  }
}

foreach ($file in $envFiles) {
  $fullPath = Join-Path $projectRoot $file
  if (-not (Test-Path $fullPath)) {
    Write-Host ""
    Write-Host ("{0}: (missing)" -f $file) -ForegroundColor DarkGray
    continue
  }

  Write-Host ""
  Write-Host ("{0}:" -f $file)
  $lines = Get-Content $fullPath
  if (-not $lines) {
    Write-Host "  (empty file)"
    continue
  }

  $activeLines = $lines | Where-Object { $_ -notmatch '^\s*#' -and $_ -match '\S' }
  $supabaseLines = $activeLines | Where-Object { $_ -match 'SUPABASE_' }
  Write-Host ("  SUPABASE_* lines: {0}" -f $supabaseLines.Count)

  $keysInFile = @{}

  foreach ($line in $activeLines) {
    $parts = $line.Split("=", 2)
    if ($parts.Count -lt 2) {
      continue
    }

    $key = $parts[0].Trim()
    $value = $parts[1]

    if ([string]::IsNullOrWhiteSpace($key)) {
      continue
    }

    $keysInFile[$key] = $true

    if ($key -like "SUPABASE_*") {
      $cleanValue = $value.Trim().Trim('"').Trim("'")
      $info = Get-SafeValueInfo -Value $cleanValue
      $length = if ($info.present) { $info.length } else { 0 }
      $starts = if ($info.present) { $info.startsWithEyJ } else { $false }
      $hasSpace = if ($info.present) { $info.containsSpace } else { $false }

      Write-Host ("    - {0}: present={1}; length={2}; startsWithEyJ={3}; containsSpace={4}" -f `
        $key,
        $info.present,
        $length,
        $starts,
        $hasSpace
      )

      if ($varOccurrences.ContainsKey($key)) {
        $varOccurrences[$key] += ,$file
      } else {
        $varOccurrences[$key] = @($file)
      }
    }
  }

  $trackedKeys = @(
    "SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_URL",
    $primaryKeyName,
    $legacyKeyName
  )

  foreach ($trackedKey in $trackedKeys) {
    $present = $keysInFile.ContainsKey($trackedKey)
    $status = if ($present) { "yes" } else { "no" }
    Write-Host ("    {0} present: {1}" -f $trackedKey, $status)
  }
}

$duplicates = $varOccurrences.GetEnumerator() | Where-Object { $_.Value.Count -gt 1 }

Write-Host ""
Write-Host "Duplicate SUPABASE_* definitions across files:"
if (-not $duplicates) {
  Write-Host "  None detected."
} else {
  foreach ($entry in $duplicates) {
    $uniqueFiles = $entry.Value | Select-Object -Unique
    $filesList = $uniqueFiles -join ", "
    Write-Host ("  - {0}: {1}" -f $entry.Key, $filesList)
  }
}

