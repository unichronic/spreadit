# Deployment Guide - Railway

This guide will help you deploy your CrossPost application (Next.js frontend + FastAPI backend) to Railway.

## Prerequisites

1. **GitHub Account**: Your code should be in a GitHub repository
2. **Railway Account**: Sign up at [railway.app](https://railway.app)
3. **Environment Variables**: Prepare your environment variables

## Step 1: Prepare Your Repository

Make sure your code is pushed to GitHub:

```bash
git add .
git commit -m "Prepare for Railway deployment"
git push origin main
```

## Step 2: Deploy to Railway

### Option A: Deploy via Railway Dashboard (Recommended)

1. **Go to Railway**: Visit [railway.app](https://railway.app) and sign in
2. **Create New Project**: Click "New Project"
3. **Deploy from GitHub**: Select "Deploy from GitHub repo"
4. **Select Repository**: Choose your repository
5. **Deploy Services**: Railway will detect your services automatically

### Option B: Deploy via Railway CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize project
railway init

# Deploy
railway up
```

## Step 3: Configure Services

Railway will create separate services for your frontend and backend. You need to configure them:

### Backend Service Configuration

1. **Service Name**: `crosspost-api`
2. **Root Directory**: `/be`
3. **Build Command**: `pip install -r requirements.txt`
4. **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`

### Frontend Service Configuration

1. **Service Name**: `crosspost-frontend`
2. **Root Directory**: `/fe`
3. **Build Command**: `npm run build`
4. **Start Command**: `npm start`

## Step 4: Add Database Services

### PostgreSQL Database

1. **Add Service**: Click "New" → "Database" → "PostgreSQL"
2. **Service Name**: `crosspost-db`
3. **Note**: Railway will automatically provide connection variables

### Redis Database

1. **Add Service**: Click "New" → "Database" → "Redis"
2. **Service Name**: `crosspost-redis`
3. **Note**: Railway will automatically provide connection variables

## Step 5: Configure Environment Variables

### Backend Environment Variables

Add these to your backend service:

```env
# Database (Auto-provided by Railway)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Redis (Auto-provided by Railway)
REDIS_URL=${{Redis.REDIS_URL}}

# Security
SECRET_KEY=your-super-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS
FRONTEND_URL=${{crosspost-frontend.RAILWAY_PUBLIC_DOMAIN}}

# API Keys (Add your actual keys)
HASHNODE_API_KEY=your-hashnode-api-key
MEDIUM_API_KEY=your-medium-api-key
DEVTO_API_KEY=your-devto-api-key
```

### Frontend Environment Variables

Add these to your frontend service:

```env
NEXT_PUBLIC_API_URL=https://${{crosspost-api.RAILWAY_PUBLIC_DOMAIN}}
```

## Step 6: Deploy Celery Worker (Optional)

If you need background tasks:

1. **Add New Service**: Click "New" → "Empty Service"
2. **Service Name**: `crosspost-worker`
3. **Root Directory**: `/be`
4. **Start Command**: `python start_worker.py`
5. **Environment Variables**: Same as backend service

## Step 7: Database Migration

After deployment, run database migrations:

1. **Connect to Backend Service**: Use Railway's terminal
2. **Run Migrations**:
   ```bash
   alembic upgrade head
   ```

## Step 8: Custom Domain (Optional)

1. **Go to Service Settings**: Select your frontend service
2. **Custom Domain**: Add your domain
3. **Update Environment Variables**: Update CORS settings in backend

## Troubleshooting

### Common Issues

1. **CORS Errors**: Make sure FRONTEND_URL is set correctly in backend
2. **Database Connection**: Verify DATABASE_URL is properly set
3. **Build Failures**: Check logs in Railway dashboard

### Useful Commands

```bash
# View logs
railway logs

# Connect to service shell
railway shell

# Check environment variables
railway variables
```

## Alternative: Vercel + Railway

You can also deploy:
- **Frontend**: Vercel (better for Next.js)
- **Backend + Database**: Railway

### Vercel Frontend Deployment

1. **Connect GitHub**: Link your repository to Vercel
2. **Root Directory**: Set to `fe`
3. **Environment Variables**:
   ```env
   NEXT_PUBLIC_API_URL=https://your-railway-backend-url.railway.app
   ```

## Cost Estimation

### Railway (Recommended)
- **Free Tier**: $0/month (with limitations)
- **Pro Plan**: $20/month (recommended for production)

### Vercel + Railway
- **Vercel**: Free for personal projects
- **Railway**: $5-20/month depending on usage

## Security Checklist

- [ ] Change default SECRET_KEY
- [ ] Set up proper CORS origins
- [ ] Use environment variables for all secrets
- [ ] Enable HTTPS (automatic on Railway)
- [ ] Set up database backups
- [ ] Monitor application logs

## Next Steps

1. **Monitor**: Set up monitoring and alerts
2. **Backup**: Configure database backups
3. **CI/CD**: Set up automatic deployments
4. **Scaling**: Monitor usage and scale as needed

---

**Need Help?** Check Railway's documentation or reach out to their support team. 