$ErrorActionPreference = "Continue"

Write-Host "Killing old backend services..."
node test/helpers/server-control.js kill-all

Write-Host "Starting Docker (Postgres, Redis, RabbitMQ, Nginx)..."
docker-compose up -d

Write-Host "Waiting 15 seconds for RabbitMQ to boot..."
Start-Sleep -Seconds 15

Write-Host "Starting all Node.js Microservices in background..."
Start-Process -FilePath "node" -ArgumentList "start-backend.js" -WindowStyle Normal

Write-Host "Starting Frontend in background..."
Set-Location -Path "ticketbox-client"
Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "npm run dev > frontend.log 2>&1" -WindowStyle Hidden
Set-Location -Path ".."

Write-Host "All services started! Ready for K6 UI test."
