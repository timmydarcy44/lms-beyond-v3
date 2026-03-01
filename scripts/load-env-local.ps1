param()

$projectRoot = Get-Location
$envFile = Join-Path $projectRoot ".env.local"

if (-not (Test-Path $envFile)) {
  Write-Host ".env.local not found at $envFile" -ForegroundColor Yellow
  exit 0
}

$loaded = 0

Get-Content $envFile | ForEach-Object {
  $line = $_
  if ($line -match '^\s*#') { return }
  if ($line -match '^\s*$') { return }

  $parts = $line.Split("=", 2)
  if ($parts.Count -lt 2) { return }

  $key = $parts[0].Trim()
  if ([string]::IsNullOrWhiteSpace($key)) { return }

  $value = $parts[1]
  $value = $value.Trim()

  if ($value.StartsWith('"') -and $value.EndsWith('"') -and $value.Length -ge 2) {
    $value = $value.Substring(1, $value.Length - 2)
  } elseif ($value.StartsWith("'") -and $value.EndsWith("'") -and $value.Length -ge 2) {
    $value = $value.Substring(1, $value.Length - 2)
  }

  Remove-Item "Env:$key" -ErrorAction SilentlyContinue
  [System.Environment]::SetEnvironmentVariable($key, $value, "Process")
  $loaded++
}

Write-Host "Loaded $loaded variable(s) into the current PowerShell process." -ForegroundColor Cyan

function Show-EnvSummary {
  param (
    [string] $Key
  )

  $value = [System.Environment]::GetEnvironmentVariable($Key, "Process")
  if ($null -eq $value) {
    Write-Host (" - {0}: not set" -f $Key)
    return
  }

  $trimmed = $value.Trim()
  $length = $trimmed.Length
  $startsWithEyJ = $trimmed.StartsWith("eyJ")
  $containsSpace = $trimmed -match "\s"

  Write-Host (" - {0}: present | length={1} | startsWithEyJ={2} | containsSpace={3}" -f `
    $Key,
    $length,
    $startsWithEyJ,
    $containsSpace
  )
}

Write-Host "Supabase service key summary:"
$primaryKeyName = "SUPABASE_SERVICE_ROLE_KEY"
$legacyKeyName = "SUPABASE_SERVICE_ROLE_KEY"
Show-EnvSummary -Key $primaryKeyName
if ($legacyKeyName -ne $primaryKeyName) {
  Show-EnvSummary -Key $legacyKeyName
}

