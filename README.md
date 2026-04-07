# Savorka Solar ERP

A full-stack CRM system for solar energy sales management.

## Features

- Lead management with sales pipeline tracking
- Status pipeline: New → Contacted → Qualified → Site Visit → Proposal → Won → Lost
- Assign leads to sales users
- Activity notes tracking
- Filtering by status and city
- REST API with pagination

## Tech Stack

- Backend: Django + Django REST Framework
- Frontend: React
- Database: SQLite (development)

## Setup

### Backend

1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Create virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Install dependencies:
   ```bash
   pip install djangorestframework django-cors-headers django-filter
   ```

4. Run migrations:
   ```bash
   python manage.py migrate
   ```

5. Create superuser:
   ```bash
   python manage.py createsuperuser
   ```

6. Run server:
   ```bash
   python manage.py runserver 0.0.0.0:8000
   ```

### Frontend

1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start development server:
   ```bash
   npm start
   ```

## Environment Variables

For production, set the following environment variables:

- `DEBUG`: Set to `False` for production
- `SECRET_KEY`: Django secret key
- `ALLOWED_HOSTS`: Comma-separated list of allowed hosts
- `CORS_ALLOWED_ORIGINS`: Comma-separated list of allowed origins (for development, allow all)

## API Endpoints

- `GET/POST/PUT/PATCH/DELETE /api/leads/` - Lead CRUD
- `GET/POST/PUT/PATCH/DELETE /api/notes/` - Note CRUD

## Usage in GitHub Codespaces

The application is configured to work in GitHub Codespaces:

- Backend runs on `0.0.0.0:8000`
- Frontend runs on port 3000
- API calls use the Codespaces public URL dynamically
- CORS is configured for development

Update `.env` in frontend if needed for custom API URL.