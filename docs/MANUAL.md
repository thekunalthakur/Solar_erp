# Savorka Solar ERP — Application Manual

> **Maintenance Rule:** Whenever a new feature is added, modified, or removed, update this file to reflect the change. See [README.md](../README.md) for the full policy.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Modules & Features](#2-modules--features)
3. [Tech Stack](#3-tech-stack)
4. [Project Structure](#4-project-structure)
5. [How to Run the Project](#5-how-to-run-the-project)
6. [API Reference](#6-api-reference)
7. [User Roles](#7-user-roles)
8. [Future Scope](#8-future-scope)
9. [Change Log](#9-change-log)

---

## 1. Project Overview

**Savorka Solar ERP** is a full-stack ERP/CRM system purpose-built for solar energy sales teams. It covers the complete business journey — from lead capture through site survey, proposal, installation, customer management, finance, inventory, and marketing — while giving managers real-time visibility into pipeline health and team performance.

**Core capabilities:**
- Full sales pipeline from initial lead through won/lost conversion
- Customer records auto-created from won leads, with document uploads
- Operations tracking for surveys and installations
- Finance tracking for loans and government subsidies
- Inventory management for products, suppliers, and stock levels
- Marketing module with campaigns, broadcasts, engagement logs, and automation rules
- Team task management with priorities and overdue detection
- JWT-based auth with role-based access control

---

## 2. Modules & Features

### 2.1 Sales — Leads ✅
**Route:** `/leads`, `/leads/:id`

- Create leads with auto-generated IDs (`SVK-0001`, `SVK-0002`, …)
- 7-stage pipeline: **New → Contacted → Qualified → Site Visit → Proposal → Won → Lost**
- Filter by status and city
- Assign leads to sales users (admin only)
- Color-coded status badges
- Lead detail page with full contact info, status change, and assignment
- Activity notes per lead (with author and timestamp)

### 2.2 Sales — Follow-ups ✅
**Route:** `/follow-ups` (also accessible from lead detail page)

- Schedule follow-up dates linked to specific leads
- Status: **Pending / Done**
- Overdue follow-ups are highlighted separately from upcoming ones
- Mark individual follow-ups as done from lead detail view

### 2.3 Sales — Conversions ✅
**Route:** `/conversions`

- View all leads with status **Won** or **Lost**
- Summary cards showing total won count and total lost count
- Filter by won/lost status
- Click-through to individual lead detail

### 2.4 Customers ✅
**Route:** `/customers`, `/customers/:id`

- Customer records are **automatically created** when a lead is marked as Won
- Filter by assigned user and city
- Customer detail page with full profile
- Document upload per customer (title + file)
- Uploaded documents listed with uploader name and date

### 2.5 Operations — Survey ✅
**Route:** `/survey`

- Schedule site surveys with a date and assigned engineer
- Link surveys to specific leads
- List all scheduled surveys with engineer and date
- Delete survey entries

### 2.6 Operations — Installation ✅
**Route:** `/installation`

- Track installation jobs per lead
- Assign an engineer to the installation
- Status flow: **Pending → In Progress → Completed**
- Inline status change via dropdown
- "Mark Completed" quick-action button
- Completion timestamp recorded when marked done

### 2.7 Inventory — Products ✅ (backend only)
**API:** `/api/products/`

- Product catalogue with name, category, price, and linked supplier
- Backend CRUD fully available; frontend pages are planned

### 2.8 Inventory — Suppliers ✅ (backend only)
**API:** `/api/suppliers/`

- Supplier records with name, phone, email, and address
- Backend CRUD fully available; frontend pages are planned

### 2.9 Inventory — Stock ✅ (backend only)
**API:** `/api/stocks/`

- One stock record per product (OneToOne)
- `increase` and `decrease` custom actions adjust quantity
- Backend CRUD fully available; frontend pages are planned

### 2.10 Finance — Loans ✅
**Route:** `/loans`

- Link loan applications to leads
- Track loan amount and status: **Pending / Approved / Rejected / Disbursed**
- Inline status update from the loans table
- Notes field per loan record

### 2.11 Finance — Subsidy ✅
**Route:** `/subsidy`

- Link government subsidy applications to leads
- Track application number and status: **Pending / Submitted / Approved / Rejected**
- Inline status update from the subsidy table
- Notes field per application

### 2.12 Tasks ✅
**Route:** `/tasks`

- Create, edit, and delete tasks
- Link tasks to a lead and/or user
- Priority: **Low / Medium / High** (color-coded)
- Status: **Pending / In Progress / Done** (inline dropdown)
- Due date with automatic overdue detection (row highlighted red)
- Filter by assigned user and status

### 2.13 Marketing — Campaigns ✅
**Route:** `/campaigns`

- Create and manage campaigns with name, source, budget, start date, and end date
- Track which leads belong to each campaign (multi-select)
- Tracked leads displayed per campaign row
- Edit or delete campaigns

### 2.14 Marketing — Broadcasts ✅
**Route:** `/broadcasts`

- Compose and send broadcast messages with a subject and body
- Select multiple lead recipients per broadcast
- Logs stored per broadcast: recipient count and lead names
- Broadcast history table with sent timestamp

### 2.15 Marketing — Engagement ✅
**Route:** `/engagement`

- Log individual interactions against a lead
- Activity types: **Call / Message / Email**
- Optional description per entry
- Activity log table showing lead name, type, description, and timestamp

### 2.16 Marketing — Automation ✅
**Route:** `/automation`

- Create trigger-based rules: fire when a lead changes to a specific status
- Two action types:
  - **Create Task** — specify title and description templates
  - **Create Follow-up** — specify days-from-now and notes templates
- Rules execute automatically when a lead's status is updated via the API
- Enable / disable rules with a single toggle button

### 2.17 Dashboard ✅
**Route:** `/`

- High-level metrics and summary cards
- Quick navigation sidebar with collapsible module groups
- Responsive layout; sidebar auto-collapses on mobile

### 2.18 Authentication ✅
**Route:** `/login`

- JWT-based login with username/password
- Access token (60-minute expiry) + refresh token
- Automatic silent token refresh on 401 responses
- Refresh token blacklisted on logout
- Protected routes redirect unauthenticated users to `/login`
- Current user profile accessible via `GET /api/auth/me/`

---

## 3. Tech Stack

| Layer        | Technology                        | Version |
|--------------|-----------------------------------|---------|
| Backend      | Django                            | 6.0.4   |
| Backend API  | Django REST Framework             | 3.17.1  |
| Auth         | djangorestframework-simplejwt     | 5.5.1   |
| Filtering    | django-filter                     | 25.2    |
| CORS         | django-cors-headers               | 4.9.0   |
| Database     | SQLite (development)              | —       |
| Frontend     | React                             | 19.x    |
| Routing      | React Router DOM                  | 6.x     |
| HTTP client  | Axios                             | 1.x     |
| Styling      | Tailwind CSS                      | 3.x     |
| Icons        | react-icons                       | 5.x     |
| Date utils   | dayjs                             | 1.x     |
| Dev env      | GitHub Codespaces / VS Code       | —       |

---

## 4. Project Structure

```
Solar_erp/
├── .gitignore                     # Root gitignore (Python + Node + env files)
├── README.md                      # Quick overview and manual-update policy
├── docs/
│   └── MANUAL.md                  # ← This file (full application manual)
│
├── backend/                       # Django project root
│   ├── manage.py                  # Django management CLI
│   ├── requirements.txt           # Python dependencies
│   ├── db.sqlite3                 # SQLite database (dev only, gitignored)
│   │
│   ├── config/                    # Django project configuration
│   │   ├── settings.py            # All settings (DB, JWT, CORS, DRF, media)
│   │   ├── urls.py                # Root URL router (/api/ and /api/auth/)
│   │   ├── wsgi.py                # WSGI entry point
│   │   └── asgi.py                # ASGI entry point
│   │
│   └── crm/                       # Main CRM application
│       ├── models.py              # All domain models (see §6 for full list)
│       ├── serializers.py         # DRF serializers for all models
│       ├── views.py               # ViewSets and custom actions
│       ├── urls.py                # DRF router — 19 registered endpoint prefixes
│       ├── admin.py               # Django admin registrations
│       └── migrations/            # 12 migration files (0001–0012)
│
└── frontend/                      # React application
    ├── package.json               # Node dependencies and scripts
    ├── tailwind.config.js         # Tailwind CSS configuration
    ├── postcss.config.js          # PostCSS configuration
    ├── .env.example               # Environment variable template
    │
    ├── public/
    │   └── index.html             # HTML shell
    │
    └── src/
        ├── App.js                 # Root router — all protected/public routes
        ├── index.js               # React DOM entry point
        ├── api.js                 # Centralized Axios client + all API methods
        │
        ├── contexts/
        │   └── AuthContext.js     # Global auth state, login/logout/token refresh
        │
        ├── assets/
        │   └── savorka-logo.png   # Company logo
        │
        └── components/
            ├── Layout.js          # Sidebar + navbar + main content wrapper
            ├── Dashboard.js       # Home dashboard with metrics
            ├── Login.js           # Login form (public route)
            ├── ProtectedRoute.js  # JWT auth guard wrapper
            ├── LeadsTable.js      # Lead list: filters, status, assign
            ├── LeadDetail.js      # Lead detail: notes, follow-ups, status change
            ├── Conversions.js     # Won/Lost conversion summary
            ├── Customers.js       # Customer list with filters
            ├── CustomerDetail.js  # Customer profile + document upload
            ├── Survey.js          # Survey scheduling
            ├── Installation.js    # Installation tracking + status updates
            ├── Loans.js           # Loan application management
            ├── Subsidy.js         # Subsidy application management
            ├── Tasks.js           # Task CRUD with priorities and overdue
            ├── Campaigns.js       # Campaign management + lead tracking
            ├── Broadcasts.js      # Broadcast sender + recipient logs
            ├── Engagement.js      # Call/message/email activity log
            └── Automation.js      # Automation rule engine UI
```

---

## 5. How to Run the Project

### Prerequisites
- Python 3.12+
- Node.js 18+
- Git

### 5.1 Backend Setup

```bash
# 1. Clone the repository
git clone https://github.com/thekunalthakur/Solar_erp.git
cd Solar_erp

# 2. Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate          # Linux/macOS
# .venv\Scripts\activate           # Windows

# 3. Install Python dependencies
pip install -r backend/requirements.txt

# 4. Apply database migrations
cd backend
python manage.py migrate

# 5. Create a superuser (admin account)
python manage.py createsuperuser

# 6. Start the Django development server
python manage.py runserver
# Backend available at: http://localhost:8000
```

### 5.2 Frontend Setup

```bash
# In a new terminal, from project root:
cd frontend

# 1. Install Node dependencies
npm install

# 2. Configure API URL
#    Copy the example env file and set the backend URL:
cp .env.example .env
#    For local development, set:
#    REACT_APP_API_URL=http://localhost:8000

# 3. Start the React development server
npm start
# Frontend available at: http://localhost:3000
```

### 5.3 GitHub Codespaces

When running in GitHub Codespaces:
1. Ports 8000 (backend) and 3000 (frontend) are auto-forwarded.
2. Set `REACT_APP_API_URL` in `frontend/.env` to your Codespace backend URL:
   ```
  REACT_APP_API_URL=http://localhost:8000/api/
   ```
3. Ensure the backend port visibility is set to **Public** in the Ports panel.
4. Restart the frontend after changing `.env`: `npm start`

### 5.4 Validate the Setup

```bash
# Backend system check (from backend/)
python manage.py check
# Expected: "System check identified no issues (0 silenced)"

# Apply any pending migrations
python manage.py migrate

# Frontend production build (from frontend/)
npm run build
# Expected: "Compiled successfully"
```

### 5.5 Create Sample Data

```bash
# From backend/
python manage.py shell

# Then in the shell:
from django.contrib.auth.models import User
from crm.models import Lead

User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
User.objects.create_user('sales', 'sales@example.com', 'sales123')
Lead.objects.create(name='Test Lead', phone='9999999999', city='Mumbai', electricity_units=1200)
exit()
```

---

## 6. API Reference

Base URL: `http://localhost:8000/api/`

All endpoints except auth require `Authorization: Bearer <access_token>`.

### 6.1 Authentication (`/api/auth/`)

| Method | Endpoint                        | Description                        | Auth |
|--------|---------------------------------|------------------------------------|------|
| POST   | `/api/auth/login/`              | Login; returns access + refresh tokens | No |
| POST   | `/api/auth/logout/`             | Blacklist refresh token            | Yes  |
| GET    | `/api/auth/me/`                 | Current user profile               | Yes  |
| POST   | `/api/auth/token/refresh/`      | Refresh access token               | No   |
| POST   | `/api/auth/token/verify/`       | Verify token validity              | No   |

### 6.2 Leads

| Method | Endpoint                        | Description                           |
|--------|---------------------------------|---------------------------------------|
| GET    | `/api/leads/`                   | List leads (paginated, filterable)    |
| POST   | `/api/leads/`                   | Create a lead                         |
| GET    | `/api/leads/{id}/`              | Get lead with notes                   |
| PATCH  | `/api/leads/{id}/`              | Update lead fields                    |
| DELETE | `/api/leads/{id}/`              | Delete a lead                         |
| POST   | `/api/leads/{id}/assign/`       | Assign lead to a user (admin only)    |
| POST   | `/api/leads/{id}/add_note/`     | Add a note to a lead                  |
| GET    | `/api/leads/conversions/`       | List won + lost leads                 |

**Filter params:** `status`, `city`, `assigned_to`, `ordering`

### 6.3 Notes

| Method | Endpoint        | Description              |
|--------|-----------------|--------------------------|
| GET    | `/api/notes/`   | List notes               |
| POST   | `/api/notes/`   | Create a note            |
| GET    | `/api/notes/{id}/` | Get a note            |
| PATCH  | `/api/notes/{id}/` | Update a note         |
| DELETE | `/api/notes/{id}/` | Delete a note         |

### 6.4 Follow-ups

| Method | Endpoint               | Description              |
|--------|------------------------|--------------------------|
| GET    | `/api/followups/`      | List follow-ups          |
| POST   | `/api/followups/`      | Create a follow-up       |
| PATCH  | `/api/followups/{id}/` | Update (e.g. mark done)  |
| DELETE | `/api/followups/{id}/` | Delete a follow-up       |

**Filter params:** `lead`, `status`, `ordering`

### 6.5 Customers

| Method | Endpoint                               | Description                         |
|--------|----------------------------------------|-------------------------------------|
| GET    | `/api/customers/`                      | List customers                      |
| GET    | `/api/customers/{id}/`                 | Get customer with documents         |
| POST   | `/api/customers/{id}/upload_document/` | Upload a document (multipart/form)  |
| GET    | `/api/customer-documents/`             | List all customer documents         |

### 6.6 Operations — Survey

| Method | Endpoint             | Description          |
|--------|----------------------|----------------------|
| GET    | `/api/surveys/`      | List surveys         |
| POST   | `/api/surveys/`      | Schedule a survey    |
| PATCH  | `/api/surveys/{id}/` | Update survey        |
| DELETE | `/api/surveys/{id}/` | Delete survey        |

### 6.7 Operations — Installation

| Method | Endpoint                               | Description                     |
|--------|----------------------------------------|---------------------------------|
| GET    | `/api/installations/`                  | List installations               |
| POST   | `/api/installations/`                  | Create an installation entry    |
| PATCH  | `/api/installations/{id}/`             | Update installation              |
| DELETE | `/api/installations/{id}/`             | Delete installation              |
| POST   | `/api/installations/{id}/mark_completed/` | Mark as completed           |

### 6.8 Inventory — Suppliers

| Method | Endpoint               | Description        |
|--------|------------------------|--------------------|
| GET    | `/api/suppliers/`      | List suppliers     |
| POST   | `/api/suppliers/`      | Create supplier    |
| PATCH  | `/api/suppliers/{id}/` | Update supplier    |
| DELETE | `/api/suppliers/{id}/` | Delete supplier    |

### 6.9 Inventory — Products

| Method | Endpoint              | Description       |
|--------|-----------------------|-------------------|
| GET    | `/api/products/`      | List products     |
| POST   | `/api/products/`      | Create product    |
| PATCH  | `/api/products/{id}/` | Update product    |
| DELETE | `/api/products/{id}/` | Delete product    |

### 6.10 Inventory — Stock

| Method | Endpoint                          | Description                      |
|--------|-----------------------------------|----------------------------------|
| GET    | `/api/stocks/`                    | List stock levels                |
| POST   | `/api/stocks/`                    | Create stock record              |
| PATCH  | `/api/stocks/{id}/`               | Update stock                     |
| POST   | `/api/stocks/{id}/increase/`      | Increase quantity (`{ "quantity": N }`) |
| POST   | `/api/stocks/{id}/decrease/`      | Decrease quantity (`{ "quantity": N }`) |

### 6.11 Finance — Loans

| Method | Endpoint           | Description     |
|--------|--------------------|-----------------|
| GET    | `/api/loans/`      | List loans      |
| POST   | `/api/loans/`      | Create loan     |
| PATCH  | `/api/loans/{id}/` | Update loan     |
| DELETE | `/api/loans/{id}/` | Delete loan     |

### 6.12 Finance — Subsidies

| Method | Endpoint               | Description       |
|--------|------------------------|-------------------|
| GET    | `/api/subsidies/`      | List subsidies    |
| POST   | `/api/subsidies/`      | Create subsidy    |
| PATCH  | `/api/subsidies/{id}/` | Update subsidy    |
| DELETE | `/api/subsidies/{id}/` | Delete subsidy    |

### 6.13 Tasks

| Method | Endpoint           | Description    |
|--------|--------------------|----------------|
| GET    | `/api/tasks/`      | List tasks     |
| POST   | `/api/tasks/`      | Create task    |
| PATCH  | `/api/tasks/{id}/` | Update task    |
| DELETE | `/api/tasks/{id}/` | Delete task    |

**Filter params:** `assigned_to`, `status`, `priority`, `lead`

### 6.14 Marketing — Campaigns

| Method | Endpoint                | Description      |
|--------|-------------------------|------------------|
| GET    | `/api/campaigns/`       | List campaigns   |
| POST   | `/api/campaigns/`       | Create campaign  |
| PATCH  | `/api/campaigns/{id}/`  | Update campaign  |
| DELETE | `/api/campaigns/{id}/`  | Delete campaign  |

Campaigns accept `lead_ids` (array of lead PKs) on write to update tracked leads.

### 6.15 Marketing — Broadcasts

| Method | Endpoint                | Description            |
|--------|-------------------------|------------------------|
| GET    | `/api/broadcasts/`      | List broadcasts        |
| POST   | `/api/broadcasts/`      | Send broadcast         |
| DELETE | `/api/broadcasts/{id}/` | Delete broadcast log   |

POST body: `{ "subject": "...", "message": "...", "lead_ids": [1, 2, 3] }`

### 6.16 Marketing — Engagement Activities

| Method | Endpoint                            | Description              |
|--------|-------------------------------------|--------------------------|
| GET    | `/api/engagement-activities/`       | List activities          |
| POST   | `/api/engagement-activities/`       | Log an activity          |
| PATCH  | `/api/engagement-activities/{id}/`  | Update activity          |
| DELETE | `/api/engagement-activities/{id}/`  | Delete activity          |

Activity types: `call`, `message`, `email`

### 6.17 Marketing — Automation Rules

| Method | Endpoint                        | Description          |
|--------|---------------------------------|----------------------|
| GET    | `/api/automation-rules/`        | List rules           |
| POST   | `/api/automation-rules/`        | Create rule          |
| PATCH  | `/api/automation-rules/{id}/`   | Update / toggle rule |
| DELETE | `/api/automation-rules/{id}/`   | Delete rule          |

Trigger statuses: `new`, `contacted`, `qualified`, `site_visit`, `proposal`, `won`, `lost`  
Action types: `create_task`, `create_followup`

### 6.18 Users

| Method | Endpoint      | Description               |
|--------|---------------|---------------------------|
| GET    | `/api/users/` | List all users (read-only) |

### 6.19 Filtering & Pagination

All list endpoints support query-parameter filtering. Common examples:

```
GET /api/leads/?status=new&city=Mumbai
GET /api/leads/?assigned_to=3&ordering=-created_at
GET /api/tasks/?status=pending&priority=high
GET /api/followups/?lead=5&status=pending
GET /api/engagement-activities/?lead=5
```

Paginated responses follow this shape:
```json
{
  "count": 42,
  "next": "http://localhost:8000/api/leads/?page=2",
  "previous": null,
  "results": [...]
}
```

Frontend normalises both shapes: `Array.isArray(data) ? data : (data?.results ?? [])`.

---

## 7. User Roles

### 7.1 Admin (`is_staff=True` or `is_superuser=True`)

- Full read/write access to all modules
- Can **assign leads** to any user (`POST /api/leads/{id}/assign/` — admin only endpoint)
- Sees the "Assign User" dropdown in Leads and LeadDetail
- Can access Django Admin at `/admin/`

### 7.2 Regular User

- Can view and update leads (status, notes)
- Can create and manage tasks and follow-ups
- Can use all Marketing, Operations, Finance, and Inventory features
- **Cannot** assign leads to other users

### 7.3 Creating Users

```bash
# Create admin via CLI
python manage.py createsuperuser

# Create regular user via Django Admin
# http://localhost:8000/admin/auth/user/add/
```

---

## 8. Future Scope

### 8.1 Inventory Frontend Pages
- Products, Suppliers, and Stock list/detail pages (backend API is ready)
- Low-stock alerts and reorder management

### 8.2 Reporting & Analytics
- Lead conversion rate dashboard
- Team performance leaderboards
- Revenue forecasting from proposal pipeline
- Export to PDF/Excel

### 8.3 WhatsApp / SMS Integration
- Direct WhatsApp message sending from lead detail
- Automated notifications on status changes
- Integration with Twilio / WhatsApp Business API

### 8.4 Marketing Analytics
- Campaign performance metrics (open rates, click rates)
- Engagement trend charts per lead or campaign
- Broadcast delivery status tracking

### 8.5 Mobile App
- React Native companion for field sales teams
- Offline-capable lead updates synced on reconnect

---

## 9. Change Log

| Date       | Change                                                                 | Updated By |
|------------|------------------------------------------------------------------------|------------|
| 2026-04-09 | Initial manual created                                                 | Copilot    |
| 2026-04-09 | Backend: NameError fixes, missing routes, duplicate cleanup            | Copilot    |
| 2026-04-09 | Frontend: paginated response normalisation across all components       | Copilot    |
| 2026-04-09 | Added requirements.txt, root .gitignore, .env.example                 | Copilot    |
| 2026-04-09 | Built Sales module: Leads, Follow-ups, Conversions (full stack)       | Copilot    |
| 2026-04-09 | Built Customers module with document upload (full stack)               | Copilot    |
| 2026-04-09 | Built Operations module: Survey + Installation (full stack)            | Copilot    |
| 2026-04-09 | Built Inventory module: Products, Suppliers, Stock (backend only)      | Copilot    |
| 2026-04-09 | Built Finance module: Loans + Subsidy (full stack)                     | Copilot    |
| 2026-04-09 | Built Tasks module with overdue detection (full stack)                 | Copilot    |
| 2026-04-09 | Built Marketing module: Campaigns, Broadcasts, Engagement, Automation  | Copilot    |
| 2026-04-09 | Added CampaignLead + AutomationRule models, migration 0012             | Copilot    |
| 2026-04-09 | Wired /broadcasts, /engagement, /automation routes in App.js           | Copilot    |
| 2026-04-09 | Full manual rewrite to reflect all implemented modules and APIs        | Copilot    |

---

*This manual is maintained alongside the codebase. If you add a feature, update the relevant section above and add a row to the Change Log.*
