$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

$python = Join-Path $env:LOCALAPPDATA "Programs\Python\Python312\python.exe"
$npm = "C:\Program Files\nodejs\npm.cmd"

if (-not (Test-Path $python)) {
  $pythonCandidate = (where.exe python 2>$null | Select-Object -First 1)
  if ($pythonCandidate) {
    $python = $pythonCandidate
  } else {
    throw "Python not found. Tried: $python"
  }
}

if (-not (Test-Path $npm)) {
  throw "npm not found: $npm"
}

Write-Host "Preparing local database..."
powershell -ExecutionPolicy Bypass -File "scripts/setup-local.ps1"

Write-Host "Starting local API on http://127.0.0.1:8000 ..."
Start-Process powershell -ArgumentList @(
  "-NoExit",
  "-ExecutionPolicy", "Bypass",
  "-Command", "Set-Location '$projectRoot'; & '$python' 'backend/local_api.py'"
)

Start-Sleep -Seconds 1

Write-Host "Starting frontend on http://127.0.0.1:5173 ..."
Start-Process powershell -ArgumentList @(
  "-NoExit",
  "-ExecutionPolicy", "Bypass",
  "-Command", "Set-Location '$projectRoot'; & '$npm' run dev"
)

Write-Host "Local environment started."
