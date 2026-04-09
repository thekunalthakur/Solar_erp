# Savorka Solar ERP

A full-stack CRM system for solar energy sales management built with Django and React.

📖 **[Full Application Manual → docs/MANUAL.md](docs/MANUAL.md)**

---

## Manual Update Policy

> **Whenever a new feature is added, modified, or removed, update [docs/MANUAL.md](docs/MANUAL.md) accordingly.**
>
> This keeps documentation in sync with the codebase at all times.
> - Update the relevant feature section
> - Add a row to the **Change Log** table at the bottom of the manual
> - Include the date and a brief description of the change

---

## Features

- Lead management with sales pipeline tracking
- Status pipeline: New → Contacted → Qualified → Site Visit → Proposal → Won → Lost
- Assign leads to sales users (admin only)
- Activity notes and engagement tracking
- Tasks management with priority and due dates
- Marketing campaigns and broadcast messaging
- JWT authentication with role-based access
- Filtering and ordering on all list endpoints

## Tech Stack

- **Backend:** Django 6 + Django REST Framework
- **Frontend:** React 19 + Tailwind CSS
- **Database:** SQLite (development)
- **Auth:** JWT via djangorestframework-simplejwt

## Local Setup Instructions

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
npm start
```

## Environment Variables

| Variable            | Description                        | Default              |
|---------------------|------------------------------------|----------------------|
| `SECRET_KEY`        | Django secret key                  | insecure dev key     |
| `DEBUG`             | Enable debug mode                  | `True`               |
| `ALLOWED_HOSTS`     | Django allowed hosts               | `localhost,127.0.0.1` |
| `REACT_APP_API_URL` | Backend API URL for React app      | `http://localhost:8000/api/` |

## API Endpoints

See [docs/MANUAL.md — Section 6](docs/MANUAL.md#6-api-overview) for the full API reference.

Key routes:
- `POST /api/auth/login/` — get JWT token
- `GET /api/leads/` — list leads
- `GET /api/tasks/` — list tasks
- `GET /api/campaigns/` — list campaigns
- `GET /api/users/` — list users