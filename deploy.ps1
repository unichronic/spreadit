Write-Host "🚀 CrossPost Deployment Script for Railway" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green

# Check if Railway CLI is installed
try {
    railway --version | Out-Null
    Write-Host "✅ Railway CLI found" -ForegroundColor Green
} catch {
    Write-Host "❌ Railway CLI not found. Installing..." -ForegroundColor Yellow
    npm install -g @railway/cli
}

# Check if user is logged in
try {
    railway whoami | Out-Null
    Write-Host "✅ Already logged in to Railway" -ForegroundColor Green
} catch {
    Write-Host "🔐 Please login to Railway..." -ForegroundColor Yellow
    railway login
}

# Initialize Railway project if not already done
if (-not (Test-Path "railway.toml")) {
    Write-Host "🎯 Initializing Railway project..." -ForegroundColor Yellow
    railway init
}

# Deploy the project
Write-Host "🚀 Deploying to Railway..." -ForegroundColor Yellow
railway up

Write-Host "✅ Deployment initiated!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. Go to your Railway dashboard" -ForegroundColor White
Write-Host "2. Configure environment variables" -ForegroundColor White
Write-Host "3. Add PostgreSQL and Redis databases" -ForegroundColor White
Write-Host "4. Set up custom domains (optional)" -ForegroundColor White
Write-Host ""
Write-Host "🔗 Railway Dashboard: https://railway.app/dashboard" -ForegroundColor Blue 