# HMS 10-Minute Demo Script

A walkthrough to demonstrate all major features of the Hospital Management System.

## Prerequisites

Ensure all services are running:
- Backend: http://localhost:8000
- Frontend: http://localhost:5173
- Email Service: http://localhost:3000 (optional)

---

## Demo Flow (10 Minutes)

### Part 1: Doctor Registration & Setup (3 min)

#### 1.1 Open Application
```
Navigate to: http://localhost:5173
```

#### 1.2 Register as Doctor
1. Click **"Sign Up"**
2. Select **"Doctor"** role
3. Fill in details:
   - First Name: `John`
   - Last Name: `Smith`
   - Username: `drsmith`
   - Email: `drsmith@example.com`
   - Specialization: `Cardiologist`
   - Password: `Demo@123456`
4. Click **"Create Account"**

✅ **Show:** Welcome email in serverless terminal (if running)

#### 1.3 Create Availability Slots
1. On Doctor Dashboard, click **"Add Slot"**
2. Create slots for today:
   - Date: Today
   - Time: 09:00 - 09:30
3. Create 2-3 more slots for today and tomorrow
4. Show slots appearing in calendar view

✅ **Show:** Weekly calendar with slots

---

### Part 2: Patient Booking Flow (4 min)

#### 2.1 Register as Patient (Incognito Window)
1. Open **incognito/private window**
2. Navigate to: http://localhost:5173/signup
3. Select **"Patient"** role
4. Fill in details:
   - First Name: `Jane`
   - Last Name: `Doe`
   - Username: `janedoe`
   - Email: `janedoe@example.com`
   - Password: `Demo@123456`
5. Click **"Create Account"**

#### 2.2 Find and Book Doctor
1. On Patient Dashboard, find **"Dr. John Smith"**
2. Click **"View Available Slots"**
3. Select a time slot
4. Add notes: `Annual checkup`
5. Click **"Confirm Booking"**

✅ **Show:** 
- Success notification
- Booking appears in "My Appointments"
- Booking confirmation email in terminal

#### 2.3 Verify Slot Unavailable
1. Go back to doctor list
2. View Dr. Smith's slots again
3. Booked slot is no longer available

---

### Part 3: Doctor View (2 min)

#### 3.1 View Booking as Doctor
1. Switch back to **doctor window**
2. Refresh page
3. Go to **"Appointments"** tab
4. Show the booking from Jane Doe

✅ **Show:** 
- Patient name
- Time slot
- Notes from patient

#### 3.2 Attempt to Delete Booked Slot
1. Go to **"Availability Slots"** tab
2. Try to delete the booked slot
3. Show error: "Cannot delete booked slot"

---

### Part 4: Transaction Safety Demo (1 min)

#### 4.1 Explain the Mechanism
```
"When a patient books, we use database row locking:

1. Transaction starts
2. Slot is locked with select_for_update(nowait=True)
3. If another user tries to book simultaneously, they get an error
4. Slot is marked as booked
5. Booking is created
6. Transaction commits

This prevents double-booking even with concurrent requests."
```

Show code snippet from `scheduling/views.py`:
```python
with transaction.atomic():
    slot = AvailabilitySlot.objects.select_for_update(nowait=True).get(
        id=slot_id,
        is_booked=False
    )
    slot.is_booked = True
    slot.save()
    booking = Booking.objects.create(...)
```

---

## Key Technical Highlights

### Backend
- **Django 4.2** with Django REST Framework
- **PostgreSQL** for transaction support
- **Session-based authentication** with CSRF protection
- **Role-based permissions** (IsDoctor, IsPatient)
- **Transaction-safe booking** with row locking

### Frontend
- **React 18** with Vite
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Context API** for auth state
- **Date-fns** for date handling

### Integrations
- **Google Calendar API** for event sync
- **AWS Lambda** for serverless email
- **Serverless Framework** for local development

---

## Talking Points for Demo

1. **"This is a production-ready MVP"** - clean architecture, proper error handling, logging

2. **"Security first"** - password validation, CSRF tokens, role-based access

3. **"Race conditions handled"** - database transactions prevent double-booking

4. **"Modular architecture"** - frontend, backend, and email service are independent

5. **"Cloud-ready"** - can deploy to Railway, Vercel, AWS with minimal changes

---

## Q&A Highlights

**Q: Why PostgreSQL and not SQLite?**
A: PostgreSQL supports `select_for_update` for row-level locking, essential for preventing race conditions in booking.

**Q: Why session-based auth instead of JWT?**
A: For full-stack web apps, session-based auth is simpler and more secure (no token storage on client, built-in Django support).

**Q: Can this scale?**
A: Yes! Add Redis for sessions, Celery for async tasks, and it's horizontally scalable.

**Q: How does the email service work?**
A: It's a stateless Lambda function that receives booking data via HTTP and sends emails via SMTP. Can be replaced with SendGrid/SES.

---

## End of Demo

**Thank you for watching! 🎉**

Repository structure demonstrates:
- Clean code organization
- Separation of concerns
- Production-ready patterns
- Modern tech stack integration
