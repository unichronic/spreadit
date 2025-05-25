# 🚀 Railway Quick Setup - Copy & Paste Variables

## 🔧 **Backend Service Variables**

Copy and paste these into your Railway backend service:

```env
# Database (Auto-provided by Railway)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Redis (Auto-provided by Railway)  
CELERY_BROKER_URL=redis://default:vuPNZdTKXUmORPLaDSFyePtCucldvRVY@nozomi.proxy.rlwy.net:32948
CELERY_RESULT_BACKEND=redis://default:vuPNZdTKXUmORPLaDSFyePtCucldvRVY@nozomi.proxy.rlwy.net:32948

# Security (REPLACE with your own values)
SECRET_KEY=4ec862d2afddd10f8d404c4eca27288dd691c4ee3e6bf598fd2632a635843a34
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS (Auto-provided by Railway)
FRONTEND_URL=https://${{crosspost-frontend.RAILWAY_PUBLIC_DOMAIN}}
FRONTEND_BASE_URL=https://${{crosspost-frontend.RAILWAY_PUBLIC_DOMAIN}}

# Platform API Keys (REPLACE with your actual keys)
HASHNODE_API_KEY=your-hashnode-personal-access-token
DEVTO_API_KEY=your-devto-api-key
MEDIUM_CLIENT_ID=your-medium-client-id
MEDIUM_CLIENT_SECRET=your-medium-client-secret
MEDIUM_REDIRECT_URI=https://${{crosspost-api.RAILWAY_PUBLIC_DOMAIN}}/connect/medium/callback
```

## 🎨 **Frontend Service Variables**

Copy and paste this into your Railway frontend service:

```env
NEXT_PUBLIC_API_URL=https://${{crosspost-api.RAILWAY_PUBLIC_DOMAIN}}
```

## 🔄 **Worker Service Variables (Optional)**

If deploying a separate Celery worker, use the same variables as the backend service.

---

## 📝 **To-Do Checklist**

### Before Deployment:
- [ ] Get Hashnode API key from [hashnode.com/settings/developer](https://hashnode.com/settings/developer)
- [ ] Get Dev.to API key from [dev.to/settings/extensions](https://dev.to/settings/extensions)  
- [ ] Create Medium app at [medium.com/me/applications](https://medium.com/me/applications)
- [ ] Replace the `SECRET_KEY` with your own generated key (or use the one provided)

### After Deployment:
- [ ] Add PostgreSQL database service in Railway
- [ ] Add Redis database service in Railway
- [ ] Set all environment variables in Railway dashboard
- [ ] Test the deployment at your Railway URLs

---

## 🔑 **Your Generated JWT Secret Key**

```
4ec862d2afddd10f8d404c4eca27288dd691c4ee3e6bf598fd2632a635843a34
```

**⚠️ Important**: This is a secure, randomly generated key. You can use this or generate your own with:
```bash
python -c "import os; print(os.urandom(32).hex())"
```

---

## 🚀 **Quick Deploy Commands**

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

---

**🎉 That's it! Your CrossPost application should be ready to deploy on Railway!** 