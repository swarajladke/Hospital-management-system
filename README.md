# Hospital Management System (HMS)

A production-ready mini hospital management system with transactional booking, OAuth calendar sync, and serverless email microservice.

![Architecture](https://img.shields.io/badge/Architecture-Microservices-blue)
![Python](https://img.shields.io/badge/Python-3.11-green)
![Django](https://img.shields.io/badge/Django-4.2-darkgreen)
![React](https://img.shields.io/badge/React-18-blue)
![AWS](https://img.shields.io/badge/AWS-Lambda-orange)

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React + Vite + Tailwind)                   │
│  Auth Pages • Doctor Dashboard • Patient Dashboard • Settings               │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │ REST API
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         BACKEND (Django + DRF)                               │
│  accounts • scheduling • integrations • services                             │
└─────────────────────────────────────────────────────────────────────────────┘
          │                    │                           │
          ▼                    ▼                           ▼
┌─────────────────┐  ┌─────────────────┐        ┌─────────────────────┐
│   PostgreSQL    │  │ Google Calendar │        │ Serverless Email    │
│   Database      │  │      API        │        │    (AWS Lambda)     │
└─────────────────┘  └─────────────────┘        └─────────────────────┘
```

## ✨ Features

### 👨‍⚕️ Doctor Features
- Create and manage availability slots
- View weekly calendar of slots
- View upcoming appointments
- Connect Google Calendar for auto-sync

### 🏥 Patient Features
- Browse doctors by specialization
- View available time slots
- Book appointments (transaction-safe)
- Receive email confirmations
- Calendar sync with Google

### 🔒 Security Features
- Session-based authentication
- Role-based access control (RBAC)
- CSRF protection
- Row-level locking for bookings
- Password validation

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### 1. Clone and Setup

```bash
# Navigate to project
cd "Hospital Management System"

# Setup Backend
cd backend
python -m venv venv
.\venv\Scripts\activate  # Windows
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your database credentials

# Setup Database
python manage.py migrate
python manage.py createsuperuser

# Setup Frontend
cd ../frontend
npm install

# Setup Email Service
cd ../serverless-email
npm install
```

### 2. Start Development Servers

**Terminal 1 - Django Backend:**
```bash
cd backend
.\venv\Scripts\activate
python manage.py runserver
```

**Terminal 2 - React Frontend:**
```bash
cd frontend
npm run dev
```

**Terminal 3 - Email Service (Optional):**
```bash
cd serverless-email
npm start
```

### 3. Access Application

- **Frontend:** http://localhost:5175
- **Backend API:** http://localhost:8000/api
- **Admin Panel:** http://localhost:8000/admin
- **Email Service:** http://localhost:3000/email

## 🛠️ Serverless Email Microservice

This project uses a decoupled architecture where email notifications are handled by a dedicated Serverless microservice.

### How it Works:
1.  **Request**: When a trigger event occurs (e.g., User Signup, Booking Confirmation), the Django backend sends an HTTP POST request to the Serverless endpoint.
2.  **Stateless Execution**: The AWS Lambda function "wakes up," processes the request, and uses Python's `smtplib` to send the email via a configured SMTP server (like Gmail).
3.  **Local Testing**: During development, we use `serverless-offline` to simulate the AWS environment locally on port 3000.
4.  **Benefits**: This approach ensures that slow email-sending operations don't block the main application thread, improves scalability, and reduces infrastructure costs.

## 📁 Project Structure

```
Hospital Management System/
├── backend/
│   ├── accounts/          # User auth & profiles
│   ├── scheduling/        # Slots & bookings
│   ├── integrations/      # Google Calendar
│   ├── services/          # Email client
│   ├── core/              # Django settings
│   └── manage.py
├── frontend/
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── pages/         # Route pages
│   │   ├── context/       # React context
│   │   └── services/      # API calls
│   └── package.json
└── serverless-email/
    ├── handler.py         # Lambda function
    └── serverless.yml
```

## 🔧 Configuration

### Environment Variables

**Backend (.env):**
```env
SECRET_KEY=your-secret-key
DEBUG=True
DB_NAME=hms_db
DB_USER=postgres
DB_PASSWORD=password
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
CORS_ALLOWED_ORIGINS=http://localhost:5175,http://127.0.0.1:5175
CSRF_TRUSTED_ORIGINS=http://localhost:5175,http://127.0.0.1:5175
EMAIL_SERVICE_URL=http://localhost:3000/email
```

**Email Service (.env):**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## 📚 API Endpoints

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/api/auth/signup/` | No | - | Register |
| POST | `/api/auth/login/` | No | - | Login |
| POST | `/api/auth/logout/` | Yes | Any | Logout |
| GET | `/api/auth/me/` | Yes | Any | Current user |
| GET | `/api/auth/doctors/` | Yes | Patient | List doctors |
| GET | `/api/slots/` | Yes | Any | List slots |
| POST | `/api/slots/` | Yes | Doctor | Create slot |
| DELETE | `/api/slots/:id/` | Yes | Doctor | Delete slot |
| POST | `/api/bookings/` | Yes | Patient | Book slot |
| GET | `/api/bookings/` | Yes | Any | List bookings |

## 🧪 Testing

### Run Backend Tests
```bash
cd backend
python manage.py test
```

### Test Booking Transaction Safety
The booking endpoint uses `select_for_update(nowait=True)` to prevent race conditions. Test with concurrent requests to verify.

## 🚢 Production Deployment

### Backend (Railway/Render)
1. Set environment variables
2. Configure PostgreSQL database
3. Run migrations
4. Collect static files

### Frontend (Vercel/Netlify)
1. Set `VITE_API_URL` to backend URL
2. Deploy build folder

### Email Service (AWS Lambda)
```bash
cd serverless-email
serverless deploy --stage prod
```

## 📄 License

MIT License - Feel free to use for your projects!

---

Built with ❤️ using Django, React, and AWS Lambda
