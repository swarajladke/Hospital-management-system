# HMS Local Development Guide

Complete step-by-step guide to run the Hospital Management System locally.

## Prerequisites

Ensure you have the following installed:

- **Python 3.11+**: [Download](https://www.python.org/downloads/)
- **Node.js 18+**: [Download](https://nodejs.org/)
- **PostgreSQL 14+**: [Download](https://www.postgresql.org/download/)
- **Git**: [Download](https://git-scm.com/)

## Step 1: Database Setup

### Create PostgreSQL Database

```powershell
# Open psql or use pgAdmin
psql -U postgres

# Create database
CREATE DATABASE hms_db;

# Exit
\q
```

Or using pgAdmin:
1. Right-click "Databases" → "Create" → "Database"
2. Name: `hms_db`
3. Click "Save"

## Step 2: Backend Setup

### Navigate to Backend Directory

```powershell
cd "c:\Users\Vicky\Desktop\Hospital Management System\backend"
```

### Create Virtual Environment

```powershell
python -m venv venv
.\venv\Scripts\activate
```

### Install Dependencies

```powershell
pip install -r requirements.txt
```

### Configure Environment

```powershell
# Copy example env file
copy .env.example .env

# Edit .env with your values
notepad .env
```

Update these values in `.env`:
```env
SECRET_KEY=your-super-secret-key-minimum-50-chars
DEBUG=True
DB_NAME=hms_db
DB_USER=postgres
DB_PASSWORD=your-postgres-password
DB_HOST=localhost
DB_PORT=5432
```

### Run Migrations

```powershell
python manage.py migrate
```

### Create Admin User

```powershell
python manage.py createsuperuser
# Follow prompts to create admin account
```

### Start Django Server

```powershell
python manage.py runserver
```

✅ Backend should now be running at: http://localhost:8000

## Step 3: Frontend Setup

### Open New Terminal

```powershell
cd "c:\Users\Vicky\Desktop\Hospital Management System\frontend"
```

### Install Dependencies

```powershell
npm install
```

### Start Development Server

```powershell
npm run dev
```

✅ Frontend should now be running at: http://localhost:5173

## Step 4: Serverless Email Service (Optional)

### Open New Terminal

```powershell
cd "c:\Users\Vicky\Desktop\Hospital Management System\serverless-email"
```

### Install Dependencies

```powershell
npm install
```

### Configure SMTP (Optional)

For actual email sending, create `.env`:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

> **Note:** Without SMTP configuration, emails will be logged to console instead of sent.

### Start Serverless Offline

```powershell
npm start
```

✅ Email service should now be running at: http://localhost:3000/dev/email

## Step 5: Google Calendar Setup (Optional)

### Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project: "HMS Development"
3. Enable **Google Calendar API**:
   - APIs & Services → Library → Search "Calendar" → Enable

### Create OAuth Credentials

1. APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID
2. Application type: Web application
3. Authorized redirect URIs:
   - `http://localhost:8000/api/integrations/google/callback/`
4. Save Client ID and Client Secret

### Configure Backend

Update `backend/.env`:
```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8000/api/integrations/google/callback/
```

### Configure OAuth Consent Screen

1. OAuth consent screen → External
2. Add required info (app name, email)
3. Add scopes:
   - `.../auth/calendar.events`
   - `.../auth/userinfo.email`
4. Add test users (your email)

## Verification Checklist

### Backend Running
- [ ] http://localhost:8000/admin loads (login with superuser)
- [ ] http://localhost:8000/api/auth/csrf/ returns CSRF token

### Frontend Running
- [ ] http://localhost:5173 loads login page
- [ ] Can navigate to signup page

### End-to-End Test
1. [ ] Sign up as a Doctor
2. [ ] Create availability slots
3. [ ] Open incognito window, sign up as Patient
4. [ ] Find the doctor and book a slot
5. [ ] Verify slot is marked as booked
6. [ ] Check email logs in serverless terminal

## Troubleshooting

### Database Connection Error
```
django.db.utils.OperationalError: connection refused
```
**Solution:** Ensure PostgreSQL is running and credentials in `.env` are correct.

### CORS Errors
```
Access-Control-Allow-Origin missing
```
**Solution:** Frontend must run on port 5173 (configured in Django CORS settings).

### Module Not Found
```
ModuleNotFoundError: No module named 'X'
```
**Solution:** Ensure virtual environment is activated: `.\venv\Scripts\activate`

### npm Install Fails
```
npm ERR! ...
```
**Solution:** Delete `node_modules` and `package-lock.json`, then run `npm install` again.

## Development Tips

### Run Django Shell
```powershell
python manage.py shell
```

### Reset Database
```powershell
python manage.py flush --no-input
python manage.py migrate
python manage.py createsuperuser
```

### Watch Frontend Build
```powershell
npm run build
npm run preview
```

### Check API Response
```powershell
# In browser console
fetch('/api/auth/csrf/').then(r => r.json()).then(console.log)
```

---

**Happy Coding! 🚀**
