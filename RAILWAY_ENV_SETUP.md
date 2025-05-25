# 🚀 Railway Environment Variables Setup Guide

This guide lists ALL environment variables needed for your CrossPost application deployment on Railway.

## 📋 **Required Environment Variables**

### 🔧 **Backend Service Environment Variables**

#### **1. Database Configuration (Auto-provided by Railway)**
```env
# PostgreSQL Database - Railway auto-provides this
DATABASE_URL=${{Postgres.DATABASE_URL}}
```

#### **2. Redis Configuration (Auto-provided by Railway)**
```env
# Redis for Celery - Railway auto-provides this
CELERY_BROKER_URL=${{Redis.REDIS_URL}}
CELERY_RESULT_BACKEND=${{Redis.REDIS_URL}}
```

#### **3. Security & Authentication**
```env
# JWT Secret Key - GENERATE A STRONG SECRET!
SECRET_KEY=your-super-secret-jwt-key-make-it-long-and-random-at-least-32-chars

# JWT Algorithm (keep as is)
ALGORITHM=HS256

# Token expiration (in minutes)
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

#### **4. CORS & Frontend Configuration**
```env
# Frontend URL - Railway auto-provides this
FRONTEND_URL=https://${{crosspost-frontend.RAILWAY_PUBLIC_DOMAIN}}

# Alternative frontend base URL (for redirects)
FRONTEND_BASE_URL=https://${{crosspost-frontend.RAILWAY_PUBLIC_DOMAIN}}
```

#### **5. Platform API Keys (Get from respective platforms)**
```env
# Hashnode Personal Access Token
# Get from: https://hashnode.com/settings/developer
HASHNODE_API_KEY=your-hashnode-personal-access-token

# Dev.to API Key  
# Get from: https://dev.to/settings/extensions
DEVTO_API_KEY=your-devto-api-key

# Medium OAuth Credentials
# Get from: https://medium.com/me/applications
MEDIUM_CLIENT_ID=your-medium-client-id
MEDIUM_CLIENT_SECRET=your-medium-client-secret
MEDIUM_REDIRECT_URI=https://${{crosspost-api.RAILWAY_PUBLIC_DOMAIN}}/connect/medium/callback
```

---

### 🎨 **Frontend Service Environment Variables**

```env
# Backend API URL - Railway auto-provides this
NEXT_PUBLIC_API_URL=https://${{crosspost-api.RAILWAY_PUBLIC_DOMAIN}}
```

---

### 🔄 **Worker Service Environment Variables (Optional - for Celery)**

If you deploy a separate Celery worker service, use the same environment variables as the backend service.

---

## 🛠️ **How to Set Up Environment Variables in Railway**

### **Step 1: Access Railway Dashboard**
1. Go to [railway.app/dashboard](https://railway.app/dashboard)
2. Select your project
3. Click on each service (backend, frontend, worker)

### **Step 2: Add Environment Variables**
1. Click on the **"Variables"** tab for each service
2. Click **"New Variable"**
3. Add each variable name and value
4. Click **"Add"**

### **Step 3: Use Railway's Variable References**
Railway provides special syntax to reference other services:
- `${{Postgres.DATABASE_URL}}` - Auto-generated PostgreSQL URL
- `${{Redis.REDIS_URL}}` - Auto-generated Redis URL  
- `${{service-name.RAILWAY_PUBLIC_DOMAIN}}` - Public domain of another service

---

## 🔑 **How to Get API Keys**

### **1. Hashnode Personal Access Token**
1. Go to [hashnode.com/settings/developer](https://hashnode.com/settings/developer)
2. Click "Generate New Token"
3. Copy the token (starts with a UUID format)
4. Add as `HASHNODE_API_KEY`

### **2. Dev.to API Key**
1. Go to [dev.to/settings/extensions](https://dev.to/settings/extensions)
2. Generate a new API key
3. Copy the key
4. Add as `DEVTO_API_KEY`

### **3. Medium OAuth App**
1. Go to [medium.com/me/applications](https://medium.com/me/applications)
2. Create a new application
3. Get Client ID and Client Secret
4. Set redirect URI to: `https://your-backend-domain.railway.app/connect/medium/callback`
5. Add as `MEDIUM_CLIENT_ID` and `MEDIUM_CLIENT_SECRET`

### **4. Generate JWT Secret Key**
Use this command to generate a secure secret:
```bash
# Option 1: Using OpenSSL
openssl rand -hex 32

# Option 2: Using Python
python -c "import secrets; print(secrets.token_hex(32))"

# Option 3: Online generator
# Visit: https://generate-secret.vercel.app/32
```

---

## 📝 **Environment Variables Checklist**

### **Backend Service** ✅
- [ ] `DATABASE_URL` (auto-provided by Railway)
- [ ] `CELERY_BROKER_URL` (auto-provided by Railway)  
- [ ] `CELERY_RESULT_BACKEND` (auto-provided by Railway)
- [ ] `SECRET_KEY` (generate strong secret)
- [ ] `ALGORITHM` (set to "HS256")
- [ ] `ACCESS_TOKEN_EXPIRE_MINUTES` (set to "30")
- [ ] `FRONTEND_URL` (auto-provided by Railway)
- [ ] `FRONTEND_BASE_URL` (auto-provided by Railway)
- [ ] `HASHNODE_API_KEY` (get from Hashnode)
- [ ] `DEVTO_API_KEY` (get from Dev.to)
- [ ] `MEDIUM_CLIENT_ID` (get from Medium)
- [ ] `MEDIUM_CLIENT_SECRET` (get from Medium)
- [ ] `MEDIUM_REDIRECT_URI` (set to your backend callback URL)

### **Frontend Service** ✅
- [ ] `NEXT_PUBLIC_API_URL` (auto-provided by Railway)

### **Worker Service (Optional)** ✅
- [ ] Same as backend service variables

---

## 🚨 **Security Best Practices**

1. **Never commit API keys** to your repository
2. **Use strong, unique secrets** for JWT signing
3. **Rotate API keys** regularly
4. **Use Railway's variable references** for service URLs
5. **Keep production and development keys separate**

---

## 🔧 **Testing Your Environment Variables**

After setting up, test your deployment:

1. **Health Check**: Visit `https://your-backend-domain.railway.app/health`
2. **API Documentation**: Visit `https://your-backend-domain.railway.app/docs`
3. **Frontend**: Visit `https://your-frontend-domain.railway.app`

---

## 🆘 **Troubleshooting**

### **Common Issues:**

1. **CORS Errors**: Check `FRONTEND_URL` is set correctly
2. **Database Connection**: Verify `DATABASE_URL` is provided by Railway
3. **API Key Errors**: Ensure all platform API keys are valid
4. **JWT Errors**: Check `SECRET_KEY` is set and strong

### **Debug Commands:**
```bash
# Check environment variables in Railway
railway variables

# View service logs
railway logs --service=your-service-name
```

---

## 📚 **Additional Resources**

- [Railway Environment Variables Docs](https://docs.railway.app/develop/variables)
- [Hashnode API Documentation](https://apidocs.hashnode.com/)
- [Dev.to API Documentation](https://developers.forem.com/api)
- [Medium API Documentation](https://github.com/Medium/medium-api-docs)

---

**🎉 Once all variables are set, your application should deploy successfully!** 