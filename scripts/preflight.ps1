param(
  [switch]$SkipBuild
)

Write-Host "== Preflight Check ==" -ForegroundColor Cyan

# Load .env.local if present
$envFile = Join-Path (Get-Location) ".env.local"
if (Test-Path $envFile) {
  Get-Content $envFile | ForEach-Object {
    $line = $_.Trim()
    if ($line -and -not $line.StartsWith("#") -and $line.Contains("=")) {
      $parts = $line.Split("=", 2)
      $name = $parts[0].Trim()
      $value = $parts[1].Trim().Trim("'").Trim('"')
      if ($name) {
        [Environment]::SetEnvironmentVariable($name, $value)
      }
    }
  }
}

# 1) Check env
$required = @(
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY"
)

$missing = @()
foreach ($key in $required) {
  $value = [Environment]::GetEnvironmentVariable($key)
  if (-not $value -and $key -eq "SUPABASE_SERVICE_ROLE_KEY") {
    $value = [Environment]::GetEnvironmentVariable("NEXT_PUBLIC_SUPABASE_ROLE_KEY")
  }
  if (-not $value) { $missing += $key }
}

if ($missing.Count -gt 0) {
  Write-Host "Missing env vars:" -ForegroundColor Red
  $missing | ForEach-Object { Write-Host " - $_" -ForegroundColor Red }
  exit 1
}

Write-Host "Env vars OK" -ForegroundColor Green

# 1b) DB smoke check (Supabase REST)
$supabaseUrl = $env:SUPABASE_URL
if (-not $supabaseUrl) {
  $supabaseUrl = $env:NEXT_PUBLIC_SUPABASE_URL
}

if ($supabaseUrl) {
  try {
    $restUrl = "$supabaseUrl/rest/v1/profiles?select=id&limit=1"
    $serviceKey = $env:SUPABASE_SERVICE_ROLE_KEY
    if (-not $serviceKey) {
      $serviceKey = $env:NEXT_PUBLIC_SUPABASE_ROLE_KEY
    }
    $headers = @{
      "apikey" = $serviceKey
      "Authorization" = "Bearer $serviceKey"
    }
    $resp = Invoke-WebRequest -Uri $restUrl -Headers $headers -Method Get -TimeoutSec 10 -UseBasicParsing
    if ($resp.StatusCode -ge 200 -and $resp.StatusCode -lt 300) {
      Write-Host "Supabase REST OK" -ForegroundColor Green
    } else {
      Write-Host "Supabase REST responded: $($resp.StatusCode)" -ForegroundColor Yellow
    }
  } catch {
    Write-Host "Supabase REST check failed: $($_.Exception.Message)" -ForegroundColor Yellow
  }
} else {
  Write-Host "SUPABASE_URL not set, skipping REST smoke check." -ForegroundColor Yellow
}

# 2) Install deps check
if (-not (Test-Path node_modules)) {
  Write-Host "node_modules not found. Run npm install." -ForegroundColor Yellow
  exit 1
}

Write-Host "node_modules OK" -ForegroundColor Green

# 3) Build
if (-not $SkipBuild) {
  Write-Host "Running build..." -ForegroundColor Cyan
  npm run build
  if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed" -ForegroundColor Red
    exit 1
  }
  Write-Host "Build OK" -ForegroundColor Green
}

Write-Host "Preflight completed" -ForegroundColor Green
