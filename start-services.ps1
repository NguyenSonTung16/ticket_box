$ErrorActionPreference = "Continue"

Write-Host "Killing old backend services..."
node test/helpers/server-control.js kill-all

Write-Host "Starting Docker (Postgres, Redis, RabbitMQ, Nginx)..."
docker-compose up -d

Write-Host "Waiting 15 seconds for RabbitMQ to boot..."
Start-Sleep -Seconds 15

Write-Host "Starting all Node.js Microservices in background..."
Start-Process -FilePath "npm.cmd" -ArgumentList "run", "start:auth" -WindowStyle Hidden
Start-Process -FilePath "npm.cmd" -ArgumentList "run", "start:info" -WindowStyle Hidden
Start-Process -FilePath "npm.cmd" -ArgumentList "run", "start:payment" -WindowStyle Hidden
Start-Process -FilePath "npm.cmd" -ArgumentList "run", "start:worker" -WindowStyle Hidden
Start-Process -FilePath "npm.cmd" -ArgumentList "run", "start:booking" -WindowStyle Hidden

Write-Host "Starting Frontend in background..."
Set-Location -Path "ticketbox-client"
Start-Process -FilePath "npm.cmd" -ArgumentList "run", "dev" -WindowStyle Hidden
Set-Location -Path ".."

Write-Host "All services started! Ready for K6 UI test."
