param(
  [switch] $Hard
)

$ErrorActionPreference = "SilentlyContinue"

function Kill-Port($port) {
  $lines = netstat -ano | Select-String ":$port\s" | ForEach-Object { $_.ToString() }
  $pids = @()
  foreach ($line in $lines) {
    $parts = ($line -split "\s+") | Where-Object { $_ -ne "" }
    if ($parts.Length -gt 0) {
      $pid = $parts[-1]
      if ($pid -match "^\d+$") {
        $pids += [int]$pid
      }
    }
  }
  $pids = $pids | Sort-Object -Unique
  foreach ($pid in $pids) {
    Write-Host "Stopping PID $pid on port $port"
    Stop-Process -Id $pid -Force
  }
}

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

Kill-Port 3000
Kill-Port 3001

$lockPath = Join-Path $repoRoot ".next\dev\lock"
if (Test-Path $lockPath) {
  Write-Host "Removing .next/dev/lock"
  Remove-Item $lockPath -Recurse -Force
}

if ($Hard -and (Test-Path ".next")) {
  Write-Host "Hard reset: removing .next"
  Remove-Item ".next" -Recurse -Force
}

Write-Host "Dev server restarted on http://localhost:3000"
$env:PORT = "3000"
pnpm dev

