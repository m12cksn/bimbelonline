param(
  [string]$BaseUrl = "https://your-domain.com"
)

Write-Host "== Smoke Test ==" -ForegroundColor Cyan

$endpoints = @(
  "/",
  "/dashboard",
  "/dashboard/student",
  "/dashboard/admin"
)

foreach ($path in $endpoints) {
  $url = "$BaseUrl$path"
  try {
    $resp = Invoke-WebRequest -Uri $url -Method Get -TimeoutSec 15
    Write-Host "$url -> $($resp.StatusCode)" -ForegroundColor Green
  } catch {
    Write-Host "$url -> FAILED ($($_.Exception.Message))" -ForegroundColor Red
  }
}

Write-Host "Smoke test done" -ForegroundColor Cyan
