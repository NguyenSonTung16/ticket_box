$ErrorActionPreference = "Stop"

Write-Host "Kích hoạt chế độ k6 Browser..." -ForegroundColor Cyan
$env:K6_BROWSER_ENABLED = "true"

Write-Host "Tắt chế độ chạy ngầm (Headless = false) để hiển thị giao diện..." -ForegroundColor Cyan
$env:K6_BROWSER_HEADLESS = "false"

Write-Host "Bắt đầu chạy UI Race Condition Test..." -ForegroundColor Green
k6 run test/k6-browser-race.js
