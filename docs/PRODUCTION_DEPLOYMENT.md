# HMS Production Deployment Guide

Deploy the Hospital Management System to production infrastructure.

## Overview

| Component | Recommended Service | Alternative |
|-----------|-------------------|-------------|
| Backend | Railway / Render | AWS EC2, DigitalOcean |
| Frontend | Vercel / Netlify | AWS S3 + CloudFront |
| Database | Railway PostgreSQL | AWS RDS, Supabase |
| Email | AWS Lambda | SendGrid, Mailgun |

## Backend Deployment (Railway)

### 1. Prepare for Production

Update `backend/core/settings.py` for production:

```python
# Static files
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'django.contrib.staticfiles.storage.ManifestStaticFilesStorage'

# Security
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
```

### 2. Create Procfile

```
# backend/Procfile
web: gunicorn core.wsgi --log-file -
release: python manage.py migrate --no-input
```

### 3. Update requirements.txt

Add production dependencies:
```
gunicorn==21.2.0
whitenoise==6.6.0
```

### 4. Deploy to Railway

1. Push code to GitHub
2. Go to [Railway](https://railway.app/)
3. New Project → Deploy from GitHub repo
4. Add PostgreSQL database
5. Set environment variables:
   ```
   SECRET_KEY=<generate-secure-key>
   DEBUG=False
   ALLOWED_HOSTS=your-app.railway.app
   DATABASE_URL=<auto-set-by-railway>
   CORS_ALLOWED_ORIGINS=https://your-frontend.vercel.app
   CSRF_TRUSTED_ORIGINS=https://your-frontend.vercel.app
   ```
6. Deploy!

### 5. Run Migrations

Railway automatically runs the release command, but you can manually run:
```bash
railway run python manage.py migrate
railway run python manage.py createsuperuser
```

## Frontend Deployment (Vercel)

### 1. Configure for Production

Create `frontend/.env.production`:
```env
VITE_API_URL=https://your-backend.railway.app
```

### 2. Update vite.config.js

```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: import.meta.env.VITE_API_URL || 'http://localhost:8000',
        changeOrigin: true,
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
})
```

### 3. Update API Service

Update `frontend/src/services/api.js`:
```javascript
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL 
    ? `${import.meta.env.VITE_API_URL}/api`
    : '/api',
  withCredentials: true,
});
```

### 4. Deploy to Vercel

1. Push to GitHub
2. Import project in [Vercel](https://vercel.com/)
3. Set build settings:
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Add environment variables:
   ```
   VITE_API_URL=https://your-backend.railway.app
   ```
5. Deploy!

## Email Service Deployment (AWS Lambda)

### 1. Install Serverless CLI

```bash
npm install -g serverless
```

### 2. Configure AWS Credentials

```bash
serverless config credentials --provider aws --key YOUR_KEY --secret YOUR_SECRET
```

### 3. Update serverless.yml

```yaml
provider:
  name: aws
  runtime: python3.11
  stage: prod
  region: us-east-1
  environment:
    SMTP_HOST: ${env:SMTP_HOST}
    SMTP_PORT: ${env:SMTP_PORT}
    SMTP_USER: ${env:SMTP_USER}
    SMTP_PASS: ${env:SMTP_PASS}
```

### 4. Deploy

```bash
cd serverless-email
serverless deploy --stage prod
```

### 5. Get Endpoint URL

After deployment, note the endpoint URL:
```
endpoints:
  POST - https://xxxxxxxx.execute-api.us-east-1.amazonaws.com/prod/email
```

### 6. Update Backend

Update backend environment variable:
```
EMAIL_SERVICE_URL=https://xxxxxxxx.execute-api.us-east-1.amazonaws.com/prod/email
```

## Database Migration

### PostgreSQL Production Setup

1. **Enable SSL:**
   ```python
   DATABASES = {
       'default': {
           ...
           'OPTIONS': {
               'sslmode': 'require',
           }
       }
   }
   ```

2. **Run Initial Migrations:**
   ```bash
   railway run python manage.py migrate
   railway run python manage.py collectstatic --no-input
   ```

## Security Checklist

- [ ] `DEBUG=False` in production
- [ ] Strong `SECRET_KEY` (50+ random characters)
- [ ] HTTPS enabled (`SECURE_SSL_REDIRECT=True`)
- [ ] Secure cookies enabled
- [ ] CORS properly configured
- [ ] CSRF trusted origins set
- [ ] Google OAuth redirect URIs updated for production
- [ ] Database SSL enabled
- [ ] Environment variables not committed to git

## Monitoring & Logging

### Sentry Integration

```bash
pip install sentry-sdk
```

```python
# settings.py
import sentry_sdk
from sentry_sdk.integrations.django import DjangoIntegration

sentry_sdk.init(
    dsn=os.getenv('SENTRY_DSN'),
    integrations=[DjangoIntegration()],
    traces_sample_rate=1.0,
    send_default_pii=True
)
```

### Health Check Endpoint

Add to `core/urls.py`:
```python
from django.http import JsonResponse

def health_check(request):
    return JsonResponse({'status': 'healthy'})

urlpatterns = [
    path('health/', health_check),
    ...
]
```

## Scaling Considerations

### Database Connection Pooling

For high traffic, use pgBouncer or similar connection pooler.

### Redis for Sessions

For multi-instance deployments:
```python
# settings.py
SESSION_ENGINE = 'django.contrib.sessions.backends.cache'
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': os.getenv('REDIS_URL'),
    }
}
```

### Async Email Processing

For production, consider using Celery for async email:
```python
from celery import shared_task

@shared_task
def send_email_async(action, recipient, data):
    send_email(action, recipient, data)
```

---

**🎉 Your HMS is now production-ready!**
